import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { getRoomMessages, getStudyRoom, deleteStudyRoom } from '../services/studyRoomService';
import {
    Users,
    MessageSquare,
    Send,
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    LogOut,
    Loader2
} from 'lucide-react';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'https://studybuddy-backend-pl2i.onrender.com';

const ActiveStudyRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

    // UI State
    const [roomDetails, setRoomDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [participants, setParticipants] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Media State
    const [stream, setStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);

    // Refs
    const socketRef = useRef();
    const userVideoRef = useRef();
    const peersRef = useRef([]); // Keeps track of peers { peerID, peer }
    const [peers, setPeers] = useState([]); // Array of React components for remote videos
    const messagesEndRef = useRef(null);

    // Bind stream to local video element when loading finishes
    useEffect(() => {
        if (!isLoading && stream && userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
        }
    }, [isLoading, stream]);

    // Initial load: Fetch old messages
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchHistoryAndDetails = async () => {
            try {
                const [history, details] = await Promise.all([
                    getRoomMessages(roomId),
                    getStudyRoom(roomId)
                ]);
                
                // Preserve local pending messages during history sync
                setMessages(prev => {
                    const pending = prev.filter(m => m.isPending);
                    return [...history, ...pending];
                });
                setRoomDetails(details);
            } catch (err) {
                console.error("Failed to fetch room data:", err);
                navigate('/studyroom');
            }
        };
        fetchHistoryAndDetails();
        // Skip adding 'user' or 'navigate' to dependencies to prevent infinite loops or redundant fetches
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // Socket & WebRTC Initialization
    useEffect(() => {
        if (!user) return;

        socketRef.current = io(SOCKET_SERVER_URL);
        const streamRef = { current: null };

        // --- Persistent Listeners (Chat & Room) ---
        socketRef.current.on("receive-message", (message) => {
            const incomingClientId = message.clientSideId ? String(message.clientSideId) : null;
            const senderId = String(message.sender?._id || message.sender);
            console.log(`[Chat] Received from server: ClientID=${incomingClientId}, ServerID=${message._id}, Sender=${senderId}`);
            
            setMessages(prev => {
                const pendingIds = prev.filter(m => m.isPending).map(m => m.clientSideId);
                let index = -1;
                if (incomingClientId) {
                    index = prev.findIndex(m => m.clientSideId && String(m.clientSideId) === incomingClientId);
                }
                if (index === -1 && senderId === String(user.id)) {
                    index = prev.findIndex(m => m.isPending && m.text === message.text);
                }
                if (index !== -1) {
                    const newMessages = [...prev];
                    newMessages[index] = { ...prev[index], ...message, isPending: false };
                    return newMessages;
                }
                if (message._id && prev.some(m => m._id === message._id)) return prev;
                return [...prev, { ...message, isPending: false }];
            });
            scrollToBottom();
        });

        socketRef.current.on("room-users", (users) => {
            setParticipants(users);
            const currentSocketIds = users.map(u => u.socketId);
            
            // Remove stale peers
            const stalePeers = peersRef.current.filter(p => !currentSocketIds.includes(p.peerID));
            if (stalePeers.length > 0) {
                stalePeers.forEach(p => { if (!p.peer.destroyed) p.peer.destroy(); });
                peersRef.current = peersRef.current.filter(p => currentSocketIds.includes(p.peerID));
                setPeers(peersRef.current);
            }

            // BACKFILL: connect to missing participants
            if (streamRef.current) {
                users.forEach(otherUser => {
                    const alreadyConnected = peersRef.current.some(p => p.peerID === otherUser.socketId);
                    if (!alreadyConnected && otherUser.socketId !== socketRef.current.id) {
                        // FIX: Only initiate if our socket ID is lexicographically smaller to prevent race conditions
                        if (socketRef.current.id < otherUser.socketId) {
                            console.log(`[WebRTC] Initiating to: ${otherUser.socketId}`);
                            const peer = createPeer(otherUser.socketId, socketRef.current.id, streamRef.current);
                            peersRef.current.push({ peerID: otherUser.socketId, peer });
                            setPeers([...peersRef.current]);
                        }
                    }
                });
            }
        });

        socketRef.current.on("room-ended", () => {
            alert("This room has been ended by the host.");
            navigate('/studyroom');
        });

        socketRef.current.on("user-left", (socketId) => {
            const peerObj = peersRef.current.find(p => p.peerID === socketId);
            if (peerObj) peerObj.peer.destroy();
            peersRef.current = peersRef.current.filter(p => p.peerID !== socketId);
            setPeers(peersRef.current);
        });

        // --- Persistent WebRTC Signaling Listeners ---
        socketRef.current.on("webrtc-offer", payload => {
            if (!streamRef.current) return;
            const existing = peersRef.current.find(p => p.peerID === payload.from);
            if (existing) existing.peer.destroy();
            peersRef.current = peersRef.current.filter(p => p.peerID !== payload.from);
            
            const peer = addPeer(payload.offer, payload.from, streamRef.current);
            peersRef.current.push({ peerID: payload.from, peer });
            setPeers([...peersRef.current]);
        });

        socketRef.current.on("webrtc-answer", payload => {
            const item = peersRef.current.find(p => p.peerID === payload.from);
            if (item && !item.peer.destroyed) item.peer.signal(payload.answer);
        });

        socketRef.current.on("webrtc-ice-candidate", payload => {
            const item = peersRef.current.find(p => p.peerID === payload.from);
            if (item && !item.peer.destroyed) item.peer.signal(payload.candidate);
        });

        socketRef.current.on("user-joined", (payload) => {
            // FIX: Removed duplicate peer generation.
            // Peer logic is safely handled by the `room-users` listener with strict initiator logic.
            console.log(`[WebRTC] User joined notification: ${payload.socketId}`);
        });

        // --- Media & Room Join ---
        if (!navigator.mediaDevices) {
            handleMediaFallback();
        } else {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(currentStream => {
                    setStream(currentStream);
                    streamRef.current = currentStream;
                    if (userVideoRef.current) userVideoRef.current.srcObject = currentStream;
                    socketRef.current.emit("join-room", { roomId, userId: user.id, name: user.name });
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Media access failed:", err);
                    handleMediaFallback();
                });
        }

        function handleMediaFallback() {
            socketRef.current.emit("join-room", { roomId, userId: user.id, name: user.name });
            setIsLoading(false);
        }

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, [roomId]);

    // Auto-scroll chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // --- WebRTC Helpers ---
    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        // Whenever SimplePeer generates a signal (offer or ICE), send it via Socket
        peer.on("signal", signal => {
            if (signal.type === 'offer') {
                socketRef.current.emit("webrtc-offer", { offer: signal, to: userToSignal });
            } else if (signal.candidate) {
                socketRef.current.emit("webrtc-ice-candidate", { candidate: signal, to: userToSignal });
            }
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        // When SimplePeer generates an answer or ICE, send via Socket
        peer.on("signal", signal => {
            if (signal.type === 'answer') {
                socketRef.current.emit("webrtc-answer", { answer: signal, to: callerID });
            } else if (signal.candidate) {
                socketRef.current.emit("webrtc-ice-candidate", { candidate: signal, to: callerID });
            } else if (signal.type === 'offer') {
                // In case of renegotiation
                socketRef.current.emit("webrtc-offer", { offer: signal, to: callerID });
            }
        });

        // Set the remote offer right away
        peer.signal(incomingSignal);

        return peer;
    }

    // --- Media Controls ---
    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    const handleLeaveRoom = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        socketRef.current.disconnect();
        navigate('/studyroom');
    };

    const handleEndRoom = async () => {
        if (window.confirm("Are you sure you want to end this room for everyone?")) {
            try {
                await deleteStudyRoom(roomId);
                socketRef.current.emit("end-room", { roomId });
                handleLeaveRoom();
            } catch (error) {
                console.error("Failed to end room:", error);
                alert("Failed to end room. Please try again.");
            }
        }
    };

    // --- Chat Logic ---
    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const clientSideId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        console.log(`[Chat] Sending message. ClientID: ${clientSideId}`);
        
        // Optimistic Update: Add message immediately
        const optimisticMessage = {
            roomId,
            sender: {
                _id: user.id,
                name: user.name
            },
            text: newMessage,
            clientSideId,
            isPending: true,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();

        // Send to server
        socketRef.current.emit("send-message", {
            roomId,
            sender: user.id,
            name: user.name, // Added name for fallback
            text: newMessage,
            clientSideId
        });

        setNewMessage("");
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                <h2 className="text-xl ml-4">Joining Room & Starting Camera...</h2>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden font-sans">

            {/* Top Bar Navigation */}
            <div className="h-16 bg-black/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Study Room
                    </h1>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 border border-white/5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        {participants.length} Participant{participants.length !== 1 && 's'}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`md:hidden p-2 rounded-full transition-colors ${isChatOpen ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>

                    {roomDetails?.createdBy?._id === user.id && (
                        <button
                            onClick={handleEndRoom}
                            className="hidden sm:flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-red-500/20 shadow-lg shadow-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>End Room</span>
                        </button>
                    )}
                    <button
                        onClick={handleLeaveRoom}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-medium transition-colors border border-red-500/20"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Leave</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Video Grid Area */}
                <div className={`flex-1 flex justify-center items-center p-4 lg:p-6 bg-black/20 ${isChatOpen ? 'hidden md:flex' : 'flex'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full max-w-7xl auto-rows-fr">

                        {/* Local User Video */}
                        <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                            <video
                                muted
                                ref={userVideoRef}
                                autoPlay
                                playsInline
                                className={`w-full h-full object-cover ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`}
                            />
                            {/* Avatar Fallback if video muted */}
                            {isVideoMuted && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white shadow-inner">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            )}

                            {/* Name Label */}
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 border border-white/10">
                                {user.name} (You)
                                {isAudioMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                            </div>
                        </div>

                        {/* Remote Peer Videos */}
                        {peers.map((peerObj) => {
                            const remoteUser = participants.find(p => p.socketId === peerObj.peerID);
                            return (
                                <VideoPeer key={peerObj.peerID} peer={peerObj.peer} name={remoteUser?.name || 'User'} />
                            );
                        })}

                    </div>

                    {/* Floating Controls Bar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl z-30">
                        <button
                            onClick={toggleAudio}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isAudioMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-200'}`}
                            title={isAudioMuted ? "Unmute" : "Mute"}
                        >
                            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isVideoMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-200'}`}
                            title={isVideoMuted ? "Turn on Camera" : "Turn off Camera"}
                        >
                            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                        </button>

                        <div className="w-px h-8 bg-white/10 mx-2 hidden md:block"></div>

                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition-all shadow-md ${isChatOpen ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-200'}`}
                            title="Toggle Chat"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right Panel: Chat List */}
                <div className={`${isChatOpen ? 'flex' : 'hidden'} w-full md:w-80 lg:w-96 flex-col bg-gray-900 border-l border-white/10 shadow-2xl z-10 md:relative absolute inset-0 md:inset-auto`}>

                    <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-purple-400" /> Room Chat
                        </h2>
                        {/* Mobile close button */}
                        <button onClick={() => setIsChatOpen(false)} className="md:hidden text-gray-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 bg-black/10">
                        {messages.length === 0 ? (
                            <div className="text-gray-500 text-center text-sm py-10">
                                Send a message to start the conversation!
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                // Handle the populated sender object vs plain text from socket
                                const senderId = msg.sender?._id || msg.sender;
                                const senderName = msg.sender?.name || "Unknown";
                                const isMe = senderId === user.id;

                                return (
                                    <div key={msg._id || msg.clientSideId || `msg-${i}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${msg.isPending ? 'opacity-70' : 'opacity-100'}`}>
                                        <span className="text-xs text-gray-500 mb-1 ml-1">
                                            {senderName} {msg.isPending && '(sending...)'}
                                        </span>
                                        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 border border-white/5 rounded-tl-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-gray-900 border-t border-white/10">
                        <form onSubmit={sendMessage} className="relative flex items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-500"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="absolute right-1 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-600 transition-colors"
                            >
                                <Send className="w-4 h-4 -ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Sub-component to render remote peer streams
const VideoPeer = ({ peer, name }) => {
    const ref = useRef();

    useEffect(() => {
        // Handle race condition: stream might already be present
        if (peer.streams && peer.streams[0]) {
            if (ref.current) {
                ref.current.srcObject = peer.streams[0];
            }
        } else if (peer._remoteStreams && peer._remoteStreams[0]) {
            if (ref.current) {
                ref.current.srcObject = peer._remoteStreams[0];
            }
        }

        // Also listen for future streams
        peer.on("stream", stream => {
            if (ref.current) {
                ref.current.srcObject = stream;
            }
        });

        peer.on("track", (track, stream) => {
            if (ref.current && stream) {
                ref.current.srcObject = stream;
            }
        });
    }, [peer]);

    return (
        <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
            <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 text-sm font-medium rounded-lg text-white border border-white/10">
                {name}
            </div>
        </div>
    );
}

export default ActiveStudyRoom;

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
    Loader2,
    Sparkles
} from 'lucide-react';

const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || (isLocalhost
    ? 'http://localhost:5000'
    : 'https://studybuddy-backend-pl2i.onrender.com');

const ActiveStudyRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const user = useMemo(() => JSON.parse(sessionStorage.getItem('user')), []);

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
    const iceCandidateQueues = useRef({}); // Per-peer ICE candidate queues
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // --- WebRTC Helper Functions ---

    function flushIceCandidates(peerID) {
        const queue = iceCandidateQueues.current[peerID];
        if (queue && queue.length > 0) {
            const peerObj = peersRef.current.find(p => p.peerID === peerID);
            if (peerObj && !peerObj.peer.destroyed) {
                console.log(`[WebRTC] Flushing ${queue.length} queued ICE candidates for ${peerID}`);
                queue.forEach(candidate => {
                    try {
                        peerObj.peer.signal(candidate);
                    } catch (e) {
                        console.warn(`[WebRTC] Failed to signal queued ICE candidate:`, e.message);
                    }
                });
            }
            iceCandidateQueues.current[peerID] = [];
        }
    }

    function removePeer(peerID) {
        const peerObj = peersRef.current.find(p => p.peerID === peerID);
        if (peerObj && !peerObj.peer.destroyed) peerObj.peer.destroy();
        peersRef.current = peersRef.current.filter(p => p.peerID !== peerID);
        delete iceCandidateQueues.current[peerID];
        setPeers([...peersRef.current]);
    }

    function upsertPeer(peerID, peer) {
        const existing = peersRef.current.find(p => p.peerID === peerID);
        if (existing && existing.peer !== peer && !existing.peer.destroyed) {
            existing.peer.destroy();
        }
        peersRef.current = peersRef.current.filter(p => p.peerID !== peerID);
        peersRef.current.push({ peerID, peer });
        setPeers([...peersRef.current]);
    }

    function hasActivePeer(peerID) {
        const existing = peersRef.current.find(p => p.peerID === peerID);
        return !!(existing && existing.peer && !existing.peer.destroyed);
    }

    function monitorIceState(peer, peerID) {
        peer.on('iceStateChange', (iceState) => {
            console.log(`[WebRTC] ICE state for ${peerID}: ${iceState}`);
            if (iceState === 'connected' || iceState === 'completed') {
                flushIceCandidates(peerID);
            }
            if (iceState === 'failed' || iceState === 'closed') {
                console.warn(`[WebRTC] ICE ${iceState} for ${peerID}, removing peer`);
                removePeer(peerID);
            }
            if (iceState === 'disconnected') {
                console.warn(`[WebRTC] ICE disconnected for ${peerID}, keeping peer alive for recovery`);
            }
        });
    }

    // Socket & WebRTC Initialization
    useEffect(() => {
        if (!user) return;

        socketRef.current = io(SOCKET_SERVER_URL);
        const streamRef = { current: null };
        const latestUsersRef = { current: [] };
        const pendingSignals = [];

        function reconcilePeers(users, currentStream) {
            if (!currentStream || !socketRef.current?.id || !Array.isArray(users)) return;

            const mySocketId = socketRef.current.id;
            users.forEach(otherUser => {
                const otherSocketId = otherUser.socketId;
                if (!otherSocketId || otherSocketId === mySocketId) return;

                const alreadyConnected = hasActivePeer(otherSocketId);
                if (!alreadyConnected && mySocketId < otherSocketId) {
                    console.log(`[WebRTC] Reconcile: Initiating missing peer to ${otherSocketId}`);
                    const peer = createPeer(otherSocketId, mySocketId, currentStream);
                    upsertPeer(otherSocketId, peer);
                }
            });
        }

        socketRef.current.on("receive-message", (message) => {
            const incomingClientId = message.clientSideId ? String(message.clientSideId) : null;
            const senderId = String(message.sender?._id || message.sender);
            console.log(`[Chat] Received from server: ClientID=${incomingClientId}, ServerID=${message._id}, Sender=${senderId}`);
            
            setMessages(prev => {
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
            latestUsersRef.current = users;
            setParticipants(users);
            const currentSocketIds = users.map(u => u.socketId);
            
            const stalePeers = peersRef.current.filter(p => !currentSocketIds.includes(p.peerID));
            if (stalePeers.length > 0) {
                stalePeers.forEach(p => {
                    if (!p.peer.destroyed) p.peer.destroy();
                    delete iceCandidateQueues.current[p.peerID];
                });
                peersRef.current = peersRef.current.filter(p => currentSocketIds.includes(p.peerID));
                setPeers([...peersRef.current]);
            }

            if (streamRef.current) {
                reconcilePeers(users, streamRef.current);
            }
        });

        socketRef.current.on("room-ended", () => {
            alert("This room has been ended by the host.");
            navigate('/studyroom');
        });

        socketRef.current.on("user-left", (socketId) => {
            removePeer(socketId);
        });

        socketRef.current.on("webrtc-signal", payload => {
            const { signal, from } = payload;
            console.log(`[WebRTC] Received signal from ${from}, type=${signal.type || 'ice-candidate'}`);

            if (!streamRef.current) {
                console.log(`[WebRTC] Stream not ready, queuing signal from ${from}`);
                pendingSignals.push(payload);
                return;
            }

            handleIncomingSignal(from, signal, streamRef.current);
        });

        function handleIncomingSignal(from, signal, currentStream) {
            const existingPeer = peersRef.current.find(p => p.peerID === from);

            if (signal.type === 'offer') {
                if (existingPeer && !existingPeer.peer.destroyed) {
                    try {
                        existingPeer.peer.signal(signal);
                        setTimeout(() => flushIceCandidates(from), 100);
                        return;
                    } catch (e) {
                        console.warn(`[WebRTC] Failed to apply offer on existing peer ${from}, recreating peer:`, e.message);
                        removePeer(from);
                    }
                }

                peersRef.current = peersRef.current.filter(p => p.peerID !== from);
                if (!iceCandidateQueues.current[from]) {
                    iceCandidateQueues.current[from] = [];
                }

                console.log(`[WebRTC] Creating answer peer for offer from ${from}`);
                const peer = addPeer(signal, from, currentStream);
                upsertPeer(from, peer);
            } else if (signal.type === 'answer') {
                if (existingPeer && !existingPeer.peer.destroyed) {
                    existingPeer.peer.signal(signal);
                    setTimeout(() => flushIceCandidates(from), 100);
                } else {
                    console.warn(`[WebRTC] Received answer for unknown peer ${from}, ignoring`);
                }
            } else {
                if (existingPeer && !existingPeer.peer.destroyed) {
                    const pc = existingPeer.peer._pc;
                    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                        try {
                            existingPeer.peer.signal(signal);
                        } catch (e) {
                            console.warn(`[WebRTC] Error signaling ICE to ${from}, queuing:`, e.message);
                            if (!iceCandidateQueues.current[from]) iceCandidateQueues.current[from] = [];
                            iceCandidateQueues.current[from].push(signal);
                        }
                    } else {
                        console.log(`[WebRTC] Remote description not set for ${from}, queuing ICE candidate`);
                        if (!iceCandidateQueues.current[from]) iceCandidateQueues.current[from] = [];
                        iceCandidateQueues.current[from].push(signal);
                    }
                } else {
                    console.log(`[WebRTC] No peer for ${from} yet, queuing ICE candidate`);
                    if (!iceCandidateQueues.current[from]) iceCandidateQueues.current[from] = [];
                    iceCandidateQueues.current[from].push(signal);
                }
            }
        }

        socketRef.current.on("user-joined", (payload) => {
            console.log(`[WebRTC] User joined notification: ${payload.socketId}`);
        });

        function joinRoomAndProcessQueue() {
            socketRef.current.emit("join-room", { roomId, userId: user.id, name: user.name });
            setIsLoading(false);

            if (pendingSignals.length > 0 && streamRef.current) {
                console.log(`[WebRTC] Processing ${pendingSignals.length} queued signals`);
                pendingSignals.forEach(p => handleIncomingSignal(p.from, p.signal, streamRef.current));
                pendingSignals.length = 0;
            }

            reconcilePeers(latestUsersRef.current, streamRef.current);
        }

        const reconcileInterval = setInterval(() => {
            reconcilePeers(latestUsersRef.current, streamRef.current);
        }, 2500);

        if (!navigator.mediaDevices) {
            joinRoomAndProcessQueue();
        } else {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(currentStream => {
                    setStream(currentStream);
                    streamRef.current = currentStream;
                    if (userVideoRef.current) userVideoRef.current.srcObject = currentStream;
                    joinRoomAndProcessQueue();
                })
                .catch(err => {
                    console.error("Media access failed:", err);
                    joinRoomAndProcessQueue();
                });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off("receive-message");
                socketRef.current.off("room-users");
                socketRef.current.off("room-ended");
                socketRef.current.off("user-left");
                socketRef.current.off("webrtc-signal");
                socketRef.current.off("user-joined");
                socketRef.current.disconnect();
            }
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            peersRef.current.forEach(p => { if (!p.peer.destroyed) p.peer.destroy(); });
            peersRef.current = [];
            iceCandidateQueues.current = {};
            clearInterval(reconcileInterval);
        };
    }, [roomId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.voiparound.com:3478' },
        { urls: 'stun:stun.voipbuster.com:3478' },
        { urls: 'stun:stun.voipstunt.com:3478' },
        { urls: 'stun:stun.voxgratia.org:3478' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'e8dd65b92f6aee9f74073532',
            credential: 'uiadnxBjl+gFZrMi'
        },
        {
            urls: 'turn:a.relay.metered.ca:443',
            username: 'e8dd65b92f6aee9f74073532',
            credential: 'uiadnxBjl+gFZrMi'
        },
        {
            urls: 'turn:a.relay.metered.ca:443?transport=tcp',
            username: 'e8dd65b92f6aee9f74073532',
            credential: 'uiadnxBjl+gFZrMi'
        }
    ];

    function createPeer(userToSignal, callerID, stream) {
        iceCandidateQueues.current[userToSignal] = iceCandidateQueues.current[userToSignal] || [];

        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream,
            config: { iceServers }
        });

        peer.on("signal", signal => {
            console.log(`[WebRTC] createPeer signal -> to=${userToSignal}, type=${signal.type || 'ice'}`);
            socketRef.current.emit("webrtc-signal", { signal, to: userToSignal });
        });

        peer.on("error", err => {
            console.error(`[WebRTC] Peer error (initiator -> ${userToSignal}):`, err.message);
            if (err.message?.includes('User-Initiated Abort') || err.message?.includes('Ice connection failed')) {
                removePeer(userToSignal);
            }
        });

        peer.on("connect", () => {
            console.log(`[WebRTC] ✅ Connected to ${userToSignal}`);
        });

        monitorIceState(peer, userToSignal);

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        iceCandidateQueues.current[callerID] = iceCandidateQueues.current[callerID] || [];

        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream,
            config: { iceServers }
        });

        peer.on("signal", signal => {
            console.log(`[WebRTC] addPeer signal -> to=${callerID}, type=${signal.type || 'ice'}`);
            socketRef.current.emit("webrtc-signal", { signal, to: callerID });
        });

        peer.on("error", err => {
            console.error(`[WebRTC] Peer error (responder -> ${callerID}):`, err.message);
            if (err.message?.includes('User-Initiated Abort') || err.message?.includes('Ice connection failed')) {
                removePeer(callerID);
            }
        });

        peer.on("connect", () => {
            console.log(`[WebRTC] ✅ Connected to ${callerID}`);
            const queue = iceCandidateQueues.current[callerID];
            if (queue && queue.length > 0) {
                console.log(`[WebRTC] Flushing ${queue.length} ICE candidates on connect for ${callerID}`);
                queue.forEach(candidate => {
                    try { peer.signal(candidate); } catch (e) { /* ignore */ }
                });
                iceCandidateQueues.current[callerID] = [];
            }
        });

        monitorIceState(peer, callerID);

        peer.signal(incomingSignal);

        setTimeout(() => {
            const queue = iceCandidateQueues.current[callerID];
            if (queue && queue.length > 0) {
                console.log(`[WebRTC] Post-offer flush: ${queue.length} ICE candidates for ${callerID}`);
                queue.forEach(candidate => {
                    try { peer.signal(candidate); } catch (e) { /* ignore */ }
                });
                iceCandidateQueues.current[callerID] = [];
            }
        }, 200);

        return peer;
    }

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

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const clientSideId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        console.log(`[Chat] Sending message. ClientID: ${clientSideId}`);
        
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

        socketRef.current.emit("send-message", {
            roomId,
            sender: user.id,
            name: user.name, 
            text: newMessage,
            clientSideId
        });

        setNewMessage("");
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background dark:bg-[#0a0a0f] text-slate-900 dark:text-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600 dark:text-[#8c30e8] mb-4" />
                <h2 className="text-xl ml-4 font-bold tracking-wide">Joining Room & Starting Camera...</h2>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background dark:bg-[#0a0a0f] text-foreground dark:text-white overflow-hidden font-sans">

            {/* Top Bar Navigation */}
            <div className="h-16 bg-white/60 dark:bg-black/40 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-600 dark:text-[#8c30e8] hidden sm:block" />
                        Study Room
                    </h1>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-xs font-bold text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/10">
                        <Users className="w-3.5 h-3.5 text-purple-600 dark:text-[#8c30e8]" />
                        {participants.length} Participant{participants.length !== 1 && 's'}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`md:hidden p-2 rounded-full transition-colors ${isChatOpen ? 'bg-purple-50 dark:bg-[#8c30e8]/20 text-purple-600 dark:text-[#8c30e8]' : 'text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/10'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>

                    {roomDetails?.createdBy?._id === user.id && (
                        <button
                            onClick={handleEndRoom}
                            className="hidden sm:flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 px-4 py-2 rounded-lg font-bold transition-colors border border-red-200 dark:border-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>End Room</span>
                        </button>
                    )}
                    <button
                        onClick={handleLeaveRoom}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 px-4 py-2 rounded-lg font-bold transition-colors border border-slate-200 dark:border-white/10"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Leave</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Video Grid Area */}
                <div className={`flex-1 flex justify-center items-center p-4 lg:p-6 bg-slate-50 dark:bg-black/20 ${isChatOpen ? 'hidden md:flex' : 'flex'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full max-w-7xl auto-rows-fr">

                        {/* Local User Video */}
                        <div className="relative bg-slate-100 dark:bg-[#191121] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#8c30e8]/30 shadow-xl group">
                            <video
                                muted
                                ref={userVideoRef}
                                autoPlay
                                playsInline
                                className={`w-full h-full object-cover ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`}
                            />
                            {/* Avatar Fallback if video muted */}
                            {isVideoMuted && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-[#191121]">
                                    <div className="w-24 h-24 rounded-full bg-purple-50 border border-purple-100 text-purple-600 dark:bg-[#8c30e8]/20 dark:border-[#8c30e8]/30 dark:text-[#8c30e8] flex items-center justify-center text-4xl font-bold shadow-sm">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            )}

                            {/* Name Label */}
                            <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                                {user.name} (You)
                                {isAudioMuted && <MicOff className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />}
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
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#191121]/90 backdrop-blur-xl border border-slate-200 dark:border-[#8c30e8]/30 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl z-30">
                        <button
                            onClick={toggleAudio}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${isAudioMuted ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300'}`}
                            title={isAudioMuted ? "Unmute" : "Mute"}
                        >
                            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${isVideoMuted ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300'}`}
                            title={isVideoMuted ? "Turn on Camera" : "Turn off Camera"}
                        >
                            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                        </button>

                        <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-2 hidden md:block"></div>

                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition-all shadow-sm ${isChatOpen ? 'bg-purple-50 text-purple-600 dark:bg-[#8c30e8]/20 dark:text-[#8c30e8]' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300'}`}
                            title="Toggle Chat"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right Panel: Chat List */}
                <div className={`${isChatOpen ? 'flex' : 'hidden'} w-full md:w-80 lg:w-96 flex-col bg-white dark:bg-[#191121] border-l border-slate-200 dark:border-[#8c30e8]/30 shadow-2xl z-10 md:relative absolute inset-0 md:inset-auto`}>

                    <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                            <MessageSquare className="w-4 h-4 text-purple-600 dark:text-[#8c30e8]" /> Room Chat
                        </h2>
                        {/* Mobile close button */}
                        <button onClick={() => setIsChatOpen(false)} className="md:hidden text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-slate-50 dark:bg-black/10">
                        {messages.length === 0 ? (
                            <div className="text-slate-500 dark:text-gray-500 text-center text-sm font-medium py-10">
                                Send a message to start the conversation!
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const senderId = msg.sender?._id || msg.sender;
                                const senderName = msg.sender?.name || "Unknown";
                                const isMe = senderId === user.id;

                                return (
                                    <div key={msg._id || msg.clientSideId || `msg-${i}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${msg.isPending ? 'opacity-70' : 'opacity-100'}`}>
                                        <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-gray-500 mb-1 ml-1 uppercase">
                                            {senderName} {msg.isPending && '(sending...)'}
                                        </span>
                                        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${isMe ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-sm shadow-purple-500/20' : 'bg-white text-slate-700 border border-slate-200 dark:bg-white/5 dark:text-gray-200 dark:border-white/10 rounded-tl-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white dark:bg-[#191121] border-t border-slate-200 dark:border-[#8c30e8]/30">
                        <form onSubmit={sendMessage} className="relative flex items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-500 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="absolute right-1.5 w-9 h-9 rounded-lg bg-purple-600 dark:bg-[#8c30e8] flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-white/10 disabled:text-slate-500 transition-colors shadow-sm"
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
    const [hasStream, setHasStream] = useState(false);
    const attachedStreamIdRef = useRef(null);

    useEffect(() => {
        if (!peer || peer.destroyed) return;

        let retryTimer = null;

        function attachRemoteStream(stream) {
            if (!ref.current || !stream) return;

            const tracks = stream.getTracks();
            const hasLiveTrack = tracks.some(t => t.readyState === 'live');
            if (!hasLiveTrack) return;

            if (attachedStreamIdRef.current === stream.id) return;

            console.log(`[VideoPeer] Attaching REMOTE stream for ${name}, streamId=${stream.id}, tracks=${tracks.map(t => t.kind + ':' + t.readyState).join(', ')}`);
            ref.current.srcObject = stream;
            attachedStreamIdRef.current = stream.id;
            setHasStream(true);
            
            // Explicitly enable audio tracks
            stream.getAudioTracks().forEach(track => {
                track.enabled = true;
                console.log(`[VideoPeer] Audio track enabled for ${name}: ${track.id}`);
            });

            ref.current.play().catch(e => {
                console.warn('[VideoPeer] Playback failed/blocked. User interaction might be required.', e.message);
                // Attempt play on click if blocked
                const handlePlayOnClick = () => {
                    ref.current.play();
                    window.removeEventListener('click', handlePlayOnClick);
                };
                window.addEventListener('click', handlePlayOnClick);
            });

            if (retryTimer) {
                clearInterval(retryTimer);
                retryTimer = null;
            }
        }

        function tryAttachExistingRemote() {
            const existingRemote = peer._remoteStreams?.[0] || (peer._pc?.getRemoteStreams && peer._pc.getRemoteStreams()[0]);
            if (existingRemote) {
                attachRemoteStream(existingRemote);
                return true;
            }
            return false;
        }

        const attached = tryAttachExistingRemote();
        if (!attached) {
            retryTimer = setInterval(() => {
                if (peer.destroyed) {
                    clearInterval(retryTimer);
                    retryTimer = null;
                    return;
                }
                tryAttachExistingRemote();
            }, 700);
        }

        const onStream = (stream) => attachRemoteStream(stream);
        const onTrack = (_track, stream) => {
            if (stream) attachRemoteStream(stream);
        };

        peer.on("stream", onStream);
        peer.on("track", onTrack);

        const pcOnTrack = (event) => {
            if (event.streams && event.streams[0]) {
                attachRemoteStream(event.streams[0]);
            }
        };
        if (peer._pc) {
            peer._pc.addEventListener('track', pcOnTrack);
        }

        return () => {
            if (retryTimer) clearInterval(retryTimer);
            peer.removeListener("stream", onStream);
            peer.removeListener("track", onTrack);
            if (peer._pc) {
                peer._pc.removeEventListener('track', pcOnTrack);
            }
            attachedStreamIdRef.current = null;
        };
    }, [peer, name]);

    return (
        <div className="relative bg-slate-100 dark:bg-[#191121] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#8c30e8]/30 shadow-xl group">
            <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
            {!hasStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-[#191121]">
                    <div className="w-24 h-24 rounded-full bg-purple-50 border border-purple-100 text-purple-600 dark:bg-[#8c30e8]/20 dark:border-[#8c30e8]/30 dark:text-[#8c30e8] flex items-center justify-center text-4xl font-bold shadow-sm animate-pulse">
                        {name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <p className="absolute bottom-16 text-xs font-bold tracking-widest text-slate-400 dark:text-gray-500 uppercase">Connecting...</p>
                </div>
            )}
            <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 text-sm font-bold rounded-lg text-slate-900 dark:text-white border border-slate-200 dark:border-white/10">
                {name}
            </div>
        </div>
    );
}

export default ActiveStudyRoom;
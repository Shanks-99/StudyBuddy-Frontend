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
    Loader2
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
        // Skip adding 'user' or 'navigate' to dependencies to prevent infinite loops or redundant fetches
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // --- WebRTC Helper Functions (component-level so createPeer/addPeer can access them) ---

    // Helper: flush queued ICE candidates for a peer
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

    // Helper: remove a peer cleanly from refs and state
    function removePeer(peerID) {
        const peerObj = peersRef.current.find(p => p.peerID === peerID);
        if (peerObj && !peerObj.peer.destroyed) peerObj.peer.destroy();
        peersRef.current = peersRef.current.filter(p => p.peerID !== peerID);
        delete iceCandidateQueues.current[peerID];
        setPeers([...peersRef.current]);
    }

    // Helper: ensure there is only one peer object per remote socket ID
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

    // Helper: attach iceStateChange monitoring to detect dead connections
    function monitorIceState(peer, peerID) {
        peer.on('iceStateChange', (iceState) => {
            console.log(`[WebRTC] ICE state for ${peerID}: ${iceState}`);
            if (iceState === 'connected' || iceState === 'completed') {
                // Connection established — flush any remaining queued candidates
                flushIceCandidates(peerID);
            }
            if (iceState === 'failed' || iceState === 'closed') {
                console.warn(`[WebRTC] ICE ${iceState} for ${peerID}, removing peer`);
                removePeer(peerID);
            }
            if (iceState === 'disconnected') {
                // 'disconnected' is often transient on mobile networks.
                // Keep the peer and let ICE recover to avoid unnecessary video drops.
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
        // Queue signals that arrive before our stream is ready
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

        // --- Persistent Listeners (Chat & Room) ---
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
            
            // Remove stale peers (users who left)
            const stalePeers = peersRef.current.filter(p => !currentSocketIds.includes(p.peerID));
            if (stalePeers.length > 0) {
                stalePeers.forEach(p => {
                    if (!p.peer.destroyed) p.peer.destroy();
                    delete iceCandidateQueues.current[p.peerID];
                });
                peersRef.current = peersRef.current.filter(p => currentSocketIds.includes(p.peerID));
                setPeers([...peersRef.current]);
            }

            // BACKFILL: connect to missing participants (only if stream is ready)
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

        // --- UNIFIED WebRTC Signaling Listener ---
        socketRef.current.on("webrtc-signal", payload => {
            const { signal, from } = payload;
            console.log(`[WebRTC] Received signal from ${from}, type=${signal.type || 'ice-candidate'}`);

            // If stream is not ready yet, queue the signal
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
                // If peer exists, this can be a valid renegotiation offer.
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
                // Keep already queued ICE candidates that may have arrived before this offer.
                // Clearing here can break handshakes under multi-user join races.
                if (!iceCandidateQueues.current[from]) {
                    iceCandidateQueues.current[from] = [];
                }

                console.log(`[WebRTC] Creating answer peer for offer from ${from}`);
                const peer = addPeer(signal, from, currentStream);
                upsertPeer(from, peer);
            } else if (signal.type === 'answer') {
                // Answer — forward to existing peer, then flush ICE queue
                if (existingPeer && !existingPeer.peer.destroyed) {
                    existingPeer.peer.signal(signal);
                    // After remote description is set, flush queued ICE candidates
                    setTimeout(() => flushIceCandidates(from), 100);
                } else {
                    console.warn(`[WebRTC] Received answer for unknown peer ${from}, ignoring`);
                }
            } else {
                // ICE candidate
                if (existingPeer && !existingPeer.peer.destroyed) {
                    // Check if remote description is set (peer is ready for ICE candidates)
                    const pc = existingPeer.peer._pc;
                    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                        // Remote description is set — safe to signal
                        try {
                            existingPeer.peer.signal(signal);
                        } catch (e) {
                            console.warn(`[WebRTC] Error signaling ICE to ${from}, queuing:`, e.message);
                            if (!iceCandidateQueues.current[from]) iceCandidateQueues.current[from] = [];
                            iceCandidateQueues.current[from].push(signal);
                        }
                    } else {
                        // Remote description NOT set — queue the ICE candidate
                        console.log(`[WebRTC] Remote description not set for ${from}, queuing ICE candidate`);
                        if (!iceCandidateQueues.current[from]) iceCandidateQueues.current[from] = [];
                        iceCandidateQueues.current[from].push(signal);
                    }
                } else {
                    // No peer yet — queue it (it may arrive before the offer is processed)
                    console.log(`[WebRTC] No peer for ${from} yet, queuing ICE candidate`);
                    if (!iceCandidateQueues.current[from]) iceCandidateQueues.current[from] = [];
                    iceCandidateQueues.current[from].push(signal);
                }
            }
        }

        socketRef.current.on("user-joined", (payload) => {
            console.log(`[WebRTC] User joined notification: ${payload.socketId}`);
        });

        // --- Media & Room Join ---
        function joinRoomAndProcessQueue() {
            socketRef.current.emit("join-room", { roomId, userId: user.id, name: user.name });
            setIsLoading(false);

            // Process any signals that arrived before our stream was ready
            if (pendingSignals.length > 0 && streamRef.current) {
                console.log(`[WebRTC] Processing ${pendingSignals.length} queued signals`);
                pendingSignals.forEach(p => handleIncomingSignal(p.from, p.signal, streamRef.current));
                pendingSignals.length = 0;
            }

            // Immediately reconcile after join in case room-users arrived before media was ready.
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
            // Clean up all socket listeners to prevent stacking on re-render
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

    // Auto-scroll chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // --- ICE Server Configuration (FIX #4) ---
    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'e8dd65b92f6aee9f74073532',
            credential: 'uiadnxBjl+gFZrMi'
        },
        {
            urls: 'turn:a.relay.metered.ca:80?transport=tcp',
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

    // --- WebRTC Helpers ---
    function createPeer(userToSignal, callerID, stream) {
        // Initialize ICE candidate queue for this peer
        iceCandidateQueues.current[userToSignal] = iceCandidateQueues.current[userToSignal] || [];

        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream,
            config: { iceServers }
        });

        // Send ALL signals via unified event
        peer.on("signal", signal => {
            console.log(`[WebRTC] createPeer signal -> to=${userToSignal}, type=${signal.type || 'ice'}`);
            socketRef.current.emit("webrtc-signal", { signal, to: userToSignal });
        });

        peer.on("error", err => {
            console.error(`[WebRTC] Peer error (initiator -> ${userToSignal}):`, err.message);
            if (err.message?.includes('User-Initiated Abort') || err.message?.includes('Ice connection failed')) {
                // Remove the broken peer so user can reconnect
                removePeer(userToSignal);
            }
        });

        peer.on("connect", () => {
            console.log(`[WebRTC] ✅ Connected to ${userToSignal}`);
        });

        // Monitor ICE connection state for dead/failed connections
        monitorIceState(peer, userToSignal);

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        // Initialize ICE candidate queue for this peer
        iceCandidateQueues.current[callerID] = iceCandidateQueues.current[callerID] || [];

        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream,
            config: { iceServers }
        });

        // Send ALL signals via unified event
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
            // Flush any ICE candidates that arrived before connection was ready
            const queue = iceCandidateQueues.current[callerID];
            if (queue && queue.length > 0) {
                console.log(`[WebRTC] Flushing ${queue.length} ICE candidates on connect for ${callerID}`);
                queue.forEach(candidate => {
                    try { peer.signal(candidate); } catch (e) { /* ignore */ }
                });
                iceCandidateQueues.current[callerID] = [];
            }
        });

        // Monitor ICE connection state for dead/failed connections
        monitorIceState(peer, callerID);

        // Signal the incoming offer to start the handshake
        peer.signal(incomingSignal);

        // After signaling the offer, flush any ICE candidates that arrived early
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

// Sub-component to render remote peer streams — robust stream attachment with retry
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

            // Guard against rebinding same stream repeatedly due to multiple events.
            if (attachedStreamIdRef.current === stream.id) return;

            console.log(`[VideoPeer] Attaching REMOTE stream for ${name}, streamId=${stream.id}, tracks=${tracks.map(t => t.kind + ':' + t.readyState).join(', ')}`);
            ref.current.srcObject = stream;
            attachedStreamIdRef.current = stream.id;
            setHasStream(true);
            ref.current.play().catch(e => console.warn('[VideoPeer] play() rejected:', e.message));

            if (retryTimer) {
                clearInterval(retryTimer);
                retryTimer = null;
            }
        }

        function tryAttachExistingRemote() {
            // IMPORTANT: Do NOT use peer.streams here.
            // In simple-peer this can contain local outbound streams, which causes self-video duplication.
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

        // Listen for future stream arrivals
        const onStream = (stream) => attachRemoteStream(stream);
        const onTrack = (_track, stream) => {
            if (stream) attachRemoteStream(stream);
        };

        peer.on("stream", onStream);
        peer.on("track", onTrack);

        // Also listen on the underlying RTCPeerConnection for ontrack
        const pcOnTrack = (event) => {
            if (event.streams && event.streams[0]) {
                attachRemoteStream(event.streams[0]);
            }
        };
        if (peer._pc) {
            peer._pc.addEventListener('track', pcOnTrack);
        }

        // Cleanup listeners on unmount or peer change
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
        <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
            <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
            {!hasStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white animate-pulse">
                        {name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <p className="absolute bottom-16 text-xs text-gray-400">Connecting...</p>
                </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 text-sm font-medium rounded-lg text-white border border-white/10">
                {name}
            </div>
        </div>
    );
}

export default ActiveStudyRoom;

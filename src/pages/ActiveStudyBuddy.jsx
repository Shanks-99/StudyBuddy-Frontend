import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { 
    getBuddyRoomDetails, 
    getBuddyRoomMessages, 
    leaveBuddyRoom, 
    completeBuddyRoom, 
    syncBuddyNotes, 
    syncBuddyTodos 
} from '../services/studyBuddyService';
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
    Sparkles,
    Play,
    Pause,
    RotateCcw,
    CheckCircle,
    Plus,
    Trash2,
    Download,
    Clipboard,
    CheckSquare,
    Tv,
    FileText,
    Volume2,
    VolumeX,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || (isLocalhost
    ? 'http://localhost:5000'
    : 'https://studybuddy-backend-pl2i.onrender.com');

const ActiveStudyBuddy = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const user = useMemo(() => JSON.parse(sessionStorage.getItem('user')), []);
    const userId = user?.id || user?._id;

    // Room Info
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Collaboration states
    const [notes, setNotes] = useState('');
    const [isBuddyTyping, setIsBuddyTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Synced checklist
    const [todos, setTodos] = useState([]);
    const [newTodoText, setNewTodoText] = useState('');

    // Synced Pomodoro timer state
    const [timerDuration, setTimerDuration] = useState(25 * 60); // default 25 mins
    const [timerRemaining, setTimerRemaining] = useState(25 * 60);
    const [timerActive, setTimerActive] = useState(false);
    const [timerType, setTimerType] = useState('study'); // 'study' or 'break'
    const timerIntervalRef = useRef(null);

    // Chat states
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isNotesOpen, setIsNotesOpen] = useState(true);

    // WebRTC / Call states
    const [stream, setStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const remoteStreamRef = useRef(null);

    // End Session metrics
    const [showSummary, setShowSummary] = useState(false);
    const [sessionStartTime] = useState(new Date());
    const [studyMinutesCompleted, setStudyMinutesCompleted] = useState(0);

    // Refs
    const socketRef = useRef();
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerRef = useRef(null);
    const messagesEndRef = useRef(null);

    // --- WebRTC ICE Config ---
    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun.voiparound.com:3478' },
        { urls: 'turn:a.relay.metered.ca:80', username: 'e8dd65b92f6aee9f74073532', credential: 'uiadnxBjl+gFZrMi' },
        { urls: 'turn:a.relay.metered.ca:443', username: 'e8dd65b92f6aee9f74073532', credential: 'uiadnxBjl+gFZrMi' }
    ];

    // Scroll chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial load: fetch details, notes, messages, todos
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const loadRoomData = async () => {
            try {
                const details = await getBuddyRoomDetails(roomId);
                
                if (details.status === 'completed') {
                    alert("This session has already ended.");
                    navigate('/studybuddy');
                    return;
                }

                setRoom(details);
                setNotes(details.notes || '');
                setTodos(details.todos || []);
                
                const history = await getBuddyRoomMessages(roomId);
                setMessages(history);
            } catch (err) {
                console.error("Failed to load study room details:", err);
                navigate('/studybuddy');
            }
        };

        loadRoomData();
    }, [roomId, navigate, user]);

    // Bind local stream
    useEffect(() => {
        if (!isLoading && stream && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    }, [isLoading, stream]);

    // Local Timer interval
    useEffect(() => {
        if (timerActive) {
            timerIntervalRef.current = setInterval(() => {
                setTimerRemaining(prev => {
                    if (prev <= 1) {
                        setTimerActive(false);
                        clearInterval(timerIntervalRef.current);
                        // Trigger alert sound or notification
                        try {
                            const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
                            audio.volume = 0.5;
                            audio.play();
                        } catch (e) { /* ignore */ }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [timerActive]);

    // --- WebRTC / Simple-Peer Signaling ---

    const remoteStreamWatcherRef = useRef(null);
    const remoteFallbackStreamRef = useRef(new MediaStream());

    const destroyPeer = useCallback(() => {
        if (peerRef.current) {
            console.log("[WebRTC] Destroying peer connection");
            peerRef.current.destroy();
            peerRef.current = null;
        }
        if (remoteStreamWatcherRef.current) {
            clearInterval(remoteStreamWatcherRef.current);
            remoteStreamWatcherRef.current = null;
        }
        setIsCallActive(false);
        remoteStreamRef.current = null;
        remoteFallbackStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    }, []);

    // Robust remote stream attachment with audio enable & autoplay retry
    const attachRemoteStream = useCallback((remoteStream) => {
        if (!remoteStream) return;

        const tracks = remoteStream.getTracks();
        const hasLiveTrack = tracks.some(t => t.readyState === 'live');
        if (!hasLiveTrack && tracks.length > 0) return;

        // Skip if same stream already attached
        if (remoteStreamRef.current?.id === remoteStream.id) {
            if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play().catch(() => {});
            }
            return;
        }

        console.log(`[WebRTC] Attaching remote stream: id=${remoteStream.id}, tracks=${tracks.map(t => t.kind + ':' + t.readyState).join(', ')}`);

        remoteStreamRef.current = remoteStream;
        setIsCallActive(true);

        // Enable all audio tracks
        remoteStream.getAudioTracks().forEach(track => {
            track.enabled = true;
        });

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.volume = 1;
            remoteVideoRef.current.play().catch((e) => {
                console.warn('[WebRTC] Autoplay blocked:', e.message);
                const retry = () => {
                    remoteVideoRef.current?.play().catch(() => {});
                    window.removeEventListener('pointerdown', retry);
                    window.removeEventListener('keydown', retry);
                };
                window.addEventListener('pointerdown', retry, { once: true });
                window.addEventListener('keydown', retry, { once: true });
            });
        }

        // Stop watcher
        if (remoteStreamWatcherRef.current) {
            clearInterval(remoteStreamWatcherRef.current);
            remoteStreamWatcherRef.current = null;
        }
    }, []);

    // Re-attach after render
    useEffect(() => {
        if (isCallActive && remoteStreamRef.current && remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.volume = 1;
            remoteVideoRef.current.play().catch(() => {});
        }
    }, [isCallActive]);

    // Extract remote stream from peer using multiple fallback methods
    const tryExtractRemoteStream = useCallback((peer) => {
        if (!peer || peer.destroyed) return false;

        // Method 1: simple-peer internal _remoteStreams
        const existing = peer._remoteStreams?.[0]
            || (peer._pc?.getRemoteStreams && peer._pc.getRemoteStreams()[0]);
        if (existing) {
            attachRemoteStream(existing);
            return true;
        }

        // Method 2: Build stream from RTCRtpReceiver tracks
        const pc = peer._pc;
        if (pc && typeof pc.getReceivers === 'function') {
            const liveTracks = pc.getReceivers().map(r => r.track).filter(t => t && t.readyState === 'live');
            if (liveTracks.length > 0) {
                liveTracks.forEach(t => {
                    if (!remoteFallbackStreamRef.current.getTracks().some(et => et.id === t.id)) {
                        remoteFallbackStreamRef.current.addTrack(t);
                    }
                });
                if (remoteFallbackStreamRef.current.getTracks().length > 0) {
                    attachRemoteStream(remoteFallbackStreamRef.current);
                    return true;
                }
            }
        }
        return false;
    }, [attachRemoteStream]);

    // Wire up all stream detection on a peer (stream, track, pc.ontrack, polling)
    const registerPeerStreamHandlers = useCallback((peer) => {
        peer.on("stream", (stream) => {
            console.log("[WebRTC] peer.on('stream') fired");
            attachRemoteStream(stream);
        });

        peer.on("track", (track, stream) => {
            console.log(`[WebRTC] peer.on('track') fired: ${track.kind}:${track.readyState}`);
            if (stream) { attachRemoteStream(stream); return; }
            if (!remoteFallbackStreamRef.current.getTracks().some(t => t.id === track.id)) {
                remoteFallbackStreamRef.current.addTrack(track);
            }
            attachRemoteStream(remoteFallbackStreamRef.current);
        });

        if (peer._pc) {
            peer._pc.addEventListener('track', (event) => {
                console.log(`[WebRTC] pc.ontrack: ${event.track?.kind}, streams=${event.streams?.length}`);
                if (event.streams?.[0]) { attachRemoteStream(event.streams[0]); return; }
                if (event.track) {
                    if (!remoteFallbackStreamRef.current.getTracks().some(t => t.id === event.track.id)) {
                        remoteFallbackStreamRef.current.addTrack(event.track);
                    }
                    attachRemoteStream(remoteFallbackStreamRef.current);
                }
            });
        }

        // Polling fallback — check every 800ms
        if (remoteStreamWatcherRef.current) clearInterval(remoteStreamWatcherRef.current);
        remoteStreamWatcherRef.current = setInterval(() => {
            if (!peer || peer.destroyed) {
                clearInterval(remoteStreamWatcherRef.current);
                remoteStreamWatcherRef.current = null;
                return;
            }
            if (!remoteStreamRef.current) {
                tryExtractRemoteStream(peer);
            } else {
                clearInterval(remoteStreamWatcherRef.current);
                remoteStreamWatcherRef.current = null;
            }
        }, 800);
    }, [attachRemoteStream, tryExtractRemoteStream]);

    const initiateCall = useCallback((otherSocketId, currentStream) => {
        if (!currentStream) return;
        destroyPeer();

        console.log(`[WebRTC] Initiating call to ${otherSocketId}`);

        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream: currentStream,
            config: { iceServers },
            offerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: true }
        });

        peer.on("signal", signal => {
            socketRef.current.emit("webrtc-signal", { signal, to: otherSocketId });
        });

        peer.on("connect", () => {
            console.log("[WebRTC] Peer connected (initiator)");
            setIsCallActive(true);
            setTimeout(() => tryExtractRemoteStream(peer), 300);
        });

        peer.on("error", err => {
            console.error("[WebRTC] Peer error:", err);
            destroyPeer();
        });

        peer.on("close", () => {
            console.log("[WebRTC] Peer connection closed");
            destroyPeer();
        });

        registerPeerStreamHandlers(peer);
        peerRef.current = peer;
    }, [destroyPeer, registerPeerStreamHandlers, tryExtractRemoteStream]);

    const answerCall = useCallback((incomingSignal, otherSocketId, currentStream) => {
        if (!currentStream) return;
        destroyPeer();

        console.log(`[WebRTC] Answering call from socket ${otherSocketId}`);

        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream: currentStream,
            config: { iceServers },
            offerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: true }
        });

        peer.on("signal", signal => {
            socketRef.current.emit("webrtc-signal", { signal, to: otherSocketId });
        });

        peer.on("connect", () => {
            console.log("[WebRTC] Peer connected (answering)");
            setIsCallActive(true);
            setTimeout(() => tryExtractRemoteStream(peer), 300);
        });

        peer.on("error", err => {
            console.error("[WebRTC] Peer error:", err);
            destroyPeer();
        });

        peer.on("close", () => {
            console.log("[WebRTC] Peer connection closed");
            destroyPeer();
        });

        registerPeerStreamHandlers(peer);
        peer.signal(incomingSignal);
        peerRef.current = peer;
    }, [destroyPeer, registerPeerStreamHandlers, tryExtractRemoteStream]);

    // Socket Setup — All WebRTC peer logic is INLINE to avoid stale closure / re-render issues
    useEffect(() => {
        if (!user) return;

        const currentSocket = io(SOCKET_SERVER_URL);
        socketRef.current = currentSocket;
        const streamLocal = { current: null };
        let watcherInterval = null;
        const fallbackStream = new MediaStream();
        const pendingSignals = [];
        const queuedIceSignals = {};

        // --- Inline robust stream detection ---
        function doAttach(rs) {
            if (!rs) return;
            const tracks = rs.getTracks();
            if (tracks.length > 0 && !tracks.some(t => t.readyState === 'live')) return;
            if (remoteStreamRef.current?.id === rs.id) {
                if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                    remoteVideoRef.current.srcObject = rs;
                    remoteVideoRef.current.play().catch(() => {});
                }
                return;
            }
            console.log(`[WebRTC] Attaching: ${tracks.map(t => t.kind + ':' + t.readyState).join(',')}`);
            remoteStreamRef.current = rs;
            setIsCallActive(true);
            rs.getAudioTracks().forEach(t => { t.enabled = true; });
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = rs;
                remoteVideoRef.current.muted = false;
                remoteVideoRef.current.volume = 1;
                remoteVideoRef.current.play().catch(() => {
                    const r = () => { remoteVideoRef.current?.play().catch(() => {}); };
                    window.addEventListener('pointerdown', r, { once: true });
                    window.addEventListener('keydown', r, { once: true });
                });
            }
            if (watcherInterval) { clearInterval(watcherInterval); watcherInterval = null; }
        }

        function doExtract(peer) {
            if (!peer || peer.destroyed) return false;
            const ex = peer._remoteStreams?.[0] || peer._pc?.getRemoteStreams?.()[0];
            if (ex) { doAttach(ex); return true; }
            if (peer._pc?.getReceivers) {
                const live = peer._pc.getReceivers().map(r => r.track).filter(t => t?.readyState === 'live');
                live.forEach(t => { if (!fallbackStream.getTracks().some(e => e.id === t.id)) fallbackStream.addTrack(t); });
                if (fallbackStream.getTracks().length > 0) { doAttach(fallbackStream); return true; }
            }
            return false;
        }

        function hookStreamDetection(peer) {
            peer.on('stream', s => { console.log("[WebRTC] stream event"); doAttach(s); });
            peer.on('track', (t, s) => {
                console.log(`[WebRTC] track event: ${t.kind}`);
                if (s) { doAttach(s); return; }
                if (!fallbackStream.getTracks().some(e => e.id === t.id)) fallbackStream.addTrack(t);
                doAttach(fallbackStream);
            });
            if (peer._pc) {
                peer._pc.addEventListener('track', ev => {
                    console.log(`[WebRTC] pc.ontrack: ${ev.track?.kind}`);
                    if (ev.streams?.[0]) { doAttach(ev.streams[0]); return; }
                    if (ev.track) {
                        if (!fallbackStream.getTracks().some(t => t.id === ev.track.id)) fallbackStream.addTrack(ev.track);
                        doAttach(fallbackStream);
                    }
                });
            }
            if (watcherInterval) clearInterval(watcherInterval);
            watcherInterval = setInterval(() => {
                if (!peer || peer.destroyed) { clearInterval(watcherInterval); watcherInterval = null; return; }
                if (!remoteStreamRef.current) doExtract(peer);
                else { clearInterval(watcherInterval); watcherInterval = null; }
            }, 800);
        }

        function doDestroy() {
            if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
            if (watcherInterval) { clearInterval(watcherInterval); watcherInterval = null; }
            setIsCallActive(false);
            remoteStreamRef.current = null;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }

        function doQueueIce(from, signal) {
            if (!from || !signal || signal.type) return;
            if (!queuedIceSignals[from]) queuedIceSignals[from] = [];
            queuedIceSignals[from].push(signal);
        }

        function doFlushQueuedIce(from) {
            if (!from || !peerRef.current || peerRef.current.destroyed) return;
            const q = queuedIceSignals[from];
            if (!Array.isArray(q) || q.length === 0) return;
            const pc = peerRef.current._pc;
            const hasRemoteDesc = Boolean(pc?.remoteDescription?.type);
            if (!hasRemoteDesc) return;

            const remaining = [];
            q.forEach(ice => {
                try {
                    peerRef.current.signal(ice);
                } catch(e) {
                    remaining.push(ice);
                }
            });
            queuedIceSignals[from] = remaining;
        }

        function doSignalSafely(from, signal) {
            if (!peerRef.current || peerRef.current.destroyed || !signal) return false;
            const isIce = !signal.type;
            if (isIce) {
                const pc = peerRef.current._pc;
                const hasRemoteDesc = Boolean(pc?.remoteDescription?.type);
                if (!hasRemoteDesc) {
                    doQueueIce(from, signal);
                    return false;
                }
            }
            try {
                peerRef.current.signal(signal);
                if (signal.type === 'answer' || signal.type === 'offer') {
                    setTimeout(() => doFlushQueuedIce(from), 100);
                }
                return true;
            } catch(e) {
                console.warn("[WebRTC] Safe signal failed:", e.message);
                return false;
            }
        }

        function doInitiate(targetId, stream) {
            if (!stream) return;
            doDestroy();
            console.log(`[WebRTC] Initiating to ${targetId}`);
            const p = new Peer({
                initiator: true, trickle: true, stream,
                config: { iceServers },
                offerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: true }
            });
            p.on('signal', sig => currentSocket.emit('webrtc-signal', { signal: sig, to: targetId }));
            p.on('connect', () => { console.log("[WebRTC] Connected (init)"); setIsCallActive(true); setTimeout(() => doExtract(p), 300); });
            p.on('error', e => { console.error("[WebRTC] Error:", e.message); doDestroy(); });
            p.on('close', () => { console.log("[WebRTC] Closed"); doDestroy(); });
            hookStreamDetection(p);
            peerRef.current = p;
        }

        function doAnswer(offer, fromId, stream) {
            if (!stream) { console.warn("[WebRTC] No local stream for answer"); return; }
            doDestroy();
            console.log(`[WebRTC] Answering from ${fromId}`);
            const p = new Peer({
                initiator: false, trickle: true, stream,
                config: { iceServers },
                offerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: true }
            });
            p.on('signal', sig => currentSocket.emit('webrtc-signal', { signal: sig, to: fromId }));
            p.on('connect', () => { console.log("[WebRTC] Connected (answer)"); setIsCallActive(true); setTimeout(() => doExtract(p), 300); });
            p.on('error', e => { console.error("[WebRTC] Error:", e.message); doDestroy(); });
            p.on('close', () => { console.log("[WebRTC] Closed"); doDestroy(); });
            hookStreamDetection(p);
            p.signal(offer);
            peerRef.current = p;
        }

        // --- Socket listeners (registered before media/join) ---

        currentSocket.on("buddy-room-users", (users) => {
            setParticipants(users);
            const myId = currentSocket.id;
            const other = users.find(u => u.socketId !== myId);
            if (other && myId < other.socketId && streamLocal.current) {
                if (peerRef.current && !peerRef.current.destroyed) return; // guard
                doInitiate(other.socketId, streamLocal.current);
                
                // Flush pending signals
                const toFlush = pendingSignals.filter(s => s.from === other.socketId);
                toFlush.forEach(s => doSignalSafely(other.socketId, s.signal));
                
                // Filter out of pending
                const remainingPending = pendingSignals.filter(s => s.from !== other.socketId);
                pendingSignals.length = 0;
                pendingSignals.push(...remainingPending);
            }
        });

        currentSocket.on("webrtc-signal", ({ signal, from }) => {
            console.log(`[WebRTC] Signal: type=${signal.type || 'ice'} from=${from}`);
            if (signal.type === 'offer') {
                doAnswer(signal, from, streamLocal.current);
                
                // Flush pending signals (especially ICE candidates)
                const toFlush = pendingSignals.filter(s => s.from === from);
                toFlush.forEach(s => doSignalSafely(from, s.signal));
                
                const remainingPending = pendingSignals.filter(s => s.from !== from);
                pendingSignals.length = 0;
                pendingSignals.push(...remainingPending);
            } else if (!peerRef.current || peerRef.current.destroyed) {
                pendingSignals.push({ from, signal });
            } else {
                doSignalSafely(from, signal);
                doFlushQueuedIce(from);
            }
        });

        currentSocket.on("buddy-user-joined", (u) => console.log("[Socket] Partner joined:", u.name));
        currentSocket.on("buddy-user-left", () => { console.log("[Socket] Partner left"); doDestroy(); });
        currentSocket.on("buddy-session-ended", () => { computeSessionMetrics(); setShowSummary(true); });

        currentSocket.on("receive-buddy-message", (message) => {
            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
        });

        currentSocket.on("buddy-notes-change", ({ notes: incomingNotes }) => {
            setNotes(incomingNotes);
            setIsBuddyTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsBuddyTyping(false), 1500);
        });

        currentSocket.on("buddy-todo-change", ({ todos: incomingTodos }) => setTodos(incomingTodos));

        currentSocket.on("buddy-timer-control", ({ action, value }) => {
            if (action === 'start') setTimerActive(true);
            else if (action === 'pause') setTimerActive(false);
            else if (action === 'reset') {
                setTimerActive(false);
                setTimerRemaining(value.remaining);
                setTimerDuration(value.duration);
                setTimerType(value.type);
            } else if (action === 'change-duration') {
                setTimerDuration(value.duration);
                setTimerRemaining(value.duration);
                setTimerType(value.type);
                setTimerActive(false);
            }
        });

        currentSocket.on("buddy-room-full", ({ message }) => { alert(message); navigate('/studybuddy'); });

        // --- Get media, then join room ---
        (async () => {
            try {
                const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(ms);
                streamLocal.current = ms;
                if (localVideoRef.current) localVideoRef.current.srcObject = ms;
            } catch (err) {
                console.warn("[Media] Camera/mic denied:", err);
            }
            currentSocket.emit("join-buddy-room", { roomId, userId, name: user?.name });
            setIsLoading(false);
        })();

        return () => {
            currentSocket.off("buddy-room-users"); currentSocket.off("webrtc-signal");
            currentSocket.off("buddy-user-joined"); currentSocket.off("buddy-user-left");
            currentSocket.off("buddy-session-ended"); currentSocket.off("receive-buddy-message");
            currentSocket.off("buddy-notes-change"); currentSocket.off("buddy-todo-change");
            currentSocket.off("buddy-timer-control"); currentSocket.off("buddy-room-full");
            currentSocket.disconnect();
            if (streamLocal.current) streamLocal.current.getTracks().forEach(t => t.stop());
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            doDestroy();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // Send chat message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId) return;

        socketRef.current.emit("send-buddy-message", {
            roomId,
            sender: userId,
            text: newMessage
        });
        setNewMessage('');
    };

    // Notes handler
    const handleNotesChange = (e) => {
        const value = e.target.value;
        setNotes(value);

        // Sync with socket
        socketRef.current.emit("buddy-notes-change", { roomId, notes: value });

        // Debounce database sync
        debouncedSaveNotes(value);
    };

    const debouncedSaveNotes = useCallback(
        (() => {
            let timeout;
            return (val) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    syncBuddyNotes(roomId, val).catch(err => console.error("Notes save failed:", err));
                }, 2000);
            };
        })(),
        [roomId]
    );

    // Synced checklist handlers
    const handleAddTodo = (e) => {
        e.preventDefault();
        if (!newTodoText.trim()) return;

        const newTodo = {
            id: Date.now().toString(),
            text: newTodoText,
            done: false
        };

        const updated = [...todos, newTodo];
        setTodos(updated);
        setNewTodoText('');

        // Socket sync
        socketRef.current.emit("buddy-todo-change", { roomId, todos: updated });
        // Database sync
        syncBuddyTodos(roomId, updated).catch(err => console.error("DB Todo sync error:", err));
    };

    const handleToggleTodo = (id) => {
        const updated = todos.map(todo => 
            todo.id === id ? { ...todo, done: !todo.done } : todo
        );
        setTodos(updated);

        // Socket sync
        socketRef.current.emit("buddy-todo-change", { roomId, todos: updated });
        // Database sync
        syncBuddyTodos(roomId, updated).catch(err => console.error("DB Todo sync error:", err));

        // Glow effects on check
        try {
            const checkedTodo = todos.find(t => t.id === id);
            if (checkedTodo && !checkedTodo.done) {
                // Subtle celebratory pop sound
                const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
                audio.volume = 0.1;
                audio.play();
            }
        } catch(e) {}
    };

    const handleDeleteTodo = (id) => {
        const updated = todos.filter(todo => todo.id !== id);
        setTodos(updated);

        // Socket sync
        socketRef.current.emit("buddy-todo-change", { roomId, todos: updated });
        // Database sync
        syncBuddyTodos(roomId, updated).catch(err => console.error("DB Todo sync error:", err));
    };

    // Shared Pomodoro controller handlers
    const toggleSharedTimer = () => {
        const action = timerActive ? 'pause' : 'start';
        setTimerActive(!timerActive);
        socketRef.current.emit("buddy-timer-control", { roomId, action });
    };

    const changeTimerDuration = (durationMins, type) => {
        const sec = durationMins * 60;
        setTimerDuration(sec);
        setTimerRemaining(sec);
        setTimerType(type);
        setTimerActive(false);

        socketRef.current.emit("buddy-timer-control", {
            roomId,
            action: 'change-duration',
            value: { duration: sec, type }
        });
    };

    const resetSharedTimer = () => {
        setTimerActive(false);
        setTimerRemaining(timerDuration);

        socketRef.current.emit("buddy-timer-control", {
            roomId,
            action: 'reset',
            value: { remaining: timerDuration, duration: timerDuration, type: timerType }
        });
    };

    // Media controls
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

    // Compute session metrics
    const computeSessionMetrics = () => {
        const diffMs = Math.abs(new Date() - sessionStartTime);
        const mins = Math.floor(diffMs / 1000 / 60);
        setStudyMinutesCompleted(mins);
    };

    // Leaving / Ending session
    const handleLeaveSession = async () => {
        if (!room) return;

        const isHost = String(room.host?._id || room.host) === String(userId);
        
        if (isHost) {
            const confirmEnd = window.confirm("Are you sure you want to end this study session for everyone? Your buddy will also be disconnected.");
            if (confirmEnd) {
                try {
                    // end session in socket
                    socketRef.current.emit("buddy-session-end", { roomId });
                    // update database
                    await completeBuddyRoom(roomId);
                } catch (err) {
                    console.error("Error ending session:", err);
                }
            }
        } else {
            const confirmLeave = window.confirm("Are you sure you want to leave this study session? You can rejoin later if the host keeps it active.");
            if (confirmLeave) {
                try {
                    await leaveBuddyRoom(roomId, userId);
                    navigate('/studybuddy');
                } catch (err) {
                    console.error("Error leaving room:", err);
                }
            }
        }
    };

    // Download notes content
    const handleDownloadNotes = () => {
        const element = document.createElement("a");
        const file = new Blob([notes], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${room?.name || 'StudyBuddy'}_Notes.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Copy notes content
    const handleCopyNotes = () => {
        navigator.clipboard.writeText(notes);
        alert("Notes copied to clipboard!");
    };

    // Render formatted time
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isHost = room && String(room.host?._id || room.host) === String(userId);
    const partnerName = participants.find(p => p.userId !== userId)?.name || "Buddy";

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0f0a16]">
                <Loader2 className="w-12 h-12 text-[#8c30e8] animate-spin mb-4" />
                <p className="text-white text-sm font-semibold tracking-wider">CONNECTING CLASSROOM...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden relative">
            
            {/* Background blur */}
            <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#8c30e8]/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="flex-1 flex flex-col h-full relative z-10">
                
                {/* Active Session Navbar */}
                <header className="px-6 py-4 bg-slate-950/80 border-b border-white/5 backdrop-blur-md flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <div>
                            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                                {room?.name} <span className="text-xs font-normal text-slate-400">({room?.subject})</span>
                            </h2>
                            <p className="text-[10px] text-slate-400 font-medium">
                                P2P Co-Studying
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Audio/Video controls */}
                        <div className="flex items-center bg-slate-900/80 border border-white/5 rounded-xl p-1 gap-1">
                            <button
                                onClick={toggleAudio}
                                className={`p-2 rounded-lg transition-all ${
                                    isAudioMuted 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                        : 'hover:bg-white/5 text-slate-300'
                                }`}
                                title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
                            >
                                {isAudioMuted ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                            <button
                                onClick={toggleVideo}
                                className={`p-2 rounded-lg transition-all ${
                                    isVideoMuted 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                        : 'hover:bg-white/5 text-slate-300'
                                }`}
                                title={isVideoMuted ? "Start Camera" : "Stop Camera"}
                            >
                                {isVideoMuted ? <VideoOff size={16} /> : <VideoIcon size={16} />}
                            </button>
                        </div>

                        {/* End/Leave Button */}
                        <button
                            onClick={handleLeaveSession}
                            className="bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-600 text-red-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <LogOut size={14} />
                            {isHost ? 'End Session' : 'Leave Room'}
                        </button>
                    </div>
                </header>

                {/* Workspace grid layout */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left Column: Video Call & Collaboration tools */}
                    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
                        
                        {/* WebRTC Video call grid (strictly 2 slots) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                            {/* Local Stream (User A) */}
                            <div className="relative aspect-video rounded-3xl bg-slate-950 border border-white/5 overflow-hidden shadow-inner flex items-center justify-center">
                                {isVideoMuted ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-500">
                                            <VideoOff size={22} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">Camera is off</span>
                                    </div>
                                ) : (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover rounded-3xl"
                                    />
                                )}
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/5 text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    You {isAudioMuted && <span className="text-red-400 ml-1 font-normal">(Muted)</span>}
                                </div>
                            </div>

                            {/* Remote Stream (User B) */}
                            <div className="relative aspect-video rounded-3xl bg-slate-950 border border-white/5 overflow-hidden shadow-inner flex items-center justify-center">
                                {/* Always render the video element so the ref is available when the stream arrives */}
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className={`w-full h-full object-cover rounded-3xl ${isCallActive ? 'block' : 'hidden'}`}
                                />
                                {!isCallActive && (
                                    <div className="flex flex-col items-center gap-2 text-center p-4">
                                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-[#8c30e8] animate-pulse">
                                            <Users size={22} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-300">Waiting for buddy to connect...</span>
                                        <p className="text-[10px] text-slate-500 max-w-[200px]">Send the room link to your friend so they can join co-studying!</p>
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/5 text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isCallActive ? 'bg-green-500' : 'bg-slate-500'}`} />
                                    {partnerName}
                                </div>
                            </div>
                        </div>

                        {/* Co-Studying session checklist / Goals */}
                        <div className="bg-slate-950/60 border border-white/5 rounded-3xl p-6 flex flex-col flex-1 min-h-[300px]">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                                <CheckSquare size={18} className="text-[#8c30e8]" />
                                <h3 className="text-sm font-bold text-slate-200">Shared Session Objectives</h3>
                                <span className="text-[10px] text-slate-500 font-normal ml-auto">
                                    {todos.filter(t => t.done).length}/{todos.length} Complete
                                </span>
                            </div>

                            {/* Add Todo */}
                            <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newTodoText}
                                    onChange={(e) => setNewTodoText(e.target.value)}
                                    placeholder="What topic do we want to cover?"
                                    className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#8c30e8] placeholder-slate-600"
                                />
                                <button type="submit" className="bg-[#8c30e8] hover:bg-[#9c4be9] p-2 rounded-xl text-white">
                                    <Plus size={16} />
                                </button>
                            </form>

                            {/* Todo List */}
                            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                                {todos.length > 0 ? (
                                    todos.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className="flex items-center gap-3 bg-slate-900/60 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={todo.done}
                                                onChange={() => handleToggleTodo(todo.id)}
                                                className="w-4.5 h-4.5 rounded border-white/15 bg-transparent text-[#8c30e8] focus:ring-0 cursor-pointer"
                                            />
                                            <span className={`flex-1 text-xs font-semibold ${todo.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                                {todo.text}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteTodo(todo.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-500 text-xs font-medium">
                                        No objectives set yet. Add items above to coordinate your study path!
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Sliding Study Pad Bar */}
                    <AnimatePresence>
                        {isNotesOpen && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 340, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="border-l border-white/5 bg-slate-950/40 backdrop-blur-md flex flex-col shrink-0 overflow-hidden relative z-10"
                            >
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-[#8c30e8]" />
                                        <span className="text-xs font-bold text-slate-200">Shared Study Pad</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {isBuddyTyping && (
                                            <span className="text-[10px] text-purple-400 animate-pulse mr-2 font-medium">
                                                Typing...
                                            </span>
                                        )}
                                        <button
                                            onClick={handleCopyNotes}
                                            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
                                            title="Copy Notes"
                                        >
                                            <Clipboard size={14} />
                                        </button>
                                        <button
                                            onClick={handleDownloadNotes}
                                            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
                                            title="Download Notes"
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button
                                            onClick={() => setIsNotesOpen(false)}
                                            className="text-slate-400 hover:text-white ml-1"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Collaborative Notes Textarea */}
                                <div className="flex-1 p-4 flex flex-col">
                                    <textarea
                                        value={notes}
                                        onChange={handleNotesChange}
                                        placeholder="Type anything here! Notes are synced instantly and saved automatically."
                                        className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-300 focus:ring-0 focus:outline-none placeholder-slate-600 custom-scrollbar leading-relaxed"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Chat toggle button when closed */}
                    {!isNotesOpen && (
                        <button
                            onClick={() => setIsNotesOpen(true)}
                            className="absolute bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-[#8c30e8] hover:bg-[#9c4be9] shadow-xl flex items-center justify-center text-white cursor-pointer transition-transform hover:-translate-y-0.5"
                        >
                            <FileText size={20} />
                        </button>
                    )}

                </div>

            </div>

            {/* End of Session Summary Modal (Outstanding feature) */}
            <AnimatePresence>
                {showSummary && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-2xl bg-[#191121] border border-[#8c30e8]/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-[-20%] left-[-10%] w-80 h-80 bg-[#8c30e8]/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-[#8c30e8]/20 flex items-center justify-center mx-auto mb-4 border border-[#8c30e8]/30">
                                    <Sparkles className="text-[#8c30e8] animate-bounce" size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-white">Co-Study Session Completed!</h2>
                                <p className="text-slate-400 text-xs mt-1">Outstanding work! Here is what you achieved in this session.</p>
                            </div>

                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Co-Studied</span>
                                    <h3 className="text-2xl font-black text-white mt-1.5">{studyMinutesCompleted}<span className="text-xs font-semibold text-slate-400 ml-0.5">m</span></h3>
                                </div>
                                
                                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Tasks</span>
                                    <h3 className="text-2xl font-black text-white mt-1.5">
                                        {todos.filter(t => t.done).length} / {todos.length}
                                    </h3>
                                </div>

                                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Session Partner</span>
                                    <h3 className="text-sm font-bold text-[#8c30e8] mt-2.5 truncate">{partnerName}</h3>
                                </div>
                            </div>

                            {/* Notes review */}
                            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 mb-8 flex flex-col max-h-48">
                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                    <span className="text-xs font-bold text-slate-300">Session Notes Summary</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopyNotes}
                                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                                        >
                                            <Clipboard size={12} /> Copy
                                        </button>
                                        <button
                                            onClick={handleDownloadNotes}
                                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                                        >
                                            <Download size={12} /> Download
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed overflow-y-auto custom-scrollbar italic whitespace-pre-line">
                                    {notes || "No notes were captured in this session."}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/studybuddy')}
                                    className="flex-1 py-3 bg-[#8c30e8] hover:bg-[#9c4be9] text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-purple-500/25 transition-all text-center"
                                >
                                    Return to Lobby
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
        </div>
    );
};

export default ActiveStudyBuddy;

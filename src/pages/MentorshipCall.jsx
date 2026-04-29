import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Monitor, MonitorOff, Loader2 } from 'lucide-react';

const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || (isLocalhost
    ? 'http://localhost:5000'
    : 'https://studybuddy-backend-pl2i.onrender.com');

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
        credential: 'uiadnxBjl+gFZrMi',
    },
    {
        urls: 'turn:a.relay.metered.ca:80?transport=tcp',
        username: 'e8dd65b92f6aee9f74073532',
        credential: 'uiadnxBjl+gFZrMi',
    },
    {
        urls: 'turn:a.relay.metered.ca:443',
        username: 'e8dd65b92f6aee9f74073532',
        credential: 'uiadnxBjl+gFZrMi',
    },
    {
        urls: 'turn:a.relay.metered.ca:443?transport=tcp',
        username: 'e8dd65b92f6aee9f74073532',
        credential: 'uiadnxBjl+gFZrMi',
    },
];

const MentorshipCall = () => {
    const { callId } = useParams();
    const navigate = useNavigate();
    const user = useMemo(() => {
        try {
            return JSON.parse(sessionStorage.getItem('user'));
        } catch (error) {
            return null;
        }
    }, []);

    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [hasRemoteStream, setHasRemoteStream] = useState(false);
    const [hasLocalStream, setHasLocalStream] = useState(false);
    const [mediaError, setMediaError] = useState('');

    const socketRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const localPreviewStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const activeVideoTrackRef = useRef(null);
    const pendingSignalsRef = useRef([]);
    const queuedIceSignalsRef = useRef({});
    const remoteSocketIdRef = useRef(null);
    const remoteStreamIdRef = useRef(null);
    const remoteFallbackStreamRef = useRef(new MediaStream());
    const remoteAttachIntervalRef = useRef(null);

    const otherParticipant = participants.find((item) => item.socketId !== socketRef.current?.id);

    useEffect(() => {
        const previewStream = localPreviewStreamRef.current || streamRef.current;
        if (!localVideoRef.current || !previewStream) return;

        if (localVideoRef.current.srcObject !== previewStream) {
            localVideoRef.current.srcObject = previewStream;
        }

        localVideoRef.current.play().catch(() => {});
    }, [isLoading, hasLocalStream, isScreenSharing]);

    const cleanupPeer = () => {
        if (peerRef.current && !peerRef.current.destroyed) {
            peerRef.current.destroy();
        }
        peerRef.current = null;
        if (remoteAttachIntervalRef.current) {
            clearInterval(remoteAttachIntervalRef.current);
            remoteAttachIntervalRef.current = null;
        }
        remoteSocketIdRef.current = null;
        queuedIceSignalsRef.current = {};
        remoteStreamIdRef.current = null;
        remoteFallbackStreamRef.current = new MediaStream();
        setHasRemoteStream(false);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    };

    const attachRemoteStream = (remoteStream) => {
        if (!remoteVideoRef.current || !remoteStream) return;
        if (remoteStreamIdRef.current === remoteStream.id) return;

        remoteVideoRef.current.srcObject = remoteStream;
        remoteStreamIdRef.current = remoteStream.id;
        setHasRemoteStream(true);
        remoteVideoRef.current.play().catch(() => {});
    };

    const startRemoteAttachWatcher = (remoteSocketId) => {
        if (remoteAttachIntervalRef.current) {
            clearInterval(remoteAttachIntervalRef.current);
            remoteAttachIntervalRef.current = null;
        }

        remoteAttachIntervalRef.current = setInterval(() => {
            if (!peerRef.current || peerRef.current.destroyed) {
                return;
            }

            if (remoteSocketIdRef.current && remoteSocketIdRef.current !== remoteSocketId) {
                return;
            }

            const peer = peerRef.current;
            const existingRemote = peer._remoteStreams?.[0] || (peer._pc?.getRemoteStreams && peer._pc.getRemoteStreams()[0]);

            if (existingRemote) {
                attachRemoteStream(existingRemote);
            }
        }, 700);
    };

    const queueIceSignal = (remoteSocketId, signal) => {
        if (!remoteSocketId || !signal || signal.type) return;

        if (!queuedIceSignalsRef.current[remoteSocketId]) {
            queuedIceSignalsRef.current[remoteSocketId] = [];
        }
        queuedIceSignalsRef.current[remoteSocketId].push(signal);
    };

    const flushQueuedIceSignals = (remoteSocketId) => {
        if (!remoteSocketId || !peerRef.current || peerRef.current.destroyed) return;

        const queue = queuedIceSignalsRef.current[remoteSocketId];
        if (!Array.isArray(queue) || queue.length === 0) return;

        const peerConnection = peerRef.current._pc;
        const hasRemoteDescription = Boolean(peerConnection?.remoteDescription?.type);
        if (!hasRemoteDescription) return;

        const remaining = [];
        queue.forEach((iceSignal) => {
            try {
                peerRef.current.signal(iceSignal);
            } catch (error) {
                remaining.push(iceSignal);
            }
        });

        queuedIceSignalsRef.current[remoteSocketId] = remaining;
    };

    const signalPeerSafely = (remoteSocketId, signal) => {
        if (!peerRef.current || peerRef.current.destroyed || !signal) return false;

        const isIceSignal = !signal.type;
        if (isIceSignal) {
            const peerConnection = peerRef.current._pc;
            const hasRemoteDescription = Boolean(peerConnection?.remoteDescription?.type);
            if (!hasRemoteDescription) {
                queueIceSignal(remoteSocketId, signal);
                return false;
            }
        }

        try {
            peerRef.current.signal(signal);

            if (signal.type === 'answer' || signal.type === 'offer') {
                setTimeout(() => flushQueuedIceSignals(remoteSocketId), 100);
            }

            return true;
        } catch (error) {
            if (isIceSignal) {
                queueIceSignal(remoteSocketId, signal);
            } else {
                pendingSignalsRef.current.push({ from: remoteSocketId, signal });
            }
            return false;
        }
    };

    const flushPendingSignals = (remoteSocketId) => {
        if (!remoteSocketId) return;

        const remaining = [];
        pendingSignalsRef.current.forEach((item) => {
            if (item.from !== remoteSocketId) {
                remaining.push(item);
                return;
            }

            const applied = signalPeerSafely(remoteSocketId, item.signal);
            if (!applied && item.signal?.type) {
                remaining.push(item);
            }
        });

        pendingSignalsRef.current = remaining;
    };

    const registerPeerHandlers = (peer, remoteSocketId) => {
        peer.on('signal', (signal) => {
            socketRef.current?.emit('webrtc-signal', { signal, to: remoteSocketId });
        });

        peer.on('stream', (remoteStream) => {
            attachRemoteStream(remoteStream);
        });

        peer.on('track', (_track, remoteStream) => {
            if (remoteStream) {
                attachRemoteStream(remoteStream);
                return;
            }

            if (_track) {
                const existingTrack = remoteFallbackStreamRef.current
                    .getTracks()
                    .find((track) => track.id === _track.id);

                if (!existingTrack) {
                    remoteFallbackStreamRef.current.addTrack(_track);
                }
                attachRemoteStream(remoteFallbackStreamRef.current);
            }
        });

        if (peer._pc) {
            peer._pc.addEventListener('track', (event) => {
                if (event.streams && event.streams[0]) {
                    attachRemoteStream(event.streams[0]);
                    return;
                }

                if (event.track) {
                    const exists = remoteFallbackStreamRef.current
                        .getTracks()
                        .find((track) => track.id === event.track.id);
                    if (!exists) {
                        remoteFallbackStreamRef.current.addTrack(event.track);
                    }
                    attachRemoteStream(remoteFallbackStreamRef.current);
                }
            });
        }

        peer.on('connect', () => {
            flushPendingSignals(remoteSocketId);
            flushQueuedIceSignals(remoteSocketId);
        });

        peer.on('error', (error) => {
            console.error('[MentorshipCall] Peer error:', error?.message || error);
        });

        startRemoteAttachWatcher(remoteSocketId);
    };

    const leaveCall = () => {
        cleanupPeer();
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => {
                track.onended = null;
                track.stop();
            });
            screenStreamRef.current = null;
        }
        setIsScreenSharing(false);

        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current = null;
        }
        localPreviewStreamRef.current = null;
        activeVideoTrackRef.current = null;
        setHasLocalStream(false);
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (user?.role === 'teacher') {
            navigate('/instructor-mentorship');
            return;
        }
        navigate('/mentorship');
    };

    const createInitiatorPeer = (remoteSocketId, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream: stream || undefined,
            config: { iceServers },
            offerOptions: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            },
        });

        registerPeerHandlers(peer, remoteSocketId);

        return peer;
    };

    const createResponderPeer = (offerSignal, remoteSocketId, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream: stream || undefined,
            config: { iceServers },
            offerOptions: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            },
        });

        registerPeerHandlers(peer, remoteSocketId);

        try {
            peer.signal(offerSignal);
        } catch (error) {
            pendingSignalsRef.current.push({ from: remoteSocketId, signal: offerSignal });
        }

        return peer;
    };

    const applyOutgoingVideoTrack = async (videoTrack, sourceStream) => {
        if (!videoTrack || !peerRef.current || peerRef.current.destroyed) return;

        const peerConnection = peerRef.current._pc;
        const videoSender = peerConnection
            ?.getSenders?.()
            .find((sender) => sender.track?.kind === 'video');

        try {
            if (videoSender) {
                await videoSender.replaceTrack(videoTrack);
                return;
            }

            peerRef.current.addTrack(videoTrack, sourceStream || new MediaStream([videoTrack]));
        } catch (error) {
            console.error('[MentorshipCall] Failed to apply outgoing video track:', error?.message || error);
        }
    };

    const stopScreenShare = async () => {
        if (!screenStreamRef.current && !isScreenSharing) return;

        const cameraTrack = cameraStreamRef.current?.getVideoTracks?.()[0] || null;
        if (cameraTrack) {
            await applyOutgoingVideoTrack(cameraTrack, cameraStreamRef.current);
            activeVideoTrackRef.current = cameraTrack;
            localPreviewStreamRef.current = cameraStreamRef.current;

            if (localVideoRef.current && localVideoRef.current.srcObject !== cameraStreamRef.current) {
                localVideoRef.current.srcObject = cameraStreamRef.current;
            }
            localVideoRef.current?.play().catch(() => {});

            setHasLocalStream(true);
            setIsVideoMuted(!cameraTrack.enabled);
        } else {
            activeVideoTrackRef.current = null;
            localPreviewStreamRef.current = null;
            setHasLocalStream(false);
        }

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => {
                track.onended = null;
                track.stop();
            });
            screenStreamRef.current = null;
        }

        setIsScreenSharing(false);
    };

    const startScreenShare = async () => {
        if (!navigator.mediaDevices?.getDisplayMedia) {
            setMediaError('Screen sharing is not supported in this browser.');
            return;
        }

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });

            const displayTrack = displayStream.getVideoTracks()[0];
            if (!displayTrack) {
                displayStream.getTracks().forEach((track) => track.stop());
                return;
            }

            await applyOutgoingVideoTrack(displayTrack, displayStream);

            activeVideoTrackRef.current = displayTrack;
            localPreviewStreamRef.current = displayStream;
            screenStreamRef.current = displayStream;
            setHasLocalStream(true);
            setIsScreenSharing(true);
            setIsVideoMuted(!displayTrack.enabled);
            setMediaError('');

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = displayStream;
                localVideoRef.current.play().catch(() => {});
            }

            displayTrack.onended = () => {
                stopScreenShare();
            };
        } catch (error) {
            if (error?.name !== 'NotAllowedError') {
                console.error('[MentorshipCall] Screen share error:', error?.message || error);
            }
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            await stopScreenShare();
            return;
        }

        await startScreenShare();
    };

    const requestLocalMedia = async () => {
        try {
            const previousCameraStream = cameraStreamRef.current;
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            const newVideoTrack = stream.getVideoTracks()[0] || null;
            const newAudioTrack = stream.getAudioTracks()[0] || null;

            cameraStreamRef.current = stream;
            streamRef.current = stream;
            setMediaError('');
            setHasLocalStream(Boolean(newVideoTrack));

            if (!isScreenSharing) {
                localPreviewStreamRef.current = stream;
                activeVideoTrackRef.current = newVideoTrack;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            }

            setIsVideoMuted(newVideoTrack ? !newVideoTrack.enabled : false);

            if (peerRef.current && !peerRef.current.destroyed) {
                const peerConnection = peerRef.current._pc;

                if (newAudioTrack) {
                    const audioSender = peerConnection
                        ?.getSenders?.()
                        .find((sender) => sender.track?.kind === 'audio');

                    try {
                        if (audioSender) {
                            await audioSender.replaceTrack(newAudioTrack);
                        } else {
                            peerRef.current.addTrack(newAudioTrack, stream);
                        }
                    } catch (error) {
                        console.error('[MentorshipCall] Failed to apply outgoing audio track:', error?.message || error);
                    }
                }

                if (newVideoTrack && !isScreenSharing) {
                    await applyOutgoingVideoTrack(newVideoTrack, stream);
                }
            }

            if (previousCameraStream && previousCameraStream !== stream) {
                previousCameraStream.getTracks().forEach((track) => track.stop());
            }

            return true;
        } catch (error) {
            setHasLocalStream(false);
            if (!isScreenSharing) {
                localPreviewStreamRef.current = null;
                activeVideoTrackRef.current = null;
            }
            setMediaError('Camera or microphone permission is blocked/unavailable. Click Retry Camera after allowing access.');
            return false;
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return undefined;
        }

        const socket = io(SOCKET_SERVER_URL);
        socketRef.current = socket;

        const roomId = callId;

        const joinRoom = () => {
            socket.emit('join-room', { roomId, userId: user.id, name: user.name });
            setIsLoading(false);
        };

        const startMedia = async () => {
            await requestLocalMedia();
            joinRoom();
        };

        socket.on('room-users', (users) => {
            setParticipants(users);
            const mySocketId = socket.id;
            const remoteUsers = users.filter((item) => item.socketId !== mySocketId);
            const remoteUser = remoteUsers[0];

            if (!remoteUser || !mySocketId) return;
            if (peerRef.current && !peerRef.current.destroyed) return;

            if (mySocketId < remoteUser.socketId) {
                remoteSocketIdRef.current = remoteUser.socketId;
                peerRef.current = createInitiatorPeer(remoteUser.socketId, streamRef.current);
                flushPendingSignals(remoteUser.socketId);
                setTimeout(() => flushQueuedIceSignals(remoteUser.socketId), 100);
            }
        });

        socket.on('user-left', () => {
            cleanupPeer();
        });

        socket.on('webrtc-signal', ({ from, signal }) => {
            if (signal.type === 'offer') {
                if (
                    peerRef.current &&
                    !peerRef.current.destroyed &&
                    remoteSocketIdRef.current === from
                ) {
                    signalPeerSafely(from, signal);
                    flushPendingSignals(from);
                    setTimeout(() => flushQueuedIceSignals(from), 100);
                    return;
                }

                cleanupPeer();
                remoteSocketIdRef.current = from;
                peerRef.current = createResponderPeer(signal, from, streamRef.current);
                flushPendingSignals(from);
                setTimeout(() => flushQueuedIceSignals(from), 100);
                return;
            }

            if (!peerRef.current || peerRef.current.destroyed) {
                pendingSignalsRef.current.push({ from, signal });
                return;
            }

            if (remoteSocketIdRef.current && remoteSocketIdRef.current !== from) {
                return;
            }

            if (!remoteSocketIdRef.current) {
                remoteSocketIdRef.current = from;
            }

            signalPeerSafely(from, signal);
            flushPendingSignals(from);
            flushQueuedIceSignals(from);
        });

        startMedia();

        return () => {
            cleanupPeer();

            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => {
                    track.onended = null;
                    track.stop();
                });
                screenStreamRef.current = null;
            }

            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach((track) => track.stop());
                cameraStreamRef.current = null;
            }

            streamRef.current = null;
            localPreviewStreamRef.current = null;
            activeVideoTrackRef.current = null;
            setIsScreenSharing(false);
            setHasLocalStream(false);
            socket.off('room-users');
            socket.off('user-left');
            socket.off('webrtc-signal');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [callId, navigate, user]);

    const toggleAudio = () => {
        const audioTrack = cameraStreamRef.current?.getAudioTracks?.()[0]
            || streamRef.current?.getAudioTracks?.()[0];
        if (!audioTrack) return;
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
    };

    const toggleVideo = () => {
        const videoTrack = activeVideoTrackRef.current || streamRef.current?.getVideoTracks?.()[0];
        if (!videoTrack) return;
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
    };

    // ── Loading View ──
    if (isLoading) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white font-sans">
                <div className="flex items-center gap-3 text-purple-600 dark:text-[#8c30e8] font-bold tracking-wide">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Joining session...
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full flex flex-col font-sans transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-[#0f0a16] dark:text-white relative overflow-hidden">
            
            {/* ── Background Ambience ── */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/5 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-600/5 dark:bg-[#8c30e8]/5 rounded-full blur-[120px]" />
            </div>

            {/* ── Header ── */}
            <header className="relative z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b backdrop-blur-md transition-colors bg-white/80 border-slate-200 dark:bg-[#0f0a16]/80 dark:border-white/5">
                <div>
                    <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">Mentorship Session Call</h1>
                    <p className="text-xs text-slate-500 dark:text-white/40">1 to 1 Mentorship Session</p>
                </div>
                <button
                    onClick={leaveCall}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-sm font-bold transition-all"
                >
                    <PhoneOff size={16} />
                    <span className="hidden sm:inline">Leave Call</span>
                </button>
            </header>

            {/* ── Main Video Area ── */}
            <main className="relative z-10 flex-1 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 lg:p-6 bg-slate-100/50 dark:bg-[#130d1a]/50 backdrop-blur-sm">
                    
                    {/* Local Video */}
                    <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-sm group">
                        <video ref={localVideoRef} muted autoPlay playsInline className="w-full h-full object-cover" />
                        
                        {!hasLocalStream && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-purple-50 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-white/40 px-4 text-center">
                                <div className="font-medium text-sm">Camera preview unavailable</div>
                                {mediaError && (
                                    <button
                                        onClick={requestLocalMedia}
                                        className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-white/10 border border-purple-200 dark:border-white/20 hover:bg-purple-200 dark:hover:bg-white/20 text-sm font-bold transition-colors"
                                    >
                                        Retry Camera
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {isVideoMuted && hasLocalStream && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-white/40">
                                <VideoOff size={32} className="opacity-50" />
                                <span className="text-sm font-medium">Camera is off</span>
                            </div>
                        )}
                        
                        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-white/80 text-slate-900 dark:bg-black/50 dark:text-white shadow-sm border border-slate-200 dark:border-white/10">
                            {user?.name || 'You'} (You)
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-sm group">
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        
                        {!otherParticipant && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-white/40">
                                <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                                <span className="text-sm font-medium">Waiting for the other participant...</span>
                            </div>
                        )}
                        
                        {otherParticipant && !hasRemoteStream && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-white/40">
                                <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                                <span className="text-sm font-medium">Connecting to {otherParticipant.name}'s video...</span>
                            </div>
                        )}
                        
                        {otherParticipant && (
                            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-white/80 text-slate-900 dark:bg-black/50 dark:text-white shadow-sm border border-slate-200 dark:border-white/10">
                                {otherParticipant.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Floating Bottom Controls ── */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-colors bg-white/90 border-slate-200 dark:bg-[#191121]/90 dark:border-white/10">
                        <button
                            onClick={toggleAudio}
                            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                                !isAudioMuted
                                    ? 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30'
                            }`}
                        >
                            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        
                        <button
                            onClick={toggleVideo}
                            title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                                !isVideoMuted
                                    ? 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30'
                            }`}
                        >
                            {isVideoMuted ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                        </button>
                        
                        <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />
                        
                        <button
                            onClick={toggleScreenShare}
                            title={isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                                isScreenSharing
                                    ? 'bg-purple-600 text-white dark:bg-[#8c30e8] shadow-md shadow-purple-500/20 hover:brightness-110'
                                    : 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
                            }`}
                        >
                            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MentorshipCall;
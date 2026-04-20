import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';

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
            return JSON.parse(localStorage.getItem('user'));
        } catch (error) {
            return null;
        }
    }, []);

    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [hasRemoteStream, setHasRemoteStream] = useState(false);
    const [hasLocalStream, setHasLocalStream] = useState(false);
    const [mediaError, setMediaError] = useState('');

    const socketRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);
    const pendingSignalsRef = useRef([]);
    const queuedIceSignalsRef = useRef({});
    const remoteSocketIdRef = useRef(null);
    const remoteStreamIdRef = useRef(null);
    const remoteFallbackStreamRef = useRef(new MediaStream());
    const remoteAttachIntervalRef = useRef(null);

    const otherParticipant = participants.find((item) => item.socketId !== socketRef.current?.id);

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
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
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

    const requestLocalMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            setHasLocalStream(true);
            setMediaError('');

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            if (peerRef.current && !peerRef.current.destroyed) {
                const existingSenders = peerRef.current._pc?.getSenders?.() || [];
                const existingTrackIds = new Set(existingSenders.map((sender) => sender.track?.id).filter(Boolean));

                stream.getTracks().forEach((track) => {
                    if (existingTrackIds.has(track.id)) return;
                    try {
                        peerRef.current.addTrack(track, stream);
                    } catch (error) {
                        // Ignore addTrack errors for already-negotiated tracks
                    }
                });
            }

            return true;
        } catch (error) {
            setHasLocalStream(false);
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
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            setHasLocalStream(false);
            socket.off('room-users');
            socket.off('user-left');
            socket.off('webrtc-signal');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [callId, navigate, user]);

    const toggleAudio = () => {
        const audioTrack = streamRef.current?.getAudioTracks?.()[0];
        if (!audioTrack) return;
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
    };

    const toggleVideo = () => {
        const videoTrack = streamRef.current?.getVideoTracks?.()[0];
        if (!videoTrack) return;
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
    };

    if (isLoading) {
        return (
            <div className="h-screen bg-gray-950 text-white flex items-center justify-center">
                <div className="text-lg">Joining session...</div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-950 text-white flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 bg-black/30 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Mentorship Session Call</h1>
                    <p className="text-sm text-gray-400">Two-person video call room</p>
                </div>
                <button
                    onClick={leaveCall}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                    Leave Call
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gray-900">
                    <video ref={localVideoRef} muted autoPlay playsInline className="w-full h-full object-cover" />
                    {!hasLocalStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 text-gray-300 px-4 text-center">
                            <div>Camera preview unavailable</div>
                            {mediaError && (
                                <button
                                    onClick={requestLocalMedia}
                                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-sm"
                                >
                                    Retry Camera
                                </button>
                            )}
                        </div>
                    )}
                    {isVideoMuted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-300">
                            Camera is off
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 text-sm">
                        {user?.name || 'You'} (You)
                    </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gray-900">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {!otherParticipant && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-300">
                            Waiting for the other participant...
                        </div>
                    )}
                    {otherParticipant && !hasRemoteStream && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-300">
                            Connecting to {otherParticipant.name}'s video...
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 text-sm">
                        {otherParticipant?.name || 'Participant'}
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-black/30 flex items-center justify-center gap-4">
                <button
                    onClick={toggleAudio}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                    {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                    {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                </button>
                <button
                    onClick={leaveCall}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700"
                >
                    <PhoneOff className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default MentorshipCall;

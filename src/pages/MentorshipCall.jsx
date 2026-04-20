import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';

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

    if (isLoading) {
        return (
            <div className="h-screen bg-gray-950 text-white flex items-center justify-center">
                <div className="text-lg">Joining session...</div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-gray-950 text-white flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-black/30 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-bold">Mentorship Session Call</h1>
                    <p className="text-sm text-gray-400">1 to 1 Mentorship Session</p>
                </div>
                <button
                    onClick={leaveCall}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                    Leave Call
                </button>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
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

            <div className="px-6 py-4 border-t border-white/10 bg-gray-950/95 backdrop-blur shrink-0 flex items-center justify-center gap-4">
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
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                    {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
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

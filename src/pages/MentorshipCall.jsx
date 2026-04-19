import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'https://studybuddy-backend-pl2i.onrender.com';

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

    const socketRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);
    const pendingSignalsRef = useRef([]);

    const otherParticipant = participants.find((item) => item.socketId !== socketRef.current?.id);

    const cleanupPeer = () => {
        if (peerRef.current && !peerRef.current.destroyed) {
            peerRef.current.destroy();
        }
        peerRef.current = null;
    };

    const leaveCall = () => {
        cleanupPeer();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
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
            stream,
            config: { iceServers },
        });

        peer.on('signal', (signal) => {
            socketRef.current?.emit('webrtc-signal', { signal, to: remoteSocketId });
        });

        peer.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });

        peer.on('error', () => {
            cleanupPeer();
        });

        return peer;
    };

    const createResponderPeer = (offerSignal, remoteSocketId, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream,
            config: { iceServers },
        });

        peer.on('signal', (signal) => {
            socketRef.current?.emit('webrtc-signal', { signal, to: remoteSocketId });
        });

        peer.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });

        peer.on('error', () => {
            cleanupPeer();
        });

        peer.signal(offerSignal);
        return peer;
    };

    const flushPendingSignals = (remoteSocketId) => {
        if (!peerRef.current || peerRef.current.destroyed) return;

        const remaining = [];
        pendingSignalsRef.current.forEach((item) => {
            if (item.from === remoteSocketId) {
                try {
                    peerRef.current.signal(item.signal);
                } catch (error) {
                    remaining.push(item);
                }
            } else {
                remaining.push(item);
            }
        });
        pendingSignalsRef.current = remaining;
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
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                joinRoom();
            } catch (error) {
                joinRoom();
            }
        };

        socket.on('room-users', (users) => {
            setParticipants(users);
            const mySocketId = socket.id;
            const remoteUsers = users.filter((item) => item.socketId !== mySocketId);
            const remoteUser = remoteUsers[0];

            if (!remoteUser || !streamRef.current || !mySocketId) return;
            if (peerRef.current && !peerRef.current.destroyed) return;

            if (mySocketId < remoteUser.socketId) {
                peerRef.current = createInitiatorPeer(remoteUser.socketId, streamRef.current);
                flushPendingSignals(remoteUser.socketId);
            }
        });

        socket.on('user-left', () => {
            cleanupPeer();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
        });

        socket.on('webrtc-signal', ({ from, signal }) => {
            if (!streamRef.current) {
                pendingSignalsRef.current.push({ from, signal });
                return;
            }

            if (signal.type === 'offer') {
                cleanupPeer();
                peerRef.current = createResponderPeer(signal, from, streamRef.current);
                flushPendingSignals(from);
                return;
            }

            if (!peerRef.current || peerRef.current.destroyed) {
                pendingSignalsRef.current.push({ from, signal });
                return;
            }

            try {
                peerRef.current.signal(signal);
            } catch (error) {
                pendingSignalsRef.current.push({ from, signal });
            }
        });

        startMedia();

        return () => {
            cleanupPeer();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
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

import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/notes` : 'https://studybuddy-backend-pl2i.onrender.com/api/notes';

/**
 * Generate notes from message with streaming support
 * @param {string} message - The user's message
 * @param {function} onChunk - Callback function for each chunk of text
 * @param {AbortSignal} signal - Signal to abort the request
 */
export const generateNotes = async (message, onChunk, signal) => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
            signal: signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate notes');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            if (onChunk) {
                onChunk(fullText);
            }
        }

        return { notes: fullText };
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Generation stopped by user');
            throw error;
        }
        console.error("Generation error:", error);
        throw error;
    }
};

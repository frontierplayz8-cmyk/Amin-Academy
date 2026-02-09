/**
 * Utility functions for AI voice call management
 */

export interface CallState {
    isActive: boolean;
    isMuted: boolean;
    isAISpeaking: boolean;
    duration: number;
}

export interface SpeechRecognitionResult {
    transcript: string;
    isFinal: boolean;
    confidence: number;
}

/**
 * Check if browser supports speech recognition
 */
export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}

/**
 * Initialize speech recognition with optimal settings for conversation
 */
export function initializeSpeechRecognition(): any {
    if (!isSpeechRecognitionSupported()) {
        throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Optimal settings for natural conversation
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Get partial results
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    return recognition;
}

/**
 * Detect silence/pause in speech to trigger AI response
 * Returns true if user has stopped speaking
 */
export class SilenceDetector {
    private silenceTimer: NodeJS.Timeout | null = null;
    private readonly silenceThreshold: number;
    private onSilenceDetected: () => void;

    constructor(silenceThresholdMs: number = 1500, onSilence: () => void) {
        this.silenceThreshold = silenceThresholdMs;
        this.onSilenceDetected = onSilence;
    }

    /**
     * Call this when user is speaking
     */
    resetTimer() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
        }
        this.silenceTimer = setTimeout(() => {
            this.onSilenceDetected();
        }, this.silenceThreshold);
    }

    /**
     * Call this to stop detection
     */
    stop() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
    }
}

/**
 * Format call duration in MM:SS format
 */
export function formatCallDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Play audio from blob with proper cleanup
 */
export async function playAudioBlob(blob: Blob): Promise<HTMLAudioElement> {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);

    audio.src = url;
    audio.volume = 1.0;

    // Cleanup when done
    audio.onended = () => {
        URL.revokeObjectURL(url);
    };

    await audio.play();
    return audio;
}

/**
 * Check if microphone permission is granted
 */
export async function checkMicrophonePermission(): Promise<boolean> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<MediaStream | null> {
    try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
        console.error('Microphone permission denied:', error);
        return null;
    }
}

/**
 * Generate unique call session ID
 */
export function generateCallSessionId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize transcript text for AI processing
 */
export function sanitizeTranscript(text: string): string {
    return text
        .trim()
        .replace(/\s+/g, ' ') // Remove extra whitespace
        .replace(/[^\w\s.,!?'-]/g, ''); // Remove special characters except basic punctuation
}

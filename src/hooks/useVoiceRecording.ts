
import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecordingProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export const useVoiceRecording = ({ onTranscriptionComplete, onError }: UseVoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError('Speech recognition is not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      console.log('Speech recognition result:', event.results);
      const transcript = event.results[0][0].transcript;
      console.log('Transcript:', transcript);
      onTranscriptionComplete(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);
    return true;
  }, [onTranscriptionComplete, onError]);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');

      if (!recognitionRef.current) {
        const initialized = initializeRecognition();
        if (!initialized) return;
      }

      recognitionRef.current?.start();
    } catch (error) {
      console.error('Microphone access error:', error);
      onError('Microphone access denied or not available');
    }
  }, [initializeRecognition, onError]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording
  };
};

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseContinuousRecorderOptions {
  onSpeechDetected?: () => void;
  onSilenceDetected?: (audioBlob: Blob) => void;
  silenceDuration?: number; // milliseconds
  voiceThreshold?: number; // 0-255
}

interface UseContinuousRecorderReturn {
  isActive: boolean;
  isSpeaking: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  pauseDetection: () => void;
  resumeDetection: () => void;
  error: string | null;
}

export function useContinuousRecorder({
  onSpeechDetected,
  onSilenceDetected,
  silenceDuration = 1500,
  voiceThreshold = 25,
}: UseContinuousRecorderOptions): UseContinuousRecorderReturn {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isSpeakingRef = useRef(false);
  const isActiveRef = useRef(false);
  const isPausedRef = useRef(false);

  // Voice Activity Detection
  const detectVoiceActivity = useCallback(() => {
    if (!analyserRef.current || !isActiveRef.current) {
      return;
    }
    
    // If paused, keep the loop running but don't process
    if (isPausedRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectVoiceActivity);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const isVoiceDetected = average > voiceThreshold;

    // Log volume level periodically for debugging
    if (Math.random() < 0.01) { // Log ~1% of the time to avoid spam
      console.log(`🔊 Volume level: ${average.toFixed(1)} (threshold: ${voiceThreshold})`);
    }

    if (isVoiceDetected) {
      // Voice detected
      if (!isSpeakingRef.current) {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        onSpeechDetected?.();
        console.log('🎤 Voice detected, listening...');
      }

      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else if (isSpeakingRef.current) {
      // Silence detected after speaking
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          console.log('🔇 Silence detected, processing audio...');
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          
          // Stop and restart MediaRecorder to get clean audio for next recording
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            
            // Wait for the final dataavailable event, then process
            mediaRecorderRef.current.onstop = () => {
              // Create blob from recorded chunks
              if (chunksRef.current.length > 0) {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                console.log(`📦 Created audio blob: ${audioBlob.size} bytes`);
                onSilenceDetected?.(audioBlob);
                
                // Clear chunks for next recording
                chunksRef.current = [];
              }
              
              // Restart recording for next speech
              if (mediaRecorderRef.current && streamRef.current && isActiveRef.current) {
                try {
                  mediaRecorderRef.current.start(100);
                  console.log('🔄 MediaRecorder restarted for next speech');
                } catch (e) {
                  console.error('Failed to restart MediaRecorder:', e);
                }
              }
            };
          }

          silenceTimerRef.current = null;
        }, silenceDuration);
      }
    }

    // Continue monitoring
    animationFrameRef.current = requestAnimationFrame(detectVoiceActivity);
  }, [onSpeechDetected, onSilenceDetected, silenceDuration, voiceThreshold]);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access with echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Set up audio context for VAD
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up media recorder for continuous recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      
      isActiveRef.current = true;
      setIsActive(true);

      // Start VAD monitoring
      detectVoiceActivity();

      console.log('🎧 Continuous listening started with threshold:', voiceThreshold);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start listening';
      setError(errorMessage);
      console.error('Listening error:', err);
    }
  }, [detectVoiceActivity]);

  const stopListening = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
isActiveRef.current = false;
    isSpeakingRef.current = false;
    
    setIsActive(false);
    setIsSpeaking(false);
    chunksRef.current = [];

    console.log('🔴 Continuous listening stopped');
  }, []);

  const pauseDetection = useCallback(() => {
    isPausedRef.current = true;
    console.log('⏸️ Voice detection paused');
  }, []);

  const resumeDetection = useCallback(() => {
    isPausedRef.current = false;
    console.log('▶️ Voice detection resumed');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isActive,
    isSpeaking,
    startListening,
    stopListening,
    pauseDetection,
    resumeDetection,
    error,
  };
}

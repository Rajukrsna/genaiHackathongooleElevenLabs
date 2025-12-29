import { useState, useRef, useCallback, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import {
  AppBar,
  CallerID,
  ListeningIndicator,
  TextInputBox,
  IncomingCard,
  IntentDetection,
  IntroMessage,
  OutgoingCard,
} from '../components/call';
import { useContinuousRecorder } from '../hooks/useContinuousRecorder';
import * as callService from '../lib/api/callService';
import { useToast } from '../hooks/use-toast';

interface Message {
  id: string;
  text: string;
  type: 'incoming' | 'outgoing' | 'intro';
  timestamp: Date;
}

interface SuggestionState {
  suggestions: string[];
  isCommunicationFailure: boolean;
  failureType?: string;
  failureReason?: string;
}

export default function CallPage() {
  const [callStatus, setCallStatus] = useState<'incoming' | 'active' | 'ended'>('incoming');
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestionState, setSuggestionState] = useState<SuggestionState>({
    suggestions: [],
    isCommunicationFailure: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const [callContext, setCallContext] = useState<any>({
    user_profile: {
      user_id: 'DP_04821',
      role: 'delivery_partner',
      speech_ability: 'non_verbal',
      accessibility_mode: true,
      preferred_language: 'en-IN',
      tts_voice: 'male_calm_neutral'
    },
    order_context: {
      order_id: 'ORD-991245',
      platform: 'QuickEats',
      delivery_type: 'food',
      payment_mode: 'prepaid',
      cash_to_collect: false
    },
    environment_context: {
      noise_level: 'medium',
      network_quality: 'good',
      location_accuracy: 'approximate'
    },
    trip_status: {
      delivery_stage: 'en_route',
      distance_to_destination_meters: 420,
      eta_minutes: 3,
      gps_status: 'moving'
    },
    customer_context: {
      customer_name: 'Rohit Sharma',
      preferred_language: 'en-IN',
      call_reason_probability: { ask_location: 0.62, ask_eta: 0.21 }
    },
    speech_input_analysis: {},
    response_rules: {
      max_response_length_words: 10,
      tone: 'polite_professional',
      allow_follow_up: false,
      avoid_questions: true
    }
  });
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [lastOutgoingMessage, setLastOutgoingMessage] = useState<Message | null>(null);

  // Debug / PWA workaround states
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [audioPlaybackAllowed, setAudioPlaybackAllowed] = useState<boolean | null>(null);
  const [showEnableAudioPrompt, setShowEnableAudioPrompt] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingResponseRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Detect if running as a PWA / standalone
  useEffect(() => {
    try {
      const pwa = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window as any).navigator?.standalone;
      setIsPWA(Boolean(pwa));
      if (pwa) console.debug('[CALL] Running in PWA/standalone mode');
    } catch (e) {
      console.debug('[CALL] PWA detection failed', e);
    }
  }, []);

  // Attempt to enable microphone & unlock audio on a user gesture
  const attemptEnableAudioAndMic = useCallback(async (opts: {showToast?: boolean} = {showToast: true}) => {
    console.debug('[CALL] attemptEnableAudioAndMic - start');

    // Microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // stop tracks immediately - we just wanted permission
      stream.getTracks().forEach(t => t.stop());
      setMicPermissionGranted(true);
      console.debug('[CALL] Microphone permission granted');
      if (opts.showToast) toast({ title: 'Microphone access granted', description: 'Microphone access is enabled.' });
    } catch (err) {
      setMicPermissionGranted(false);
      console.warn('[CALL] Microphone permission denied', err);
      setShowEnableAudioPrompt(true);
      if (opts.showToast) toast({ title: 'Mic permission needed', description: 'Please allow microphone access in your browser or PWA', variant: 'destructive' });
      return false;
    }

    // Try to prime audio (resume AudioContext) to allow playback in PWAs
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        // small silent buffer
        try {
          const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        } catch (err) {
          console.debug('[CALL] Audio priming (buffer) failed', err);
        }
      }

      // Try to play any existing audio element source (if set) to test playback
      if (audioRef.current) {
        try {
          // If there is no src, this may still throw; ignore if so
          await audioRef.current.play();
          audioRef.current.pause();
          setAudioPlaybackAllowed(true);
          setShowEnableAudioPrompt(false);
          if (opts.showToast) toast({ title: 'Audio enabled', description: 'Audio playback should work now.' });
          console.debug('[CALL] Audio playback allowed');
        } catch (err) {
          setAudioPlaybackAllowed(false);
          setShowEnableAudioPrompt(true);
          console.warn('[CALL] Audio playback failed', err);
          if (opts.showToast) toast({ title: 'Audio blocked', description: 'Tap the button to enable audio & mic', variant: 'destructive' });
          return false;
        }
      } else {
        // No audio element exists yet, still consider audio as likely ok
        setAudioPlaybackAllowed(null);
      }

      return true;
    } catch (err) {
      console.warn('[CALL] attemptEnableAudioAndMic encountered an error', err);
      setShowEnableAudioPrompt(true);
      if (opts.showToast) toast({ title: 'Audio enable failed', description: 'Please interact with the app to enable audio playback', variant: 'destructive' });
      return false;
    }
  }, [audioRef, toast]);


  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, suggestionState.suggestions]);

  // Process audio when silence is detected
  const handleSilenceDetected = useCallback(async (audioBlob: Blob) => {
    // Don't process if we're currently playing a response
    if (isPlayingResponseRef.current) {
      console.log('⏸️ Skipping processing - response is playing');
      return;
    }

    if (audioBlob.size < 1000) {
      console.log('⏸️ Audio too short, skipping...');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('📤 Processing audio blob, size:', audioBlob.size);

      // Convert speech to text
      const transcribedText = await callService.speechToText(audioBlob);

      if (!transcribedText || transcribedText.trim() === '') {
        console.log('⚠️ No speech detected');
        setIsProcessing(false);
        return;
      }

      console.log('✅ Transcribed:', transcribedText);

      // Add incoming message
      const newMessage: Message = {
        id: Date.now().toString(),
        text: transcribedText,
        type: 'incoming',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);

      // Update structured call context (keep as object) and use it for the API call
      const updatedContext = {
        ...callContext,
        speech_input_analysis: {
          ...(callContext.speech_input_analysis || {}),
          raw_transcript: transcribedText,
          confidence: 0.87,
          language_detected: 'hinglish',
          background_noise_detected: callContext.speech_input_analysis?.background_noise_detected || false,
        },
        // Track last few transcripts for debugging/demo
        _history: [
          ...(callContext._history || []),
          { role: 'caller', text: transcribedText, timestamp: new Date().toISOString() }
        ].slice(-10)
      };

      setCallContext(updatedContext);

      // Debug: log the structured context being sent
      console.debug('[CALL] Sending context to process-intent:', updatedContext);

      // Process with AI to get reply suggestions (send structured context)
      const response = await callService.processIntent(transcribedText, updatedContext, isFirstMessage);
      
      setSuggestionState({
        suggestions: response.replies,
        isCommunicationFailure: response.isCommunicationFailure || false,
        failureType: response.failureType,
        failureReason: response.failureReason,
      });

      if (isFirstMessage) {
        setIsFirstMessage(false);
      }

      toast({
        title: response.isCommunicationFailure ? 'Communication Issue Detected' : 'Replies ready!',
        description: response.isCommunicationFailure 
          ? 'Select a repair prompt to help the caller' 
          : 'Select a reply option',
      });
    } catch (error) {
      console.error('Error processing speech:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process speech',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [callContext, toast, isFirstMessage]);

  const handleSpeechDetected = useCallback(() => {
    console.log('👂 Caller is speaking...');
  }, []);

  // Continuous recorder with VAD
  const { isActive, isSpeaking, startListening, stopListening, pauseDetection, resumeDetection, error: recordingError } =
    useContinuousRecorder({
      onSpeechDetected: handleSpeechDetected,
      onSilenceDetected: handleSilenceDetected,
      silenceDuration: 1500,
      voiceThreshold: 25,
    });

  const handleAcceptCall = async () => {
    setCallStatus('active');

    // Add intro message when call starts
    const introMsg: Message = {
      id: 'intro-' + Date.now(),
      text: "Hello. I'm using an assistive communication app to respond. Please speak one sentence at a time and pause so I can reply accurately. Thank you for your patience.",
      type: 'intro',
      timestamp: new Date(),
    };
    setMessages([introMsg]);

    // Try to enable mic & audio (user gesture) and start listening
    try {
      const ok = await attemptEnableAudioAndMic();
      if (!ok) {
        // User denied or audio blocked; revert and show prompt
        setCallStatus('incoming');
        return;
      }

      // Start the continuous recorder now that permission was granted
      try {
        await startListening();
        setMicPermissionGranted(true);
        setShowEnableAudioPrompt(false);
        console.debug('[CALL] startListening started after permission');
      } catch (startErr) {
        console.warn('[CALL] startListening failed after permission:', startErr);
        // still allow call flow to continue but show prompt
        setShowEnableAudioPrompt(true);
      }
    } catch (err) {
      console.error('[CALL] Error during enable mic/audio:', err);
      toast({ title: 'Error', description: 'Failed to enable mic/audio', variant: 'destructive' });
      setCallStatus('incoming');
      return;
    }

    // Speak the intro message but keep detection paused so we don't capture our own playback
    try {
      isPlayingResponseRef.current = true;
      pauseDetection(); // Pause VAD while playing response

      // Prime audio to improve playback reliability in PWAs (user gesture unlock)
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') await ctx.resume();
          const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        }
      } catch (e) {
        console.debug('Audio priming failed:', e);
      }

      // Convert text to speech
      const audioDataUrl = await callService.textToSpeech(introMsg.text);

      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = audioDataUrl;
        await audioRef.current.play().catch((err) => {
          console.error('Audio play failed:', err);
          toast({
            title: 'Audio playback blocked',
            description: 'Unable to play intro audio. Interact with the app to enable audio playback.',
            variant: 'destructive',
          });
        });

        toast({
          title: "Intro message sent",
          description: "Playing the intro message to the caller",
        });

        // Wait for audio to finish (with a fallback timeout in case onended doesn't fire)
        await new Promise<void>((resolve) => {
          let resolved = false;
          const done = () => { if (!resolved) { resolved = true; resolve(); } };
          if (audioRef.current) {
            audioRef.current.onended = () => done();
            // Fallback timeout (4s)
            setTimeout(() => done(), 4000);
          } else {
            done();
          }
        });

        // Add a small delay after audio ends to avoid picking up tail end
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error converting intro message to speech:', error);
      toast({
        title: "Error",
        description: 'Failed to play intro message audio',
        variant: "destructive",
      });
    } finally {
      isPlayingResponseRef.current = false;
      resumeDetection(); // Resume VAD after response is done
    }

    // Do NOT call startListening() again here - we already started listening above
    toast({
      title: 'Call connected',
      description: 'Listening for caller speech automatically',
    });
  };

  const handleRejectCall = () => {
    stopListening();
    setCallStatus('ended');
    toast({
      title: "Call ended",
      description: "Redirecting...",
    });
    // Redirect after 1 second
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handlePause = () => {
    if (isPaused) {
      resumeDetection();
      setIsPaused(false);
      toast({
        title: 'Listening resumed',
        description: 'The system is now listening for speech',
      });
    } else {
      pauseDetection();
      setIsPaused(true);
      toast({
        title: 'Listening paused',
        description: 'The system has stopped listening',
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'outgoing',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setLastOutgoingMessage(newMessage);

    // Update structured call context with outgoing message
    const updatedContext = {
      ...callContext,
      _history: [
        ...(callContext._history || []),
        { role: 'you', text, timestamp: new Date().toISOString() }
      ].slice(-50),
      // Optionally include latest dynamic responses
      dynamic_tap_responses: callContext.dynamic_tap_responses || []
    };

    setCallContext(updatedContext);

    try {
      isPlayingResponseRef.current = true;
      pauseDetection(); // Pause VAD while playing response

      // Convert text to speech
      const audioDataUrl = await callService.textToSpeech(text);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = audioDataUrl;
        await audioRef.current.play();
        
        toast({
          title: "Response sent",
          description: "Playing your reply to the caller",
        });

        // Wait for audio to finish
        await new Promise<void>((resolve) => {
          if (audioRef.current) {
            audioRef.current.onended = () => resolve();
          } else {
            resolve();
          }
        });
        
        // Add a small delay after audio ends to avoid picking up tail end
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error converting to speech:', error);
      toast({
        title: "Error",
        description: 'Failed to play audio response',
        variant: "destructive",
      });
    } finally {
      isPlayingResponseRef.current = false;
      resumeDetection(); // Resume VAD after response is done
    }
  };

  const handleSelectReply = async (reply: string) => {
    setSuggestionState({ suggestions: [], isCommunicationFailure: false }); // Clear suggestions after selection
    await handleSendMessage(reply);
  };

  const handleUndoLastMessage = () => {
    if (!lastOutgoingMessage) return;

    // Remove the last outgoing message
    setMessages(prev => prev.filter(m => m.id !== lastOutgoingMessage.id));
    
    // Remove last outgoing entry from structured call context
    setCallContext(prev => {
      const history = (prev._history || []).slice();
      // remove last 'you' entry
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'you') {
          history.splice(i, 1);
          break;
        }
      }
      return { ...prev, _history: history };
    });

    // Get the last incoming message to restore suggestions
    const lastIncoming = [...messages].reverse().find(m => m.type === 'incoming');
    if (lastIncoming) {
      // Regenerate suggestions for the last incoming message
      handleRegenerate();
    }

    setLastOutgoingMessage(null);
    
    toast({
      title: "Message undone",
      description: "Your last response has been removed",
    });
  };

  const handleRegenerate = async () => {
    if (messages.length === 0) return;

    // Get the last incoming message
    const lastIncomingMessage = [...messages].reverse().find(m => m.type === 'incoming');
    
    if (!lastIncomingMessage) return;

    setIsProcessing(true);
    
    try {
      toast({
        title: "Regenerating replies...",
        description: "Getting new response options",
      });

      // Debug: log the structured context being sent when regenerating
      console.debug('[CALL] Regenerate - sending context to process-intent:', callContext);
      // Process with AI again (send structured context)
      const response = await callService.processIntent(lastIncomingMessage.text, callContext, false);
      
      setSuggestionState({
        suggestions: response.replies,
        isCommunicationFailure: response.isCommunicationFailure || false,
        failureType: response.failureType,
        failureReason: response.failureReason,
      });

      toast({
        title: "New replies ready!",
        description: "Select a reply option below",
      });
    } catch (error) {
      console.error('Error regenerating replies:', error);
      toast({
        title: "Error",
        description: 'Failed to regenerate replies',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#0b1220] min-h-[100svh] w-full flex flex-col relative mx-auto max-w-[420px] sm:max-w-md md:max-w-md">
      {/* Fixed Top Navigation */}
      <div className="sticky top-0 z-20 bg-[#0b1220]">
        {/* Caller ID */}
        <CallerID
          callerName="Customer 1"
          callerPhone="+91 7895455145"
          status={callStatus === 'incoming' ? 'incoming' : 'active'}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
        />

        {/* App Bar and Listening Indicator */}
        <div className="flex flex-col items-start w-full">
          <AppBar />
          <ListeningIndicator isListening={!isPaused && callStatus !== 'ended'} />

          {/* Prompt to enable audio & mic in PWAs or when blocked */}
          {showEnableAudioPrompt && (
            <div className="w-full px-4 py-3 bg-yellow-500 text-black rounded-md my-2 flex flex-col items-center gap-2">
              <div className="text-sm font-medium">Audio / Microphone not enabled</div>
              <div className="text-xs">Tap the button below to enable audio playback and microphone access.</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => attemptEnableAudioAndMic()}
                  className="px-3 py-1 bg-white rounded text-sm"
                >
                  Enable audio & mic
                </button>
                <button
                  onClick={() => setShowEnableAudioPrompt(false)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          
          {/* Voice Activity Status */}
          {isActive && isSpeaking && (
            <div className="w-full px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-base">Caller speaking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
        {messages.map((message, index) => {
          // Determine if this is the latest message of its type
          const isLatestIncoming = message.type === 'incoming' && 
            index === messages.map((m, i) => m.type === 'incoming' ? i : -1)
              .filter(i => i !== -1)
              .pop();
          
          const isLatestOutgoing = message.type === 'outgoing' && 
            index === messages.map((m, i) => m.type === 'outgoing' ? i : -1)
              .filter(i => i !== -1)
              .pop();

          return (
            <div key={message.id}>
              {message.type === 'intro' ? (
                <IntroMessage message={message.text} />
              ) : message.type === 'incoming' ? (
                <IncomingCard 
                  message={message.text}
                  isLatest={isLatestIncoming}
                />
              ) : (
                <OutgoingCard 
                  message={message.text}
                  isLatest={isLatestOutgoing}
                  canUndo={lastOutgoingMessage?.id === message.id && index === messages.length - 1}
                  onUndo={handleUndoLastMessage}
                />
              )}
            </div>
          );
        })}

        {/* Detecting Intent Card */}
        {isProcessing && (
          <div
            className="w-full flex items-center justify-start max-w-full sm:max-w-[391px] bg-[#1f2937] text-[#9CA3AF] rounded-[13px] px-4 py-3"
            style={{
              fontFamily: 'Segoe UI',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '100%',
              letterSpacing: '0%',
              height: '57px',
              gap: '8px'
            }}
          >
            Detecting intent...
          </div>
        )}

        {/* Intent Detection with Suggestions */}
        {!isProcessing && suggestionState.suggestions.length > 0 && (
          <IntentDetection
            suggestions={suggestionState.suggestions}
            onSelectReply={handleSelectReply}
            onRegenerate={handleRegenerate}
            isCommunicationFailure={suggestionState.isCommunicationFailure}
            failureType={suggestionState.failureType}
          />
        )}
      </div>
      
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />

      {/* Fixed Bottom Controls */}
      <div className="sticky bottom-0 left-0 right-0 p-2.5 space-y-2 bg-[#0b1220] z-10">
        <div className="relative">
          <TextInputBox
            onSend={handleSendMessage}
            placeholder="Type message..."
          />
          
          {/* Pause/Play Button positioned relative to text input */}
          <button
            onClick={handlePause}
            disabled={isProcessing}
            className="absolute -top-12 left-2 flex items-center justify-center disabled:opacity-50 transition-colors"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '13px',
              padding: '8px',
              background: '#111827'
            }}
            aria-label={isPaused ? "Resume Listening" : "Pause Listening"}
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-[#3B82F6]" />
            ) : (
              <Pause className="w-5 h-5 text-[#3B82F6]" />
            )}
          </button>
        </div>
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Error display */}
      {recordingError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-50">
          {recordingError}
        </div>
      )}

      {/* Instructions when call is active but no messages yet
      {callStatus === 'active' && messages.length === 0 && !isSpeaking && !isProcessing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600/20 border-2 border-blue-600 text-white px-6 py-4 rounded-lg text-center max-w-xs">
          <p className="text-lg font-semibold mb-2">🎧 Auto-Listening Active</p>
          <p className="text-sm">Speak now - the system will automatically detect your speech and process it</p>
        </div>
      )} */}
    </div>
  );
}

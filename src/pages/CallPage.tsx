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
  const [conversationContext, setConversationContext] = useState<string>('');
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [lastOutgoingMessage, setLastOutgoingMessage] = useState<Message | null>(null);
  
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingResponseRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

      // Update conversation context
      setConversationContext((prev) => 
        prev + `\nCaller: ${transcribedText}`
      );

      // Process with AI to get reply suggestions
      const response = await callService.processIntent(transcribedText, conversationContext, isFirstMessage);
      
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
  }, [conversationContext, toast, isFirstMessage]);

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
    
    // Speak the intro message
    try {
      isPlayingResponseRef.current = true;
      pauseDetection(); // Pause VAD while playing response

      // Convert text to speech
      const audioDataUrl = await callService.textToSpeech(introMsg.text);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = audioDataUrl;
        await audioRef.current.play();
        
        toast({
          title: "Intro message sent",
          description: "Playing the intro message to the caller",
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
    
    // Auto-start continuous listening
    await startListening();
    
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

    // Update conversation context
    setConversationContext((prev) => 
      prev + `\nYou: ${text}`
    );

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
    
    // Restore the conversation context (remove the last "You: " entry)
    setConversationContext(prev => {
      const lines = prev.split('\n');
      const lastYouIndex = lines.map((line, idx) => line.startsWith('You:') ? idx : -1)
        .filter(idx => idx !== -1)
        .pop();
      
      if (lastYouIndex !== undefined) {
        lines.splice(lastYouIndex, 1);
      }
      
      return lines.join('\n');
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

      // Process with AI again
      const response = await callService.processIntent(lastIncomingMessage.text, conversationContext, false);
      
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
            className="w-full flex items-center justify-start"
            style={{
              fontFamily: 'Segoe UI',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '100%',
              letterSpacing: '0%',
              width: '391px',
              height: '57px',
              borderRadius: '13px',
              gap: '8px',
              padding: '12px 16px',
              background: '#1f2937',
              color: '#9CA3AF'
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

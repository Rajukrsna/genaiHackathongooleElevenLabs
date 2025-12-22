import { useState, useRef, useCallback } from 'react';
import {
  AppBar,
  CallerID,
  ListeningIndicator,
  TextInputBox,
  PauseButton,
  IncomingCard,
  IntentDetection,
} from '../components/call';
import { useContinuousRecorder } from '../hooks/useContinuousRecorder';
import * as callService from '../lib/api/callService';
import { useToast } from '../hooks/use-toast';

interface Message {
  id: string;
  text: string;
  type: 'incoming' | 'outgoing';
  timestamp: Date;
}

export default function CallPage() {
  const [callStatus, setCallStatus] = useState<'incoming' | 'active' | 'ended'>('incoming');
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationContext, setConversationContext] = useState<string>('');
  
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingResponseRef = useRef(false);

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
      const replies = await callService.processIntent(transcribedText, conversationContext);
      setSuggestions(replies);

      toast({
        title: 'Replies ready!',
        description: 'Select a reply option',
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
  }, [conversationContext, toast]);

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

  const handleSendMessage = async (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'outgoing',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);

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
    setSuggestions([]); // Clear suggestions after selection
    await handleSendMessage(reply);
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
      const replies = await callService.processIntent(lastIncomingMessage.text, conversationContext);
      setSuggestions(replies);

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
    <div className="bg-[#0b1220] min-h-screen w-full flex flex-col relative max-w-md mx-auto">
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
        <ListeningIndicator isListening={isActive} />
        
        {/* Voice Activity Status */}
        {isActive && (
          <div className="w-full px-4 py-2">
            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-base">Caller speaking...</span>
                </>
              ) : isProcessing ? (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 text-base">Processing...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-400 text-base">Listening...</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === 'incoming' ? (
              <IncomingCard message={message.text} />
            ) : (
              <div className="bg-[#111827] flex items-center justify-center px-4 py-3 rounded-[13px]">
                <p className="text-white text-base">{message.text}</p>
              </div>
            )}
          </div>
        ))}

        {/* Intent Detection with Suggestions */}
        {suggestions.length > 0 && (
          <IntentDetection
            suggestions={suggestions}
            onSelectReply={handleSelectReply}
            onRegenerate={handleRegenerate}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="sticky bottom-0 left-0 right-0 p-2.5 space-y-2 bg-[#0b1220]">
        <TextInputBox
          onSend={handleSendMessage}
          placeholder="Type message..."
        />
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

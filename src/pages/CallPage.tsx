import { useState, useRef } from 'react';
import {
  AppBar,
  CallerID,
  ListeningIndicator,
  TextInputBox,
  PauseButton,
  IncomingCard,
  IntentDetection,
} from '../components/call';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
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
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { startRecording, stopRecording, error: recordingError } = useAudioRecorder();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAcceptCall = () => {
    setCallStatus('active');
    setIsListening(false);
    toast({
      title: "Call connected",
      description: "Click 'Start Listening' to begin recording caller's speech",
    });
  };

  const handleRejectCall = () => {
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

  const handlePause = async () => {
    if (!isListening) {
      // Start listening (recording)
      setIsListening(true);
      await startRecording();
      toast({
        title: "Listening...",
        description: "Recording caller's speech. Click again to stop and process.",
      });
    } else {
      // Stop listening and process
      setIsListening(false);
      setIsProcessing(true);
      
      try {
        // Stop recording and get audio blob
        const audioBlob = await stopRecording();
        
        if (!audioBlob) {
          throw new Error('No audio recorded');
        }

        toast({
          title: "Processing speech...",
          description: "Converting speech to text and generating replies",
        });

        // Convert speech to text
        const transcribedText = await callService.speechToText(audioBlob);
        
        if (!transcribedText || transcribedText.trim() === '') {
          throw new Error('No speech detected');
        }

        // Add incoming message
        const newMessage: Message = {
          id: Date.now().toString(),
          text: transcribedText,
          type: 'incoming',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);

        // Process with AI to get reply suggestions
        const replies = await callService.processIntent(transcribedText);
        setSuggestions(replies);

        toast({
          title: "Replies ready!",
          description: "Select a reply option below",
        });

      } catch (error) {
        console.error('Error processing speech:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to process speech',
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
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

    try {
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
      }
    } catch (error) {
      console.error('Error converting to speech:', error);
      toast({
        title: "Error",
        description: 'Failed to play audio response',
        variant: "destructive",
      });
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
      const replies = await callService.processIntent(lastIncomingMessage.text);
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
        <ListeningIndicator isListening={callStatus === 'active' && isListening} />
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
      <div className="sticky bottom-0 left-0 right-0 p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <PauseButton 
            onPause={handlePause} 
            isListening={isListening}
            isProcessing={isProcessing}
          />
        </div>
        <TextInputBox
          onSend={handleSendMessage}
          placeholder="Type message..."
        />
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Error display */}
      {recordingError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg">
          {recordingError}
        </div>
      )}

      {/* Instructions when call is active but not started */}
      {callStatus === 'active' && messages.length === 0 && !isListening && !isProcessing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600/20 border-2 border-blue-600 text-white px-6 py-4 rounded-lg text-center max-w-xs">
          <p className="text-lg font-semibold mb-2">Ready to assist</p>
          <p className="text-sm">Click the "Start Listening" button below to record the caller's speech</p>
        </div>
      )}
    </div>
  );
}

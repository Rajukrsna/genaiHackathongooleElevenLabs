import { Mic, MicOff } from 'lucide-react';

interface ListeningIndicatorProps {
  isListening?: boolean;
  label?: boolean;
}

export function ListeningIndicator({ isListening = true, label = true }: ListeningIndicatorProps) {
  return (
    <div className="flex justify-center w-full relative gap-2" style={{ padding: '12px 16px 12px 0', minHeight: '72px' }}>
      {/* Mic Icon */}
      <div 
        className="overflow-hidden w-12 h-12 flex items-center justify-center"
        style={{
          borderRadius: '13px',
          background: 'radial-gradient(50.01% 50.01% at 48.96% 50%, rgba(31, 41, 55, 0.50) 0%, rgba(31, 41, 55, 0.50) 61.78%, rgba(88, 117, 157, 0.50) 100%)'
        }}
      >
        {isListening ? (
          <Mic className="w-6 h-6 text-[#3b82f6]" />
        ) : (
          <MicOff className="w-6 h-6 text-[#9ca3af]" />
        )}
      </div>
      
      {isListening && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-blue-400" style={{ fontFamily: 'Segoe UI', fontWeight: 400, fontSize: '16px', lineHeight: '100%', letterSpacing: '0%' }}>Listening...</span>
        </div>
      )}
    </div>
  );
}

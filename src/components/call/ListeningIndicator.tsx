import { Mic, MicOff } from 'lucide-react';

interface ListeningIndicatorProps {
  isListening?: boolean;
  label?: boolean;
}

export function ListeningIndicator({ isListening = true, label = true }: ListeningIndicatorProps) {
  return (
    <div className="flex gap-2 items-center justify-center pl-0 pr-4 py-3 w-full">
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
      
    
    </div>
  );
}

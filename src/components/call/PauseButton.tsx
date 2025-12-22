import { Pause, Mic, Loader2 } from 'lucide-react';

interface PauseButtonProps {
  onPause?: () => void;
  isListening?: boolean;
  isProcessing?: boolean;
}

export function PauseButton({ onPause, isListening = false, isProcessing = false }: PauseButtonProps) {
  return (
    <button 
      onClick={onPause}
      disabled={isProcessing}
      className={`flex items-center justify-center p-2.5 rounded-[13px] min-w-[180px] h-12 transition-all ${
        isListening 
          ? 'bg-red-600 hover:bg-red-700' 
          : 'bg-blue-600 hover:bg-blue-700'
      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isListening ? "Stop Listening" : "Start Listening"}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 text-white mr-2 animate-spin" />
          <span className="text-white font-medium">Processing...</span>
        </>
      ) : isListening ? (
        <>
          <Pause className="w-5 h-5 text-white mr-2" />
          <span className="text-white font-medium">Stop & Process</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5 text-white mr-2" />
          <span className="text-white font-medium">Start Listening</span>
        </>
      )}
    </button>
  );
}

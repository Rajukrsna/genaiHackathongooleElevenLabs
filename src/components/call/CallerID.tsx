import { Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CallerIDProps {
  callerName?: string;
  callerPhone?: string;
  status?: 'incoming' | 'active';
  onAccept?: () => void;
  onReject?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
}

export function CallerID({ 
  callerName = 'Customer 1', 
  callerPhone = '+91 7895455145',
  status = 'incoming',
  onAccept,
  onReject,
  onToggleMute,
  isMuted = false
}: CallerIDProps) {
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'active') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="bg-[#302e2f] flex gap-1 h-[77px] items-center justify-center px-6 py-[18px] rounded-2xl w-full">
      {/* Caller Information */}
      <div className="flex flex-col gap-1 items-start text-white flex-1">
        <div className="flex gap-4 h-5 items-center w-full">
          <div className="flex flex-col justify-center">
            <p className="text-lg font-bold leading-5">{callerName}</p>
          </div>
          <div className="flex flex-col h-5 justify-center">
            <p className="text-sm leading-5">{callerPhone}</p>
          </div>
        </div>
        <div className="flex flex-col justify-center w-full">
          <p className="text-sm leading-5">
            {status === 'incoming' ? 'Incoming call' : `Ongoing call ${formatDuration(callDuration)}`}
          </p>
        </div>
      </div>

      {/* Call Actions */}
      <div className="flex gap-1.5 items-center">
        {status === 'incoming' ? (
          <>
            {/* Accept Button */}
            <button 
              onClick={onAccept}
              className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
              aria-label="Accept call"
            >
              <Phone className="w-6 h-6 text-white" />
            </button>
            {/* Reject Button */}
            <button 
              onClick={onReject}
              className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="Reject call"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </>
        ) : (
          <>
            {/* Mute/Unmute Button - Speaker Icon */}
            <button 
              onClick={onToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-700'
              }`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </button>
            {/* End Call Button */}
            <button 
              onClick={onReject}
              className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="End call"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

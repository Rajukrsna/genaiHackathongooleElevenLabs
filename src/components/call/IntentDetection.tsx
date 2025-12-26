import { ReplyButton } from './MessageCards';

interface IntentDetectionProps {
  suggestions: string[];
  onSelectReply?: (reply: string) => void;
  onRegenerate?: () => void;
  isCommunicationFailure?: boolean;
  failureType?: string;
}

export function IntentDetection({ 
  suggestions, 
  onSelectReply, 
  onRegenerate,
  isCommunicationFailure = false,
  failureType = 'unknown'
}: IntentDetectionProps) {
  // Determine the title based on failure type
  const getTitle = () => {
    if (!isCommunicationFailure) {
      return 'Intent Detected';
    }
    
    switch (failureType) {
      case 'no_speech':
        return 'No Speech Detected';
      case 'noise':
        return 'Background Noise Detected';
      case 'gibberish':
      case 'multiple_voices':
        return 'Unclear Speech Detected';
      default:
        return 'Communication Issue Detected';
    }
  };

  return (
    <div className="bg-[#111827] flex flex-col gap-2 items-start px-4 py-3 rounded-[13px] w-full">
      <p className="text-[#9ca3af] text-base w-full whitespace-pre-wrap">
        {getTitle()}
      </p>
      <div className="flex flex-col gap-4 items-start w-full">
        {suggestions.map((suggestion, index) => (
          <ReplyButton
            key={index}
            text={suggestion}
            isPrimary={index === 0}
            onSelect={() => onSelectReply?.(suggestion)}
          />
        ))}
        {!isCommunicationFailure && (
          <div className="flex items-center justify-center w-full">
            <button
              onClick={onRegenerate}
              className="w-12 h-12 flex items-center justify-center hover:bg-[#1f2937] rounded-full transition-colors"
              aria-label="Regenerate suggestions"
            >
              <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21C7.75 21 6.57917 20.7625 5.4875 20.2875C4.39583 19.8125 3.44583 19.1708 2.6375 18.3625C1.82917 17.5542 1.1875 16.6042 0.7125 15.5125C0.2375 14.4208 0 13.25 0 12H2C2 13.95 2.67917 15.6042 4.0375 16.9625C5.39583 18.3208 7.05 19 9 19C10.95 19 12.6042 18.3208 13.9625 16.9625C15.3208 15.6042 16 13.95 16 12C16 10.05 15.3208 8.39583 13.9625 7.0375C12.6042 5.67917 10.95 5 9 5H8.85L10.4 6.55L9 8L5 4L9 0L10.4 1.45L8.85 3H9C10.25 3 11.4208 3.2375 12.5125 3.7125C13.6042 4.1875 14.5542 4.82917 15.3625 5.6375C16.1708 6.44583 16.8125 7.39583 17.2875 8.4875C17.7625 9.57917 18 10.75 18 12C18 13.25 17.7625 14.4208 17.2875 15.5125C16.8125 16.6042 16.1708 17.5542 15.3625 18.3625C14.5542 19.1708 13.6042 19.8125 12.5125 20.2875C11.4208 20.7625 10.25 21 9 21Z" fill="#9CA3AF"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

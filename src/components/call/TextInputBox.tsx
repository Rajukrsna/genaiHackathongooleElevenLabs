import { useState } from 'react';
import { SendIcon } from './SendIcon';

interface TextInputBoxProps {
  onSend?: (text: string) => void;
  placeholder?: string;
}

export function TextInputBox({ onSend, placeholder = 'Type message...' }: TextInputBoxProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && onSend) {
      onSend(text);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[#111827] border border-[#111827] flex gap-2 sm:gap-4 h-10 sm:h-12 items-center justify-end px-3 sm:px-4 py-2 sm:py-3 rounded-[13px] w-full min-w-0">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent text-[#9ca3af] text-base sm:text-2xl outline-none placeholder:text-[#9ca3af]"
      />
      <button 
        onClick={handleSend}
        disabled={!text.trim()}
        className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center disabled:opacity-50 flex-shrink-0"
        aria-label="Send message"
      >
        <SendIcon className="text-[#9CA3AF] w-4 h-4 sm:w-6 sm:h-6" />
      </button>
    </div>
  );
}

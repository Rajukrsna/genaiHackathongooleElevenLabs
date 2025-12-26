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
    <div className="bg-[#111827] border border-[#111827] flex gap-4 h-12 items-center justify-end px-4 py-3 rounded-[13px] w-full">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[#9ca3af] text-2xl outline-none placeholder:text-[#9ca3af]"
      />
      <button 
        onClick={handleSend}
        disabled={!text.trim()}
        className="w-12 h-12 flex items-center justify-center disabled:opacity-50"
        aria-label="Send message"
      >
        <SendIcon className="text-[#9CA3AF]" />
      </button>
    </div>
  );
}

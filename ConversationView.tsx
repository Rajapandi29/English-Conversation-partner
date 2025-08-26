
import React from 'react';
import { type Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import { CorrectionCard } from './CorrectionCard';

interface ConversationViewProps {
  messages: Message[];
}

const ConversationView: React.FC<ConversationViewProps> = ({ messages }) => {
  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
          {message.role === 'assistant' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BotIcon className="w-6 h-6 text-white" />
            </div>
          )}
          <div className={`max-w-md flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`rounded-2xl px-4 py-3 text-base ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none shadow-sm'
              }`}
            >
              <p>{message.text}</p>
            </div>
            {message.role === 'assistant' && message.correction && message.explanation && (
                <CorrectionCard correction={message.correction} explanation={message.explanation} />
            )}
            {message.role === 'assistant' && !message.correction && message.explanation && index > 0 && (
                <CorrectionCard explanation={message.explanation} />
            )}
          </div>
          {message.role === 'user' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationView;

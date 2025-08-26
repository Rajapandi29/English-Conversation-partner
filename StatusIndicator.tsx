
import React from 'react';
import { type AppState } from '../types';

interface StatusIndicatorProps {
  state: AppState;
}

const statusConfig = {
  idle: { text: 'Ready', color: 'bg-green-500' },
  listening: { text: 'Listening...', color: 'bg-red-500 animate-pulse' },
  processing: { text: 'Thinking...', color: 'bg-yellow-500' },
  speaking: { text: 'Speaking...', color: 'bg-blue-500' },
  error: { text: 'Error', color: 'bg-red-700' },
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state }) => {
  const { text, color } = statusConfig[state] || statusConfig.idle;

  return (
    <div className="flex items-center space-x-2">
      <span className={`w-3 h-3 rounded-full ${color} transition-colors duration-300`}></span>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{text}</span>
    </div>
  );
};

export default StatusIndicator;

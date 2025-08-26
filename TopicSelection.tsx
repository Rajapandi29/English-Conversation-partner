
import React from 'react';

interface TopicSelectionProps {
  onTopicSelect: (topic: string) => void;
}

const topics = [
  { name: 'General Chat', emoji: '💬' },
  { name: 'Travel', emoji: '✈️' },
  { name: 'Food', emoji: '🍔' },
  { name: 'Work', emoji: '💼' },
  { name: 'Hobbies', emoji: '🎨' },
  { name: 'Technology', emoji: '💻' },
];

const TopicSelection: React.FC<TopicSelectionProps> = ({ onTopicSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh w-full bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Welcome to your English Partner
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Choose a topic to get started.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-2xl">
        {topics.map((topic) => (
          <button
            key={topic.name}
            onClick={() => onTopicSelect(topic.name)}
            className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-md hover:shadow-xl dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <span className="text-5xl md:text-6xl mb-4 transition-transform duration-300 group-hover:scale-110">
              {topic.emoji}
            </span>
            <span className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-200">
              {topic.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelection;


import React from 'react';
import { MicIcon } from './icons/MicIcon';
import { StopIcon } from './icons/StopIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface MicButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ isListening, isProcessing, onClick }) => {
  const isDisabled = isProcessing;

  const getButtonContent = () => {
    if (isProcessing) {
      return (
        <>
          <LoaderIcon className="w-8 h-8 text-white" />
          <span className="sr-only">Processing</span>
        </>
      );
    }
    if (isListening) {
      return (
        <>
          <StopIcon className="w-8 h-8 text-white" />
          <span className="sr-only">Stop listening</span>
        </>
      );
    }
    return (
      <>
        <MicIcon className="w-8 h-8 text-white" />
        <span className="sr-only">Start listening</span>
      </>
    );
  };

  const buttonClasses = `relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed
    ${isListening ? 'bg-red-500 hover:bg-red-600 shadow-lg scale-105' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}
    ${isProcessing ? 'bg-gray-500' : ''}
  `;

  return (
    <button onClick={onClick} disabled={isDisabled} className={buttonClasses}>
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse"></span>
      )}
      {getButtonContent()}
    </button>
  );
};

export default MicButton;

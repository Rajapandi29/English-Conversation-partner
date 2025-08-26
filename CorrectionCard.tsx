
import React from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface CorrectionCardProps {
  correction?: string | null;
  explanation: string;
}

export const CorrectionCard: React.FC<CorrectionCardProps> = ({ correction, explanation }) => {
  return (
    <div className="mt-3 w-full max-w-md p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-md">
      {correction ? (
        <>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-yellow-500" />
            <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Suggestion</h4>
          </div>
          <p className="mt-2 text-base text-gray-700 dark:text-gray-300 font-medium">{correction}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{explanation}</p>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <CheckIcon className="h-5 w-5 text-green-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{explanation}</p>
        </div>
      )}
    </div>
  );
};

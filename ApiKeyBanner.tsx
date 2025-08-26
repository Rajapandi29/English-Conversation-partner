
import React from 'react';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

const ApiKeyBanner = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-red-500/50">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangleIcon className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
          Configuration Error
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300">
          The Gemini API key is missing. Please ensure the <code>API_KEY</code> environment variable is set for this application to function.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyBanner;

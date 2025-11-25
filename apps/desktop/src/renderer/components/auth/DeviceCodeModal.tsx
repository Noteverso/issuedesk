/**
 * Device Code Modal component
 * Feature: 002-github-app-auth
 * 
 * Displays the device code for GitHub authorization during device flow.
 */

import { useState, useEffect } from 'react';

export interface DeviceCodeModalProps {
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  onClose: () => void;
  onRetry?: () => void;
}

export function DeviceCodeModal({
  userCode,
  verificationUri,
  expiresIn,
  onClose,
  onRetry,
}: DeviceCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(expiresIn);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authorize Device
          </h2>
          <p className="text-gray-600 mb-6">
            A browser window has been opened. Please enter this code on GitHub:
          </p>

          {isExpired ? (
            // Expired state
            <>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
                <div className="text-red-600 mb-2">
                  <svg
                    className="h-12 w-12 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-red-900 mb-1">
                  Code Expired
                </div>
                <div className="text-sm text-red-700">
                  This authorization code expired after 15 minutes. 
                  Please try again with a new code.
                </div>
              </div>

              <div className="space-y-3">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            // Active state
            <>
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mb-4">
                <div className="text-4xl font-mono font-bold text-gray-900 tracking-wider mb-2">
                  {userCode}
                </div>
                <button
                  onClick={handleCopy}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {copied ? '✓ Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <a
                  href={verificationUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                >
                  Open GitHub
                </a>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Waiting for authorization...</span>
                </div>

                <div className="text-xs text-gray-500">
                  Code expires in {formatTime(timeRemaining)}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200"
        role="alertdialog"
        aria-labelledby="device-modal-title"
        aria-describedby="device-modal-description"
      >
        <div className="text-center">
          <h2 id="device-modal-title" className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            Authorize Device
          </h2>
          <p id="device-modal-description" className="text-gray-600 mb-8 text-base leading-relaxed">
            A browser window has been opened. Please enter this code on GitHub:
          </p>

          {isExpired ? (
            // Expired state
            <>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6" role="status" aria-live="polite">
                <div className="text-red-600 mb-3" aria-hidden="true">
                  <svg
                    className="h-12 w-12 mx-auto mb-3"
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
                <div className="text-lg font-semibold text-red-900 mb-2">
                  Code Expired
                </div>
                <div className="text-sm text-red-700 leading-relaxed">
                  This authorization code expired after 15 minutes. 
                  Please try again with a new code.
                </div>
              </div>

              <div className="space-y-3">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                    aria-label="Try again with a new device code"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
                  aria-label="Cancel authorization and close dialog"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            // Active state
            <>
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-8 mb-8">
                <label htmlFor="device-code" className="block text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide text-center">
                  Device Code
                </label>
                <div 
                  id="device-code"
                  className="text-5xl font-mono font-bold text-gray-900 tracking-widest mb-4 select-all text-center font-['SF_Mono',monospace]"
                  role="textbox"
                  aria-readonly="true"
                  aria-label="Device code to enter on GitHub"
                >
                  {userCode}
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full px-3 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  aria-live="polite"
                  aria-label={copied ? 'Code copied to clipboard' : 'Copy device code to clipboard'}
                >
                  {copied ? '✓ Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <a
                  href={verificationUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                  aria-label="Open GitHub in browser to authorize this device"
                >
                  Open GitHub
                </a>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600" aria-live="polite" aria-atomic="true">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
                  <span className="font-medium">Waiting for authorization...</span>
                </div>

                <div className="text-center text-sm text-gray-500 font-medium" aria-label={`Code expires in ${formatTime(timeRemaining)}`}>
                  Code expires in {formatTime(timeRemaining)}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
                aria-label="Cancel authorization and close dialog"
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

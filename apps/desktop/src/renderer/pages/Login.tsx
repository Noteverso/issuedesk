/**
 * Login page component
 * Feature: 002-github-app-auth
 * 
 * Provides GitHub App authentication UI with device flow.
 */

import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { DeviceCodeModal } from '../components/auth/DeviceCodeModal';
import { useToast, ToastContainer } from '../components/common/Toast';
import type { AuthUserCodeEvent, AuthLoginErrorEvent } from '@issuedesk/shared';

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [deviceCode, setDeviceCode] = useState<AuthUserCodeEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Listen for device code event
    authService.onUserCode((event) => {
      setDeviceCode(event);
      setIsLoading(true);
      toast.info('Authentication Started', 'Please complete the authorization in your browser');
    });

    // Listen for login error
    authService.onLoginError((event: AuthLoginErrorEvent) => {
      setError(event.message);
      setIsLoading(false);
      setDeviceCode(null);
      // Note: Error is displayed in the UI banner below, no toast needed
    });

    // Listen for login success
    authService.onLoginSuccess(() => {
      toast.success('Login Successful', 'Welcome to IssueDesk!');
      setIsLoading(false);
      setDeviceCode(null);
    });

    // Note: Event listeners remain active until component unmounts
    // This is intentional as we want to receive events throughout the component lifecycle
  }, []); // Empty dependency array - only register listeners once on mount

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.githubLogin();
      // Note: Success toast will be shown when user-code event is received
    } catch (err) {
      // Note: Errors are handled by onLoginError event listener
      // This catch block is for unexpected errors only
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleLogin();
  };

  const handleCloseModal = () => {
    setDeviceCode(null);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">IssueDesk</h1>
          <p className="text-gray-600">
            Manage GitHub issues locally with powerful offline capabilities
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Login Failed</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="mt-3 w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Authenticating...
              </>
            ) : (
              'Login with GitHub'
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            By logging in, you authorize IssueDesk to access your GitHub issues
          </p>
        </div>
      </div>

      {deviceCode && (
        <DeviceCodeModal
          userCode={deviceCode.userCode}
          verificationUri={deviceCode.verificationUri}
          expiresIn={deviceCode.expiresIn}
          onClose={handleCloseModal}
          onRetry={handleRetry}
        />
      )}

      <ToastContainer messages={toast.messages} onClose={toast.closeToast} />
    </div>
  );
}

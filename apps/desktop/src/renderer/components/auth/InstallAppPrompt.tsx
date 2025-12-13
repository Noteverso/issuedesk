/**
 * Install App Prompt Component
 * Feature: 002-github-app-auth
 * 
 * Prompts user to install the GitHub App when no installations are found.
 * Provides direct link to installation page and allows retry after installation.
 */

import React from 'react';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface InstallAppPromptProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function InstallAppPrompt({ onRetry, isRetrying = false }: InstallAppPromptProps) {
  // GitHub App installation URL
  // Note: Set VITE_GITHUB_APP_SLUG environment variable or it defaults to 'issuedesk'
  const GITHUB_APP_SLUG = import.meta.env.VITE_GITHUB_APP_SLUG ?? 'issuedesk';
  const installUrl = `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;

  const handleInstallClick = () => {
    // Open installation page in external browser
    window.electronAPI.system.openExternal({ url: installUrl });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center" aria-hidden="true">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3" id="install-prompt-title">
            Install IssueDesk GitHub App
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-8 text-sm leading-relaxed" id="install-prompt-description">
            To use IssueDesk, you need to install the GitHub App on your account or organization.
            This grants IssueDesk access to your repositories with fine-grained permissions.
          </p>

          {/* Steps */}
          <div className="space-y-3 mb-8" role="region" aria-labelledby="installation-steps-label">
            <h3 id="installation-steps-label" className="sr-only">Installation Steps</h3>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold" aria-hidden="true">
                1
              </div>
              <p className="text-sm text-gray-600 pt-0.5">
                Click "Install App" to open GitHub in your browser
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold" aria-hidden="true">
                2
              </div>
              <p className="text-sm text-gray-600 pt-0.5">
                Select the account or organization where you want to install the app
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold" aria-hidden="true">
                3
              </div>
              <p className="text-sm text-gray-600 pt-0.5">
                Choose which repositories the app can access (all or selected)
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold" aria-hidden="true">
                4
              </div>
              <p className="text-sm text-gray-600 pt-0.5">
                Click "Install" to complete the installation
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold" aria-hidden="true">
                5
              </div>
              <p className="text-sm text-gray-600 pt-0.5">
                Return here and click "Check Again" to continue
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              aria-label="Open GitHub in browser to install the IssueDesk app"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Install App on GitHub
            </button>

            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isRetrying ? 'Checking for app installation...' : 'Check again to verify app installation'}
              aria-busy={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Check Again
                </>
              )}
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center leading-relaxed">
              The app requires read & write access to issues and pull requests.
              You can modify permissions or uninstall the app anytime from GitHub settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center mb-2">
            Install IssueDesk GitHub App
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-center mb-6">
            To use IssueDesk, you need to install the GitHub App on your account or organization.
            This grants IssueDesk access to your repositories with fine-grained permissions.
          </p>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <p className="text-sm text-muted-foreground pt-0.5">
                Click "Install App" to open GitHub in your browser
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <p className="text-sm text-muted-foreground pt-0.5">
                Select the account or organization where you want to install the app
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <p className="text-sm text-muted-foreground pt-0.5">
                Choose which repositories the app can access (all or selected)
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                4
              </div>
              <p className="text-sm text-muted-foreground pt-0.5">
                Click "Install" to complete the installation
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                5
              </div>
              <p className="text-sm text-muted-foreground pt-0.5">
                Return here and click "Check Again" to continue
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Install App on GitHub
            </button>

            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Check Again
                </>
              )}
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              The app requires read & write access to issues and pull requests.
              You can modify permissions or uninstall the app anytime from GitHub settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

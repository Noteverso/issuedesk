/**
 * Installation Switcher Component
 * Feature: 002-github-app-auth
 * Task: T051
 * 
 * Dropdown component to display current installation and allow switching between installations.
 * Shown in the app header for quick access.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import type { Installation } from '@issuedesk/shared';
import { authService } from '../../services/auth.service';

interface InstallationSwitcherProps {
  installations: Installation[];
  currentInstallationId: number;
  onSwitch?: (installation: Installation) => void;
}

export function InstallationSwitcher({ 
  installations, 
  currentInstallationId,
  onSwitch 
}: InstallationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current installation
  const currentInstallation = installations.find(i => i.id === currentInstallationId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSwitch = async (installation: Installation) => {
    // Don't switch to current installation
    if (installation.id === currentInstallationId) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(installation.id);

      // Call backend to exchange installation ID for token
      const response = await authService.selectInstallation(installation.id);

      if (!response.success) {
        throw new Error('Failed to switch installation');
      }

      // Close dropdown
      setIsOpen(false);

      // Callback for parent component (e.g., reload data)
      onSwitch?.(installation);
    } catch (err) {
      console.error('Installation switch error:', err);
      alert('Failed to switch installation. Please try again.');
    } finally {
      setSwitching(null);
    }
  };

  if (!currentInstallation) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
        aria-label="Switch installation"
        aria-expanded={isOpen}
      >
        <img
          src={currentInstallation.account.avatar_url}
          alt={currentInstallation.account.login}
          className="w-6 h-6 rounded-full"
        />
        <span className="text-sm font-medium hidden sm:inline">
          {currentInstallation.account.login}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted-foreground px-2 py-1">
              Switch Installation
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {installations.map((installation) => {
              const isSelected = installation.id === currentInstallationId;
              const isSwitching = switching === installation.id;
              const { account, repository_selection } = installation;

              return (
                <button
                  key={installation.id}
                  onClick={() => handleSwitch(installation)}
                  disabled={isSwitching || isSelected}
                  className={`
                    w-full p-3 flex items-center gap-3
                    transition-colors text-left
                    ${isSelected 
                      ? 'bg-primary/10 cursor-default' 
                      : 'hover:bg-accent cursor-pointer'
                    }
                    ${isSwitching ? 'opacity-50 cursor-wait' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    <img
                      src={account.avatar_url}
                      alt={account.login}
                      className="w-10 h-10 rounded-full"
                    />
                    {account.type === 'Organization' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-card border border-border rounded-full flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{account.login}</div>
                    <div className="text-xs text-muted-foreground">
                      {repository_selection === 'all' 
                        ? 'All repositories' 
                        : 'Selected repositories'
                      }
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {isSwitching ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

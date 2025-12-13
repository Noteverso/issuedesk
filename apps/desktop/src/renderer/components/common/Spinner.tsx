/**
 * Reusable Spinner Component
 * Feature: 002-github-app-auth
 * Task: T072 - Loading states consistency
 * 
 * Provides consistent loading/spinner UI across authentication components.
 */

import React from 'react';

export interface SpinnerProps {
  /** Size of the spinner (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  
  /** Optional text to display below spinner */
  text?: string;
  
  /** Color variant */
  variant?: 'primary' | 'muted' | 'white';
  
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

const variantClasses = {
  primary: 'border-primary border-t-transparent',
  muted: 'border-muted-foreground border-t-transparent',
  white: 'border-white border-t-transparent',
};

/**
 * Spinner component for loading states
 */
export function Spinner({ 
  size = 'md', 
  text, 
  variant = 'primary',
  className = '' 
}: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`
          rounded-full animate-spin
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Full-page loading screen with spinner
 */
export function LoadingScreen({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <Spinner size="lg" text={text} />
    </div>
  );
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

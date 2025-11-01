import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useZoom } from '../../hooks/useZoom';
import { useTheme } from './ThemeProvider';

interface StatusBarProps {
  className?: string;
}

export default function StatusBar({ className = '' }: StatusBarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { zoomLevel, zoomPercentage, zoomIn, zoomOut, resetZoom, isZooming } = useZoom();
  const { theme } = useTheme();
  
  // Theme-based styling
  const isDark = theme === 'dark';
  const statusBarClasses = isDark 
    ? 'bg-gray-800 border-gray-700 text-gray-200' 
    : 'bg-white border-gray-200 text-gray-700';

  useEffect(() => {
    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Keyboard shortcuts for zoom
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      if (cmdOrCtrl) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault();
            zoomIn();
            break;
          case '-':
            event.preventDefault();
            zoomOut();
            break;
          case '0':
            event.preventDefault();
            resetZoom();
            break;
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomIn, zoomOut, resetZoom]);

  // Handle double-click on zoom percentage to reset zoom
  const handleZoomDoubleClick = () => {
    resetZoom();
  };

  return (
    <div className={`flex items-center justify-between h-6 px-3 text-xs border-t select-none ${statusBarClasses} ${className}`}>
      {/* Left side - Connection status and info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <div 
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            title={isOnline ? 'Online' : 'Offline'}
          />
          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>
          IssueDesk
        </div>
      </div>

      {/* Right side - Zoom controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={zoomOut}
          className={`px-2 py-0.5 rounded transition-colors ${
            isDark 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Zoom Out (Cmd/Ctrl + -)"
          disabled={zoomLevel <= -5 || isZooming}
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        
        <button
          onDoubleClick={handleZoomDoubleClick}
          className={`px-3 py-0.5 rounded transition-colors font-mono min-w-[50px] text-center border ${
            isDark 
              ? 'hover:bg-gray-700 text-gray-200 border-gray-600' 
              : 'hover:bg-gray-100 text-gray-700 border-gray-300'
          }`}
          title="Double-click to reset zoom (Cmd/Ctrl + 0)"
          disabled={isZooming}
        >
          {zoomPercentage}%
        </button>
        
        <button
          onClick={zoomIn}
          className={`px-2 py-0.5 rounded transition-colors ${
            isDark 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Zoom In (Cmd/Ctrl + +)"
          disabled={zoomLevel >= 5 || isZooming}
        >
          <ZoomIn className="w-3 h-3" />
        </button>
        
        <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
        
        <button
          onClick={resetZoom}
          className={`px-2 py-0.5 rounded transition-colors ${
            isDark 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Reset Zoom to 100%"
          disabled={isZooming}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
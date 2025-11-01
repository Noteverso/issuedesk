import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { useWindowTitle } from '../../hooks/useWindowTitle';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const { settings } = useConfig();

  // Update window title when repository changes
  useWindowTitle({
    repositoryName: settings?.activeRepositoryId || undefined
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - conditionally render space on desktop */}
      {sidebarOpen && (
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            repositoryName={settings?.activeRepositoryId || undefined}
          />
        </div>
      )}
      
      {/* Mobile sidebar (overlay) */}
      <div className="lg:hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          repositoryName={settings?.activeRepositoryId || undefined}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Compact header bar */}
        <div className="flex items-center h-12 px-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <Menu className="h-4 w-4" />
          </button>
          
          {/* Repository breadcrumb */}
          {settings?.activeRepositoryId && (
            <div className="ml-4 flex items-center text-sm text-muted-foreground">
              <span className="font-medium">{settings.activeRepositoryId}</span>
            </div>
          )}
          
          <div className="flex-1" />
          
          {/* Optional: Add quick actions here in the future */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>

        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
}

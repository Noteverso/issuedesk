import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { UserProfile } from '../auth/UserProfile';
import { InstallationSwitcher } from '../auth/InstallationSwitcher';
import { useWindowTitle } from '../../hooks/useWindowTitle';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const { settings } = useConfig();
  const { session, logout, refreshSession } = useAuth();

  // Update window title when repository changes
  useWindowTitle({
    repositoryName: settings?.activeRepositoryId || undefined
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleInstallationSwitch = async () => {
    // Refresh session to get updated installation token
    await refreshSession();
    
    // Optionally reload the page to fetch new data with new token
    // This ensures all data is fetched with the correct installation context
    window.location.reload();
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
          
          {/* Installation Switcher */}
          {session?.installations && session.installations.length > 1 && session.currentInstallation && (
            <InstallationSwitcher
              installations={session.installations}
              currentInstallationId={session.currentInstallation.id}
              onSwitch={handleInstallationSwitch}
            />
          )}
          
          {/* User Profile */}
          {session && <UserProfile user={session.user} onLogout={logout} />}
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

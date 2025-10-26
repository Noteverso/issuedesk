import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { config } = useConfig();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        repositoryName={config?.github?.defaultRepository}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center space-x-4">
            {config?.github?.username && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>@{config.github.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

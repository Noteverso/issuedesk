import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter, createHashRouter, redirect } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Issues from './pages/Issues';
import Labels from './pages/Labels';
import Settings from './pages/Settings';
import { Login } from './pages/Login';
import { AuthGuard } from './components/auth/AuthGuard';
import './styles/globals.css';

const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        loader: () => redirect('/dashboard'),
      },
      {
        path: 'dashboard',
        element: (
          <AuthGuard requireInstallation>
            <Dashboard />
          </AuthGuard>
        ),
      },
      {
        path: 'issues',
        element: (
          <AuthGuard requireInstallation>
            <Issues />
          </AuthGuard>
        ),
      },
      {
        path: 'labels',
        element: (
          <AuthGuard requireInstallation>
            <Labels />
          </AuthGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <AuthGuard>
            <Settings />
          </AuthGuard>
        ),
      },
    ],
  },
];

// Electron packages load via file://, so switch to hash routing to keep URLs working
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const router = isFileProtocol ? createHashRouter(routes) : createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

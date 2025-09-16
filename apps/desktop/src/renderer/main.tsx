import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter, redirect } from 'react-router';
import App from './App';
import Dashboard from './pages/Dashboard';
import Issues from './pages/Issues';
import Labels from './pages/Labels';
import Settings from './pages/Settings';
import './index.css';

const router = createBrowserRouter([
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
        element: <Dashboard />,
      },
      {
        path: 'issues',
        element: <Issues />,
      },
      {
        path: 'labels',
        element: <Labels />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

/**
 * User Profile component
 * Feature: 002-github-app-auth
 * 
 * Displays authenticated user information.
 */

import type { User } from '@issuedesk/shared';

export interface UserProfileProps {
  user: User;
  onLogout?: () => void;
}

export function UserProfile({ user, onLogout }: UserProfileProps) {
  return (
    <div className="flex items-center space-x-3 px-4 py-2">
      <img
        src={user.avatar_url}
        alt={user.name}
        className="w-8 h-8 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {user.name}
        </div>
        <div className="text-xs text-gray-500 truncate">@{user.login}</div>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          title="Logout"
        >
          Logout
        </button>
      )}
    </div>
  );
}

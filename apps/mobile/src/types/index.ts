/**
 * Mobile-specific types extending @issuedesk/shared
 */

export * from '@issuedesk/shared';

// Mobile-specific extensions can be added here

/**
 * Device authorization state during OAuth flow
 */
export interface DeviceAuthorization {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresAt: number;
  interval: number;
}

/**
 * User session stored in secure storage
 */
export interface UserSession {
  userId: string;
  username: string;
  avatarUrl: string;
  sessionToken: string;
  selectedInstallationId: number;
}

/**
 * GitHub App installation
 */
export interface Installation {
  id: number;
  accountLogin: string;
  accountType: 'User' | 'Organization';
  avatarUrl: string;
}

/**
 * Access token with expiration
 */
export interface AccessToken {
  token: string;
  expiresAt: number;
  installationId: number;
}

/**
 * Selected repository preference
 */
export interface SelectedRepository {
  id: number;
  owner: string;
  name: string;
  fullName: string;
}

/**
 * App preferences stored in AsyncStorage
 */
export interface AppPreferences {
  themeMode: 'light' | 'dark' | 'system';
  selectedRepositoryId: number | null;
}

/**
 * Navigation parameter types
 */
export type RootStackParamList = {
  Auth: { screen?: string; params?: { isInitial?: boolean } } | undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  DeviceCode: { deviceCode: string; userCode: string; verificationUri: string };
  InstallApp: undefined;
  RepositorySelect: { isInitial?: boolean };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Issues: undefined;
  Labels: undefined;
  Settings: undefined;
};

export type IssuesStackParamList = {
  IssueList: { labelFilter?: string };
  IssueDetail: { issueNumber: number };
  CreateIssue: undefined;
  EditIssue: { issueNumber: number };
};

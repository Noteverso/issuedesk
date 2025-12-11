/**
 * Repository Selector Component
 * Feature: 002-github-app-auth
 * Phase 8: Polish - Repository configuration after GitHub App login
 * 
 * Displays repositories from GitHub App installation and allows user to select one.
 */

import React, { useState, useEffect } from 'react';
import { GitHubRepository } from '@issuedesk/shared';
import { Github, FolderGit2, Lock, CheckCircle, RefreshCw } from 'lucide-react';

interface RepositorySelectorProps {
  installationToken: string;
  onRepositorySelected: (owner: string, name: string) => Promise<void>;
}

export function RepositorySelector({ installationToken, onRepositorySelected }: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  useEffect(() => {
    loadRepositories();
  }, [installationToken]);

  const loadRepositories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[RepositorySelector] Fetching repositories with installation token...');
      // Fetch repositories using the installation token
      const response = await window.electronAPI.settings.getRepositories(installationToken);
      
      console.log('[RepositorySelector] Response:', response);
      
      if (response.success && response.data) {
        setRepositories(response.data);
        console.log(`[RepositorySelector] Loaded ${response.data.length} repositories`);
      } else {
        setError(response.message || 'Failed to load repositories');
      }
    } catch (err) {
      console.error('[RepositorySelector] Failed to load repositories:', err);
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepository = async (repo: GitHubRepository) => {
    setSelecting(true);
    setSelectedRepo(repo.full_name);
    
    try {
      console.log(`[RepositorySelector] Selecting repository: ${repo.full_name}`);
      await onRepositorySelected(repo.owner.login, repo.name);
      console.log(`[RepositorySelector] ✅ Repository configured successfully`);
    } catch (err) {
      console.error('[RepositorySelector] Failed to select repository:', err);
      setError('Failed to configure repository');
      setSelectedRepo(null);
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading repositories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <Github className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Failed to Load Repositories</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={loadRepositories}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="max-w-md text-center">
          <FolderGit2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Repositories Found</h1>
          <p className="text-muted-foreground mb-6">
            No repositories are accessible with this installation. Please check your GitHub App installation settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Select a Repository</h1>
          <p className="text-muted-foreground">
            Choose which repository to manage with IssueDesk
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repositories.map((repo) => (
            <button
              key={repo.id}
              onClick={() => handleSelectRepository(repo)}
              disabled={selecting}
              className={`
                relative p-6 rounded-lg border-2 text-left transition-all
                ${selectedRepo === repo.full_name 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-accent'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-start gap-3">
                <FolderGit2 className={`h-5 w-5 mt-1 ${repo.private ? 'text-amber-500' : 'text-primary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{repo.name}</h3>
                    {repo.private && (
                      <Lock className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {repo.full_name}
                  </p>
                  {repo.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                </div>
                {selectedRepo === repo.full_name && selecting && (
                  <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                )}
                {selectedRepo === repo.full_name && !selecting && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

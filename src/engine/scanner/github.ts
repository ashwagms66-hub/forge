/**
 * GitHub Repository Fetcher
 * Downloads a public GitHub repository's default branch as a ZIP archive
 * (via GitHub's codeload service - the same thing the "Download ZIP"
 * button on github.com uses) so it can be scanned with the existing
 * ProjectScanner, unmodified. No git binary is required, and nothing is
 * ever written to disk: the archive is fetched straight into memory and
 * discarded once the request finishes, so there are no temporary files
 * to clean up.
 */

const GITHUB_URL_PATTERN = /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?\/?(?:[/?#].*)?$/i;

export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export class GitHubRepositoryFetcher {
  static parseRepoUrl(url: string): GitHubRepoRef {
    const match = url.trim().match(GITHUB_URL_PATTERN);
    if (!match) {
      throw new Error('URL must look like https://github.com/{owner}/{repo}');
    }
    return { owner: match[1], repo: match[2] };
  }

  private static async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (response.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found or is private`);
    }
    if (!response.ok) {
      throw new Error(`GitHub API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (typeof data?.default_branch !== 'string') {
      throw new Error('Could not determine the repository default branch');
    }

    return data.default_branch;
  }

  /**
   * Download the repository's default branch as a ZIP archive, entirely
   * in memory.
   */
  static async fetchRepositoryZip(owner: string, repo: string): Promise<ArrayBuffer> {
    const branch = await this.getDefaultBranch(owner, repo);

    const zipResponse = await fetch(
      `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`
    );

    if (!zipResponse.ok) {
      throw new Error(`Failed to download repository archive (status ${zipResponse.status})`);
    }

    return zipResponse.arrayBuffer();
  }
}

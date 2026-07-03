import { NextResponse } from 'next/server';
import { ProjectScanner } from '@/src/engine/scanner';
import { GitHubRepositoryFetcher } from '@/src/engine/scanner/github';

export async function POST(request: Request) {
  let body: { repoUrl?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!body || typeof body.repoUrl !== 'string' || body.repoUrl.trim() === '') {
    return NextResponse.json({ error: 'Request must include a "repoUrl" string' }, { status: 400 });
  }

  let owner: string;
  let repo: string;

  try {
    ({ owner, repo } = GitHubRepositoryFetcher.parseRepoUrl(body.repoUrl));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid GitHub repository URL' },
      { status: 400 }
    );
  }

  try {
    const zipData = await GitHubRepositoryFetcher.fetchRepositoryZip(owner, repo);
    const projectFiles = await ProjectScanner.extractProjectFiles(zipData);

    if (projectFiles.length === 0) {
      return NextResponse.json(
        { error: 'No .ts or .tsx files found in this repository' },
        { status: 422 }
      );
    }

    const analysis = ProjectScanner.analyzeProject(projectFiles);

    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scan repository';
    const status = /not found|private/i.test(message) ? 404 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}

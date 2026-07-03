import { NextResponse } from 'next/server';
import { ProjectScanner } from '@/src/engine/scanner';

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Request must be multipart/form-data containing a project ZIP file' },
      { status: 400 }
    );
  }

  const file = formData.get('project');

  if (!file || typeof file === 'string') {
    return NextResponse.json(
      { error: 'Request must include a "project" field with a ZIP file' },
      { status: 400 }
    );
  }

  try {
    const zipData = await file.arrayBuffer();
    const projectFiles = await ProjectScanner.extractProjectFiles(zipData);

    if (projectFiles.length === 0) {
      return NextResponse.json(
        { error: 'No .ts or .tsx files found in the uploaded project' },
        { status: 422 }
      );
    }

    const analysis = ProjectScanner.analyzeProject(projectFiles);

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scan project ZIP' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { AnalysisEngine } from '@/src/engine/analyzer';
import type { ParserInput } from '@/src/types';

export async function POST(request: Request) {
  const input: ParserInput = await request.json();
  const result = AnalysisEngine.analyze(input);
  return NextResponse.json(result);
}

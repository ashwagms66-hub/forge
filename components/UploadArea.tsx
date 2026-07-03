'use client';

import { useRef, useState } from 'react';
import type { AnalysisResult } from '@/src/types';
import { ResultsDisplay } from './ResultsDisplay';

interface UploadedFile {
  name: string;
  size: number;
  content: string;
  uploadedAt: Date;
}

type UploadState = 'idle' | 'loading' | 'success' | 'error';

export function UploadArea() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file extension
    if (!file.name.endsWith('.tsx') && !file.name.endsWith('.ts')) {
      return { valid: false, error: 'Only .tsx and .ts files are supported' };
    }

    // Check file size (max 1MB)
    const maxSize = 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `File size must be less than ${formatFileSize(maxSize)}` };
    }

    // Check if it's a text file
    if (!file.type.includes('text') && file.type !== '') {
      return { valid: false, error: 'File must be a text file' };
    }

    return { valid: true };
  };

  const processFile = async (file: File): Promise<void> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setUploadState('error');
      return;
    }

    setUploadState('loading');
    setErrorMessage(null);

    // Simulate file reading delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const content = await file.text();

      // Check if file contains React-like code
      if (!content.includes('export') && !content.includes('import')) {
        setErrorMessage('File does not appear to be a valid React TypeScript file');
        setUploadState('error');
        return;
      }

      // Store file in memory
      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        content: content,
        uploadedAt: new Date(),
      };

      setUploadedFile(uploadedFile);
      setUploadState('success');
      setErrorMessage(null);
      setAnalysisResult(null); // Reset analysis when new file is uploaded
    } catch (error) {
      setErrorMessage('Failed to read file');
      setUploadState('error');
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    setAnalysisState('analyzing');

    // Simulate analysis delay for UI feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadedFile.name,
          fileContent: uploadedFile.content,
        }),
      });

      const result: AnalysisResult = await response.json();
      result.startedAt = new Date(result.startedAt);
      result.completedAt = result.completedAt ? new Date(result.completedAt) : undefined;
      result.metrics.analyzedAt = new Date(result.metrics.analyzedAt);

      setAnalysisResult(result);
      setAnalysisState('idle');
    } catch (error) {
      setErrorMessage('Failed to analyze file');
      setAnalysisState('idle');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setUploadState('idle');
    setUploadedFile(null);
    setErrorMessage(null);
    setAnalysisResult(null);
    setAnalysisState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload Area */}
      {uploadState !== 'success' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-12 transition-all duration-300 ${
            isDragging
              ? 'border-blue-400/50 bg-blue-950/20'
              : 'border-gray-700 bg-gray-900/30 hover:border-gray-600 hover:bg-gray-900/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".tsx,.ts"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            {uploadState === 'loading' ? (
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4">
                <div className="animate-spin">
                  <svg
                    className="h-8 w-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
              </div>
            ) : uploadState === 'error' ? (
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 p-4">
                <svg
                  className="h-8 w-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4">
                <svg
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6"
                  />
                </svg>
              </div>
            )}

            {/* Text */}
            <div className="text-center">
              {uploadState === 'loading' ? (
                <>
                  <p className="text-lg font-semibold text-white">Processing file...</p>
                  <p className="mt-1 text-sm text-gray-400">Please wait</p>
                </>
              ) : uploadState === 'error' ? (
                <>
                  <p className="text-lg font-semibold text-red-400">Upload failed</p>
                  <p className="mt-1 text-sm text-gray-400">{errorMessage}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-white">Drag & drop your .tsx file</p>
                  <p className="mt-1 text-sm text-gray-400">or click to browse</p>
                  <p className="mt-2 text-xs text-gray-500">Max size: 1 MB</p>
                </>
              )}
            </div>

            {/* Button */}
            {uploadState !== 'loading' && (
              <button
                onClick={handleClickUpload}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {uploadState === 'error' ? 'Try again' : 'Browse files'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadState === 'success' && uploadedFile && (
        <div className="space-y-4">
          {/* File Info Card */}
          <div className="rounded-2xl border border-green-500/30 bg-green-950/20 p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex items-center justify-center rounded-xl bg-green-500/20 p-3">
                <svg
                  className="h-6 w-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Details */}
              <div className="flex-1">
                <h3 className="font-semibold text-green-400">File uploaded successfully</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-300">
                  <p>
                    <span className="text-gray-400">Name:</span> {uploadedFile.name}
                  </p>
                  <p>
                    <span className="text-gray-400">Size:</span> {formatFileSize(uploadedFile.size)}
                  </p>
                  <p>
                    <span className="text-gray-400">Uploaded:</span>{' '}
                    {uploadedFile.uploadedAt.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleReset}
                className="text-gray-400 transition-colors hover:text-gray-300"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAnalyze}
              disabled={analysisState === 'analyzing'}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {analysisState === 'analyzing' ? 'Analyzing...' : 'Analyze Component'}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-600 px-6 py-3 font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <ResultsDisplay analysis={analysisResult} fileContent={uploadedFile?.content ?? ''} />
      )}
    </div>
  );
}

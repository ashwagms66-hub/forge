'use client';

import { useState } from 'react';

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="border-b border-gray-800 bg-black px-4 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Join the Forge Beta</h2>
        <p className="mb-8 text-gray-400">
          Be among the first developers to test AI-powered codebase analysis and refactoring.
        </p>

        {submitted ? (
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-950/20 px-6 py-4">
            <svg className="h-5 w-5 shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-semibold text-green-400">You&rsquo;re on the list.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/30"
            >
              Join Beta
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

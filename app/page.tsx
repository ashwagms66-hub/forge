import { Header } from '@/components/Header';
import { UploadArea } from '@/components/UploadArea';
import { Features } from '@/components/Features';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-800 bg-gradient-to-b from-black via-black to-gray-900/50 px-4 py-20 md:py-32">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-cyan-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/50 px-4 py-2 backdrop-blur">
              <span className="text-xs font-medium text-gray-300">
                ✨ AI-Powered Code Analysis
              </span>
            </div>
          </div>

          {/* Hero Title & Subtitle */}
          <div className="mb-12 text-center">
            <h1 className="mb-6 bg-gradient-to-r from-blue-200 via-blue-400 to-cyan-400 bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-8xl">
              Forge
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-400 md:text-xl">
              Your AI engineering partner for understanding, scoring, and refactoring React codebases.
            </p>
          </div>

          {/* Upload Section */}
          <div id="upload" className="mb-16">
            <UploadArea />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-gray-800 bg-black/50 px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-white md:text-4xl">
            Powerful Analysis Engine
          </h2>
          <p className="mb-12 text-center text-gray-400">
            Everything you need to refactor React components professionally
          </p>
          <Features />
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-gray-800 bg-black px-4 py-20 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to improve your code?</h2>
          <p className="mb-8 text-gray-400">
            Start analyzing your React components today. It's fast, free, and secure.
          </p>
          <a
            href="#upload"
            className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/30"
          >
            Analyze Codebase
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black/80 px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          <p>Forge • AI Refactoring Engineer • Built for modern React development</p>
        </div>
      </footer>
    </div>
  );
}

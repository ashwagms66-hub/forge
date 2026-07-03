export function Header() {
  return (
    <header className="border-b border-gray-800 bg-black/50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-2">
            <span className="text-lg font-bold text-white">⚙️</span>
          </div>
          <span className="text-xl font-bold text-white">Forge</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-gray-300 transition-colors hover:text-white">
            Features
          </a>
          <a href="#upload" className="text-sm text-gray-300 transition-colors hover:text-white">
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}

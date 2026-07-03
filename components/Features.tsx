export function Features() {
  const features = [
    {
      icon: '🔍',
      title: 'AST Analysis',
      description: 'Deep code parsing to understand component structure, hooks, and dependencies.',
    },
    {
      icon: '⭐',
      title: 'Quality Score',
      description: 'Comprehensive scoring based on complexity, maintainability, and best practices.',
    },
    {
      icon: '✨',
      title: 'Smart Refactoring',
      description: 'Intelligent suggestions for improving code quality and performance.',
    },
    {
      icon: '🚀',
      title: 'Production Ready',
      description: 'Industry best practices and patterns for production-grade React applications.',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className="group rounded-xl border border-gray-800 bg-gray-900/40 p-6 transition-all duration-300 hover:border-gray-700 hover:bg-gray-900/60 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="mb-3 text-3xl">{feature.icon}</div>
          <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
          <p className="text-sm text-gray-400">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}

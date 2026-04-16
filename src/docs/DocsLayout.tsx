import { NavLink, Outlet, Link } from 'react-router-dom'

const NAV = [
  {
    group: 'Getting Started',
    items: [
      { label: 'Overview', to: '/docs' },
      { label: 'Quickstart', to: '/docs/quickstart' },
    ],
  },
  {
    group: 'Core Concepts',
    items: [
      { label: 'Ink Tokens & Formula', to: '/docs/concepts' },
      { label: 'State Machine', to: '/docs/concepts#state-machine' },
      { label: 'Trust Layers', to: '/docs/concepts#trust-layers' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { label: 'API Reference', to: '/docs/api' },
      { label: 'MCP Integration', to: '/docs/mcp' },
    ],
  },
]

export function DocsLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100 hover:text-violet-600 transition-colors">
              ACP
            </Link>
            <span className="text-gray-300 dark:text-gray-700 select-none">/</span>
            <span className="text-sm text-gray-500">Docs</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors hidden sm:block">
              Landing
            </Link>
            <a
              href="https://github.com/ymow/acp-server"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              GitHub →
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 flex gap-0">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-6">
          {NAV.map((section) => (
            <div key={section.group} className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-2">
                {section.group}
              </p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/docs'}
                  className={({ isActive }) =>
                    `block px-2 py-1.5 rounded text-sm transition-colors ${
                      isActive
                        ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full border-b border-gray-100 dark:border-gray-800 py-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {NAV.flatMap((s) => s.items).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/docs'}
                className={({ isActive }) =>
                  `px-3 py-1 rounded-full text-xs transition-colors ${
                    isActive
                      ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 font-medium'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 py-10 md:pl-8 max-w-3xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

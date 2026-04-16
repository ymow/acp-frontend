/** Shared primitives for doc pages — code blocks, tables, callouts */
import type React from 'react'

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[13px] text-violet-700 dark:text-violet-400">
      {children}
    </code>
  )
}

export function Pre({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      {lang && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">{lang}</span>
        </div>
      )}
      <pre className="bg-gray-950 text-gray-100 text-[13px] font-mono leading-relaxed overflow-x-auto px-5 py-4">
        <code>{children}</code>
      </pre>
    </div>
  )
}

export function Callout({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    warn: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    tip: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-300',
  }
  const icons = { info: 'ℹ', warn: '⚠', tip: '✦' }
  return (
    <div className={`my-4 px-4 py-3 rounded-xl border text-sm leading-relaxed flex gap-3 ${styles[type]}`}>
      <span className="text-base shrink-0 mt-0.5">{icons[type]}</span>
      <div>{children}</div>
    </div>
  )
}

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-semibold tracking-tight mb-3">{children}</h1>
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-semibold tracking-tight mt-12 mb-4 scroll-mt-20">
      {children}
    </h2>
  )
}

export function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-base font-semibold mt-8 mb-3 text-gray-800 dark:text-gray-200 scroll-mt-20">
      {children}
    </h3>
  )
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8 text-base">{children}</p>
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-sm">{children}</p>
}

export function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-mono text-[13px] align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-8">
      <div className="shrink-0 w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-400 text-sm font-bold mt-0.5">
        {n}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</p>
        {children}
      </div>
    </div>
  )
}

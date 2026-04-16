/**
 * SSR entry point — used only by scripts/prerender.mjs.
 * Renders the full page structure WITHOUT any Three.js / D3 / Canvas components.
 * Those are client-only and wrapped in <ClientOnly> in App.tsx; they render null here.
 * All text content (FAQ, steps, formula, sections) is real HTML.
 */
import { renderToString } from 'react-dom/server'
import { StrictMode } from 'react'
import App from './App.tsx'

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

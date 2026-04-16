/**
 * SSR entry point — used only by scripts/prerender.mjs.
 * Renders each route to HTML. Browser-API-heavy components render null via ClientOnly wrappers.
 */
import { renderToString } from 'react-dom/server'
import { StrictMode } from 'react'
import { StaticRouter } from 'react-router-dom/server'
import { Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import { DocsLayout } from './docs/DocsLayout.tsx'
import { DocsIndex } from './docs/DocsIndex.tsx'
import { QuickstartPage } from './docs/QuickstartPage.tsx'
import { ConceptsPage } from './docs/ConceptsPage.tsx'
import { ApiRefPage } from './docs/ApiRefPage.tsx'
import { McpPage } from './docs/McpPage.tsx'

export function render(url: string = '/') {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/docs" element={<DocsLayout />}>
            <Route index element={<DocsIndex />} />
            <Route path="quickstart" element={<QuickstartPage />} />
            <Route path="concepts" element={<ConceptsPage />} />
            <Route path="api" element={<ApiRefPage />} />
            <Route path="mcp" element={<McpPage />} />
          </Route>
        </Routes>
      </StaticRouter>
    </StrictMode>
  )
}

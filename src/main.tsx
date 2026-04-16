import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DocsLayout } from './docs/DocsLayout.tsx'
import { DocsIndex } from './docs/DocsIndex.tsx'
import { QuickstartPage } from './docs/QuickstartPage.tsx'
import { ConceptsPage } from './docs/ConceptsPage.tsx'
import { ApiRefPage } from './docs/ApiRefPage.tsx'
import { McpPage } from './docs/McpPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
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
    </BrowserRouter>
  </StrictMode>,
)

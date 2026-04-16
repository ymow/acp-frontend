// Post-build SSG script.
// Uses Vite's ssrLoadModule to render each route to HTML, then writes:
//   / → dist/index.html
//   /docs → dist/docs/index.html
//   /docs/quickstart → dist/docs/quickstart/index.html  (etc.)
// Three.js / D3 / Canvas components render null (ClientOnly wrappers).
// All text content — FAQ, steps, formula, doc pages — becomes real static HTML.
import { createServer } from 'vite'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')

// Define read-only browser globals safely
function def(key, value) {
  if (!(key in globalThis)) {
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true })
  }
}

const fakeCanvas = { getContext: () => null, style: {}, width: 0, height: 0, appendChild: () => {} }
const fakeElement = { style: {}, appendChild: () => {}, addEventListener: () => {}, removeEventListener: () => {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, setAttribute: () => {}, removeAttribute: () => {}, dispatchEvent: () => {}, getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }) }
const fakeDoc = {
  createElement: (tag) => tag === 'canvas' ? fakeCanvas : { ...fakeElement },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  createElementNS: () => ({ ...fakeElement }),
  body: { ...fakeElement, className: '' },
  documentElement: { ...fakeElement, lang: 'en', dir: 'ltr', style: {} },
  head: { ...fakeElement },
}

const focusNoop = () => {}
const fakeHTMLElement = { prototype: { focus: focusNoop, blur: focusNoop } }
const fakeWindow = {
  innerWidth: 1200, innerHeight: 800,
  addEventListener: () => {}, removeEventListener: () => {},
  devicePixelRatio: 1, location: { href: '' },
  HTMLElement: fakeHTMLElement,
  HTMLInputElement: fakeHTMLElement,
  HTMLTextAreaElement: fakeHTMLElement,
  HTMLSelectElement: fakeHTMLElement,
  visualViewport: null,
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {} }),
}
def('window', fakeWindow)
def('HTMLElement', fakeHTMLElement)
def('document', fakeDoc)
def('navigator', { userAgent: 'node', maxTouchPoints: 0 })
def('requestAnimationFrame', () => 0)
def('cancelAnimationFrame', () => {})
def('ResizeObserver', class { observe() {} disconnect() {} })
def('IntersectionObserver', class { observe() {} disconnect() {} })
def('HTMLCanvasElement', { prototype: {} })
def('WebGLRenderingContext', {})
def('location', { href: '' })

const ROUTES = [
  '/',
  '/docs',
  '/docs/quickstart',
  '/docs/concepts',
  '/docs/api',
  '/docs/mcp',
]

const vite = await createServer({
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  ssr: { external: ['three', 'd3'] },
  logLevel: 'warn',
})

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')
  const template = readFileSync(resolve(root, 'dist/index.html'), 'utf-8')

  for (const route of ROUTES) {
    const appHtml = render(route)
    const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

    if (route === '/') {
      writeFileSync(resolve(root, 'dist/index.html'), html)
      console.log('✓ /')
    } else {
      // e.g. /docs/quickstart → dist/docs/quickstart/index.html
      const outDir = resolve(root, 'dist' + route)
      mkdirSync(outDir, { recursive: true })
      writeFileSync(resolve(outDir, 'index.html'), html)
      console.log(`✓ ${route}`)
    }
  }

  console.log(`\n✓ Pre-rendered ${ROUTES.length} routes`)
} finally {
  await vite.close()
}

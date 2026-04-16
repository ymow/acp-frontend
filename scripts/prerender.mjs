/**
 * Post-build SSG script.
 * Uses Vite's ssrLoadModule to render App to HTML, then injects it into dist/index.html.
 * Three.js / D3 / Canvas components render null (ClientOnly wrappers).
 * All text content — FAQ, steps, formula, sections — becomes real static HTML.
 */
import { createServer } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

const vite = await createServer({
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  ssr: { external: ['three', 'd3'] },
  logLevel: 'warn',
})

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')
  const appHtml = render()

  const templatePath = resolve(root, 'dist/index.html')
  let template = readFileSync(templatePath, 'utf-8')
  template = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  writeFileSync(templatePath, template)

  console.log('✓ Pre-rendered HTML injected into dist/index.html')
} finally {
  await vite.close()
}

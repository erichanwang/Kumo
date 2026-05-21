import '@testing-library/jest-dom'

// Polyfill IntersectionObserver for jsdom test environment
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  root: null = null
  rootMargin: string = ''
  thresholds: ReadonlyArray<number> = []
  takeRecords() { return [] }
}
;(globalThis as any).IntersectionObserver = MockIntersectionObserver

import { Component } from 'react'

/**
 * Catches any render-time crash anywhere below it. Without this, a single
 * unhandled exception (a bad prop, a `.map` on undefined, …) blanks the
 * whole app to a white screen.
 *
 * Only catches RENDER errors. Async errors inside event handlers, fetches,
 * and promises still need to be handled by their own try/catch or the
 * React Query / mutation onError paths.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Keep the console-noise low but useful. A real deployment would
    // pipe this into Sentry / Datadog / whatever.
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  handleReload = () => {
    window.location.assign('/')
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
        padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🪲</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 440, lineHeight: 1.5, marginBottom: 20 }}>
          The app hit an unexpected error. You can try to recover, or reload from the homepage.
        </p>
        <pre style={{
          background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 6,
          fontSize: 12, color: 'var(--text-muted)', maxWidth: 540, overflow: 'auto',
          marginBottom: 20, whiteSpace: 'pre-wrap',
        }}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--surface)', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
            }}
          >
            Try again
          </button>
          <button
            onClick={this.handleReload}
            style={{
              padding: '8px 16px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: 'white', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600,
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    )
  }
}

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode | ((error: Error | null) => ReactNode)
  onError?: (error: Error) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      const fb = this.props.fallback
      return typeof fb === 'function' ? fb(this.state.error) : fb
    }
    return this.props.children
  }
}

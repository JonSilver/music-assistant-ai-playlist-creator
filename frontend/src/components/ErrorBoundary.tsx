import React, { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error !== null) {
      return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
          <div className="card bg-base-100 shadow-xl max-w-2xl w-full">
            <div className="card-body">
              <h2 className="card-title text-error">Application Error</h2>
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{this.state.error.toString()}</span>
              </div>

              {this.state.errorInfo !== null && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2">Component Stack:</h3>
                  <pre className="bg-base-200 p-4 rounded text-xs overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    window.location.reload()
                  }}
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

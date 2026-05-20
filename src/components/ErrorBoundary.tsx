import React, { Component, ReactNode } from "react";

// Zero-dependency ErrorBoundary to prevent infinite loops during initialization failures
export class ErrorBoundary extends Component<{ children?: ReactNode }, { hasError: boolean; error: Error | null }> {
  public state = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Critical Uncaught Error:", error, errorInfo);
  }

  private handleRetry = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#010604',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px',
          fontFamily: 'sans-serif'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            Ops! Algo deu errado.
          </h1>
          <p style={{ opacity: 0.8, marginBottom: '24px', maxWidth: '400px' }}>
            A aplicação encontrou um erro crítico e não pôde carregar.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Tentar Novamente
          </button>
          {this.state.error && (
            <pre style={{
              marginTop: '20px',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '4px',
              fontSize: '12px',
              maxWidth: '90vw',
              overflow: 'auto'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

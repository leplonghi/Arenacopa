import React, { Component, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", backgroundColor: "#b91c1c", color: "white", minHeight: "100vh", zIndex: 99999 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "20px" }}>React Error (Tela Preta Fix)</h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "20px" }}>A aplicação encontrou um erro crítico. Por favor, veja a mensagem de erro abaixo:</p>
          <pre style={{ backgroundColor: "#7f1d1d", padding: "20px", borderRadius: "8px", overflowX: "auto", whiteSpace: "pre-wrap" }}>
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

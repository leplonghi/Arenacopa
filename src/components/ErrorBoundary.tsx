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

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign("/");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#04140f] px-6 py-10 text-white">
          <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col items-center justify-center text-center">
            <div className="mb-6 inline-flex rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-200">
              Recuperacao de erro
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Algo saiu do ritmo da partida</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
              A tela encontrou um erro inesperado. Voce pode tentar carregar novamente ou voltar para o inicio sem perder o restante do app.
            </p>

            <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full rounded-2xl bg-primary px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:brightness-110"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
              >
                Voltar ao inicio
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-8 w-full overflow-x-auto rounded-3xl border border-white/10 bg-black/30 p-5 text-left text-xs leading-6 text-white/75">
                {this.state.error.toString()}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

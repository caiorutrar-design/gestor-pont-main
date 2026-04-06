import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="max-w-md w-full border-none shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado na aplicação. Nossa equipe técnica já foi notificada (simulação).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-100 rounded text-xs font-mono text-slate-600 break-all overflow-auto max-h-32">
                {this.state.error?.message}
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full gap-2 border-primary/20 hover:bg-primary/5"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" /> Recarregar Página
                </Button>
                <Button 
                  onClick={() => window.location.href = "/"} 
                  className="w-full gap-2 bg-primary hover:bg-primary/90"
                >
                  <Home className="h-4 w-4" /> Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

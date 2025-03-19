"use client";

import { Typography, Button, Box, CircularProgress, Alert } from "@mui/material";
import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  errorType?: "network" | "auth" | "data" | "general";
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, isRetrying: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo);

    // Add sentry
  }

  handleRetry = async (): Promise<void> => {
    this.setState({ isRetrying: true });

    await new Promise((resolve) => setTimeout(resolve, 800));

    this.setState({
      hasError: false,
      error: null,
      isRetrying: false,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  getErrorMessage(): { title: string; description: string } {
    let title = "Une erreur est survenue lors du chargement des données";
    let description =
      "Nous n'avons pas pu charger les informations demandées. Veuillez réessayer dans quelques instants.";

    if (this.state.error instanceof TypeError && this.state.error.message.includes("fetch")) {
      title = "Problème de connexion";
      description =
        "Nous n'avons pas pu établir la connexion avec le serveur. Vérifiez votre connexion internet et réessayez.";
    }

    if (
      this.state.error instanceof Error &&
      (this.state.error.message.includes("401") || this.state.error.message.includes("unauthorized"))
    ) {
      title = "Session expirée";
      description = "Votre session a expiré. Veuillez vous reconnecter pour continuer.";
    }

    if (this.props.errorType) {
      switch (this.props.errorType) {
        case "network":
          title = "Problème de connexion";
          description =
            "Nous n'avons pas pu établir la connexion avec le serveur. Vérifiez votre connexion internet et réessayez.";
          break;
        case "auth":
          title = "Accès non autorisé";
          description = "Vous n'avez pas les permissions nécessaires pour accéder à cette section.";
          break;
        case "data":
          title = "Données non disponibles";
          description = "Les données demandées ne sont pas disponibles. Vérifiez vos paramètres de recherche.";
          break;
        default:
          break;
      }
    }

    return { title, description };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description } = this.getErrorMessage();

      return (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: "4px",
            backgroundColor: "var(--background-alt-blue-france)",
            maxWidth: "600px",
            mx: "auto",
            my: 4,
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2">{description}</Typography>
          </Alert>

          <Button
            variant="contained"
            color="primary"
            onClick={this.handleRetry}
            disabled={this.state.isRetrying}
            startIcon={this.state.isRetrying && <CircularProgress size={16} color="inherit" />}
          >
            {this.state.isRetrying ? "Chargement..." : "Réessayer"}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

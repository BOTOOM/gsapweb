import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ExperienceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(): void {
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fallback-story">
          <p className="eyebrow">La casa al final del viento</p>
          <h1>La isla permanece, incluso cuando el viento se detiene.</h1>
          <p>La escena 3D no pudo iniciar en este dispositivo. Puedes seguir leyendo la historia o volver a intentarlo desde un navegador con WebGL.</p>
        </main>
      );
    }
    return this.props.children;
  }
}

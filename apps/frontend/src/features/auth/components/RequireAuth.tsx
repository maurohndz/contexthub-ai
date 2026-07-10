import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '../application/use-current-user';

// Guard de rutas privadas: consulta la sesión (cookie httpOnly) contra el
// backend la primera vez y redirige a /login si no hay usuario.
export function RequireAuth() {
  const { user, hasLoaded } = useCurrentUser();

  if (!hasLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

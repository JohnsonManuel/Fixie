import { Dashboard } from './Dashboard';

// Dashboard handles its own auth state via Firebase onAuthStateChanged
// and redirects to /login if no authenticated user is found.
export default function ProtectedDashboard() {
  return <Dashboard />;
}

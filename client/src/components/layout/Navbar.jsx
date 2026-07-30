import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/common/Button';

const NAV_LINKS = [
  { label: 'Dashboard', to: '/dashboard', protected: true },
  { label: 'Chat', to: '/chat', protected: true },
];

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-white tracking-tight">
          Find Your Perfect Roommate
        </Link>

        <div className="flex items-center gap-6">
          {isAuthenticated &&
            NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-sm transition-colors duration-150 ${
                    isActive ? 'text-white font-medium' : 'text-text-muted hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" as={Link} to="/login">
                Sign in
              </Button>
              <Button size="sm" as={Link} to="/register">
                Get started
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

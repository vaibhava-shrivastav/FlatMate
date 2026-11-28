import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import authService from '@services/authService';
import Button from '@components/common/Button';

const NAV_LINKS = [
  { label: 'Dashboard', to: '/dashboard', protected: true },
  { label: 'Chat', to: '/chat', protected: true },
  { label: 'Profile', to: '/profile', protected: true },
];

export default function Navbar() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async (role) => {
    const email =
      role === 'HOST'
        ? 'kartik.sharma@example.com'
        : 'priya.mehra@example.com';
    const password = 'demoPassword123';

    try {
      const data = await authService.login(email, password);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold text-text tracking-tight">
            FlatMate
          </Link>

          {/* Quick Demo Switcher for Presenters */}
          <div className="hidden lg:flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-full border border-border text-xs">
            <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
              Demo:
            </span>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('HOST')}
              className="text-text hover:text-primary transition-colors cursor-pointer font-medium text-[11px]"
              title="Sign in as Kartik Sharma (Host with Room)"
            >
              Kartik (Host)
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('SEEKER')}
              className="text-text hover:text-primary transition-colors cursor-pointer font-medium text-[11px]"
              title="Sign in as Priya Mehra (Room Seeker)"
            >
              Priya (Seeker)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated &&
            NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-sm transition-colors duration-150 ${
                    isActive ? 'text-text font-medium border-b-2 border-primary' : 'text-text-muted hover:text-text'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted hidden sm:inline">
                {user?.name?.split(' ')[0] || user?.fullName?.split(' ')[0] || ''}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
            </div>
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

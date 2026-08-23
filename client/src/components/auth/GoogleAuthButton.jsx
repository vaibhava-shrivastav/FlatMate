import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { cn } from '@utils/cn';
import authService from '@services/authService';
import tokenManager from '@services/tokenManager';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function GoogleAuthButton({ label = 'Continue with Google', className }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = async (tokenResponse) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await authService.googleLogin(tokenResponse.access_token);
      // Store token so the API interceptor can use it for the next request
      tokenManager.set(data.token);
      // Now fetch the full user profile
      const user = await authService.getCurrentUser();
      login(user, data.token);
      navigate(data.isNewUser ? '/onboarding' : '/dashboard', { replace: true });
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => triggerGoogleLogin()}
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-3',
          'bg-card border border-border rounded-[var(--radius)]',
          'px-4 py-2.5 text-sm font-medium text-text',
          'transition-all duration-200 cursor-pointer select-none',
          'hover:border-[#4285F4]/50 hover:bg-[#111827]/80',
          'active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <GoogleIcon />
        )}
        <span>{isLoading ? 'Signing in...' : label}</span>
      </button>

      {error && <p className="text-xs text-danger text-center">{error}</p>}
    </div>
  );
}

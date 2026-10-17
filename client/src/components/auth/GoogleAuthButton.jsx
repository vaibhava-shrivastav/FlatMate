import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import authService from '@services/authService';

export default function GoogleAuthButton({ label = 'Continue with Google', className }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');
    try {
      const { user, token, isNewUser } = await authService.googleLogin(credentialResponse.credential);
      login(user, token);
      navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <div className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-[var(--radius)] bg-card text-sm text-text-muted">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Signing in...</span>
        </div>
      ) : (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError('Google sign-in was cancelled or failed.')}
          text={label === 'Sign up with Google' ? 'signup_with' : 'signin_with'}
          shape="rectangular"
          width="100%"
        />
      )}

      {error && <p className="text-xs text-danger text-center">{error}</p>}
    </div>
  );
}

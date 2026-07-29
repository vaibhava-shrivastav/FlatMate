import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useAuthForm } from '@hooks/useAuthForm';
import { isValidEmail, isValidPassword, isRequired } from '@utils/validators';
import { resolveApiError } from '@utils/authHelpers';
import authService from '@services/authService';
import Input from '@components/common/Input';
import Button from '@components/common/Button';
import GoogleAuthButton from './GoogleAuthButton';
import AuthDivider from './AuthDivider';
import ErrorBanner from './ErrorBanner';
import PasswordInput from './PasswordInput';

const INITIAL_VALUES = { email: '', password: '' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const {
    values,
    errors,
    isSubmitting,
    serverError,
    setServerError,
    setIsSubmitting,
    setFieldError,
    handleChange,
  } = useAuthForm(INITIAL_VALUES);

  const validate = () => {
    let valid = true;
    if (!isRequired(values.email)) {
      setFieldError('email', 'Email is required.');
      valid = false;
    } else if (!isValidEmail(values.email)) {
      setFieldError('email', 'Enter a valid email address.');
      valid = false;
    }
    if (!isRequired(values.password)) {
      setFieldError('password', 'Password is required.');
      valid = false;
    } else if (!isValidPassword(values.password)) {
      setFieldError('password', 'Password must be at least 8 characters.');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = await authService.login(values.email, values.password);
      login(data.user, data.token);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(resolveApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-text-muted">Sign in to your account.</p>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-6 flex flex-col gap-5">
        <GoogleAuthButton label="Continue with Google" />

        <AuthDivider />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <ErrorBanner message={serverError} onDismiss={() => setServerError('')} />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            required
          />

          <div className="flex flex-col gap-1.5">
            <PasswordInput
              label="Password"
              name="password"
              placeholder="••••••••"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
              required
            />
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-text-muted hover:text-text transition-colors duration-150"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full mt-1" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="text-text font-medium hover:text-primary transition-colors duration-150"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

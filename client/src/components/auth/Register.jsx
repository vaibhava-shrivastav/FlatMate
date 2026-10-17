import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useAuthForm } from '@hooks/useAuthForm';
import { isValidEmail, isValidPassword, isRequired } from '@utils/validators';
import { cn } from '@utils/cn';
import { resolveApiError } from '@utils/authHelpers';
import authService from '@services/authService';
import tokenManager from '@services/tokenManager';
import Input from '@components/common/Input';
import Button from '@components/common/Button';
import GoogleAuthButton from './GoogleAuthButton';
import AuthDivider from './AuthDivider';
import ErrorBanner from './ErrorBanner';
import PasswordInput from './PasswordInput';

const INITIAL_VALUES = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
};

const ROLES = [
  {
    value: 'SEARCHING_ROOM',
    label: 'Looking for a room',
    description: 'I need to find a place to stay.',
  },
  {
    value: 'HAS_ROOM',
    label: 'I have a room',
    description: 'I have a space available to rent.',
  },
];

function RoleSelector({ value, onChange, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text">
        I am <span className="text-danger ml-0.5">*</span>
      </span>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((role) => {
          const selected = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className={cn(
                'flex flex-col items-start gap-0.5 px-3.5 py-3 rounded-[var(--radius)]',
                'border text-left transition-all duration-200 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-primary bg-primary/10 text-text'
                  : 'border-border bg-background hover:border-border/80 text-text-muted hover:text-text'
              )}
            >
              <span className="text-sm font-medium">{role.label}</span>
              <span className="text-xs text-text-muted leading-snug">{role.description}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

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

  const handleRoleChange = (role) => {
    handleChange({ target: { name: 'role', value: role } });
  };

  const validate = () => {
    let valid = true;

    if (!isRequired(values.fullName)) {
      setFieldError('fullName', 'Full name is required.');
      valid = false;
    } else if (values.fullName.trim().length < 2) {
      setFieldError('fullName', 'Name must be at least 2 characters.');
      valid = false;
    }

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

    if (!isRequired(values.confirmPassword)) {
      setFieldError('confirmPassword', 'Please confirm your password.');
      valid = false;
    } else if (values.password !== values.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match.');
      valid = false;
    }

    if (!isRequired(values.role)) {
      setFieldError('role', 'Please select your role.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = await authService.register({
        name: values.fullName.trim(),
        email: values.email,
        password: values.password,
        role: values.role,
      });
      // Server returns { token, isNewUser } — no user object
      tokenManager.set(data.token);
      const user = await authService.getCurrentUser();
      register(user, data.token);
      navigate('/onboarding', { replace: true });
    } catch (error) {
      setServerError(resolveApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-text-muted">Find your perfect roommate Here.</p>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-6 flex flex-col gap-5">
        <GoogleAuthButton label="Sign up with Google" />

        <AuthDivider />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <ErrorBanner message={serverError} onDismiss={() => setServerError('')} />

          <Input
            label="Full name"
            name="fullName"
            type="text"
            placeholder="Alex Johnson"
            value={values.fullName}
            onChange={handleChange}
            error={errors.fullName}
            autoComplete="name"
            required
          />

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

          <PasswordInput
            label="Password"
            name="password"
            placeholder="Min. 8 characters"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
            required
          />

          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            placeholder="Repeat your password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />

          <RoleSelector
            value={values.role}
            onChange={handleRoleChange}
            error={errors.role}
          />

          <Button type="submit" className="w-full mt-1" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-text font-medium hover:text-primary transition-colors duration-150"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

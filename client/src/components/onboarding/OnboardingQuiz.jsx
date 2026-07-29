import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import api from '@services/api';
import { resolveApiError } from '@utils/authHelpers';
import { cn } from '@utils/cn';
import Button from '@components/common/Button';
import ErrorBanner from '@components/common/ErrorBanner';

const STEPS = [
  {
    key: 'sleepSchedule',
    question: 'What is your sleep schedule?',
    options: [
      { value: 'early_bird', label: 'Early bird', description: 'I sleep before 10 PM.' },
      { value: 'night_owl', label: 'Night owl', description: 'I stay up past midnight.' },
      { value: 'flexible', label: 'Flexible', description: 'It varies day to day.' },
    ],
  },
  {
    key: 'cleanliness',
    question: 'How clean do you keep your space?',
    options: [
      { value: 'very_clean', label: 'Very clean', description: 'I clean every day.' },
      { value: 'average', label: 'Average', description: 'I tidy up weekly.' },
      { value: 'relaxed', label: 'Relaxed', description: 'I clean when needed.' },
    ],
  },
  {
    key: 'smoking',
    question: 'Do you smoke?',
    options: [
      { value: 'no', label: 'No', description: 'I do not smoke.' },
      { value: 'outside_only', label: 'Outside only', description: 'Only outside the home.' },
      { value: 'yes', label: 'Yes', description: 'I smoke indoors.' },
    ],
  },
  {
    key: 'cooking',
    question: 'How often do you cook at home?',
    options: [
      { value: 'daily', label: 'Daily', description: 'I cook most meals.' },
      { value: 'sometimes', label: 'Sometimes', description: 'A few times a week.' },
      { value: 'rarely', label: 'Rarely', description: 'I mostly eat out.' },
    ],
  },
  {
    key: 'guests',
    question: 'How often do you have guests over?',
    options: [
      { value: 'rarely', label: 'Rarely', description: 'Almost never.' },
      { value: 'occasionally', label: 'Occasionally', description: 'Once or twice a month.' },
      { value: 'frequently', label: 'Frequently', description: 'Several times a week.' },
    ],
  },
  {
    key: 'noise',
    question: 'What is your noise preference at home?',
    options: [
      { value: 'quiet', label: 'Quiet', description: 'I prefer a silent space.' },
      { value: 'moderate', label: 'Moderate', description: 'Some noise is fine.' },
      { value: 'lively', label: 'Lively', description: 'I like music and activity.' },
    ],
  },
];

export default function OnboardingQuiz() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const selectedValue = answers[current.key] ?? null;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [current.key]: value }));
  };

  const handleNext = () => {
    if (!selectedValue) return;
    if (isLast) {
      handleSubmit();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/users/onboarding', {habitVector: answers,});
      updateUser(data.user ?? {});
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(resolveApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text tracking-tight">Tell us about yourself</h1>
        <p className="text-sm text-text-muted">
          Step {step + 1} of {STEPS.length} — help us find your best roommate match.
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-6 flex flex-col gap-5">
        <ErrorBanner message={error} onDismiss={() => setError('')} />

        <p className="text-base font-medium text-text">{current.question}</p>

        <div className="flex flex-col gap-2">
          {current.options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex flex-col items-start gap-0.5 px-4 py-3 rounded-[var(--radius)]',
                  'border text-left transition-all duration-200 cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isSelected
                    ? 'border-primary bg-primary/10 text-text'
                    : 'border-border bg-background hover:border-border/80 text-text-muted hover:text-text'
                )}
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-text-muted leading-snug">{option.description}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            disabled={!selectedValue}
            isLoading={isSubmitting}
          >
            {isLast ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
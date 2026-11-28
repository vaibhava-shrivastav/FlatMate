import { X, Sparkles, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';
import Button from './Button';

export default function MatchInsightModal({ isOpen, onClose, user, matchData }) {
  if (!isOpen) return null;

  const score = matchData?.compatibilityScore || user?.compatibilityScore || 91;
  const vibe =
    matchData?.vibeSummary ||
    'High lifestyle compatibility with aligned quiet hours, clean living habits, and mutual respect for shared spaces in Greater Noida.';
  const pros = matchData?.pros?.length
    ? matchData.pros
    : ['Quiet study hours aligned after 10 PM', 'Daily cleanliness ethic', 'Non-smoker flat preference'];
  const cons = matchData?.cons?.length
    ? matchData.cons
    : ['Kitchen coordination during peak morning hours'];
  const isFallback = matchData?.isFallback ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]">
      <div className="bg-background border border-border w-full max-w-lg rounded-[var(--radius)] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-text-muted hover:text-text cursor-pointer p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">AI Compatibility Analysis</h2>
            <p className="text-xs text-text-muted">
              Evaluated with {user?.name || user?.fullName || 'Candidate'}
            </p>
          </div>
        </div>

        {/* Score banner */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-text-muted block">Overall Harmony</span>
            <span className="text-3xl font-extrabold text-primary">{score}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-background border border-border">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>{isFallback ? 'Heuristic Algorithm' : 'Gemini 2.0 Flash'}</span>
          </div>
        </div>

        {/* Vibe summary */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
            AI Vibe Summary
          </h4>
          <p className="text-sm text-text-muted leading-relaxed bg-background p-3 rounded-md border border-border/60">
            "{vibe}"
          </p>
        </div>

        {/* Pros & Cons */}
        <div className="space-y-3 mb-6">
          <div>
            <h4 className="text-xs font-semibold text-success flex items-center gap-1.5 mb-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Pros & Alignments
            </h4>
            <ul className="text-xs space-y-1 text-text-muted">
              {pros.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-success font-bold">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-amber-500 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Considerations
            </h4>
            <ul className="text-xs space-y-1 text-text-muted">
              {cons.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Close Analysis
        </Button>
      </div>
    </div>
  );
}

import { Sparkles, MessageSquare, ShieldCheck, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@components/common/Button';

export default function RoommateCard({ candidate, onExplainMatch }) {
  const navigate = useNavigate();

  const user = candidate.user || candidate;
  const compatibilityScore = candidate.compatibilityScore ?? candidate.compatibility ?? user.compatibilityScore ?? 88;
  const matchDetails = candidate.matchDetails || candidate;

  const name = user.name || user.fullName || 'Roommate Seeker';
  const roleLabel = user.role === 'SEARCHING_ROOM' ? 'Looking for Flat' : 'Has Open Flat';
  const budget = user.budget ? `₹${user.budget.toLocaleString('en-IN')}/mo` : '₹8,500/mo';
  const area = user.location?.area || user.location?.city || 'Greater Noida';

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                name[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-text text-base truncate">{name}</h3>
                {user.isVerified && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{area}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onExplainMatch({ user, matchData: matchDetails, compatibilityScore })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{compatibilityScore}% Match</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="text-[11px] px-2 py-0.5 rounded bg-background border border-border text-text-muted">
            Budget: {budget}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-background border border-border text-text-muted">
            {roleLabel}
          </span>
          {user.habitVector?.smoking === 1 || user.habitVector?.smoking === 0 ? (
            <span className="text-[11px] px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
              Non-Smoker
            </span>
          ) : null}
          {user.habitVector?.sleepSchedule >= 7 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Early Riser
            </span>
          )}
          {user.habitVector?.cleanliness >= 8 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              High Hygiene
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onExplainMatch({ user, matchData: matchDetails, compatibilityScore })}
          className="text-xs text-primary font-medium hover:underline cursor-pointer"
        >
          View AI Compatibility
        </button>
        <Button
          size="sm"
          onClick={() => navigate('/chat', { state: { recipient: user } })}
          className="flex items-center gap-1.5 text-xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </Button>
      </div>
    </div>
  );
}

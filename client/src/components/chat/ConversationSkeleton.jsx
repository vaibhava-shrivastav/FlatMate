import Bone from '@components/common/Skeleton';

function ConversationSkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Bone className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Bone className="h-3 w-28" />
          <Bone className="h-2.5 w-10" />
        </div>
        <Bone className="h-2.5 w-40" />
      </div>
    </div>
  );
}

export default function ConversationSkeleton({ count = 6 }) {
  return (
    <div aria-label="Loading conversations" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <ConversationSkeletonRow key={i} />
      ))}
    </div>
  );
}

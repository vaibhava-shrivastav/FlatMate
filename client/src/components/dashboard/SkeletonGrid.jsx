import Bone from '@components/common/Skeleton';

function ListingSkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
      <Bone className="w-full h-44" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <Bone className="h-4 w-3/5" />
          <Bone className="h-5 w-12 rounded-full" />
        </div>
        <Bone className="h-3 w-2/5" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-4/5" />
        <div className="flex items-center justify-between pt-1">
          <Bone className="h-5 w-20" />
          <Bone className="h-8 w-28 rounded-[var(--radius)]" />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonGrid({ count = 6 }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      aria-label="Loading listings"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <ListingSkeletonCard key={i} />
      ))}
    </div>
  );
}

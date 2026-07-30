import Bone from '@components/common/Skeleton';

function MessageSkeletonRow({ outgoing }) {
  return (
    <div className={`flex items-end gap-2.5 ${outgoing ? 'flex-row-reverse' : 'flex-row'}`}>
      {!outgoing && <Bone className="w-7 h-7 rounded-full shrink-0" />}
      <div className={`flex flex-col gap-1.5 ${outgoing ? 'items-end' : 'items-start'}`}>
        <Bone className={`h-9 rounded-2xl ${outgoing ? 'w-48' : 'w-56'}`} />
        <Bone className="h-2.5 w-10" />
      </div>
    </div>
  );
}

export default function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" aria-label="Loading messages" aria-busy="true">
      <MessageSkeletonRow outgoing={false} />
      <MessageSkeletonRow outgoing={true} />
      <MessageSkeletonRow outgoing={false} />
      <MessageSkeletonRow outgoing={true} />
      <MessageSkeletonRow outgoing={false} />
      <MessageSkeletonRow outgoing={true} />
    </div>
  );
}

/** Reusable skeleton / shimmer loading primitives. */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div>
      <div className="border-b border-neutral-100 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-neutral-50 last:border-0 px-4 py-4 flex gap-4 items-center">
          <div className="flex items-center gap-2.5 w-36 shrink-0">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <Skeleton key={j} className={`h-3.5 ${j === 0 ? 'flex-1' : 'w-20'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function ConvListSkeleton() {
  return (
    <div className="py-2 px-2 flex flex-col gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-2.5 py-2.5 flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-2.5 w-2/5" />
        </div>
      ))}
    </div>
  );
}

export function ApprovalCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-start gap-4">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
    </div>
  );
}

import { CardsSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="container-x py-20">
      <Skeleton className="h-4 w-32 rounded-full" />
      <Skeleton className="mt-6 h-12 w-3/4" />
      <Skeleton className="mt-3 h-12 w-1/2" />
      <Skeleton className="mt-6 h-4 w-2/3" />
      <div className="mt-14">
        <CardsSkeleton count={6} />
      </div>
    </div>
  );
}

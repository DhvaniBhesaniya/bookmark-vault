import { AnimatePresence } from 'framer-motion';
import BookmarkCard from './BookmarkCard';
import { Skeleton } from './ui/skeleton';

function resolveBookmarkKey(bookmark, index) {
  const id = bookmark?.id;
  const mongoId = bookmark?._id;

  const fromId = typeof id === 'string'
    ? id
    : (id && typeof id === 'object' && typeof id.$oid === 'string' ? id.$oid : null);

  const fromMongoId = typeof mongoId === 'string'
    ? mongoId
    : (mongoId && typeof mongoId === 'object' && typeof mongoId.$oid === 'string' ? mongoId.$oid : null);

  if (fromId) return fromId;
  if (fromMongoId) return fromMongoId;

  const fallbackUrl = bookmark?.url || 'no-url';
  const fallbackTitle = bookmark?.title || 'untitled';
  const fallbackCreatedAt = bookmark?.created_at || 'no-date';

  return `${fallbackUrl}::${fallbackTitle}::${fallbackCreatedAt}::${index}`;
}

function BookmarkCardSkeleton() {
  return (
    <div className="rounded-lg bg-bg-elevated border border-border overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-16 h-3" />
        </div>
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-2/3 h-3" />
        <div className="flex gap-1.5">
          <Skeleton className="w-14 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-12 h-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function BookmarkGrid({
  bookmarks = [],
  isLoading,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpen,
  collections = [],
  onMoveToFolder,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <BookmarkCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-accent/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 className="font-display text-headline-md text-text-primary mb-2">
          No bookmarks yet
        </h3>
        <p className="text-text-muted text-sm max-w-sm">
          Start by importing your browser bookmarks or saving a link manually.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      <AnimatePresence mode="popLayout">
        {bookmarks.map((bookmark, index) => (
          <BookmarkCard
            key={resolveBookmarkKey(bookmark, index)}
            bookmark={bookmark}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onOpen={onOpen}
            collections={collections}
            onMoveToFolder={onMoveToFolder}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

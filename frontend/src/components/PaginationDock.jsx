import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

function buildPageWindow(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('left-ellipsis');
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (end < totalPages - 1) pages.push('right-ellipsis');

  pages.push(totalPages);
  return pages;
}

export default function PaginationDock({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageWindow(currentPage, totalPages);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-bg-elevated/90 backdrop-blur-md px-2 py-2 shadow-lg">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-9 w-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-elevated-high disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((entry) => {
          if (typeof entry === 'string') {
            return (
              <span key={entry} className="px-2 text-xs text-text-faint">
                ...
              </span>
            );
          }

          const isActive = entry === currentPage;
          return (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              className={cn(
                'h-9 min-w-9 px-2 rounded-full text-sm transition-colors',
                isActive
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated-high'
              )}
              aria-label={`Go to page ${entry}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {entry}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-9 w-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-elevated-high disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

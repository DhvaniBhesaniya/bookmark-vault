import { useEffect, useRef } from 'react';
import { FolderOpen, FolderMinus } from 'lucide-react';
import { cn, resolveOid } from '../lib/utils';

function resolveId(collection) {
  return resolveOid(collection.id ?? collection._id);
}

/**
 * Small floating dropdown to pick (or clear) a folder for a bookmark.
 * Rendered via a portal-style absolute box – caller controls open/close state.
 */
export default function FolderPicker({ collections = [], currentCollectionId, onSelect, onClose, className }) {
  const normalizedCurrent = resolveOid(currentCollectionId);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[180px] rounded-xl border border-border bg-bg-elevated shadow-card p-1 text-sm',
        className
      )}
    >
      {/* Remove from folder option */}
      {normalizedCurrent && (
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            onClose?.();
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-text-muted hover:bg-bg-secondary hover:text-danger transition-colors"
        >
          <FolderMinus className="w-3.5 h-3.5 shrink-0" />
          Remove from folder
        </button>
      )}

      {collections.length === 0 && (
        <p className="px-3 py-2 text-text-faint text-xs">No folders yet</p>
      )}

      {collections.map((collection) => {
        const id = resolveId(collection);
        const isCurrent = normalizedCurrent === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              onSelect(id);
              onClose?.();
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
              isCurrent
                ? 'bg-accent/10 text-accent-light'
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
            )}
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{collection.name}</span>
          </button>
        );
      })}
    </div>
  );
}


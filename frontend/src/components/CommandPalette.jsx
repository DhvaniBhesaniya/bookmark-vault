import { useEffect, useState, useRef, useCallback } from 'react';
import { Command } from 'cmdk';
import { Search, ExternalLink, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { BorderBeam } from './magicui/BorderBeam';
import { cn, extractDomain, getFaviconUrl, truncate } from '../lib/utils';

export default function CommandPalette({ isOpen, onClose, onSearch, onSelectResult, results = [], recentSearches = [] }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      onSearch?.('');
    }
  }, [isOpen, onSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch?.(query.trim());
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  // Global ⌘K handler and Escape
  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose?.();
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose?.();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[600px] z-[61]">
        <div className="relative rounded-xl">
          <BorderBeam
            size={150}
            duration={6}
            delay={0}
            borderWidth={2}
            colorFrom="var(--accent-light)"
            colorTo="var(--accent)"
            className="rounded-xl"
          />
          <BorderBeam
            size={150}
            duration={6}
            delay={3}
            borderWidth={2}
            colorFrom="var(--accent)"
            colorTo="var(--accent-light)"
            className="rounded-xl"
          />
        <Command
          className="rounded-xl border border-border bg-bg-secondary shadow-ambient overflow-hidden animate-fade-in"
          shouldFilter={false}
        >
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="w-4 h-4 text-text-muted shrink-0" />
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search bookmarks..."
              className="flex-1 h-12 bg-transparent text-sm text-text-primary placeholder:text-text-faint focus:outline-none"
              autoFocus
            />
            <kbd className="text-[10px] text-text-faint bg-bg-elevated px-1.5 py-0.5 rounded border border-border font-mono">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[340px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-text-muted">
              No bookmarks found for &ldquo;{query}&rdquo;
            </Command.Empty>

            {!query && recentSearches.length > 0 && (
              <Command.Group heading={<span className="text-[11px] font-bold text-text-faint uppercase tracking-wider px-2">Recent</span>}>
                {recentSearches.map((item, i) => (
                  <Command.Item
                    key={`recent-${i}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-bg-elevated data-[selected=true]:text-text-primary transition-colors"
                    onSelect={() => setQuery(item)}
                  >
                    <Clock className="w-3.5 h-3.5 text-text-faint" />
                    {item}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.length > 0 && (
              <Command.Group heading={<span className="text-[11px] font-bold text-text-faint uppercase tracking-wider px-2">Results</span>}>
                {results.map((result) => {
                  const bm = result.bookmark || result;
                  const domain = bm.domain || extractDomain(bm.url);
                  return (
                    <Command.Item
                      key={bm.id || (typeof bm._id === 'object' ? bm._id.$oid : bm._id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-bg-elevated transition-colors group"
                      onSelect={() => {
                        onSelectResult?.(query);
                        if (bm.url) window.open(bm.url, '_blank');
                        onClose?.();
                      }}
                    >
                      <img src={getFaviconUrl(domain)} alt="" className="w-4 h-4 rounded-sm shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{bm.title}</p>
                        {bm.ai_summary && (
                          <p className="text-xs text-text-muted truncate">{truncate(bm.ai_summary, 80)}</p>
                        )}
                      </div>
                      {bm.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} className="text-[9px] px-1.5 py-0.5 hidden sm:inline-flex">{tag}</Badge>
                      ))}
                      <ExternalLink className="w-3.5 h-3.5 text-text-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-text-faint">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
        </Command>
        </div>
      </div>
    </div>
  );
}

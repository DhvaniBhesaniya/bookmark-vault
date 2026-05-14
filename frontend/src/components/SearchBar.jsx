import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { BorderBeam } from './magicui/BorderBeam';

export default function SearchBar({ onSearch, resultCount, isSearching, query: externalQuery }) {
  const [query, setQuery] = useState(externalQuery || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Placeholder cycling text
  const placeholders = [
    'Search your bookmarks...',
    "Try 'rust tutorials'",
    "Try 'free tools'",
    "Try 'design inspiration'",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (isFocused) return; // Don't cycle when focused
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isFocused]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch?.(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // ⌘K global shortcut to focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={cn(
          'relative flex items-center gap-3 px-5 py-3 overflow-hidden',
          'rounded-xl border transition-all duration-300',
          'bg-bg-secondary',
          isFocused
            ? 'border-accent/50 shadow-glow-lg'
            : 'border-border hover:border-border-hover'
        )}
      >
        <BorderBeam size={100} duration={8} delay={0} />
        <BorderBeam size={100} duration={8} delay={4} />

        <Search
          className={cn(
            'w-5 h-5 shrink-0 transition-colors duration-200 z-10',
            isFocused ? 'text-accent' : 'text-text-muted'
          )}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholders[placeholderIndex]}
          className="flex-1 bg-transparent text-text-primary text-base placeholder:text-text-faint focus:outline-none font-display z-10"
          id="search-bar"
        />

        {query && (
          <button
            onClick={() => setQuery('')}
            className="shrink-0 text-text-muted hover:text-text-primary transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {!isFocused && !query && (
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-text-faint bg-bg-elevated border border-border z-10">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Result count */}
      {query && isSearching && (
        <p className="text-xs text-text-muted mt-2 text-center animate-fade-in flex items-center justify-center gap-2">
          <span className="inline-block w-3.5 h-3.5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
          Searching for &ldquo;{query}&rdquo;&hellip;
        </p>
      )}
      {query && !isSearching && resultCount !== undefined && (
        <p className="text-xs text-text-muted mt-2 text-center animate-fade-in">
          {resultCount} {resultCount === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}

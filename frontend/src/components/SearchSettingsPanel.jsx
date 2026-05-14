import { useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SearchSettingsPanel({
  searchLimit,
  minScore,
  selectedCollectionId,
  collections,
  onSearchLimitChange,
  onMinScoreChange,
  onCollectionChange,
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isLimitCustomMode, setIsLimitCustomMode] = useState(false);
  const [isScoreCustomMode, setIsScoreCustomMode] = useState(false);
  const [customLimit, setCustomLimit] = useState('');
  const [customMinScore, setCustomMinScore] = useState('');

  const limitRef = useRef(null);
  const scoreRef = useRef(null);
  const folderRef = useRef(null);

  const resultLimitOptions = useMemo(() => [15, 25, 50, 100, 200], []);
  const minScoreOptions = useMemo(() => [0.3, 0.4, 0.5, 0.6, 0.7], []);

  const isPresetLimit = resultLimitOptions.includes(searchLimit);
  const isPresetMinScore = minScore !== null && minScoreOptions.includes(Number(minScore));

  const resultLimitLabel = isPresetLimit ? String(searchLimit) : `Custom: ${searchLimit}`;
  const minScoreLabel =
    minScore === null ? 'Off' : (isPresetMinScore ? Number(minScore).toFixed(2) : `Custom: ${Number(minScore).toFixed(2)}`);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (limitRef.current && !limitRef.current.contains(event.target)) {
        setIsLimitOpen(false);
      }
      if (scoreRef.current && !scoreRef.current.contains(event.target)) {
        setIsScoreOpen(false);
      }
      if (folderRef.current && !folderRef.current.contains(event.target)) {
        setIsFolderOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCustomLimitApply = () => {
    const parsed = Number(customLimit);
    if (Number.isFinite(parsed) && parsed > 0) {
      onSearchLimitChange?.(Math.floor(parsed));
      setIsLimitCustomMode(false);
    }
  };

  const handleCustomMinScoreApply = () => {
    const parsed = Number(customMinScore);
    if (Number.isFinite(parsed)) {
      onMinScoreChange?.(Math.max(0, Math.min(1, parsed)));
      setIsScoreCustomMode(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors w-full"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filter & Search
      </button>

      {!isCollapsed && (
        <div className={cn('rounded-xl border border-border bg-bg-elevated/60 p-3 space-y-3')}>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Result Limit
            </label>
            <div className="relative" ref={limitRef}>
              <button
                type="button"
                onClick={() => {
                  setIsLimitOpen((prev) => !prev);
                  setIsScoreOpen(false);
                  setIsFolderOpen(false);
                }}
                className={cn(
                  'w-full bg-bg-secondary border border-border pl-3 pr-9 py-2 text-sm text-text-primary text-left transition-colors',
                  'rounded-xl focus:outline-none focus:border-accent',
                  isLimitOpen && 'rounded-b-none border-b-transparent'
                )}
              >
                {resultLimitLabel}
              </button>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />

              {isLimitOpen && (
                <div className="absolute left-0 right-0 top-full -mt-px z-20 rounded-b-xl border border-border bg-bg-secondary overflow-hidden">
                  {resultLimitOptions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        onSearchLimitChange?.(value);
                        setIsLimitCustomMode(false);
                        setIsLimitOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated"
                    >
                      {value}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLimitCustomMode(true);
                      setIsLimitOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated border-t border-border"
                  >
                    Custom...
                  </button>
                </div>
              )}
            </div>

            {(isLimitCustomMode || !isPresetLimit) && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomLimitApply();
                    }
                  }}
                  placeholder="Enter custom limit"
                  className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={handleCustomLimitApply}
                  className="shrink-0 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent-light text-xs font-semibold hover:bg-accent/20"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Min Relevance Score
            </label>
            <div className="relative" ref={scoreRef}>
              <button
                type="button"
                onClick={() => {
                  setIsScoreOpen((prev) => !prev);
                  setIsLimitOpen(false);
                  setIsFolderOpen(false);
                }}
                className={cn(
                  'w-full bg-bg-secondary border border-border pl-3 pr-9 py-2 text-sm text-text-primary text-left transition-colors',
                  'rounded-xl focus:outline-none focus:border-accent',
                  isScoreOpen && 'rounded-b-none border-b-transparent'
                )}
              >
                {minScoreLabel}
              </button>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />

              {isScoreOpen && (
                <div className="absolute left-0 right-0 top-full -mt-px z-20 rounded-b-xl border border-border bg-bg-secondary overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      onMinScoreChange?.(null);
                      setIsScoreCustomMode(false);
                      setIsScoreOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated"
                  >
                    Off
                  </button>
                  {minScoreOptions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        onMinScoreChange?.(value);
                        setIsScoreCustomMode(false);
                        setIsScoreOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated"
                    >
                      {value.toFixed(2)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsScoreCustomMode(true);
                      setIsScoreOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated border-t border-border"
                  >
                    Custom...
                  </button>
                </div>
              )}
            </div>

            {(isScoreCustomMode || (minScore !== null && !isPresetMinScore)) && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={customMinScore}
                  onChange={(e) => setCustomMinScore(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomMinScoreApply();
                    }
                  }}
                  placeholder="0.00 to 1.00"
                  className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={handleCustomMinScoreApply}
                  className="shrink-0 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent-light text-xs font-semibold hover:bg-accent/20"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Folder Filter
            </label>
            <div className="relative" ref={folderRef}>
              <button
                type="button"
                onClick={() => {
                  setIsFolderOpen((prev) => !prev);
                  setIsLimitOpen(false);
                  setIsScoreOpen(false);
                }}
                className={cn(
                  'w-full bg-bg-secondary border border-border pl-3 pr-9 py-2 text-sm text-text-primary text-left transition-colors',
                  'rounded-xl focus:outline-none focus:border-accent',
                  isFolderOpen && 'rounded-b-none border-b-transparent'
                )}
              >
                {selectedCollectionId
                  ? (collections.find((collection) => {
                      const id = collection.id || collection._id?.$oid || collection._id;
                      return id === selectedCollectionId;
                    })?.name || 'Selected Folder')
                  : 'All Folders'}
              </button>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />

              {isFolderOpen && (
                <div className="absolute left-0 right-0 top-full -mt-px z-20 max-h-56 overflow-y-auto rounded-b-xl border border-border bg-bg-secondary">
                  <button
                    type="button"
                    onClick={() => {
                      onCollectionChange?.(null);
                      setIsFolderOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated"
                  >
                    All Folders
                  </button>
                  {collections.map((collection) => {
                    const id = collection.id || collection._id?.$oid || collection._id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          onCollectionChange?.(id);
                          setIsFolderOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated"
                      >
                        {collection.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

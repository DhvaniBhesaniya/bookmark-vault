import { cn } from '../lib/utils';
import { FILTER_OPTIONS } from '../lib/constants';
import { Hash, ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

export default function TagFilter({
  tags = [],
  selectedTags = [],
  activeFilter = 'all',
  onFilterChange,
  onTagToggle,
  settingsNode,
  totalBookmarks,
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  // toolsSelected = true → sections visible. Default = visible.
  const [toolsSelected, setToolsSelected] = useState(true);
  const toolsVisible = toolsSelected;

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Filter Pills + Tools toggle */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterChange?.(opt.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
              activeFilter === opt.value
                ? 'bg-accent text-white shadow-glow'
                : 'bg-bg-elevated text-text-muted border border-border hover:border-border-hover hover:text-text-primary'
            )}
          >
            {opt.label}
          </button>
        ))}

        {/* Tools toggle — hides/shows Filter & Search, Folders, Tags */}
        <button
          onClick={() => setToolsSelected((v) => !v)}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
            toolsSelected
              ? 'bg-accent text-white shadow-glow'
              : 'bg-bg-elevated text-text-muted border border-border hover:border-border-hover hover:text-text-primary'
          )}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Tools
        </button>
      </div>

      {/* Settings panel + Folders — hidden when Tools is selected */}
      {toolsVisible && settingsNode ? (
        <div className="shrink-0">{settingsNode}</div>
      ) : null}

      {/* Tag Sidebar — hidden when Tools is selected */}
      {toolsVisible && (
        <div className="flex flex-col flex-1 min-h-0 gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors w-full"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Tags
            <span className="text-text-faint ml-auto">{tags.length}</span>
          </button>

          {!isCollapsed && (
            <div className="space-y-0.5 flex-1 overflow-y-auto no-scrollbar max-h-[150px] lg:max-h-none">
              {tags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => onTagToggle?.(tag.name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200',
                    selectedTags.includes(tag.name)
                      ? 'bg-accent/10 text-accent-light'
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  )}
                >
                  <Hash className="w-3 h-3 shrink-0" />
                  <span className="truncate flex-1 text-left">{tag.name}</span>
                  <span className="text-xs text-text-faint shrink-0">{tag.count}</span>
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-text-faint px-3 py-2">No tags yet</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Total bookmarks count */}
      {totalBookmarks !== undefined && (
        <div className="shrink-0 mt-auto pt-4 border-t border-border">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Bookmarks</span>
            <span className="text-sm font-bold text-accent drop-shadow-[0_0_6px_var(--color-accent)] animate-pulse">
              {totalBookmarks}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

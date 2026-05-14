import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles, Tag, FileText, Globe, Calendar, Trash2, ArrowLeft, FolderOpen, Type } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn, formatDate, extractDomain, getFaviconUrl, resolveOid } from '../lib/utils';
import FolderPicker from './FolderPicker';

function resolveId(collection) {
  return resolveOid(collection.id ?? collection._id);
}

export default function BookmarkDetail({ bookmark, isOpen, onClose, onSave, onDelete, collections = [], onMoveToFolder }) {
  const [edited, setEdited] = useState(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (bookmark) setEdited({ ...bookmark });
  }, [bookmark]);

  if (!bookmark || !edited) return null;

  const currentCollection = collections.find((c) => resolveId(c) === resolveOid(bookmark.collection_id)) || null;

  const domain = bookmark.domain || extractDomain(bookmark.url);
  const faviconUrl = getFaviconUrl(domain);

  const handleTagRemove = (tag) => {
    setEdited((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (!edited.tags?.includes(newTag)) {
        setEdited((p) => ({ ...p, tags: [...(p.tags || []), newTag] }));
      }
      setTagInput('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] bg-bg-secondary border-l border-border shadow-ambient flex flex-col"
          >
            {/* Header — always visible, never scrolls */}
            <div className="shrink-0 bg-bg-secondary border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={onClose}
                  className="shrink-0 h-8 px-3 rounded-md flex items-center gap-1.5 bg-bg-elevated border border-border text-text-primary text-xs font-medium hover:bg-bg-secondary transition-colors"
                  aria-label="Back to bookmarks"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                {faviconUrl && <img src={faviconUrl} alt="" className="w-5 h-5 rounded-sm shrink-0" />}
                <h2 className="text-sm font-semibold text-text-primary truncate">{bookmark.title || 'Detail'}</h2>
              </div>
              <button onClick={onClose} className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-bg-elevated border border-border text-text-primary hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {bookmark.og_image && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={bookmark.og_image} alt="" className="w-full aspect-video object-cover" />
                </div>
              )}

              {bookmark.url && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />URL</label>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-accent-light hover:text-accent group">
                    <span className="truncate">{bookmark.url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              )}

              {/* Title edit field */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />Title
                </label>
                <input
                  type="text"
                  value={edited.title || ''}
                  onChange={(e) => setEdited((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Untitled"
                  className="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Folder assignment */}
              <div className="space-y-1.5 relative">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />Folder
                </label>
                <button
                  type="button"
                  onClick={() => setShowFolderPicker((v) => !v)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 w-full text-left',
                    'bg-bg-elevated border-border hover:border-accent/40 text-text-secondary hover:text-text-primary'
                  )}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 text-text-faint" />
                  <span className="flex-1 truncate">{currentCollection ? currentCollection.name : 'No folder'}</span>
                  <X
                    className={cn('w-3.5 h-3.5 shrink-0 text-text-faint hover:text-danger transition-colors', !resolveOid(bookmark.collection_id) && 'hidden')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToFolder?.(bookmark, null);
                    }}
                  />
                </button>
                {showFolderPicker && (
                  <FolderPicker
                    collections={collections}
                    currentCollectionId={resolveOid(bookmark.collection_id)}
                    onSelect={(colId) => {
                      onMoveToFolder?.(bookmark, colId);
                      setShowFolderPicker(false);
                    }}
                    onClose={() => setShowFolderPicker(false)}
                    className="left-0 top-full mt-1 w-full"
                  />
                )}
              </div>

              {bookmark.ai_summary && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent" />AI Summary</label>
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-sm text-text-secondary leading-relaxed">{bookmark.ai_summary}</p>
                  </div>
                </div>
              )}

              {edited.duplicate_links && edited.duplicate_links.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5 text-orange-400" />Duplicate Links Imports</label>
                  <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 space-y-2 max-h-48 overflow-y-auto">
                    {edited.duplicate_links.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2 group/dup">
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => {
                            const newLinks = [...edited.duplicate_links];
                            newLinks[idx] = e.target.value;
                            setEdited(p => ({ ...p, duplicate_links: newLinks }));
                          }}
                          className="flex-1 bg-transparent text-xs text-orange-400 focus:text-orange-400 border-b border-transparent focus:border-orange-500/30 focus:outline-none transition-colors"
                        />
                        <button
                          onClick={() => {
                            const newLinks = edited.duplicate_links.filter((_, i) => i !== idx);
                            setEdited(p => ({ ...p, duplicate_links: newLinks }));
                          }}
                          className="shrink-0 text-orange-500/30 hover:text-orange-500 opacity-0 group-hover/dup:opacity-100 transition-all"
                          title="Remove link"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {edited.tags?.map((tag) => (
                    <Badge key={tag} className="cursor-pointer group" onClick={() => handleTagRemove(tag)}>
                      {tag}<X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Badge>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag…"
                    style={{ width: tagInput ? `${tagInput.length + 3}ch` : '8ch' }}
                    className="bg-transparent text-xs text-text-muted placeholder:text-text-faint focus:outline-none focus:text-text-primary transition-all min-w-[5ch] max-w-[30ch]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Notes</label>
                <textarea
                  value={edited.notes || ''}
                  onChange={(e) => setEdited((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Add personal notes..."
                  rows={4}
                  className={cn('w-full rounded-lg bg-bg-elevated border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent focus:shadow-glow resize-none transition-all duration-200')}
                />
              </div>

              <div className="space-y-2 text-xs text-text-muted">
                <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /><span>{domain}</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>Saved {formatDate(bookmark.created_at)}</span></div>
              </div>
            </div>
            </div>

            {/* Footer — always visible, never scrolls */}
            <div className="sticky bottom-0 bg-bg-secondary/90 backdrop-blur-xl border-t border-border px-6 py-4 flex items-center justify-between">
              <Button variant="danger" size="sm" onClick={() => onDelete?.(bookmark)}><Trash2 className="w-4 h-4" />Delete</Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                <Button size="sm" onClick={() => onSave?.(edited)}>Save Changes</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

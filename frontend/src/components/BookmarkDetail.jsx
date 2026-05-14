import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles, Tag, FileText, Globe, Calendar, Trash2, ArrowLeft, FolderOpen, Type, Pencil, ImageIcon, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn, formatDate, extractDomain, getFaviconUrl, resolveOid } from '../lib/utils';
import FolderPicker from './FolderPicker';
import { toast } from 'sonner';

const DEFAULT_IMAGE = '/default_image/image_not_found.png';

function resolveId(collection) {
  return resolveOid(collection.id ?? collection._id);
}

export default function BookmarkDetail({ bookmark, isOpen, onClose, onSave, onDelete, collections = [], onMoveToFolder }) {
  const [edited, setEdited] = useState(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [imgDropdownOpen, setImgDropdownOpen] = useState(false);
  const imgDropdownRef = useRef(null);

  useEffect(() => {
    if (bookmark) {
      setEdited({ ...bookmark });
      setIsEditing(false);
      setImgDropdownOpen(false);
    }
  }, [bookmark]);

  // Close image dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (imgDropdownRef.current && !imgDropdownRef.current.contains(e.target)) {
        setImgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

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

  const hasChanges = () => {
    if (!bookmark || !edited) return false;
    return (
      edited.title !== bookmark.title ||
      edited.notes !== bookmark.notes ||
      JSON.stringify(edited.tags) !== JSON.stringify(bookmark.tags) ||
      JSON.stringify(edited.duplicate_links) !== JSON.stringify(bookmark.duplicate_links) ||
      Boolean(edited.use_default_image) !== Boolean(bookmark.use_default_image)
    );
  };

  const handleSave = () => {
    if (!hasChanges()) {
      toast.info('No changes made');
      return;
    }
    onSave?.(edited);
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-full max-w-[480px] bg-bg-secondary border-l border-border shadow-ambient flex flex-col"
          >
            {/* Header — always visible, never scrolls */}
            <div className="shrink-0 bg-bg-secondary border-b border-border px-4 py-3 flex items-center">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={onClose}
                  className="shrink-0 h-8 px-3 rounded-md flex items-center gap-1.5 bg-bg-elevated border border-border text-text-primary text-xs font-medium hover:bg-bg-secondary transition-colors"
                  aria-label="Back to bookmarks"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  
                </button>
                {faviconUrl && <img src={faviconUrl} alt="" className="w-5 h-5 rounded-sm shrink-0" />}
                <h2 className="text-sm font-semibold text-text-primary truncate">{bookmark.title || 'Detail'}</h2>
              </div>
              {/* <button onClick={onClose} className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-bg-elevated border border-border text-text-primary hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors">
                <X className="w-4 h-4" />
              </button> */}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Image with preference selector */}
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={edited.use_default_image ? DEFAULT_IMAGE : (bookmark.og_image || DEFAULT_IMAGE)}
                  alt=""
                  className="w-full aspect-video object-cover"
                />
                {/* Image source dropdown — top-right corner, always visible */}
                <div ref={imgDropdownRef} className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    onClick={() => setImgDropdownOpen((v) => !v)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium hover:bg-black/75 transition-colors"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{edited.use_default_image ? 'Default' : 'Current'}</span>
                    <ChevronDown className={cn('w-3 h-3 transition-transform', imgDropdownOpen && 'rotate-180')} />
                  </button>

                    {imgDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-bg-elevated border border-border shadow-ambient overflow-hidden">
                        <button
                          type="button"
                          onClick={() => { setEdited((p) => ({ ...p, use_default_image: false })); setImgDropdownOpen(false); }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors',
                            !edited.use_default_image
                              ? 'bg-accent/10 text-accent-light'
                              : 'text-text-primary hover:bg-bg-secondary'
                          )}
                        >
                          <span className={cn(
                            'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0',
                            !edited.use_default_image ? 'border-accent' : 'border-border'
                          )}>
                            {!edited.use_default_image && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                          </span>
                          Current Image
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEdited((p) => ({ ...p, use_default_image: true })); setImgDropdownOpen(false); }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors',
                            edited.use_default_image
                              ? 'bg-accent/10 text-accent-light'
                              : 'text-text-primary hover:bg-bg-secondary'
                          )}
                        >
                          <span className={cn(
                            'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0',
                            edited.use_default_image ? 'border-accent' : 'border-border'
                          )}>
                            {edited.use_default_image && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                          </span>
                          Default Image
                        </button>
                      </div>
                    )}
                  </div>
              </div>

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
                  readOnly={!isEditing}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none transition-colors",
                    isEditing
                      ? "bg-bg-elevated border-border focus:border-accent"
                      : "bg-transparent border-transparent cursor-default"
                  )}
                />
              </div>

              {/* Folder assignment */}
              <div className="space-y-1.5 relative">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />Folder
                </label>
                <button
                  type="button"
                  onClick={() => isEditing && setShowFolderPicker((v) => !v)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 w-full text-left',
                    isEditing
                      ? 'bg-bg-elevated border-border hover:border-accent/40 text-text-secondary hover:text-text-primary cursor-pointer'
                      : 'bg-transparent border-transparent text-text-secondary cursor-default'
                  )}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 text-text-faint" />
                  <span className="flex-1 truncate">{currentCollection ? currentCollection.name : 'No folder'}</span>
                  <X
                    className={cn('w-3.5 h-3.5 shrink-0 text-text-faint hover:text-danger transition-colors', (!resolveOid(bookmark.collection_id) || !isEditing) && 'hidden')}
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
                          readOnly={!isEditing}
                          onChange={(e) => {
                            const newLinks = [...edited.duplicate_links];
                            newLinks[idx] = e.target.value;
                            setEdited(p => ({ ...p, duplicate_links: newLinks }));
                          }}
                          className={cn(
                            "flex-1 text-xs text-orange-400 border-b focus:outline-none transition-colors",
                            isEditing
                              ? "bg-transparent focus:text-orange-400 border-transparent focus:border-orange-500/30"
                              : "bg-transparent border-transparent cursor-default"
                          )}
                        />
                        {isEditing && (
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
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {edited.tags?.map((tag) => (
                    <Badge key={tag} className="flex items-center gap-1">
                      {tag}
                      {isEditing && (
                        <button type="button" onClick={() => handleTagRemove(tag)} className="ml-0.5 rounded-full hover:bg-danger/20 p-0.5 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {isEditing && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (tagInput.trim()) {
                          const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
                          if (!edited.tags?.includes(newTag)) {
                            setEdited((p) => ({ ...p, tags: [...(p.tags || []), newTag] }));
                          }
                          setTagInput('');
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Add tag…"
                        style={{ width: tagInput ? `${tagInput.length + 3}ch` : '8ch' }}
                        className="bg-transparent text-xs text-text-muted placeholder:text-text-faint focus:outline-none focus:text-text-primary transition-all min-w-[5ch] max-w-[30ch]"
                      />
                      {tagInput.trim() && (
                        <button type="submit" className="shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center hover:bg-accent/30 transition-colors">
                          <span className="text-xs font-bold leading-none">+</span>
                        </button>
                      )}
                    </form>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Notes</label>
                <textarea
                  value={edited.notes || ''}
                  onChange={(e) => setEdited((p) => ({ ...p, notes: e.target.value }))}
                  placeholder={isEditing ? "Add personal notes..." : "No notes"}
                  rows={4}
                  readOnly={!isEditing}
                  className={cn(
                    'w-full rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-faint focus:outline-none resize-none transition-all duration-200',
                    isEditing
                      ? 'bg-bg-elevated border border-border focus:border-accent focus:shadow-glow'
                      : 'bg-transparent border border-transparent cursor-default'
                  )}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      // Cancel editing, reset changes
                      setEdited({ ...bookmark });
                      setTagInput('');
                    }
                    setIsEditing((v) => !v);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  {isEditing ? 'Editing' : 'Edit'}
                </Button>
                <Button size="sm" onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Edit3, Star, Trash2, Globe, FolderInput } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn, formatRelativeTime, extractDomain, truncate, getFaviconUrl, resolveOid } from '../lib/utils';
import { MagicCard } from './magicui/MagicCard';
import FolderPicker from './FolderPicker';

const BookmarkCard = forwardRef(function BookmarkCard(
  { bookmark, onEdit, onDelete, onToggleFavorite, onOpen, collections = [], onMoveToFolder },
  ref
) {
  const [isHovered, setIsHovered] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const domain = bookmark.domain || extractDomain(bookmark.url);
  const faviconUrl = getFaviconUrl(domain);
  const maxVisibleTags = 3;
  const visibleTags = bookmark.tags?.slice(0, maxVisibleTags) || [];
  const extraTagCount = (bookmark.tags?.length || 0) - maxVisibleTags;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-lg overflow-hidden h-full"
    >
      <MagicCard
        className={cn(
          'flex-col cursor-pointer transition-all duration-300 hover:shadow-card-hover'
        )}
      >
        <div
          className="flex flex-col h-full w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onOpen?.(bookmark)}
        >
          {/* OG Image */}
          {bookmark.og_image && (
            <div className="relative w-full aspect-video overflow-hidden bg-bg-secondary">
              <img
                src={bookmark.og_image}
                alt=""
                loading="lazy"
                className={cn(
                  'w-full h-full object-cover transition-all duration-500',
                  isHovered ? 'scale-105 saturate-100' : 'saturate-[0.8]'
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated/80 to-transparent" />
            </div>
          )}

          <div className="p-4 space-y-3 flex-1 flex flex-col">
            {/* Header: Favicon + Domain + Time */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="" className="w-4 h-4 rounded-sm" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                <span className="truncate max-w-[120px]">{domain}</span>
              </div>
              <span className="text-text-faint shrink-0">
                {formatRelativeTime(bookmark.created_at)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-accent-light transition-colors">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (bookmark.url) window.open(bookmark.url, '_blank');
                }}
                className="hover:underline"
              >
                {bookmark.title || 'Untitled'}
              </span>
            </h3>

            {/* AI Summary */}
            {bookmark.ai_summary && (
              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed flex-1">
                {bookmark.ai_summary}
              </p>
            )}

            {/* Tags */}
            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {visibleTags.map((tag) => (
                  <Badge key={tag} variant="default" className="text-[10px] px-2 py-0.5">
                    {tag}
                  </Badge>
                ))}
                {extraTagCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    +{extraTagCount}
                  </Badge>
                )}
              </div>
            )}

            {/* Processing status */}
            {bookmark.status === 'processing' && (
              <div className="flex items-center gap-2 text-xs text-accent mt-auto">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Processing...
              </div>
            )}
          </div>

          {/* Hover Action Bar */}
          <motion.div
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 right-3 flex items-center gap-1 pointer-events-none"
            style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
          >
            {[
              { icon: ExternalLink, action: () => bookmark.url && window.open(bookmark.url, '_blank'), title: 'Open' },
              { icon: Edit3, action: () => onEdit?.(bookmark), title: 'Edit' },
              { icon: Star, action: () => onToggleFavorite?.(bookmark), title: 'Favorite', active: bookmark.is_favorite },
              { icon: Trash2, action: () => onDelete?.(bookmark), title: 'Delete', danger: true },
            ].map(({ icon: Icon, action, title, active, danger }) => (
              <button
                key={title}
                onClick={(e) => {
                  e.stopPropagation();
                  action();
                }}
                title={title}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center',
                  'bg-bg-secondary/90 backdrop-blur-sm border border-border',
                  'transition-all duration-200',
                  danger
                    ? 'hover:bg-danger/10 hover:text-danger hover:border-danger/30'
                    : active
                      ? 'text-warning bg-warning/10 border-warning/30'
                      : 'text-text-muted hover:text-accent-light hover:border-accent/30'
                )}
              >
                <Icon className="w-3.5 h-3.5" fill={active ? 'currentColor' : 'none'} />
              </button>
            ))}

            {/* Move-to-folder button */}
            {onMoveToFolder && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFolderPicker((v) => !v);
                  }}
                  title="Move to folder"
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center',
                    'bg-bg-secondary/90 backdrop-blur-sm border border-border',
                    'transition-all duration-200 text-text-muted hover:text-accent-light hover:border-accent/30'
                  )}
                >
                  <FolderInput className="w-3.5 h-3.5" />
                </button>
                {showFolderPicker && (
                  <FolderPicker
                    collections={collections}
                    currentCollectionId={resolveOid(bookmark.collection_id)}
                    onSelect={(colId) => onMoveToFolder(bookmark, colId)}
                    onClose={() => setShowFolderPicker(false)}
                    className="right-0 top-9"
                  />
                )}
              </div>
            )}
          </motion.div>

          {/* Favorite indicator */}
          {bookmark.is_favorite && (
            <div className="absolute top-3 left-3">
              <Star className="w-4 h-4 text-warning fill-warning" />
            </div>
          )}
        </div>
      </MagicCard>
    </motion.div>
  );
});

BookmarkCard.displayName = 'BookmarkCard';

export default BookmarkCard;

import { useState, useCallback, useEffect, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import SearchSettingsPanel from '../components/SearchSettingsPanel';
import BookmarkGrid from '../components/BookmarkGrid';
import BookmarkDetail from '../components/BookmarkDetail';
import TagFilter from '../components/TagFilter';
import FolderSection from '../components/FolderSection';
import PaginationDock from '../components/PaginationDock';
import { useBookmarks, useTags, useUpdateBookmark, useDeleteBookmark } from '../hooks/useBookmarks';
import { useCollections, useMoveBookmarkToCollection } from '../hooks/useCollections';
import { useSearch } from '../hooks/useSearch';
import { toast } from 'sonner';
import { AnimatedGridPattern } from '../components/magicui/AnimatedGridPattern';
import { ITEMS_PER_PAGE } from '../lib/constants';

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchLimit, setSearchLimit] = useState(50);
  const [minScore, setMinScore] = useState(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);

  const { search, query, results, resultCount, isSearching } = useSearch({
    limit: searchLimit,
    minScore,
    collectionId: selectedCollectionId,
  });
  const { data: tagsData } = useTags();
  const { data: collectionsData } = useCollections();
  const tags = tagsData || [];
  const collections = collectionsData || [];

  const isFavoriteFilter = activeFilter === 'favorite';
  const typeFilter = activeFilter !== 'all' && activeFilter !== 'favorite' ? activeFilter : undefined;

  const { data: bookmarksData, isLoading } = useBookmarks({
    type: typeFilter,
    tags: selectedTags,
    favorite: isFavoriteFilter || undefined,
    collectionId: selectedCollectionId || undefined,
    includeAll: true,
  });

  const updateBookmark = useUpdateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const moveToCollection = useMoveBookmarkToCollection();

  const displayBookmarks = query
    ? results.map((r) => r.bookmark || r)
    : bookmarksData?.bookmarks || [];

  const totalPages = Math.max(1, Math.ceil(displayBookmarks.length / ITEMS_PER_PAGE));

  const paginatedBookmarks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return displayBookmarks.slice(start, end);
  }, [displayBookmarks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    activeFilter,
    selectedTags,
    isFavoriteFilter,
    typeFilter,
    selectedCollectionId,
    searchLimit,
    minScore,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenDetail = useCallback((bookmark) => {
    setSelectedBookmark(bookmark);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedBookmark(null), 300);
  }, []);

  const handleSave = useCallback(async (edited) => {
    try {
      const id = edited.id || (typeof edited._id === 'object' ? edited._id.$oid : edited._id);
      const payload = {
        id,
        title: edited.title,
        notes: edited.notes,
        tags: edited.tags,
        duplicate_links: edited.duplicate_links,
        is_favorite: edited.is_favorite,
      };
      await updateBookmark.mutateAsync(payload);
      toast.success('Bookmark updated');
      handleCloseDetail();
    } catch {
      toast.error('Failed to update bookmark');
    }
  }, [updateBookmark, handleCloseDetail]);

  const handleDelete = useCallback(async (bookmark) => {
    try {
      const id = bookmark.id || (typeof bookmark._id === 'object' ? bookmark._id.$oid : bookmark._id);
      await deleteBookmark.mutateAsync(id);
      toast.success('Bookmark deleted');
      handleCloseDetail();
    } catch {
      toast.error('Failed to delete bookmark');
    }
  }, [deleteBookmark, handleCloseDetail]);

  const handleToggleFavorite = useCallback(async (bookmark) => {
    try {
      const id = bookmark.id || (typeof bookmark._id === 'object' ? bookmark._id.$oid : bookmark._id);
      await updateBookmark.mutateAsync({
        id,
        is_favorite: !bookmark.is_favorite,
      });
      toast.success(bookmark.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch {
      toast.error('Failed to update');
    }
  }, [updateBookmark]);

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleMoveToFolder = useCallback(async (bookmark, collectionId) => {
    try {
      const id = bookmark.id || (typeof bookmark._id === 'object' ? bookmark._id.$oid : bookmark._id);
      await moveToCollection.mutateAsync({ bookmarkId: id, collectionId });
      toast.success(collectionId ? 'Moved to folder' : 'Removed from folder');
      // Patch the open detail panel immediately so it reflects the new folder
      setSelectedBookmark((prev) => {
        if (!prev) return prev;
        const prevId = prev.id || (typeof prev._id === 'object' ? prev._id.$oid : prev._id);
        return prevId === id ? { ...prev, collection_id: collectionId ?? null } : prev;
      });
    } catch {
      toast.error('Failed to move bookmark');
    }
  }, [moveToCollection]);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      <AnimatedGridPattern className="absolute inset-0 opacity-40 z-0 pointer-events-none" />
      <div className="flex flex-col flex-1 h-full w-full max-w-container mx-auto px-gutter relative z-10 min-h-0">
        {/* Search */}
        <div className="shrink-0 pt-8 pb-6 bg-bg/70 backdrop-blur-xl -mx-gutter px-gutter z-20">
          <SearchBar onSearch={search} resultCount={query ? resultCount : undefined} query={query} />
        </div>

        <div className="flex flex-1 gap-8 min-h-0 pb-6">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-full overflow-y-auto no-scrollbar bg-bg-primary/50 backdrop-blur-md rounded-xl p-4">
            <TagFilter
              tags={tags}
              selectedTags={selectedTags}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onTagToggle={handleTagToggle}
              settingsNode={(
                <div className="flex flex-col gap-4">
                  <SearchSettingsPanel
                    searchLimit={searchLimit}
                    minScore={minScore}
                    selectedCollectionId={selectedCollectionId}
                    collections={collections}
                    onSearchLimitChange={setSearchLimit}
                    onMinScoreChange={setMinScore}
                    onCollectionChange={setSelectedCollectionId}
                  />
                  <FolderSection
                    selectedCollectionId={selectedCollectionId}
                    onCollectionChange={setSelectedCollectionId}
                  />
                </div>
              )}
            />
          </aside>

          {/* Main Grid container */}
          <main className="flex-1 flex flex-col min-w-0 h-full">
            {/* Mobile Filter Pills */}
            <div className="lg:hidden shrink-0 mb-6 bg-bg/70 backdrop-blur-xl -mx-gutter px-gutter py-2 z-20">
              <TagFilter
                tags={tags}
                selectedTags={selectedTags}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onTagToggle={handleTagToggle}
                settingsNode={(
                  <div className="flex flex-col gap-4">
                    <SearchSettingsPanel
                      searchLimit={searchLimit}
                      minScore={minScore}
                      selectedCollectionId={selectedCollectionId}
                      collections={collections}
                      onSearchLimitChange={setSearchLimit}
                      onMinScoreChange={setMinScore}
                      onCollectionChange={setSelectedCollectionId}
                    />
                    <FolderSection
                      selectedCollectionId={selectedCollectionId}
                      onCollectionChange={setSelectedCollectionId}
                    />
                  </div>
                )}
              />
            </div>

            {/* Folder context label */}
            {selectedCollectionId && (() => {
              const folder = collections.find((c) => {
                const id = c.id || (typeof c._id === 'object' ? c._id?.$oid : c._id) || '';
                return id === selectedCollectionId;
              });
              return folder ? (
                <div className="shrink-0 flex items-center gap-2 text-xs text-text-muted mb-3">
                  <span className="text-text-faint">Folder:</span>
                  <span className="text-accent-light font-medium">{folder.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCollectionId(null)}
                    className="ml-1 text-text-faint hover:text-text-muted transition-colors"
                    title="Clear folder filter"
                  >
                    ✕
                  </button>
                </div>
              ) : null;
            })()}

            {/* Scrollable grid area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-24">
              <BookmarkGrid
                bookmarks={paginatedBookmarks}
                isLoading={isLoading || isSearching}
                onEdit={handleOpenDetail}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onOpen={handleOpenDetail}
                collections={collections}
                onMoveToFolder={handleMoveToFolder}
              />
            </div>
          </main>
        </div>

        <PaginationDock
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Detail Sheet */}
        <BookmarkDetail
          bookmark={selectedBookmark}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          onSave={handleSave}
          onDelete={handleDelete}
          collections={collections}
          onMoveToFolder={handleMoveToFolder}
        />
      </div>
    </div>
  );
}

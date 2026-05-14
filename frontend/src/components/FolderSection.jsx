import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, FolderOpen, FolderPlus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  useCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
} from '../hooks/useCollections';

function resolveId(collection) {
  return (
    collection.id ||
    (typeof collection._id === 'object' ? collection._id?.$oid : collection._id) ||
    ''
  );
}

export default function FolderSection({ selectedCollectionId, onCollectionChange }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const newInputRef = useRef(null);

  const { data: collections = [] } = useCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await createCollection.mutateAsync({ name });
    setNewName('');
    setIsCreating(false);
  };

  const handleRename = async (id) => {
    const name = editingName.trim();
    if (!name) return;
    await updateCollection.mutateAsync({ id, name });
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id) => {
    if (selectedCollectionId === id) onCollectionChange?.(null);
    await deleteCollection.mutateAsync(id);
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Header row identical in style to Tags */}
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors w-full"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Folders
        <span className="text-text-faint ml-auto">{collections.length}</span>
      </button>

      {!isCollapsed && (
        <div className="space-y-0.5">
          {/* All bookmarks row */}
          <button
            type="button"
            onClick={() => onCollectionChange?.(null)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200',
              !selectedCollectionId
                ? 'bg-accent/10 text-accent-light'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            )}
          >
            <FolderOpen className="w-3 h-3 shrink-0" />
            <span className="truncate flex-1 text-left">All</span>
          </button>

          {/* Folder rows */}
          {collections.map((collection) => {
            const id = resolveId(collection);
            const isActive = selectedCollectionId === id;
            const isEditing = editingId === id;

            return (
              <div
                key={id}
                className={cn(
                  'group/folder flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent-light'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                )}
              >
                <FolderOpen className="w-3 h-3 shrink-0" />

                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none border-b border-accent/40 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(id)}
                      className="shrink-0 text-accent-light hover:text-accent"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="shrink-0 text-text-faint hover:text-text-muted"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onCollectionChange?.(isActive ? null : id)}
                      className="truncate flex-1 text-left"
                    >
                      {collection.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(id);
                        setEditingName(collection.name);
                      }}
                      className="shrink-0 opacity-0 group-hover/folder:opacity-100 text-text-faint hover:text-text-muted transition-opacity"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(id)}
                      className="shrink-0 opacity-0 group-hover/folder:opacity-100 text-text-faint hover:text-danger transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {/* New folder inline input */}
          {isCreating ? (
            <div className="flex items-center gap-1 px-3 py-1.5">
              <FolderPlus className="w-3 h-3 shrink-0 text-accent/70" />
              <input
                ref={newInputRef}
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewName('');
                  }
                }}
                placeholder="Folder name..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-faint focus:outline-none border-b border-accent/40 min-w-0"
              />
              <button type="button" onClick={handleCreate} className="shrink-0 text-accent-light hover:text-accent">
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
                className="shrink-0 text-text-faint hover:text-text-muted"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-text-faint hover:text-accent-light hover:bg-bg-elevated transition-all"
            >
              <FolderPlus className="w-3 h-3" />
              New folder
            </button>
          )}
        </div>
      )}
    </div>
  );
}

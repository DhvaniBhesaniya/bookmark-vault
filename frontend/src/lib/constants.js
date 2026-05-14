export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const BOOKMARK_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'link', label: 'Links' },
  { value: 'note', label: 'Notes' },
  { value: 'image', label: 'Images' },
];

export const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'link', label: 'Links' },
  { value: 'image', label: 'Images' },
  { value: 'favorite', label: 'Favorites' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title A-Z' },
];

export const ITEMS_PER_PAGE = 15;

export const IMPORT_POLL_INTERVAL = 2000; // 2 seconds

export const SEARCH_DEBOUNCE_MS = 300;

export const ACCENT_COLORS = [
  { name: 'Purple', value: 'purple', color: '#7c6af7', description: 'Classic & bold' },
  { name: 'Ocean Teal', value: 'teal', color: '#2dd4bf', description: 'Calm & modern' },
  { name: 'Warm Amber', value: 'amber', color: '#f59e0b', description: 'Cozy & warm' },
  { name: 'Rose Pink', value: 'rose', color: '#fb7185', description: 'Elegant & trendy' },
  { name: 'Emerald', value: 'emerald', color: '#34d399', description: 'Fresh & natural' },
  { name: 'Electric Blue', value: 'blue', color: '#60a5fa', description: 'Clean & trustworthy' },
];

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Palette, Download, Upload, Eye, EyeOff, Check, Loader2, Sun, Moon, Monitor, Wand2, Search, X, Info, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ACCENT_COLORS } from '../lib/constants';
import useAuthStore from '../store/useAuthStore';
import { useTheme } from '../components/ThemeProvider';
import { Dock, DockIcon } from '../components/magicui/Dock';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn, resolveOid } from '../lib/utils';
import api from '../lib/api';
import { toast } from 'sonner';

const sections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'import-export', label: 'Import/Export', icon: Download },
  { id: 'data-quality', label: 'Data Quality', icon: Wand2 },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => searchParams.get('section') || 'account');
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessingAll, setReprocessingAll] = useState(false);
  const [reprocessingSelected, setReprocessingSelected] = useState(false);
  const [dataQualityMode, setDataQualityMode] = useState('all');
  const [bookmarkSearch, setBookmarkSearch] = useState('');
  const [selectedBookmarkId, setSelectedBookmarkId] = useState('');
  const [bookmarksForSelect, setBookmarksForSelect] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const dropdownRef = useRef(null);
  const infoRef = useRef(null);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingHtml, setExportingHtml] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);


  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);


  const { user } = useAuthStore();
  const { theme, setTheme, accent, setAccent } = useTheme();


  const handleReprocessWeak = async () => {
    setReprocessing(true);
    try {
      const { data } = await api.post('/bookmarks/reprocess-weak');
      toast.success(`Dispatched ${data.dispatched} bookmark(s) for reprocessing`);
    } catch {
      toast.error('Failed to start reprocessing');
    } finally {
      setReprocessing(false);
    }
  };

  const loadBookmarksForSelection = async () => {
    setLoadingBookmarks(true);
    try {
      const { data } = await api.get('/bookmarks?all=true');
      const normalized = (data?.bookmarks || [])
        .map((b) => {
          const id = resolveOid(b.id ?? b._id);
          const title = (b.title || '').trim();
          const url = (b.url || '').trim();
          const label = title || url || 'Untitled bookmark';
          const searchText = `${label} ${url}`.toLowerCase();
          return { id, title, url, label, searchText };
        })
        .filter((b) => !!b.id);

      setBookmarksForSelect(normalized);

      // Keep selected value only if it still exists in refreshed list.
      if (selectedBookmarkId && !normalized.some((b) => b.id === selectedBookmarkId)) {
        setSelectedBookmarkId('');
      }
    } catch {
      toast.error('Failed to load bookmarks for selection');
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const handleReprocessAll = async () => {
    setReprocessingAll(true);
    try {
      const { data } = await api.post('/bookmarks/reprocess-all');
      toast.success(`Dispatched ${data.dispatched} bookmark(s) for full reprocess`);
    } catch {
      toast.error('Failed to start full reprocess');
    } finally {
      setReprocessingAll(false);
    }
  };

  const handleReprocessSelected = async () => {
    if (!selectedBookmarkId) {
      toast.error('Please select a bookmark first');
      return;
    }

    setReprocessingSelected(true);
    try {
      await api.post(`/bookmarks/${selectedBookmarkId}/reprocess`);
      toast.success('Selected bookmark sent for AI reprocessing');
      setSelectedBookmarkId('');
      setBookmarkSearch('');
    } catch {
      toast.error('Failed to reprocess selected bookmark');
    } finally {
      setReprocessingSelected(false);
    }
  };

  const handleChangePassword = async () => {
    const current = currentPassword.trim();
    const next = newPassword.trim();

    if (!current || !next) {
      toast.error('Please fill current and new password');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: current,
        new_password: next,
      });

      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getAllBookmarks = async () => {
    const { data } = await api.get('/bookmarks?all=true');
    return data?.bookmarks || [];
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    try {
      const bookmarks = await getAllBookmarks();
      const payload = {
        exported_at: new Date().toISOString(),
        total: bookmarks.length,
        bookmarks,
      };

      const fileName = `bookmarkvault-export-${new Date().toISOString().slice(0, 10)}.json`;
      downloadFile(JSON.stringify(payload, null, 2), fileName, 'application/json');
      toast.success(`Exported ${bookmarks.length} bookmark(s) as JSON`);
    } catch {
      toast.error('Failed to export JSON');
    } finally {
      setExportingJson(false);
    }
  };

  const handleExportHtml = async () => {
    setExportingHtml(true);
    try {
      const bookmarks = await getAllBookmarks();
      const links = bookmarks.filter((b) => !!b.url);

      const escapeHtml = (str = '') => str
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

      const items = links
        .map((b) => {
          const title = escapeHtml(b.title || b.url);
          const url = escapeHtml(b.url);
          const addDate = b.created_at ? Math.floor(new Date(b.created_at).getTime() / 1000) : Math.floor(Date.now() / 1000);
          return `    <DT><A HREF="${url}" ADD_DATE="${addDate}">${title}</A>`;
        })
        .join('\n');

      const html = [
        '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
        '<!-- This is an automatically generated file.',
        '     It will be read and overwritten.',
        '     DO NOT EDIT! -->',
        '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
        '<TITLE>Bookmarks</TITLE>',
        '<H1>Bookmarks</H1>',
        '<DL><p>',
        '  <DT><H3>Bookmarkvault Export</H3>',
        '  <DL><p>',
        items,
        '  </DL><p>',
        '</DL><p>',
      ].join('\n');

      const fileName = `bookmarkvault-export-${new Date().toISOString().slice(0, 10)}.html`;
      downloadFile(html, fileName, 'text/html;charset=utf-8');
      toast.success(`Exported ${links.length} bookmark(s) as HTML`);
    } catch {
      toast.error('Failed to export HTML');
    } finally {
      setExportingHtml(false);
    }
  };


  // Sync with URL search params when navigating from sidebar dropdown
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && sections.some((s) => s.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Fetch bookmarks once when data-quality section is first opened
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (activeSection === 'data-quality' && !hasFetchedRef.current && !loadingBookmarks) {
      hasFetchedRef.current = true;
      loadBookmarksForSelection();
    }
  }, [activeSection]);

  // Close dropdown / info tooltip on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        setInfoOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const filteredBookmarks = bookmarksForSelect.filter((b) => {
    const q = bookmarkSearch.toLowerCase().trim();
    if (!q) return true;
    return b.searchText.includes(q);
  });

  const selectedBookmark = bookmarksForSelect.find((b) => b.id === selectedBookmarkId) || null;

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">

        <div className="flex h-full">
          {/* Sidebar Nav — fixed left column */}
          <nav className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-border px-4 py-8">
            <h1 className="font-display text-headline-md text-text-primary mb-6 px-3">Settings</h1>
            <div className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all',
                    activeSection === s.id
                      ? 'bg-accent/10 text-accent-light font-medium'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  )}
                >
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content — fills remaining space */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* Main content area */}
            <div className="flex-1 min-w-0 px-gutter py-8 overflow-y-auto no-scrollbar pb-24 md:pb-8">
              <h1 className="md:hidden font-display text-headline-md text-text-primary mb-6">Settings</h1>

            <div className="max-w-2xl space-y-8">
              {activeSection === 'account' && (
                <div className="rounded-xl bg-bg-elevated border border-border p-6 sm:p-8 space-y-6">
                  <h2 className="text-title-sm text-text-primary">Account</h2>
                  <div className="space-y-5 max-w-lg">
                    <div>
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</label>
                      <p className="text-sm text-text-primary mt-1">{user?.email || 'Not signed in'}</p>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-2">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Change Password</label>

                      <input type="text" autoComplete="username" value={user?.email || ''} readOnly hidden aria-hidden="true" tabIndex={-1} />
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="Current password"
                            className="w-full pr-10"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                            aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="New password"
                            className="w-full pr-10"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        className="mt-2"
                        disabled={changingPassword}
                      >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>

                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="rounded-xl bg-bg-elevated border border-border p-6 sm:p-8 space-y-6">
                  <h2 className="text-title-sm text-text-primary">Appearance</h2>
                  <div className="space-y-6">
                    {/* Mode Toggle */}
                    <div>
                      <p className="text-sm text-text-primary font-medium mb-3">Mode</p>
                      <div className="flex gap-2">
                        {[
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'system', label: 'System', icon: Monitor },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => setTheme(mode.value)}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                              theme === mode.value
                                ? 'bg-accent/10 text-accent-light border-border-accent shadow-glow'
                                : 'bg-bg-elevated-high text-text-muted border-border hover:border-border-hover hover:text-text-primary'
                            )}
                          >
                            <mode.icon className="w-4 h-4" />
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <p className="text-sm text-text-primary font-medium mb-3">Accent Color</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ACCENT_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setAccent(c.value)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-3 rounded-lg border transition-all duration-200',
                              accent === c.value
                                ? 'border-border-accent bg-accent/5 shadow-glow'
                                : 'border-border hover:border-border-hover bg-bg-elevated-high'
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-full shrink-0 relative flex items-center justify-center"
                              style={{ backgroundColor: c.color }}
                            >
                              {accent === c.value && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-text-primary">{c.name}</p>
                              <p className="text-xs text-text-muted">{c.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'import-export' && (
                <div className="rounded-xl bg-bg-elevated border border-border p-6 sm:p-8 space-y-6">
                  <h2 className="text-title-sm text-text-primary">Import / Export</h2>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="ghost" onClick={() => navigate('/import')}>
                      <Upload className="w-4 h-4" />Import Bookmarks
                    </Button>
                    <Button variant="ghost" onClick={handleExportJson} disabled={exportingJson || exportingHtml}>
                      {exportingJson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Export as JSON
                    </Button>
                    <Button variant="ghost" onClick={handleExportHtml} disabled={exportingJson || exportingHtml}>
                      {exportingHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Export as HTML
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === 'data-quality' && (
                <div className="rounded-xl bg-bg-elevated border border-border p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-title-sm text-text-primary">Data Quality</h2>
                    <button
                      type="button"
                      onClick={loadBookmarksForSelection}
                      disabled={loadingBookmarks}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-muted hover:text-accent hover:bg-accent/10 transition-all disabled:opacity-50"
                      title="Refresh bookmarks list"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', loadingBookmarks && 'animate-spin')} />
                      <span>Refresh if no bookmark found</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-bg-secondary p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Wand2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-text-primary">Reprocess Weak Titles</p>
                          <div ref={infoRef} className="relative">
                            <button
                              type="button"
                              onClick={() => setInfoOpen((v) => !v)}
                              onMouseEnter={() => setInfoOpen(true)}
                              onMouseLeave={() => setInfoOpen(false)}
                              className="shrink-0 rounded-full p-0.5 text-accent hover:text-accent-light transition-colors focus:outline-none"
                              aria-label="More info"
                            >
                              <Info className="w-3.5 h-3.5 drop-shadow-[0_0_4px_var(--color-accent)]" />
                            </button>
                            {infoOpen && (
                              <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 z-30 w-[min(280px,calc(100vw-2rem))] rounded-xl bg-bg-elevated border border-border shadow-ambient p-3 text-xs text-text-muted leading-relaxed">
                                Finds bookmarks with missing, generic, or low-quality titles
                                (e.g. &quot;Home&quot;, &quot;404&quot;, or stuck in &quot;Processing...&quot;)
                                and reruns metadata fetch + AI enrichment on them.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDataQualityMode('all')}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                            dataQualityMode === 'all'
                              ? 'bg-accent/10 text-accent-light border-border-accent'
                              : 'bg-bg-elevated text-text-muted border-border hover:text-text-primary'
                          )}
                        >
                          Run Process All
                        </button>
                        <button
                          type="button"
                          onClick={() => setDataQualityMode('selected')}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                            dataQualityMode === 'selected'
                              ? 'bg-accent/10 text-accent-light border-border-accent'
                              : 'bg-bg-elevated text-text-muted border-border hover:text-text-primary'
                          )}
                        >
                          Run Selected
                        </button>
                      </div>

                      {dataQualityMode === 'all' ? (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            onClick={handleReprocessAll}
                            disabled={reprocessingAll || reprocessing || reprocessingSelected}
                          >
                            {reprocessingAll ? (
                              <><Loader2 className="w-4 h-4 animate-spin" />Running All...</>
                            ) : (
                              <><Wand2 className="w-4 h-4" />Run Process All</>
                            )}
                          </Button>
                          <p className="text-[11px] text-text-faint">This dispatches every bookmark for AI reprocessing.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Searchable bookmark picker */}
                          <div ref={dropdownRef} className="relative">
                            <div
                              className={cn(
                                'flex items-center gap-2 w-full rounded-xl bg-bg-elevated border px-3 py-2.5 text-sm transition-colors cursor-text',
                                dropdownOpen ? 'border-accent shadow-glow' : 'border-border'
                              )}
                              onClick={() => setDropdownOpen(true)}
                            >
                              <Search className="w-4 h-4 text-text-faint shrink-0" />
                              <input
                                type="text"
                                placeholder={selectedBookmark ? selectedBookmark.label : 'Search bookmarks by title or URL...'}
                                value={bookmarkSearch}
                                onChange={(e) => {
                                  setBookmarkSearch(e.target.value);
                                  setDropdownOpen(true);
                                }}
                                onFocus={() => setDropdownOpen(true)}
                                className="flex-1 bg-transparent text-text-primary placeholder:text-text-faint focus:outline-none text-sm min-w-0"
                              />
                              {(bookmarkSearch || selectedBookmarkId) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBookmarkSearch('');
                                    setSelectedBookmarkId('');
                                  }}
                                  className="shrink-0 text-text-faint hover:text-text-primary transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Dropdown list */}
                            {dropdownOpen && (
                              <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl bg-bg-elevated border border-border shadow-ambient overflow-hidden">
                                {loadingBookmarks ? (
                                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-text-muted">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading bookmarks...
                                  </div>
                                ) : filteredBookmarks.length === 0 ? (
                                  <div className="py-4 flex flex-col items-center gap-2 text-xs text-text-faint">
                                    <span>No bookmarks match your search.</span>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); loadBookmarksForSelection(); }}
                                      disabled={loadingBookmarks}
                                      className="inline-flex items-center gap-1.5 text-accent hover:text-accent-light transition-colors"
                                    >
                                      <RefreshCw className="w-3 h-3" /> Refresh
                                    </button>
                                  </div>
                                ) : (
                                  <ul className="max-h-[220px] overflow-y-auto overscroll-contain">
                                    {filteredBookmarks.map((b) => (
                                      <li key={b.id}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedBookmarkId(b.id);
                                            setBookmarkSearch('');
                                            setDropdownOpen(false);
                                          }}
                                          className={cn(
                                            'w-full text-left px-3 py-2.5 flex flex-col gap-0.5 transition-colors',
                                            selectedBookmarkId === b.id
                                              ? 'bg-accent/10 text-accent-light'
                                              : 'text-text-primary hover:bg-bg-secondary active:bg-bg-secondary'
                                          )}
                                        >
                                          <span className="text-sm font-medium truncate">{b.title || 'Untitled'}</span>
                                          {b.url && <span className="text-[11px] text-text-faint truncate">{b.url}</span>}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>

                          {selectedBookmark && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10 text-xs text-text-muted">
                              <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span className="truncate">Selected: <span className="text-text-primary font-medium">{selectedBookmark.label}</span></span>
                            </div>
                          )}

                          <Button
                            size="sm"
                            onClick={handleReprocessSelected}
                            disabled={!selectedBookmarkId || loadingBookmarks || reprocessingSelected || reprocessingAll || reprocessing}
                          >
                            {reprocessingSelected ? (
                              <><Loader2 className="w-4 h-4 animate-spin" />Reprocessing Selected...</>
                            ) : (
                              <><Wand2 className="w-4 h-4" />Run Selected Reprocess</>
                            )}
                          </Button>
                          <p className="text-[11px] text-text-faint">Only the chosen bookmark will be reprocessed with current data and Gemini.</p>
                        </div>
                      )}

                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleReprocessWeak}
                          disabled={reprocessing || reprocessingAll || reprocessingSelected}
                        >
                          {reprocessing ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Running Weak-only...</>
                          ) : (
                            <><Wand2 className="w-4 h-4" />Run Weak-Only Reprocess</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Mobile Dock — horizontal at the bottom */}
            <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
              <Dock
                orientation="horizontal"
                iconSize={40}
                iconMagnification={56}
                iconDistance={120}
                className="border-border/50 bg-bg-elevated/80 backdrop-blur-xl shadow-ambient"
              >
                {sections.map((s) => (
                  <DockIcon
                    key={s.id}
                    active={activeSection === s.id}
                    onClick={() => setActiveSection(s.id)}
                    aria-label={s.label}
                  >
                    <s.icon className="w-5 h-5" />
                  </DockIcon>
                ))}
              </Dock>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

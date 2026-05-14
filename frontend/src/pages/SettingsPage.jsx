import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Key, Palette, Download, Upload, Eye, EyeOff, Check, Loader2, Sun, Moon, Monitor, Wand2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ACCENT_COLORS } from '../lib/constants';
import useAuthStore from '../store/useAuthStore';
import { useTheme } from '../components/ThemeProvider';
import { Dock, DockIcon } from '../components/magicui/Dock';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { toast } from 'sonner';

const sections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'import-export', label: 'Import/Export', icon: Download },
  { id: 'data-quality', label: 'Data Quality', icon: Wand2 },
];

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => searchParams.get('section') || 'account');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [reprocessing, setReprocessing] = useState(false);
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

  // Sync with URL search params when navigating from sidebar dropdown
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) setActiveSection(section);
  }, [searchParams]);

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
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Change Password</label>
                      <Input type="password" placeholder="Current password" className="w-full" />
                      <Input type="password" placeholder="New password" className="w-full" />
                      <Button size="sm" className="mt-2">Update Password</Button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'api-keys' && (
                <div className="rounded-xl bg-bg-elevated border border-border p-6 sm:p-8 space-y-6">
                  <h2 className="text-title-sm text-text-primary">API Keys</h2>
                  <div className="space-y-2 max-w-lg">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Gemini API Key</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="AIza..."
                          className="w-full"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button variant="ghost" size="default">Test</Button>
                    </div>
                    <p className="text-xs text-text-faint">Get your key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-accent-light hover:underline">Google AI Studio</a></p>
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
                    <Button variant="ghost"><Upload className="w-4 h-4" />Import Bookmarks</Button>
                    <Button variant="ghost"><Download className="w-4 h-4" />Export as JSON</Button>
                    <Button variant="ghost"><Download className="w-4 h-4" />Export as HTML</Button>
                  </div>
                </div>
              )}

              {activeSection === 'data-quality' && (
                <div className="rounded-xl bg-bg-elevated border border-border p-6 sm:p-8 space-y-6">
                  <h2 className="text-title-sm text-text-primary">Data Quality</h2>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-bg-secondary p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Wand2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">Reprocess Weak Titles</p>
                          <p className="text-xs text-text-muted mt-1">
                            Finds bookmarks with missing, generic, or low-quality titles (e.g. "Home", "404",
                            or stuck in "Processing...") and reruns metadata fetch + AI enrichment on them.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleReprocessWeak}
                        disabled={reprocessing}
                      >
                        {reprocessing ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Running...</>
                        ) : (
                          <><Wand2 className="w-4 h-4" />Run Reprocess</>
                        )}
                      </Button>
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

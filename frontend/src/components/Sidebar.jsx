import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Bookmark, Plus, Upload, Settings, X, User, Key, Palette, Download, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { TextReveal } from './magicui/TextReveal';
import { useState } from 'react';

const navLinks = [
  { path: '/', label: 'Vault', icon: Bookmark },
  { path: '/add', label: 'Add Bookmark', icon: Plus },
  { path: '/import', label: 'Import', icon: Upload },
];

const settingsSubPages = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'import-export', label: 'Import/Export', icon: Download },
];

export default function Sidebar({ isOpen, onClose }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsActive = location.pathname === '/settings';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 glass border-r border-border transition-all duration-300 ease-in-out',
          'lg:static lg:h-[calc(100vh-64px)]',
          isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn(
          "flex flex-col h-full w-64 transition-opacity duration-300",
          !isOpen && "opacity-0 pointer-events-none lg:opacity-0"
        )}>
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-6 h-16 lg:hidden border-b border-border">
            <span className="font-display text-xl text-text-primary">Menu</span>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-accent/10 text-accent-light shadow-glow'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  )
                }
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  "group-hover:bg-accent/10"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                {label}
              </NavLink>
            ))}

            {/* Settings with dropdown */}
            <div>
              <button
                onClick={() => {
                  setSettingsOpen(!settingsOpen);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isSettingsActive
                    ? 'bg-accent/10 text-accent-light shadow-glow'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  "group-hover:bg-accent/10"
                )}>
                  <Settings className="w-4 h-4" />
                </div>
                Settings
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 ml-auto transition-transform duration-200",
                  settingsOpen && "rotate-180"
                )} />
              </button>

              {/* Sub-pages dropdown */}
              <div className={cn(
                "overflow-hidden transition-all duration-200",
                settingsOpen ? "max-h-48 mt-1" : "max-h-0"
              )}>
                <div className="pl-6 space-y-0.5">
                  {settingsSubPages.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        navigate(`/settings?section=${id}`);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Footer — Logo */}
          <div className="p-6 border-t border-border">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <Bookmark className="w-4 h-4 text-accent-light" />
              </div>
              <TextReveal text="Bookmarkvault" className="font-display text-lg text-text-primary tracking-tight" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Settings, LogOut, User, Command, Menu, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import useAuthStore from '../store/useAuthStore';
import { useTheme } from './ThemeProvider';
import { AnimatedThemeButton } from './magicui/AnimatedThemeButton';
import { TextReveal } from './magicui/TextReveal';

export default function Navbar({ onCommandPaletteOpen, onMenuToggle }) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 glass glass-border">
      <div className="max-w-container mx-auto px-gutter flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          {/* Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Bookmark className="w-4 h-4 text-accent-light" />
            </div>
            <TextReveal text="Bookmarkvault" className="font-display text-xl text-text-primary tracking-tight" />
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Command Palette Shortcut */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCommandPaletteOpen}
            className="hidden md:flex items-center gap-2 text-text-muted"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="text-xs">⌘K</span>
          </Button>

          {/* Theme Toggle */}
          <AnimatedThemeButton />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center text-white hover:opacity-90 transition-opacity ring-2 ring-transparent focus:ring-accent-light outline-none relative shadow-sm">
                <span className="text-xs font-semibold uppercase">
                  {user?.email ? user.email.charAt(0) : 'U'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl border border-border bg-bg-elevated/95 backdrop-blur-xl shadow-ambient animate-in slide-in-from-top-2 fade-in-0 zoom-in-95">
              <div className="flex items-center gap-3 p-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center text-white shrink-0">
                  <span className="text-sm font-semibold uppercase">
                    {user?.email ? user.email.charAt(0) : 'U'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {user?.email ? user.email.split('@')[0] : 'User'}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {user?.email || 'Not signed in'}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator className="mb-1 bg-border/50" />
              <div className="space-y-1">
                <DropdownMenuItem className="rounded-lg cursor-pointer px-2 py-2 text-sm text-text-primary hover:bg-accent/10 hover:text-accent-light focus:bg-accent/10 focus:text-accent-light transition-colors">
                  <User className="w-4 h-4 mr-3 text-text-muted group-hover:text-accent-light" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg cursor-pointer px-2 py-2 text-sm text-text-primary hover:bg-accent/10 hover:text-accent-light focus:bg-accent/10 focus:text-accent-light transition-colors">
                  <CreditCard className="w-4 h-4 mr-3 text-text-muted group-hover:text-accent-light" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-lg cursor-pointer px-2 py-2 text-sm text-text-primary hover:bg-accent/10 hover:text-accent-light focus:bg-accent/10 focus:text-accent-light transition-colors">
                  <Settings className="w-4 h-4 mr-3 text-text-muted group-hover:text-accent-light" />
                  Settings
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="my-1 bg-border/50" />
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer px-2 py-2 text-sm text-danger hover:bg-danger/10 hover:text-danger focus:bg-danger/10 focus:text-danger transition-colors">
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

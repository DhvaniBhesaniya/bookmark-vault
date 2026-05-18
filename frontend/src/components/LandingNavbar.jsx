import { Link } from 'react-router-dom';
import { Bookmark, Github } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './ThemeProvider';
import { AnimatedThemeButton } from './magicui/AnimatedThemeButton';
import { TextReveal } from './magicui/TextReveal';

export default function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-40 glass glass-border">
      <div className="max-w-container mx-auto px-gutter flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Bookmark className="w-4 h-4 text-accent-light" />
            </div>
            <TextReveal text="Bookmarkvault" className="font-display text-xl text-text-primary tracking-tight" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            <a href="#home" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Home</a>
            <a href="#service" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Service</a>
            <a href="#about" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">About Us</a>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <AnimatedThemeButton />

          <a 
            href="https://github.com/DhvaniBhesaniya/bookmark-vault" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex"
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}

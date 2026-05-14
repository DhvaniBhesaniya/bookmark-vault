import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useCreateBookmark } from '../hooks/useBookmarks';
import { toast } from 'sonner';

export default function AddBookmarkPage() {
  const navigate = useNavigate();
  const createBookmark = useCreateBookmark();
  
  const [url, setUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('URL is required');
      return;
    }

    try {
      await createBookmark.mutateAsync({ url: url.trim() });
      toast.success('Bookmark added — AI is working its magic ✨');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add bookmark');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-gutter py-12 h-full overflow-y-auto no-scrollbar">
      <header className="mb-10">
        <h1 className="font-display text-4xl text-text-primary mb-3">Add Bookmark</h1>
        <p className="text-text-muted flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-light" />
          Drop a URL and let AI handle the rest — title, tags, summary, all auto-filled.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <Link2 className="w-4 h-4 text-accent-light" />
            URL
          </label>
          <Input
            required
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-bg-elevated border-border hover:border-border-hover focus:border-accent-container transition-colors h-12 text-base"
          />
          <p className="text-xs text-text-faint">We'll scrape the page and use AI to generate title, description, tags & summary.</p>
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-text-muted hover:text-text-primary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createBookmark.isPending}
            className="bg-accent hover:bg-accent/90 text-white px-8 h-12 text-base font-semibold shadow-glow"
          >
            {createBookmark.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                Add to Vault
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

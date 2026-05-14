import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Chrome, Download, Sparkles } from 'lucide-react';
import ImportDropzone from '../components/ImportDropzone';
import ImportProgress from '../components/ImportProgress';
import { useImport } from '../hooks/useImport';

const steps = [
  { icon: Chrome, title: 'Export from browser', desc: 'Go to Chrome/Firefox → Bookmarks → Export as HTML' },
  { icon: Upload, title: 'Drop file here', desc: 'Drag your exported .html file into the zone above' },
  { icon: Sparkles, title: 'AI processes everything', desc: 'Gemini auto-tags, summarizes & embeds every bookmark' },
];

export default function ImportPage() {
  const navigate = useNavigate();
  const { importFile, isImporting, jobStatus, error } = useImport();

  const handleComplete = () => navigate('/');

  return (
    <div className="max-w-container mx-auto px-gutter py-12 h-full overflow-y-auto no-scrollbar">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-display-lg text-text-primary mb-3">Import Bookmarks</h1>
          <p className="text-text-muted text-base">
            Bring your bookmarks home. AI will do the rest.
          </p>
        </div>

        {/* Dropzone or Progress */}
        <ImportDropzone onFileAccepted={importFile} isProcessing={isImporting || !!jobStatus} />
        <ImportProgress jobStatus={jobStatus} onComplete={handleComplete} />

        {error && (
          <p className="text-sm text-danger text-center bg-danger/10 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Steps */}
        {!isImporting && !jobStatus && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (i + 1) }}
                className="text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center mx-auto">
                  <step.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{step.title}</p>
                  <p className="text-xs text-text-muted mt-1">{step.desc}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center mx-auto">
                  {i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

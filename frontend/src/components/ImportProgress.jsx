import { motion } from 'framer-motion';
import { Progress } from './ui/progress';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

export default function ImportProgress({ jobStatus, onComplete }) {
  if (!jobStatus) return null;

  const { total = 0, processed = 0, status, percent = 0 } = jobStatus;
  const isComplete = status === 'completed' || status === 'done';
  const isFailed = status === 'failed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-bg-elevated p-8 space-y-6"
    >
      {isComplete ? (
        /* Success State */
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-8 h-8 text-success" />
          </motion.div>
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-display text-3xl text-text-primary"
            >
              {total}
            </motion.p>
            <p className="text-sm text-text-muted mt-1">bookmarks imported successfully!</p>
          </div>
          <Button onClick={onComplete} className="mt-4">
            Start Searching
          </Button>
        </div>
      ) : isFailed ? (
        /* Failed State */
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-sm text-danger">Import failed. Please try again.</p>
        </div>
      ) : (
        /* Processing State */
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                Processing {total} bookmarks...
              </p>
              <p className="text-xs text-text-muted">{processed} done</p>
            </div>
            <span className="text-sm font-mono text-accent">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>
      )}
    </motion.div>
  );
}

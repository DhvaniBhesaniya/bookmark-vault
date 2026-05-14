import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ImportDropzone({ onFileAccepted, isProcessing }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted?.(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/html': ['.html', '.htm'] },
    maxFiles: 1,
    disabled: isProcessing,
  });

  if (isProcessing) return null;

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300',
        isDragActive
          ? 'border-accent bg-accent/5 shadow-glow-lg'
          : 'border-border hover:border-border-hover hover:bg-bg-elevated/50'
      )}
    >
      <input {...getInputProps()} id="import-dropzone" />
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
          isDragActive ? 'bg-accent/20 scale-110' : 'bg-bg-elevated-high'
        )}>
          {isDragActive ? (
            <FileText className="w-7 h-7 text-accent" />
          ) : (
            <Upload className="w-7 h-7 text-text-muted" />
          )}
        </div>

        <div>
          <p className="text-base font-semibold text-text-primary mb-1">
            {isDragActive ? 'Drop it!' : 'Drop your bookmark HTML file here'}
          </p>
          <p className="text-sm text-text-muted">
            {isDragActive
              ? 'Release to start importing'
              : 'Chrome or Firefox bookmark export (.html)'}
          </p>
          {!isDragActive && (
            <p className="text-xs text-accent mt-2 hover:underline">
              or browse file
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

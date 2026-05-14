import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import { IMPORT_POLL_INTERVAL } from '../lib/constants';

export function useImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((jobId) => {
    stopPolling();
    let errorCount = 0;
    const MAX_POLL_ERRORS = 5;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/bookmarks/import/status/${jobId}`);
        errorCount = 0; // Reset on success
        setJobStatus(data);
        if (data.status === 'completed' || data.status === 'done' || data.status === 'failed') {
          stopPolling();
          setIsImporting(false);
        }
      } catch (err) {
        errorCount++;
        console.error(`Poll error (${errorCount}/${MAX_POLL_ERRORS}):`, err);
        if (errorCount >= MAX_POLL_ERRORS) {
          stopPolling();
          setIsImporting(false);
          setError('Lost connection to import job. Please check your bookmarks and try again.');
        }
      }
    }, IMPORT_POLL_INTERVAL);
  }, [stopPolling]);

  const importFile = useCallback(async (file) => {
    setIsImporting(true);
    setError(null);
    setJobStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/bookmarks/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setJobStatus({ job_id: data.job_id, total: data.total, processed: 0, status: 'running', percent: 0 });
      startPolling(data.job_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
      setIsImporting(false);
    }
  }, [startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setIsImporting(false);
    setJobStatus(null);
    setError(null);
  }, [stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { importFile, isImporting, jobStatus, error, reset };
}

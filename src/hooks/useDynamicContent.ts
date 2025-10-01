import { useState, useEffect } from 'react';
import DynamicDataService, { DynamicContent } from '../services/dynamicDataService';

export const useDynamicContent = () => {
  const [content, setContent] = useState<DynamicContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const service = DynamicDataService.getInstance();
        const dynamicContent = await service.getDynamicContent();
        setContent(dynamicContent);
        setError(null);
      } catch (err) {
        setError('Failed to load content');
        console.error('Dynamic content error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    // Refresh content every 2 minutes
    const interval = setInterval(fetchContent, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const refreshContent = async () => {
    const service = DynamicDataService.getInstance();
    service.clearCache();
    
    try {
      setLoading(true);
      const dynamicContent = await service.getDynamicContent();
      setContent(dynamicContent);
      setError(null);
    } catch (err) {
      setError('Failed to refresh content');
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, error, refreshContent };
};
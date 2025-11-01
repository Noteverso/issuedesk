import { useState, useEffect } from 'react';

export interface UseZoomResult {
  zoomLevel: number;
  zoomPercentage: number;
  zoomIn: () => Promise<void>;
  zoomOut: () => Promise<void>;
  resetZoom: () => Promise<void>;
  isZooming: boolean;
}

export function useZoom(): UseZoomResult {
  const [zoomLevel, setZoomLevel] = useState(0);
  const [isZooming, setIsZooming] = useState(false);

  // Convert zoom level to percentage (Electron uses a logarithmic scale)
  const zoomPercentage = Math.round((Math.pow(1.2, zoomLevel)) * 100);

  useEffect(() => {
    // Get initial zoom level
    const getInitialZoom = async () => {
      try {
        const result = await window.electronAPI.system.getZoomLevel();
        if (result.success && typeof result.zoomLevel === 'number') {
          setZoomLevel(result.zoomLevel);
        }
      } catch (error) {
        console.error('Failed to get initial zoom level:', error);
      }
    };

    getInitialZoom();
  }, []);

  const zoomIn = async () => {
    if (isZooming) return;
    
    setIsZooming(true);
    try {
      const result = await window.electronAPI.system.zoomIn();
      if (result.success && typeof result.zoomLevel === 'number') {
        setZoomLevel(result.zoomLevel);
      }
    } catch (error) {
      console.error('Failed to zoom in:', error);
    } finally {
      setIsZooming(false);
    }
  };

  const zoomOut = async () => {
    if (isZooming) return;
    
    setIsZooming(true);
    try {
      const result = await window.electronAPI.system.zoomOut();
      if (result.success && typeof result.zoomLevel === 'number') {
        setZoomLevel(result.zoomLevel);
      }
    } catch (error) {
      console.error('Failed to zoom out:', error);
    } finally {
      setIsZooming(false);
    }
  };

  const resetZoom = async () => {
    if (isZooming) return;
    
    setIsZooming(true);
    try {
      const result = await window.electronAPI.system.resetZoom();
      if (result.success && typeof result.zoomLevel === 'number') {
        setZoomLevel(result.zoomLevel);
      }
    } catch (error) {
      console.error('Failed to reset zoom:', error);
    } finally {
      setIsZooming(false);
    }
  };

  return {
    zoomLevel,
    zoomPercentage,
    zoomIn,
    zoomOut,
    resetZoom,
    isZooming,
  };
}
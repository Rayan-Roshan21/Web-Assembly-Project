// src/hooks/useONNX.ts
import { useState, useEffect, useCallback } from 'react';
import { ModelManager } from '../utils/onnxModelHandler';

export function useONNX() {
  const [modelManager, setModelManager] = useState<ModelManager | null>(null);
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize model manager
  useEffect(() => {
    const manager = new ModelManager();
    setModelManager(manager);

    // Cleanup on unmount
    return () => {
      manager.disposeAll();
    };
  }, []);

  const loadModel = useCallback(async (modelName: string) => {
    if (!modelManager) {
      throw new Error('Model manager not initialized');
    }

    // Check if model is already loaded in the ModelManager
    if (modelManager.getModel(modelName)) {
      console.log(`Model ${modelName} already loaded`);
      // Ensure React state is in sync
      setLoadedModels(prev => new Set([...prev, modelName]));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Loading model: ${modelName}`);
      await modelManager.loadModel(modelName);
      
      // Update React state after successful load
      setLoadedModels(prev => {
        const newSet = new Set([...prev, modelName]);
        console.log(`✅ Model ${modelName} loaded successfully. Loaded models:`, Array.from(newSet));
        return newSet;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
      console.error(`❌ Error loading model ${modelName}:`, err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [modelManager]);

  const processImage = useCallback(async (modelName: string, file: File): Promise<ImageData> => {
    if (!modelManager) {
      throw new Error('Model manager not initialized');
    }

    // Check if model exists in the ModelManager directly, not just the React state
    const model = modelManager.getModel(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not loaded. Load the model first.`);
    }

    setError(null);
    
    try {
      console.log(`Processing image with model: ${modelName}`);
      const result = await modelManager.processImage(modelName, file);
      console.log(`✅ Image processed successfully with ${modelName}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      console.error(`❌ Error processing image with ${modelName}:`, err);
      setError(errorMessage);
      throw err;
    }
  }, [modelManager]);

  const isModelLoaded = useCallback((modelName: string) => {
    // Check the ModelManager directly for the most accurate state
    return modelManager ? !!modelManager.getModel(modelName) : false;
  }, [modelManager]);

  const getLoadedModels = useCallback(() => {
    return Array.from(loadedModels);
  }, [loadedModels]);

  return {
    loadModel,
    processImage,
    isModelLoaded,
    getLoadedModels,
    isLoading,
    error,
    isInitialized: modelManager !== null
  };
}

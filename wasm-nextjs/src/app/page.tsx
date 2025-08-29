// src/app/page.tsx
"use client";
import useWasm from "../hooks/useWasm";
import { useONNX } from "../hooks/useONNX";
import { useState } from "react";

export default function Home() {
  const { wasm, loading: wasmLoading, error: wasmError } = useWasm();
  const { 
    loadModel, 
    processImage: processImageWithONNX, 
    isModelLoaded,
    isLoading: onnxLoading, 
    error: onnxError 
  } = useONNX();
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("piccasso");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    try {
      // Load model if not already loaded
      if (!isModelLoaded(selectedStyle)) {
        console.log(`Loading model: ${selectedStyle}`);
        await loadModel(selectedStyle);
        console.log(`Model ${selectedStyle} loaded successfully`);
      }
      
      // Process image with ONNX model
      console.log(`Processing image with model: ${selectedStyle}`);
      const resultImageData = await processImageWithONNX(selectedStyle, selectedImage);
      
      // Convert ImageData to displayable format
      const canvas = document.createElement('canvas');
      canvas.width = resultImageData.width;
      canvas.height = resultImageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(resultImageData, 0, 0);
      
      const processedDataUrl = canvas.toDataURL();
      setProcessedImage(processedDataUrl);
      console.log('✅ Image processing completed successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      alert(`Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = wasmLoading || onnxLoading || isProcessing;
  const error = wasmError || onnxError;

  if (isLoading && !selectedImage) {
    return (
      <main className="min-h-screen p-24">
        <h1 className="text-4xl font-bold mb-8">AI Style Transfer</h1>
        <p>Loading WebAssembly and ONNX Runtime...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-24">
        <h1 className="text-4xl font-bold mb-8">AI Style Transfer</h1>
        <p className="text-red-500">Error: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-24">
      <h1 className="text-4xl font-bold mb-8">AI Style Transfer</h1>
      <p className="text-gray-600 mb-6">Upload an image and apply artistic style transfer using ONNX models</p>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="p-2 border rounded w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Choose Style:</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="p-2 border rounded w-full"
            >
              <option value="piccasso">Piccasso Style</option>
              <option value="vangogh">Van Gogh Style</option>
              <option value="cyberpunk">Cyberpunk Style</option>
            </select>
          </div>

          <button
            onClick={processImage}
            className={`p-3 rounded font-medium w-full transition-colors ${
              isProcessing 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : selectedImage 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!selectedImage || isProcessing}
          >
            {isProcessing ? 'Processing...' : `Apply ${selectedStyle} Style`}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {imagePreview && (
            <div>
              <h3 className="text-lg font-medium mb-2">Original Image:</h3>
              <img
                src={imagePreview}
                alt="Original"
                className="max-w-full max-h-64 object-contain border rounded shadow-sm"
              />
            </div>
          )}

          {processedImage && (
            <div>
              <h3 className="text-lg font-medium mb-2">Stylized Result:</h3>
              <img
                src={processedImage}
                alt="Processed"
                className="max-w-full max-h-64 object-contain border rounded shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Processing status */}
        {isProcessing && (
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="animate-pulse">
              <p className="text-blue-700">Processing image with {selectedStyle} style...</p>
              <p className="text-sm text-blue-600 mt-1">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && !isProcessing && (
          <div className="text-center p-4 bg-red-50 rounded">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
// src/app/page.tsx
"use client";
import useWasm from "../hooks/useWasm";
import { useONNX } from "../hooks/useONNX";
import { useState, useRef } from "react";

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
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
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

  const styleOptions = [
    { value: "piccasso", label: "Picasso", description: "Cubist artistic style" },
    { value: "vangogh", label: "Van Gogh", description: "Post-impressionist brushstrokes" },
    { value: "cyberpunk", label: "Cyberpunk", description: "Futuristic digital art" }
  ];

  const isLoading = wasmLoading || onnxLoading || isProcessing;
  const error = wasmError || onnxError;

  if (isLoading && !selectedImage) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card card-elevated p-12 text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">AI Style Transfer</h1>
          <p className="text-gray-600">Initializing WebAssembly and ONNX Runtime...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card card-elevated p-12 text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">System Error</h1>
          <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AI Style Transfer</h1>
            </div>
            <div className="text-sm text-gray-500">
              Powered by ONNX Runtime
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="card p-6 animate-slide-in">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h2>
              
              <div
                className={`upload-area p-8 text-center transition-all duration-200 ${
                  isDragOver ? 'dragover' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {!imagePreview ? (
                  <div className="py-12">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 font-medium mb-1">Drop your image here</p>
                    <p className="text-gray-500 text-sm">or click to browse</p>
                    <p className="text-gray-400 text-xs mt-2">Supports JPG, PNG, GIF</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                        setImagePreview(null);
                        setProcessedImage(null);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-gray-900 bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Style Selection */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Style</h2>
              
              <div className="space-y-3">
                {styleOptions.map((style) => (
                  <label
                    key={style.value}
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedStyle === style.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="style"
                      value={style.value}
                      checked={selectedStyle === style.value}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{style.label}</p>
                        <p className="text-sm text-gray-500">{style.description}</p>
                      </div>
                      {selectedStyle === style.value && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={processImage}
              disabled={!selectedImage || isProcessing}
              className={`w-full btn-primary ${
                !selectedImage || isProcessing ? 'btn-primary:disabled' : ''
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Apply ${styleOptions.find(s => s.value === selectedStyle)?.label} Style`
              )}
            </button>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6 text-white">
            {/* Processing Status */}
            {isProcessing && (
              <div className="card p-6 animate-fade-in">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Processing Image</h3>
                </div>
                <div className="progress-bar mb-3">
                  <div className="progress-bar-fill"></div>
                </div>
                <p className="text-gray-600 text-sm">
                  Applying {styleOptions.find(s => s.value === selectedStyle)?.label} style to your image...
                </p>
              </div>
            )}

            {/* Images Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original Image */}
              {imagePreview && (
                <div className="card p-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Image</h3>
                  <img
                    src={imagePreview}
                    alt="Original"
                    className="w-full rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Processed Image */}
              {processedImage && (
                <div className="card p-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Stylized Result</h3>
                    <div className="flex space-x-2">
                        <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.download = `stylized-${selectedStyle}-${Date.now()}.png`;
                          link.href = processedImage;
                          link.click();
                        }}
                        className="bg-black text-white text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-1"
                        >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download</span>
                        </button>
                    </div>
                  </div>
                  <img
                    src={processedImage}
                    alt="Stylized"
                    className="w-full rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && !isProcessing && (
              <div className="card p-6 border-red-200 bg-red-50 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Processing Error</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
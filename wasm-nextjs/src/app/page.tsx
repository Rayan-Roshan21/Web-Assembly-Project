// src/app/page.tsx
"use client";
import useWasm from "../hooks/useWasm";
import { useState } from "react";

export default function Home() {
  const { wasm, loading, error } = useWasm();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("picasso");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const processImage = () => {
    if (!selectedImage || !wasm) return;
    // Process image with selected style using WASM
    console.log(`Processing image with ${selectedStyle} style`);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-24">
        <h1 className="text-4xl font-bold mb-8">Next.js + WASM = 🔥</h1>
        <p>Loading WebAssembly module...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-24">
        <h1 className="text-4xl font-bold mb-8">Next.js + WASM = 🔥</h1>
        <p className="text-red-500">Error loading WASM: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-24">
      <h1 className="text-4xl font-bold mb-8">Next.js + WASM = 🔥</h1>
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
              <option value="picasso">Picasso</option>
              <option value="van_gogh">Van Gogh</option>
              <option value="cyberpunk">Cyberpunk</option>
            </select>
          </div>

          <button
            onClick={processImage}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!selectedImage || !wasm}
          >
            Process Image with {selectedStyle} Style
          </button>
        </div>

        {imagePreview && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Preview:</h3>
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-md max-h-64 object-contain border rounded"
            />
          </div>
        )}
      </div>
    </main>
  );
}

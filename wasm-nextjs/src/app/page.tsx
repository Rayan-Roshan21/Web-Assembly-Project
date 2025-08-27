// src/app/page.tsx
"use client";
import useWasm from "../hooks/useWasm";
import { useState } from "react";

export default function Home() {
  const { wasm, loading, error } = useWasm();
  const [input, setInput] = useState(10);
  const [result, setResult] = useState<number | null>(null);

  const computeFactorial = () => {
    if (!wasm) return;
    setResult(wasm.factorial(input));
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
      <div className="space-y-4">
        <div>
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(Number(e.target.value))}
            className="p-2 border rounded"
            min="0"
            max="20"
          />
          <button
            onClick={computeFactorial}
            className="ml-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!wasm}
          >
            Compute Factorial (WASM)
          </button>
        </div>
        {result !== null && (
          <p className="mt-4 text-xl">
            Factorial of {input} is <strong>{result}</strong> (computed in WASM)
          </p>
        )}
      </div>
    </main>
  );
}

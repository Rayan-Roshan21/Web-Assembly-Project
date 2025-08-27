// src/hooks/useWasm.ts
import { useEffect, useState } from "react";

interface WasmModule {
  factorial: (n: number) => number;
}

const useWasm = () => {
  const [wasm, setWasm] = useState<WasmModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        setLoading(true);
        setError(null);

        // Import the WASM module
        const wasmModule = await import("../wasm-math/wasm_math");
        await wasmModule.default();

        // Create the module interface
        const module: WasmModule = {
          factorial: wasmModule.factorial,
        };

        setWasm(module);
      } catch (err) {
        console.error("Failed to load WASM module:", err);
        setError(err instanceof Error ? err.message : "Failed to load WASM module");
      } finally {
        setLoading(false);
      }
    };

    loadWasm();
  }, []);

  return { wasm, loading, error };
};

export default useWasm;

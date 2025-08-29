import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Configure fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      buffer: false,
    };

    // Don't bundle ONNX Runtime for server-side to avoid issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('onnxruntime-web');
    } else {
      // Client-side: Configure for ONNX Runtime
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent bundling WASM files that cause issues
        'onnxruntime-web/dist/ort-wasm.wasm': false,
        'onnxruntime-web/dist/ort-wasm-simd.wasm': false,
        'onnxruntime-web/dist/ort-wasm-threaded.wasm': false,
        'onnxruntime-web/dist/ort-wasm-simd-threaded.wasm': false,
      };
    }

    return config;
  },
};

export default nextConfig;

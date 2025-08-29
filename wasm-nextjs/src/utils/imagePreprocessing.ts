// src/utils/imagePreprocessing.ts
import * as ort from 'onnxruntime-web';

/**
 * Configuration for different ONNX models
 * Different style transfer models may have different input requirements
 */
export const PREPROCESSING_CONFIGS = {
  default: {
    width: 224,
    height: 224,
    mean: [0.485, 0.456, 0.406], // ImageNet normalization
    std: [0.229, 0.224, 0.225],
    channels: 3, // RGB
  },
  styleTransfer: {
    width: 224,
    height: 224,
    mean: [0.485, 0.456, 0.406], // ImageNet normalization
    std: [0.229, 0.224, 0.225],
    channels: 3,
  },
  styleTransferSimple: {
    width: 224,
    height: 224,
    mean: [0.5, 0.5, 0.5], // Simple normalization (-1 to 1 range)
    std: [0.5, 0.5, 0.5],
    channels: 3,
  },
  styleTransferNoNorm: {
    width: 224,
    height: 224,
    mean: [0.0, 0.0, 0.0], // No normalization (0 to 1 range)
    std: [1.0, 1.0, 1.0],
    channels: 3,
  }
};

/**
 * Load image from File object and create an HTMLImageElement
 */
export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize image to target dimensions while maintaining aspect ratio
 * and center crop if needed
 */
export function resizeAndCropImage(
  img: HTMLImageElement, 
  targetWidth: number, 
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Calculate scaling to maintain aspect ratio
  const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;

  // Center the image
  const offsetX = (targetWidth - scaledWidth) / 2;
  const offsetY = (targetHeight - scaledHeight) / 2;

  // Clear canvas with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw the resized image
  ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

  return canvas;
}

/**
 * Extract RGB pixel data from canvas and normalize
 */
export function extractAndNormalizePixels(
  canvas: HTMLCanvasElement,
  config = PREPROCESSING_CONFIGS.default
): Float32Array {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const { mean, std } = config;

  // Create array for normalized pixels [C, H, W] format
  const normalizedData = new Float32Array(3 * canvas.width * canvas.height);

  for (let i = 0; i < canvas.width * canvas.height; i++) {
    const pixelIndex = i * 4; // RGBA format
    
    // Extract RGB values (ignore alpha)
    const r = data[pixelIndex] / 255.0;
    const g = data[pixelIndex + 1] / 255.0;
    const b = data[pixelIndex + 2] / 255.0;

    // Normalize using ImageNet statistics and arrange in CHW format
    normalizedData[i] = (r - mean[0]) / std[0]; // Red channel
    normalizedData[canvas.width * canvas.height + i] = (g - mean[1]) / std[1]; // Green channel
    normalizedData[2 * canvas.width * canvas.height + i] = (b - mean[2]) / std[2]; // Blue channel
  }

  return normalizedData;
}

/**
 * Convert normalized pixel data to ONNX tensor
 */
export function createONNXTensor(
  normalizedData: Float32Array,
  width: number,
  height: number
): ort.Tensor {
  // Create tensor with shape [1, 3, height, width] for batch processing
  const tensor = new ort.Tensor('float32', normalizedData, [1, 3, height, width]);
  return tensor;
}

/**
 * Main preprocessing function that combines all steps
 */
export async function preprocessImageForONNX(
  file: File,
  modelType: 'default' | 'styleTransfer' | 'styleTransferSimple' | 'styleTransferNoNorm' = 'styleTransferSimple'
): Promise<ort.Tensor> {
  console.log('Starting image preprocessing...');
  console.log('Using config:', modelType);
  
  const config = PREPROCESSING_CONFIGS[modelType];
  console.log('Config details:', config);
  
  try {
    // Step 1: Load image from file
    console.log('Loading image from file...');
    const img = await loadImageFromFile(file);
    console.log(`Original image size: ${img.width}x${img.height}`);

    // Step 2: Resize and crop image
    console.log(`Resizing image to ${config.width}x${config.height}...`);
    const canvas = resizeAndCropImage(img, config.width, config.height);

    // Step 3: Extract and normalize pixels
    console.log('Extracting and normalizing pixels...');
    const normalizedData = extractAndNormalizePixels(canvas, config);

    // Step 4: Create ONNX tensor
    console.log('Creating ONNX tensor...');
    const tensor = createONNXTensor(normalizedData, config.width, config.height);

    console.log('Image preprocessing completed successfully');
    console.log('Tensor shape:', tensor.dims);
    
    // Calculate min/max without spread operator to avoid stack overflow
    let min = normalizedData[0];
    let max = normalizedData[0];
    for (let i = 1; i < normalizedData.length; i++) {
      if (normalizedData[i] < min) min = normalizedData[i];
      if (normalizedData[i] > max) max = normalizedData[i];
    }
    console.log('Tensor data range:', { min, max });
    
    // Clean up
    URL.revokeObjectURL(img.src);

    return tensor;
  } catch (error) {
    console.error('Error during image preprocessing:', error);
    throw new Error(`Image preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert ONNX tensor output back to ImageData for display
 * Improved version with better handling of different output formats
 */
export function tensorToImageData(
  tensor: ort.Tensor,
  width: number,
  height: number,
  configType: 'default' | 'styleTransfer' | 'styleTransferSimple' | 'styleTransferNoNorm' = 'styleTransferSimple'
): ImageData {
  const data = tensor.data as Float32Array;
  const imageData = new ImageData(width, height);
  
  console.log('Converting tensor to image data...');
  console.log('Output tensor shape:', tensor.dims);
  console.log('Output data range:', {
    min: Math.min(...Array.from(data)),
    max: Math.max(...Array.from(data))
  });
  
  const config = PREPROCESSING_CONFIGS[configType];
  const { mean, std } = config;
  
  for (let i = 0; i < width * height; i++) {
    let r, g, b;
    
    // Handle different tensor layouts
    if (tensor.dims.length === 4) {
      // Standard CHW format [1, 3, H, W]
      r = data[i];
      g = data[width * height + i];
      b = data[2 * width * height + i];
    } else if (tensor.dims.length === 3) {
      // CHW format [3, H, W]
      r = data[i];
      g = data[width * height + i];
      b = data[2 * width * height + i];
    } else {
      throw new Error(`Unsupported tensor shape: ${tensor.dims}`);
    }
    
    // Denormalize based on the configuration used
    if (configType === 'styleTransferNoNorm') {
      // No normalization was applied, data should be in 0-1 range
      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));
    } else if (configType === 'styleTransferSimple') {
      // Simple normalization: from [-1, 1] back to [0, 1]
      r = (r * std[0] + mean[0]);
      g = (g * std[1] + mean[1]);
      b = (b * std[2] + mean[2]);
      // Clamp to [0, 1]
      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));
    } else {
      // ImageNet normalization: denormalize and clamp
      r = (r * std[0] + mean[0]);
      g = (g * std[1] + mean[1]);
      b = (b * std[2] + mean[2]);
      // Clamp to [0, 1]
      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));
    }
    
    // Convert to 0-255 range
    const pixelIndex = i * 4;
    imageData.data[pixelIndex] = Math.round(r * 255);     // Red
    imageData.data[pixelIndex + 1] = Math.round(g * 255); // Green
    imageData.data[pixelIndex + 2] = Math.round(b * 255); // Blue
    imageData.data[pixelIndex + 3] = 255;                 // Alpha
  }
  
  console.log('Tensor to image conversion completed');
  return imageData;
}

/**
 * Alternative post-processing function for testing different approaches
 */
export function tensorToImageDataAuto(
  tensor: ort.Tensor,
  width: number,
  height: number
): ImageData {
  const data = tensor.data as Float32Array;
  const imageData = new ImageData(width, height);
  
  console.log('Auto-converting tensor to image data...');
  console.log('Output tensor shape:', tensor.dims);
  
  // Calculate min and max without using spread operator to avoid stack overflow
  let min = data[0];
  let max = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const dataRange = { min, max };
  console.log('Output data range:', dataRange);
  
  // Auto-detect the normalization based on data range
  let denormalizeFunc: (val: number) => number;
  
  if (dataRange.min >= -1.1 && dataRange.max <= 1.1) {
    // Data appears to be in [-1, 1] range (simple normalization)
    console.log('Detected [-1, 1] range, using simple denormalization');
    denormalizeFunc = (val: number) => (val + 1) / 2; // Convert [-1, 1] to [0, 1]
  } else if (dataRange.min >= -0.1 && dataRange.max <= 1.1) {
    // Data appears to be in [0, 1] range
    console.log('Detected [0, 1] range, no denormalization needed');
    denormalizeFunc = (val: number) => val;
  } else {
    // Unknown range, normalize to [0, 1]
    console.log('Unknown range, normalizing to [0, 1]');
    const range = dataRange.max - dataRange.min;
    denormalizeFunc = (val: number) => (val - dataRange.min) / range;
  }
  
  for (let i = 0; i < width * height; i++) {
    let r, g, b;
    
    // Handle different tensor layouts
    if (tensor.dims.length === 4) {
      // Standard CHW format [1, 3, H, W]
      r = data[i];
      g = data[width * height + i];
      b = data[2 * width * height + i];
    } else if (tensor.dims.length === 3) {
      // CHW format [3, H, W]
      r = data[i];
      g = data[width * height + i];
      b = data[2 * width * height + i];
    } else {
      throw new Error(`Unsupported tensor shape: ${tensor.dims}`);
    }
    
    // Apply denormalization
    r = denormalizeFunc(r);
    g = denormalizeFunc(g);
    b = denormalizeFunc(b);
    
    // Clamp and convert to 0-255 range
    const pixelIndex = i * 4;
    imageData.data[pixelIndex] = Math.round(Math.max(0, Math.min(1, r)) * 255);     // Red
    imageData.data[pixelIndex + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255); // Green
    imageData.data[pixelIndex + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255); // Blue
    imageData.data[pixelIndex + 3] = 255;                                           // Alpha
  }
  
  console.log('Auto tensor to image conversion completed');
  return imageData;
}

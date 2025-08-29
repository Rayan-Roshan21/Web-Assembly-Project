// src/utils/imagePreprocessing.ts
import * as ort from 'onnxruntime-web';

/**
 * Configuration for different ONNX models
 * Most style transfer models expect 224x224 or 256x256 input
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
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
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
  modelType: 'default' | 'styleTransfer' = 'styleTransfer'
): Promise<ort.Tensor> {
  console.log('Starting image preprocessing...');
  
  const config = PREPROCESSING_CONFIGS[modelType];
  
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
 */
export function tensorToImageData(
  tensor: ort.Tensor,
  width: number,
  height: number
): ImageData {
  const data = tensor.data as Float32Array;
  const imageData = new ImageData(width, height);
  
  // Convert from CHW format back to HWC and denormalize
  const { mean, std } = PREPROCESSING_CONFIGS.styleTransfer;
  
  for (let i = 0; i < width * height; i++) {
    // Get normalized values from CHW format
    const r = data[i] * std[0] + mean[0];
    const g = data[width * height + i] * std[1] + mean[1];
    const b = data[2 * width * height + i] * std[2] + mean[2];
    
    // Convert to 0-255 range and clamp
    const pixelIndex = i * 4;
    imageData.data[pixelIndex] = Math.max(0, Math.min(255, r * 255));     // Red
    imageData.data[pixelIndex + 1] = Math.max(0, Math.min(255, g * 255)); // Green
    imageData.data[pixelIndex + 2] = Math.max(0, Math.min(255, b * 255)); // Blue
    imageData.data[pixelIndex + 3] = 255;                                  // Alpha
  }
  
  return imageData;
}

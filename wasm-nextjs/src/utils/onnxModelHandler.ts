// src/utils/onnxModelHandler.ts
import * as ort from 'onnxruntime-web';
import { preprocessImageForONNX, tensorToImageData, PREPROCESSING_CONFIGS } from './imagePreprocessing';

// Configure ONNX Runtime for web
let isOnnxInitialized = false;

async function initializeOnnxRuntime() {
  if (isOnnxInitialized) return;
  
  try {
    console.log('Initializing ONNX Runtime...');
    
    // Configure for CPU execution (most compatible)
    ort.env.logLevel = 'warning';
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = false;
    
    isOnnxInitialized = true;
    console.log('ONNX Runtime initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ONNX Runtime:', error);
    throw error;
  }
}

export class ONNXModelHandler {
  private session: ort.InferenceSession | null = null;
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  /**
   * Load ONNX model from public folder
   */
  async loadModel(): Promise<void> {
    try {
      await initializeOnnxRuntime();
      
      console.log(`Loading ONNX model: ${this.modelName}`);
      const modelPath = `/models/${this.modelName}.onnx`;
      
      // Create session with CPU execution provider for compatibility
      this.session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'disabled'
      });
      
      console.log(`✅ Successfully loaded ${this.modelName} model`);
      console.log('Input names:', this.session.inputNames);
      console.log('Output names:', this.session.outputNames);
      
    } catch (error) {
      console.error(`❌ Error loading model ${this.modelName}:`, error);
      throw new Error(`Failed to load model ${this.modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run inference on preprocessed image
   */
  async runInference(inputTensor: ort.Tensor): Promise<ort.Tensor> {
    if (!this.session) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      console.log('Running inference...');
      console.log('Input tensor shape:', inputTensor.dims);
      
      // Get the input name from the session
      const inputName = this.session.inputNames[0];
      const feeds = { [inputName]: inputTensor };
      
      // Run inference
      const results = await this.session.run(feeds);
      
      // Get the output tensor
      const outputName = this.session.outputNames[0];
      const outputTensor = results[outputName];
      
      console.log('Inference completed successfully');
      console.log('Output tensor shape:', outputTensor.dims);
      
      return outputTensor;
    } catch (error) {
      console.error('Error during inference:', error);
      throw new Error(`Inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process image end-to-end: preprocess -> inference -> postprocess
   */
  async processImage(file: File): Promise<ImageData> {
    try {
      console.log(`Processing image with ${this.modelName} model...`);
      
      // Step 1: Preprocess image
      const inputTensor = await preprocessImageForONNX(file, 'styleTransfer');
      
      // Step 2: Run inference
      const outputTensor = await this.runInference(inputTensor);
      
      // Step 3: Convert output tensor to ImageData
      const config = PREPROCESSING_CONFIGS.styleTransfer;
      const imageData = tensorToImageData(outputTensor, config.width, config.height);
      
      console.log(`✅ Image processing completed with ${this.modelName}`);
      return imageData;
      
    } catch (error) {
      console.error(`Error processing image with ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Dispose of the model session
   */
  dispose(): void {
    if (this.session) {
      this.session.release?.();
      this.session = null;
    }
  }
}

/**
 * Model manager to handle multiple models
 */
export class ModelManager {
  private models: Map<string, ONNXModelHandler> = new Map();

  /**
   * Load a specific model
   */
  async loadModel(modelName: string): Promise<void> {
    if (!this.models.has(modelName)) {
      const handler = new ONNXModelHandler(modelName);
      await handler.loadModel();
      this.models.set(modelName, handler);
    }
  }

  /**
   * Get model handler
   */
  getModel(modelName: string): ONNXModelHandler | undefined {
    return this.models.get(modelName);
  }

  /**
   * Process image with specific model
   */
  async processImage(modelName: string, file: File): Promise<ImageData> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not loaded. Call loadModel() first.`);
    }
    
    return await model.processImage(file);
  }

  /**
   * Dispose all models
   */
  disposeAll(): void {
    this.models.forEach(model => model.dispose());
    this.models.clear();
  }
}

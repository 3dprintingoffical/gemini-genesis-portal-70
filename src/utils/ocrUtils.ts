
import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words?: {
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }[];
}

export const extractTextFromImage = async (
  imageFile: File | string,
  options: {
    language?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<OCRResult> => {
  try {
    console.log('Starting OCR process...');
    
    const { language = 'eng', onProgress } = options;
    
    const result = await Tesseract.recognize(
      imageFile,
      language,
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(m.progress || 0);
          }
          console.log('OCR Progress:', m);
        }
      }
    );

    console.log('OCR completed successfully');
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words?.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      })) || []
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  // For PDF OCR, we would need additional libraries like pdf-lib or PDF.js
  // This is a placeholder implementation
  try {
    console.log('PDF OCR not fully implemented yet');
    return `PDF OCR capability detected for file: ${file.name}\n\nTo fully implement PDF text extraction, you would need to:\n1. Convert PDF pages to images\n2. Apply OCR to each page\n3. Combine results\n\nThis would require additional libraries like pdf-lib or PDF.js.`;
  } catch (error) {
    console.error('PDF OCR Error:', error);
    throw new Error('PDF OCR not implemented');
  }
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};

export const canPerformOCR = (file: File): boolean => {
  return isImageFile(file) || isPDFFile(file);
};

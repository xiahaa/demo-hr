/**
 * PDF 解析服务
 * 使用 Web Worker 在后台线程处理 PDF 解析，避免阻塞 UI
 */

import {
  PDFData,
  PDFParseError,
  PDFWorkerMessage,
} from '../types';

// Web Worker 实例
let pdfWorker: Worker | null = null;

// 最大文件大小 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * 获取或创建 PDF Worker 实例
 */
function getWorker(): Worker {
  if (!pdfWorker) {
    // 创建新的 Worker
    // 注意：实际项目中需要根据构建工具配置 Worker 路径
    pdfWorker = new Worker(new URL('./pdf.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return pdfWorker;
}

/**
 * 终止 Worker
 */
export function terminateWorker(): void {
  if (pdfWorker) {
    pdfWorker.terminate();
    pdfWorker = null;
  }
}

/**
 * 使用 Web Worker 解析 PDF
 */
function parsePDFWithWorker(arrayBuffer: ArrayBuffer): Promise<PDFData> {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    
    const handleMessage = (event: MessageEvent<PDFWorkerMessage>) => {
      const { type, data, error, progress } = event.data;
      
      switch (type) {
        case 'success':
          worker.removeEventListener('message', handleMessage);
          if (data) {
            resolve(data);
          } else {
            reject(new PDFParseError('解析结果为空'));
          }
          break;
          
        case 'error':
          worker.removeEventListener('message', handleMessage);
          reject(new PDFParseError(error || 'PDF 解析失败'));
          break;
          
        case 'progress':
          // 可以在这里处理进度更新
          console.log(`PDF 解析进度: ${progress}%`);
          break;
      }
    };
    
    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      reject(new PDFParseError(`Worker 错误: ${error.message}`));
    };
    
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    
    // 发送数据到 Worker
    worker.postMessage({ arrayBuffer }, [arrayBuffer]);
  });
}

/**
 * 主线程降级解析（当 Worker 不可用时）
 * 使用 requestIdleCallback 或 setTimeout 分块处理，避免阻塞 UI
 */
async function parsePDFFallback(file: File | ArrayBuffer): Promise<PDFData> {
  // 这里使用动态导入，只在需要时加载 PDF.js
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
  
  let arrayBuffer: ArrayBuffer;
  
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
  }
  
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = '';
  
  // 分块处理页面，每处理 5 页让出主线程
  const CHUNK_SIZE = 5;
  
  for (let start = 1; start <= numPages; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE - 1, numPages);
    
    // 处理当前块
    for (let i = start; i <= end; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: { str: string }) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    // 让出主线程，避免阻塞 UI
    if (end < numPages) {
      await new Promise(resolve => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(resolve, { timeout: 100 });
        } else {
          setTimeout(resolve, 0);
        }
      });
    }
  }
  
  return {
    text: fullText.trim(),
    metadata: { numPages },
  };
}

/**
 * 解析 PDF 文件
 * 
 * @param file - PDF 文件或 ArrayBuffer
 * @param options - 解析选项
 * @returns PDF 解析结果
 * 
 * @example
 * ```typescript
 * const result = await parsePDF(file);
 * console.log(result.text); // PDF 文本内容
 * ```
 */
export async function parsePDF(
  file: File | ArrayBuffer,
  options: { 
    maxSize?: number;
    useWorker?: boolean;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<PDFData> {
  const { 
    maxSize = MAX_FILE_SIZE, 
    useWorker = true,
    onProgress,
  } = options;
  
  // 获取 ArrayBuffer
  let arrayBuffer: ArrayBuffer;
  let fileName: string | undefined;
  
  if (file instanceof File) {
    // 验证文件类型
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new PDFParseError('不支持的文件类型，请上传 PDF 文件');
    }
    
    // 检查文件大小
    if (file.size > maxSize) {
      throw new PDFParseError(
        `文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，最大支持 ${(maxSize / 1024 / 1024).toFixed(0)}MB`
      );
    }
    
    arrayBuffer = await file.arrayBuffer();
    fileName = file.name;
  } else {
    arrayBuffer = file;
    
    if (arrayBuffer.byteLength > maxSize) {
      throw new PDFParseError(
        `数据过大 (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)，最大支持 ${(maxSize / 1024 / 1024).toFixed(0)}MB`
      );
    }
  }
  
  try {
    // 优先使用 Web Worker
    if (useWorker && typeof Worker !== 'undefined') {
      try {
        return await parsePDFWithWorker(arrayBuffer);
      } catch (workerError) {
        console.warn('Web Worker 解析失败，使用降级方案:', workerError);
        // Worker 失败时使用降级方案
        return await parsePDFFallback(arrayBuffer);
      }
    } else {
      // 不支持 Worker 的环境使用降级方案
      return await parsePDFFallback(arrayBuffer);
    }
  } catch (error) {
    if (error instanceof PDFParseError) {
      throw error;
    }
    throw new PDFParseError(
      `PDF 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 提取 PDF 文本内容
 * 简化版 API，只返回文本字符串
 */
export async function extractPDFText(file: File | ArrayBuffer): Promise<string> {
  const result = await parsePDF(file);
  return result.text;
}

/**
 * 检查文件是否为有效的 PDF
 */
export async function isValidPDF(file: File | ArrayBuffer): Promise<boolean> {
  try {
    const header = file instanceof File 
      ? await file.slice(0, 4).text()
      : new TextDecoder().decode(file.slice(0, 4));
    
    // PDF 文件以 %PDF 开头
    return header.startsWith('%PDF');
  } catch {
    return false;
  }
}

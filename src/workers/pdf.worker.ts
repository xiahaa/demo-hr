/**
 * PDF Web Worker
 * 在独立线程中处理 PDF 解析，避免阻塞主线程
 */

// 使用 importScripts 加载 PDF.js 库
// 注意：实际项目中需要根据构建工具调整加载方式

interface PDFPageProxy {
  getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNum: number) => Promise<PDFPageProxy>;
}

declare const pdfjsLib: {
  getDocument: (data: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> };
  GlobalWorkerOptions: { workerSrc: string };
};

// Worker 内部状态
let isProcessing = false;

/**
 * 发送消息到主线程
 */
function postMessageToMain(message: {
  type: 'success' | 'error' | 'progress';
  data?: { text: string; metadata: { numPages: number } };
  error?: string;
  progress?: number;
}): void {
  self.postMessage(message);
}

/**
 * 解析 PDF 文件
 */
async function parsePDF(arrayBuffer: ArrayBuffer): Promise<{ text: string; numPages: number }> {
  try {
    // 动态导入 PDF.js
    // 在实际项目中，这里需要根据构建配置调整
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // 设置 worker（在 Worker 中不需要再设置 workerSrc）
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    const numPages = pdf.numPages;
    let fullText = '';
    
    // 逐页解析
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // 提取文本
      const pageText = textContent.items
        .map((item: { str: string }) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      
      // 发送进度更新
      postMessageToMain({
        type: 'progress',
        progress: Math.round((i / numPages) * 100),
      });
    }
    
    return { text: fullText.trim(), numPages };
  } catch (error) {
    throw new Error(`PDF 解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 处理来自主线程的消息
 */
self.onmessage = async (event: MessageEvent<{ arrayBuffer: ArrayBuffer; fileName?: string }>) => {
  const { arrayBuffer, fileName } = event.data;
  
  if (isProcessing) {
    postMessageToMain({
      type: 'error',
      error: 'Worker 正忙，请稍后再试',
    });
    return;
  }
  
  isProcessing = true;
  
  try {
    // 验证输入
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('无效的 PDF 文件');
    }
    
    // 检查文件大小（限制 50MB）
    const MAX_SIZE = 50 * 1024 * 1024;
    if (arrayBuffer.byteLength > MAX_SIZE) {
      throw new Error(`文件过大 (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)，最大支持 50MB`);
    }
    
    // 解析 PDF
    const { text, numPages } = await parsePDF(arrayBuffer);
    
    // 发送成功结果
    postMessageToMain({
      type: 'success',
      data: {
        text,
        metadata: {
          numPages,
        },
      },
    });
  } catch (error) {
    postMessageToMain({
      type: 'error',
      error: error instanceof Error ? error.message : 'PDF 解析失败',
    });
  } finally {
    isProcessing = false;
  }
};

// 导出空对象以满足 TypeScript 模块要求
export {};

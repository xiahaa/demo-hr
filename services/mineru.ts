/**
 * Mineru PDF parsing service
 * https://mineru.net/apiManage/docs
 */

export interface MineruResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    status: string;
    result?: {
      text: string;
      pages: number;
    };
  };
}

/**
 * Extract text from PDF using Mineru API
 * @param pdfUrl - URL of the PDF to parse
 * @returns Extracted text and page count
 */
export async function extractWithMineru(pdfUrl: string): Promise<{ text: string; numPages: number }> {
  // Get credentials from environment variables
  const mineru_id = import.meta.env.VITE_MINERU_ID || process.env.MINERU_ID;
  const mineru_key = import.meta.env.VITE_MINERU_KEY || process.env.MINERU_KEY;

  if (!mineru_id || !mineru_key) {
    throw new Error('Mineru credentials not configured. Please set MINERU_ID and MINERU_KEY environment variables.');
  }

  // Construct the API token from id and key
  const token = `${mineru_id}:${mineru_key}`;

  const url = "https://mineru.net/api/v4/extract/task";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
  const data = {
    "url": pdfUrl,
    "model_version": "vlm"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mineru API error: ${response.status} - ${errorText}`);
    }

    const result: MineruResponse = await response.json();

    if (result.code !== 0 && result.code !== 200) {
      throw new Error(`Mineru API returned error: ${result.message}`);
    }

    // The API may return a task_id that needs to be polled
    // For now, assume synchronous response with result
    if (!result.data?.result?.text) {
      throw new Error('No text extracted from PDF by Mineru API');
    }

    return {
      text: result.data.result.text,
      numPages: result.data.result.pages || 0
    };
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to extract PDF with Mineru: ${err.message}`);
    }
    throw new Error('Failed to extract PDF with Mineru: Unknown error');
  }
}

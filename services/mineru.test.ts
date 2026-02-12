import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractWithMineru } from './mineru';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment
const originalEnv = { ...import.meta.env };

describe('Mineru Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mock environment variables using stubEnv
    vi.stubEnv('VITE_MINERU_ID', 'test_id');
    vi.stubEnv('VITE_MINERU_KEY', 'test_key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should successfully extract text from PDF URL', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      data: {
        task_id: 'test-task-id',
        status: 'completed',
        result: {
          text: 'Sample PDF text content',
          pages: 5
        }
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
      status: 200
    });

    const result = await extractWithMineru('https://example.com/test.pdf');

    expect(result.text).toBe('Sample PDF text content');
    expect(result.numPages).toBe(5);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://mineru.net/api/v4/extract/task',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_id:test_key'
        }),
        body: expect.stringContaining('"url":"https://example.com/test.pdf"')
      })
    );
  });

  it('should throw error when credentials are not configured', async () => {
    vi.stubEnv('VITE_MINERU_ID', '');
    vi.stubEnv('VITE_MINERU_KEY', '');
    vi.stubEnv('MINERU_ID', '');
    vi.stubEnv('MINERU_KEY', '');

    await expect(
      extractWithMineru('https://example.com/test.pdf')
    ).rejects.toThrow('Mineru credentials not configured');
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    await expect(
      extractWithMineru('https://example.com/test.pdf')
    ).rejects.toThrow('Mineru API error: 500');
  });

  it('should throw error when API returns error code', async () => {
    const mockResponse = {
      code: 400,
      message: 'Invalid PDF URL',
      data: null
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await expect(
      extractWithMineru('https://example.com/test.pdf')
    ).rejects.toThrow('Mineru API returned error: Invalid PDF URL');
  });

  it('should throw error when no text is extracted', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      data: {
        task_id: 'test-task-id',
        status: 'completed',
        result: {
          text: '',
          pages: 0
        }
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await expect(
      extractWithMineru('https://example.com/test.pdf')
    ).rejects.toThrow('No text extracted from PDF');
  });

  it('should include model_version as vlm in request', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      data: {
        task_id: 'test-task-id',
        status: 'completed',
        result: {
          text: 'Test content',
          pages: 1
        }
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await extractWithMineru('https://example.com/test.pdf');

    const fetchCall = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.model_version).toBe('vlm');
  });
});

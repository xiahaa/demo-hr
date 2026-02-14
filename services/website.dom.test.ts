import { describe, it, expect, vi } from 'vitest';
import { extractTextContent } from './website';

describe('extractTextContent with DOMParser', () => {
  // Save original if it exists
  const originalDOMParser = global.DOMParser;

  it('should use DOMParser when available', () => {
    const mockRemove = vi.fn();
    const mockQuerySelectorAll = vi.fn().mockReturnValue([
      { remove: mockRemove },
      { remove: mockRemove }
    ]);

    // Mock DOMParser
    global.DOMParser = class MockDOMParser {
      parseFromString = vi.fn(() => ({
        body: {
          textContent: 'Parsed Content via DOMParser'
        },
        querySelectorAll: mockQuerySelectorAll
      }))
    } as any;

    const html = '<script>alert(1)</script><p>Content</p>';
    const result = extractTextContent(html);

    // Verify script/style removal was attempted
    expect(mockQuerySelectorAll).toHaveBeenCalledWith('script, style');
    expect(mockRemove).toHaveBeenCalledTimes(2);

    // Verify result came from our mock
    expect(result).toBe('Parsed Content via DOMParser');

    // Clean up
    if (originalDOMParser) {
      global.DOMParser = originalDOMParser;
    } else {
      // @ts-ignore
      delete global.DOMParser;
    }
  });

  it('should handle DOMParser errors by falling back to regex', () => {
    // Mock DOMParser to throw error
    global.DOMParser = class MockDOMParser {
      parseFromString = vi.fn(() => {
        throw new Error('Parsing failed');
      })
    } as any;

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const html = '<p>Fallback Content</p>';
    const result = extractTextContent(html);

    // Verify fallback result (regex strips <p>)
    expect(result).toBe('Fallback Content');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();

    // Clean up
    if (originalDOMParser) {
      global.DOMParser = originalDOMParser;
    } else {
      // @ts-ignore
      delete global.DOMParser;
    }
  });
});

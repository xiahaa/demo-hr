/**
 * Utility functions for the demo-hr application
 * All functions have strict TypeScript type annotations
 */

/**
 * Formats a date into a localized string representation
 * @param date - The date to format (Date object, ISO string, or timestamp)
 * @param locale - The locale to use for formatting (default: 'zh-CN')
 * @returns Formatted date string, or empty string if input is invalid
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  locale: string = 'zh-CN'
): string {
  if (date === null || date === undefined) {
    return '';
  }

  const dateObj: Date = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a date with time
 * @param date - The date to format
 * @param locale - The locale to use for formatting
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  locale: string = 'zh-CN'
): string {
  if (date === null || date === undefined) {
    return '';
  }

  const dateObj: Date = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Safely parses a JSON string with type safety
 * @param jsonString - The JSON string to parse
 * @param defaultValue - Default value to return if parsing fails
 * @returns Parsed value of type T, or defaultValue if parsing fails
 */
export function safeJsonParse<T>(
  jsonString: string | null | undefined,
  defaultValue: T
): T {
  if (typeof jsonString !== 'string') {
    return defaultValue;
  }

  try {
    const parsed: unknown = JSON.parse(jsonString);
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Type guard to check if a value is a non-null object
 * @param value - The value to check
 * @returns True if the value is a non-null object
 */
export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a string
 * @param value - The value to check
 * @returns True if the value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number (and not NaN)
 * @param value - The value to check
 * @returns True if the value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Safely accesses a nested property in an object
 * @param obj - The object to access
 * @param path - The path to the property (e.g., 'user.profile.name')
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue<T>(
  obj: Record<string, unknown> | null | undefined,
  path: string
): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const keys: string[] = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current as T | undefined;
}

/**
 * Debounces a function call
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Truncates a string to a specified length
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export function truncateString(
  str: string | null | undefined,
  maxLength: number,
  suffix: string = '...'
): string {
  if (typeof str !== 'string') {
    return '';
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Formats a number with thousand separators
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(
  num: number | string | null | undefined,
  decimals: number = 0
): string {
  const parsedNum: number = typeof num === 'string' ? parseFloat(num) : Number(num);
  
  if (!isValidNumber(parsedNum)) {
    return '0';
  }

  return parsedNum.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Validates an email address format
 * @param email - The email to validate
 * @returns True if the email format is valid
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') {
    return false;
  }

  const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Creates a URL-friendly slug from a string
 * @param str - The string to convert
 * @returns URL-friendly slug
 */
export function createSlug(str: string | null | undefined): string {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

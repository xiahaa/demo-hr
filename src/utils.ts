/**
 * 工具函数库
 * 提供类型安全的通用工具函数
 */

// ==================== 日期格式化类型定义 ====================

/**
 * 日期格式选项
 */
export interface DateFormatOptions {
  /** 是否包含时间 */
  includeTime?: boolean;
  /** 日期分隔符 */
  separator?: string;
  /** 是否使用短格式 */
  short?: boolean;
}

/**
 * 日期格式结果
 */
export type FormattedDate = string;

// ==================== 类型守卫 ====================

/**
 * 检查值是否为有效的 Date 对象
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 检查值是否为非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 检查值是否为数字（包括数字字符串）
 */
export function isNumeric(value: unknown): value is number | string {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  if (typeof value === 'string') {
    return value.trim() !== '' && !isNaN(Number(value));
  }
  return false;
}

// ==================== 日期格式化函数 ====================

/**
 * 格式化日期为字符串
 * @param date - 要格式化的日期（Date 对象、时间戳或日期字符串）
 * @param options - 格式化选项
 * @returns 格式化后的日期字符串
 * @throws 当输入无效时抛出错误
 * 
 * @example
 * formatDate(new Date()) // "2026-02-28"
 * formatDate(new Date(), { includeTime: true }) // "2026-02-28 14:30:00"
 * formatDate('2026-02-28', { short: true }) // "26/02/28"
 */
export function formatDate(
  date: Date | number | string,
  options: DateFormatOptions = {}
): FormattedDate {
  const { includeTime = false, separator = '-', short = false } = options;

  // 转换为 Date 对象
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    throw new Error('Invalid date input: expected Date, number, or string');
  }

  // 验证日期有效性
  if (!isValidDate(dateObj)) {
    throw new Error('Invalid date: resulting date object is not valid');
  }

  const year = short 
    ? dateObj.getFullYear().toString().slice(-2) 
    : dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  let result = `${year}${separator}${month}${separator}${day}`;

  if (includeTime) {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    result += ` ${hours}:${minutes}:${seconds}`;
  }

  return result;
}

/**
 * 格式化日期为相对时间字符串（如：2小时前、3天前）
 * @param date - 要格式化的日期
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | number | string): string {
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = new Date(date);
  }

  if (!isValidDate(dateObj)) {
    throw new Error('Invalid date input');
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}u��钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else if (diffMonths < 12) {
    return `${diffMonths}个月前`;
  } else {
    return `${diffYears}年前`;
  }
}

// ==================== 字符串工具函数 ====================

/**
 * 截断字符串到指定长度
 * @param str - 要截断的字符串
 * @param maxLength - 最大长度
 * @param suffix - 截断后添加的后缀（默认为...）
 * @returns 截断后的字符串
 */
export function truncateString(
  str: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!isNonEmptyString(str)) {
    return '';
  }
  if (maxLength <= 0) {
    throw new Error('maxLength must be greater than 0');
  }
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 将字符串转换为驼峰命名
 * @param str - 要转换的字符串
 * @returns 驼峰命名字符串
 */
export function toCamelCase(str: string): string {
  if (!isNonEmptyString(str)) {
    return '';
  }
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * 将字符串转换为帕斯卡命名
 * @param str - 要转换的字符串
 * @returns 帕斯卡命名字符串
 */
export function toPascalCase(str: string): string {
  if (!isNonEmptyString(str)) {
    return '';
  }
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

// ==================== 数组工具函数 ====================

/**
 * 从数组中移除重复项
 * @param array - 要去重的数组
 * @returns 去重后的数组
 */
export function uniqueArray<T>(array: T[]): T[] {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  return [...new Set(array)];
}

/**
 * 按指定键对对象数组进行分组
 * @param array - 要分组的数组
 * @param key - 分组键
 * @returns 分组后的对象
 */
export function groupBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  
  return array.reduce((result, item) => {
    const groupKey = String(item[key] ?? 'undefined');
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// ==================== 数值工具函数 ====================

/**
 * 将数字格式化为千分位字符串
 * @param num - 要格式化的数字
 * @param decimals - 小数位数
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number, decimals: number = 0): string {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new Error('Input must be a valid number');
  }
  if (decimals < 0) {
    throw new Error('Decimals must be non-negative');
  }
  
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 限制数字在指定范围内
 * @param value - 要限制的值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的值
 */
export function clamp(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Value must be a valid number');
  }
  if (min > max) {
    throw new Error('Min cannot be greater than max');
  }
  return Math.min(Math.max(value, min), max);
}

// ==================== 异步工具函数 ====================

/**
 * 延迟执行
 * @param ms - 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  if (!isNumeric(ms) || Number(ms) < 0) {
    throw new Error('Delay must be a non-negative number');
  }
  return new Promise(resolve => setTimeout(resolve, Number(ms)));
}

/**
 * 带超时的 Promise
 * @param promise - 要执行的 Promise
 * @param timeoutMs - 超时毫秒数
 * @param errorMessage - 超时错误消息
 * @returns Promise 结果
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  if (!isNumeric(timeoutMs) || Number(timeoutMs) <= 0) {
    throw new Error('Timeout must be a positive number');
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), Number(timeoutMs));
  });

  return Promise.race([promise, timeoutPromise]);
}

// ==================== 深拷贝 ====================

/**
 * 深拷贝对象
 * @param obj - 要拷贝的对象
 * @returns 深拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

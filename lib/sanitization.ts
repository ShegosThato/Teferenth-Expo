/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user input and prevent security issues
 * like XSS attacks, SQL injection, etc.
 */

/**
 * Sanitizes text input to prevent XSS attacks
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Replace HTML tags and entities
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes text for use in AI prompts
 * Removes potential prompt injection attempts
 */
export function sanitizeAIPrompt(input: string): string {
  if (!input) return '';
  
  // Basic sanitization first
  let sanitized = sanitizeText(input);
  
  // Remove potential prompt injection patterns
  // This is a basic implementation - in production you'd want more comprehensive checks
  const promptInjectionPatterns = [
    /ignore previous instructions/gi,
    /ignore all previous commands/gi,
    /disregard previous prompts/gi,
    /system:/gi,
    /\[system\]/gi,
  ];
  
  promptInjectionPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[filtered]');
  });
  
  return sanitized;
}

/**
 * Validates and sanitizes file names
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  // Remove path traversal attempts and invalid characters
  return fileName
    .replace(/\.\.\//g, '') // Remove path traversal
    .replace(/[\/\\:*?"<>|]/g, '_'); // Replace invalid filename chars
}

/**
 * Validates and sanitizes URLs
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  // Basic URL validation
  try {
    const parsedUrl = new URL(url);
    
    // Only allow certain protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }
    
    return parsedUrl.toString();
  } catch (e) {
    return null; // Invalid URL
  }
}

/**
 * Sanitizes object keys and values recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeText(key);
    
    if (typeof value === 'string') {
      result[sanitizedKey] = sanitizeText(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[sanitizedKey] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      result[sanitizedKey] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : 
        typeof item === 'object' ? sanitizeObject(item) : 
        item
      );
    } else {
      result[sanitizedKey] = value;
    }
  }
  
  return result as T;
}

/**
 * Validates email addresses
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates and formats phone numbers
 */
export function validatePhone(phone: string): boolean {
  // Basic phone validation - adjust for your specific needs
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
}

/**
 * Validates input against a maximum length
 */
export function validateLength(input: string, maxLength: number): boolean {
  return input.length <= maxLength;
}

/**
 * Truncates text to a maximum length
 */
export function truncateText(input: string, maxLength: number): string {
  if (!input) return '';
  if (input.length <= maxLength) return input;
  
  return input.substring(0, maxLength) + '...';
}
/**
 * Validation utilities
 */

/**
 * Validate phone number format (E.164)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][subscriber number]
  // Length: 8-15 digits (excluding the +)
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  return e164Regex.test(phone);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate latitude
 */
export function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

/**
 * Validate longitude
 */
export function isValidLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove any potentially harmful characters
  // Allow alphanumeric, spaces, and common punctuation
  return input.replace(/[^\w\s.,!?@'"\-]/g, '').trim();
}

/**
 * Validate list item content
 */
export function isValidListItem(content: string): boolean {
  // Must be non-empty and less than 500 characters
  return content.length > 0 && content.length <= 500;
}

/**
 * Validate list name
 */
export function isValidListName(name: string): boolean {
  // Must be non-empty and less than 100 characters
  return name.length > 0 && name.length <= 100;
}

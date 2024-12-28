/**
 * Generate a UUID v4 string
 * This is a fallback implementation when crypto.randomUUID is not available
 */
export function generateUUID(): string {
  // Generate random bytes
  const getRandomByte = () => Math.floor(Math.random() * 256);
  const randomBytes = Array.from({ length: 16 }, getRandomByte);

  // Set version (4) and variant (2) bits
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant 2

  // Convert to hex string with proper formatting
  const hexBytes = randomBytes.map(byte => byte.toString(16).padStart(2, '0'));
  return [
    hexBytes.slice(0, 4).join(''),
    hexBytes.slice(4, 6).join(''),
    hexBytes.slice(6, 8).join(''),
    hexBytes.slice(8, 10).join(''),
    hexBytes.slice(10, 16).join('')
  ].join('-');
}

/**
 * Get a UUID using the best available method
 */
export function getUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return generateUUID();
}
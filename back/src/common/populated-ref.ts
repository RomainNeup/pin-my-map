/**
 * Extracts an id string from either a raw ObjectId/string or a populated
 * Mongoose document object. Returns '' when the value is null/undefined.
 */
export function populatedRefId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object' && value !== null) {
    const obj = value as { toHexString?: () => string; _id?: unknown };
    if (typeof obj.toHexString === 'function') {
      return obj.toHexString();
    }
    if ('_id' in obj && obj._id !== obj) {
      return populatedRefId(obj._id);
    }
  }
  return String(value);
}

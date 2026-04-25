/**
 * Extracts an id string from either a raw ObjectId/string or a populated
 * Mongoose document object. Returns '' when the value is null/undefined.
 */
export function populatedRefId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object' && '_id' in (value as object)) {
    const inner = (value as { _id: unknown })._id;
    return populatedRefId(inner);
  }
  const maybe = value as { toHexString?: () => string };
  if (typeof maybe.toHexString === 'function') {
    return maybe.toHexString();
  }
  return String(value);
}

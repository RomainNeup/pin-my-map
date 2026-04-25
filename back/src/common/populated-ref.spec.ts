import { Types } from 'mongoose';
import { populatedRefId } from './populated-ref';

describe('populatedRefId', () => {
  it('returns empty string for null / undefined', () => {
    expect(populatedRefId(null)).toBe('');
    expect(populatedRefId(undefined)).toBe('');
  });

  it('returns hex for a raw ObjectId without recursing through its _id virtual', () => {
    const id = new Types.ObjectId();
    expect(populatedRefId(id)).toBe(id.toHexString());
  });

  it('extracts the id from a populated document with an ObjectId _id', () => {
    const id = new Types.ObjectId();
    const doc = { _id: id, name: 'foo' };
    expect(populatedRefId(doc)).toBe(id.toHexString());
  });

  it('extracts the id from a populated document with a string _id', () => {
    expect(populatedRefId({ _id: 'abc123', name: 'foo' })).toBe('abc123');
  });

  it('returns string representation for a plain string', () => {
    expect(populatedRefId('abc123')).toBe('abc123');
  });

  it('does not infinite-recurse on a self-referencing _id (regression: ObjectId-like)', () => {
    const selfRef: { _id?: unknown } = {};
    selfRef._id = selfRef;
    expect(() => populatedRefId(selfRef)).not.toThrow();
  });
});

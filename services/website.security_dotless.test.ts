import { describe, it, expect } from 'vitest';
import { isPrivateHostname } from './website';

describe('isPrivateHostname Security Check', () => {
  it('should identify dotless domains as private (potential internal network)', () => {
    // These should return TRUE (private), but currently likely return FALSE (public)
    expect(isPrivateHostname('intranet')).toBe(true);
    expect(isPrivateHostname('corp')).toBe(true);
    expect(isPrivateHostname('database')).toBe(true);
    expect(isPrivateHostname('go')).toBe(true);
  });
});

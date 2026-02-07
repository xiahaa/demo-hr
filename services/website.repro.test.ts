
import { describe, it, expect } from 'vitest';
import { isPrivateHostname } from './website';

describe('isPrivateHostname SSRF Bypass Reproduction', () => {
  it('should identify IPv6-mapped IPv4 addresses as private', () => {
    // These should fail before the fix
    expect(isPrivateHostname('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateHostname('[::ffff:127.0.0.1]')).toBe(true);
  });

  it('should identify IPv6-mapped private range addresses', () => {
    expect(isPrivateHostname('[::ffff:192.168.1.1]')).toBe(true);
    expect(isPrivateHostname('[::ffff:10.0.0.1]')).toBe(true);
  });
});

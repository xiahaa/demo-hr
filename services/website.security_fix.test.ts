
import { isPrivateHostname } from './website';
import { describe, it, expect } from 'vitest';

describe('isPrivateHostname Security Fixes', () => {
  it('should block IPv6 Link-Local Addresses (fe80::/10)', () => {
    // fe80:: to febf::
    expect(isPrivateHostname('fe80::1')).toBe(true);
    expect(isPrivateHostname('[fe80::1]')).toBe(true);
    expect(isPrivateHostname('fe90::1')).toBe(true);
    expect(isPrivateHostname('fea0::1')).toBe(true);
    expect(isPrivateHostname('feb0::1')).toBe(true);
  });

  it('should block IPv6 Unique Local Addresses (fc00::/7)', () => {
    // fc00:: to fdff::
    expect(isPrivateHostname('fc00::1')).toBe(true);
    expect(isPrivateHostname('[fc00::1]')).toBe(true);
    expect(isPrivateHostname('fd00::1')).toBe(true);
    expect(isPrivateHostname('[fd00::1]')).toBe(true);
  });

  it('should block IPv6 Site-Local Addresses (fec0::/10)', () => {
    // fec0:: to feff::
    expect(isPrivateHostname('fec0::1')).toBe(true);
    expect(isPrivateHostname('[fec0::1]')).toBe(true);
    expect(isPrivateHostname('fed0::1')).toBe(true);
    expect(isPrivateHostname('fee0::1')).toBe(true);
    expect(isPrivateHostname('fef0::1')).toBe(true);
  });

  it('should block IPv6 Unspecified Address (::)', () => {
    expect(isPrivateHostname('::')).toBe(true);
    expect(isPrivateHostname('[::]')).toBe(true);
  });

  it('should allow public IPv6 addresses', () => {
    // 2001:db8:: (Documentation) - technically public/routable in this context
    expect(isPrivateHostname('2001:db8::1')).toBe(false);
    expect(isPrivateHostname('[2001:db8::1]')).toBe(false);

    // Google Public DNS
    expect(isPrivateHostname('2001:4860:4860::8888')).toBe(false);
  });
});

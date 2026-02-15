
import { describe, it, expect } from 'vitest';
import { isPrivateHostname } from './website';

describe('isPrivateHostname SSRF Bypass Extended', () => {
  it('should identify octal IPs in hostnames', () => {
    // 0177.0.0.1 is 127.0.0.1
    // The previous regex (\d{1,3}) failed on 0177 (4 digits)
    expect(isPrivateHostname('0177.0.0.1.nip.io')).toBe(true);
    expect(isPrivateHostname('0177.0.0.1.traefik.me')).toBe(true);
  });

  it('should identify hex IPs in hostnames', () => {
    // 0x7f.0.0.1 is 127.0.0.1
    // The previous regex (\d) failed on 'x'
    expect(isPrivateHostname('0x7f.0.0.1.traefik.me')).toBe(true);
  });

  it('should identify mixed hex/decimal IPs', () => {
    expect(isPrivateHostname('127.0.0.0x1.traefik.me')).toBe(true);
  });
});

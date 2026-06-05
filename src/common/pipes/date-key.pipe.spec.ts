import { BadRequestException } from '@nestjs/common';
import { DateKeyPipe } from './date-key.pipe';

describe('DateKeyPipe', () => {
  it('accepts a valid YYYY-MM-DD date', () => {
    expect(new DateKeyPipe().transform('2026-06-04')).toBe('2026-06-04');
  });

  it('rejects invalid dates', () => {
    expect(() => new DateKeyPipe().transform('2026-02-31')).toThrow(BadRequestException);
    expect(() => new DateKeyPipe().transform('04-06-2026')).toThrow(BadRequestException);
  });
});

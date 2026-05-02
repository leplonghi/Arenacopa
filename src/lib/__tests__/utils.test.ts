import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
    });

    it('merges tailwind classes properly', () => {
      // tailwind-merge resolves conflicts
      expect(cn('p-4', 'p-8')).toBe('p-8');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles arrays and objects', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
      expect(cn({ 'class1': true, 'class2': false })).toBe('class1');
    });
  });
});

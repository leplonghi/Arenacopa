import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getArenaLevel, useLevelNotifier } from '../profile-level';
import * as useToastModule from '@/hooks/use-toast';

describe('profile-level', () => {
  describe('getArenaLevel', () => {
    it('returns level 1 for 0 points', () => {
      const result = getArenaLevel(0);
      expect(result.level).toBe(1);
      expect(result.currentXp).toBe(0);
      expect(result.maxXp).toBe(180);
      expect(result.ratio).toBe(0);
    });

    it('returns level 1 for null or undefined points', () => {
      expect(getArenaLevel(null).level).toBe(1);
      expect(getArenaLevel(undefined).level).toBe(1);
    });

    it('returns level 2 for 180 points', () => {
      const result = getArenaLevel(180);
      expect(result.level).toBe(2);
      expect(result.currentXp).toBe(0);
      expect(result.maxXp).toBe(180);
      expect(result.ratio).toBe(0);
    });

    it('returns level 2 for 270 points (halfway to level 3)', () => {
      const result = getArenaLevel(270);
      expect(result.level).toBe(2);
      expect(result.currentXp).toBe(90);
      expect(result.maxXp).toBe(180);
      expect(result.ratio).toBe(0.5);
    });
  });

  describe('useLevelNotifier', () => {
    let mockToast: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockToast = vi.fn();
      vi.spyOn(useToastModule, 'useToast').mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: []
      });
    });

    it('does not show toast on initial render', () => {
      renderHook(() => useLevelNotifier(180));
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('shows toast when level increases', () => {
      const { rerender } = renderHook(({ points }) => useLevelNotifier(points), {
        initialProps: { points: 0 } // Level 1
      });

      expect(mockToast).not.toHaveBeenCalled();

      rerender({ points: 180 }); // Level 2
      expect(mockToast).toHaveBeenCalledWith({
        title: "Você subiu de nível! 🎉",
        description: "Parabéns! Você alcançou o nível 2 no ArenaCup.",
      });
    });

    it('does not show toast when points increase but level stays the same', () => {
      const { rerender } = renderHook(({ points }) => useLevelNotifier(points), {
        initialProps: { points: 0 } // Level 1
      });

      rerender({ points: 90 }); // Still Level 1
      expect(mockToast).not.toHaveBeenCalled();
    });
  });
});

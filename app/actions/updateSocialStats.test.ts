/**
 * Tests for Social Stats Server Action
 *
 * TDD cycles:
 *   - Validates input schema (platform, metric, value, label)
 *   - Returns error on invalid input
 *   - Returns success on valid input
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB module
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn().mockResolvedValue([]),
      })),
    })),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { updateSocialStat } from '@/app/actions/updateSocialStats';

describe('updateSocialStat — input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when platform is missing', async () => {
    const formData = new FormData();
    formData.set('metric', 'followers');
    formData.set('value', '10000');
    formData.set('label', 'en TikTok');

    const result = await updateSocialStat(formData);

    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('platform');
  });

  it('returns error when value is negative', async () => {
    const formData = new FormData();
    formData.set('platform', 'tiktok');
    formData.set('metric', 'followers');
    formData.set('value', '-5');
    formData.set('label', 'en TikTok');

    const result = await updateSocialStat(formData);

    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('value');
  });

  it('returns error when label is empty', async () => {
    const formData = new FormData();
    formData.set('platform', 'tiktok');
    formData.set('metric', 'followers');
    formData.set('value', '10000');
    formData.set('label', '');

    const result = await updateSocialStat(formData);

    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('label');
  });

  it('returns success when all fields are valid', async () => {
    const formData = new FormData();
    formData.set('platform', 'tiktok');
    formData.set('metric', 'followers');
    formData.set('value', '10500');
    formData.set('label', 'en TikTok');

    const result = await updateSocialStat(formData);

    expect(result.success).toBe(true);
  });
});

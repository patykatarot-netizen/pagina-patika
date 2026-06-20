/**
 * Server Action to update social media statistics.
 *
 * Best practices (Next.js + Context7):
 *   - Uses 'use server' directive for server-side execution
 *   - Validates input with Zod before DB mutation
 *   - Uses revalidatePath to invalidate cache after update
 *   - Returns structured result for client-side feedback
 *
 * Security note:
 *   - This action should only be accessible from the admin panel.
 *   - In production, add authentication middleware to /admin routes.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { socialStats } from '@/db/schema';

/**
 * Schema for updating a single social stat.
 * Accepts platform, metric, new value, and display label.
 */
const updateStatSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  metric: z.string().min(1, 'Metric is required'),
  value: z.coerce.number().int().min(0, 'Value must be a positive number'),
  label: z.string().min(1, 'Label is required'),
});

/**
 * Updates or inserts a social stat record.
 *
 * Uses upsert pattern: if the platform+metric combination exists,
 * it updates the value. Otherwise, it creates a new record.
 */
export async function updateSocialStat(formData: FormData) {
  const validated = updateStatSchema.safeParse({
    platform: formData.get('platform'),
    metric: formData.get('metric'),
    value: formData.get('value'),
    label: formData.get('label'),
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten().fieldErrors,
    };
  }

  const { platform, metric, value, label } = validated.data;

  try {
    // Upsert: insert, or update if platform+metric already exists
    await db
      .insert(socialStats)
      .values({ platform, metric, value, label })
      .onConflictDoUpdate({
        target: [socialStats.platform, socialStats.metric],
        set: { value, label, updatedAt: new Date() },
      });

    // Invalidate the home page cache so SocialProof shows fresh data
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('[updateSocialStat] DB error:', error);
    return {
      success: false,
      error: { general: ['Error al guardar en la base de datos'] },
    };
  }
}

/**
 * Fetches all social stats for display on the landing page.
 * Can be called from Server Components.
 */
export async function getSocialStats() {
  try {
    return await db.select().from(socialStats).orderBy(socialStats.platform);
  } catch (error) {
    console.error('[getSocialStats] DB error:', error);
    return [];
  }
}

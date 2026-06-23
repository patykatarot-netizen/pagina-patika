/**
 * Admin Panel — Social Stats Management
 *
 * Each stat has its own form to avoid FormData collision when
 * multiple inputs share the same name.
 */

import { redirect } from 'next/navigation';
import { getSocialStats, updateSocialStat } from '@/app/actions/updateSocialStats';
import LiquidGlassContainer from '@/components/layout/LiquidGlassContainer';

async function handleUpdateStat(formData: FormData) {
  'use server';
  await updateSocialStat(formData);
}

function checkSecret(secret?: string) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return true;
  if (secret !== expected) {
    redirect('/');
  }
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;
  checkSecret(secret);

  const stats = await getSocialStats();

  const defaultStats = [
    { platform: 'tiktok', metric: 'followers', value: 10000, label: 'en TikTok' },
    { platform: 'tiktok', metric: 'likes', value: 63900, label: 'Me gusta' },
  ];

  const currentStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
          Panel de Estadísticas
        </h1>
        <p className="text-text-secondary text-center mb-12">
          Actualizá los números de redes sociales que se muestran en la web.
        </p>

        <LiquidGlassContainer className="p-6 md:p-8">
          <div className="space-y-8">
            {currentStats.map((stat, i) => (
              <form key={i} action={handleUpdateStat} className="space-y-4">
                <h3 className="text-accent-gold font-medium capitalize text-lg">
                  {stat.platform} — {stat.metric}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`value-${i}`}
                      className="block text-sm text-text-secondary mb-1"
                    >
                      Valor numérico
                    </label>
                    <input
                      id={`value-${i}`}
                      name="value"
                      type="number"
                      min="0"
                      defaultValue={stat.value}
                      className="liquid-glass w-full px-4 py-2.5 text-text-primary text-sm
                                 focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`label-${i}`}
                      className="block text-sm text-text-secondary mb-1"
                    >
                      Etiqueta visible
                    </label>
                    <input
                      id={`label-${i}`}
                      name="label"
                      type="text"
                      defaultValue={stat.label}
                      className="liquid-glass w-full px-4 py-2.5 text-text-primary text-sm
                                 focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
                      required
                    />
                  </div>
                </div>

                <input type="hidden" name="platform" value={stat.platform} />
                <input type="hidden" name="metric" value={stat.metric} />

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm font-bold
                             bg-accent-gold text-black
                             hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]
                             transition-all duration-200"
                >
                  Guardar
                </button>
              </form>
            ))}
          </div>
        </LiquidGlassContainer>

        <p className="text-text-secondary/50 text-xs text-center mt-8">
          Los cambios se reflejan inmediatamente en la página principal.
        </p>
      </div>
    </div>
  );
}

/**
 * Proxy for TikTok oEmbed API — fetches video thumbnails server-side.
 *
 * TikTok's oEmbed endpoint returns structured metadata including the
 * video's thumbnail URL. We proxy it here to avoid CORS issues and
 * keep the client lean.
 *
 * GET /api/tiktok/thumbnails?url=https://www.tiktok.com/@patyka550/video/7627965307960741128
 *
 * Returns:
 *   { thumbnails: { id, url, thumbnailUrl, title }[] }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urls = searchParams.getAll('url');

  if (urls.length === 0) {
    return Response.json(
      { error: 'At least one ?url= parameter is required' },
      { status: 400 },
    );
  }

  if (urls.length > 10) {
    return Response.json(
      { error: 'Maximum 10 URLs per request' },
      { status: 400 },
    );
  }

  try {
    const results = await Promise.all(
      urls.map(async (url) => {
        const id = url.split('/video/')[1] ?? url;

        const res = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
          { next: { revalidate: 3600 } }, // cache for 1 hour
        );

        if (!res.ok) {
          return { id, url, thumbnailUrl: null, title: null, error: `oEmbed returned ${res.status}` };
        }

        const data = await res.json();
        return {
          id,
          url,
          thumbnailUrl: data.thumbnail_url ?? null,
          title: data.title ?? null,
          error: null,
        };
      }),
    );

    return Response.json({ thumbnails: results });
  } catch (err) {
    return Response.json(
      { error: 'Failed to fetch thumbnails', details: String(err) },
      { status: 502 },
    );
  }
}

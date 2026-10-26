/**
 * VWorld 베이스 지도 타일(WMTS) 프록시
 * key 는 Pages 시크릿(env.VWORLD_API_KEY)에만 존재. 타일은 정적이라 엣지 캐시로 재사용.
 * 프론트는 /api/vtile/{z}/{y}/{x} 로 요청(OpenLayers XYZ).
 */
export async function onRequestGet({ params, env }) {
  const { z, y, x } = params;
  if (!/^\d{1,2}$/.test(z) || !/^\d{1,7}$/.test(y) || !/^\d{1,7}$/.test(x)) {
    return new Response('bad request', { status: 400 });
  }
  if (!env.VWORLD_API_KEY) return new Response('key not configured', { status: 503 });

  const cache = caches.default;
  const cacheKey = new Request(`https://apt-vtile.local/${z}/${y}/${x}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const tileUrl = `https://api.vworld.kr/req/wmts/1.0.0/${env.VWORLD_API_KEY}/Base/${z}/${y}/${x}.png`;
  const upstream = await fetch(tileUrl, {
    headers: { 'Referer': 'https://apt.baal.co.kr/' },
    cf: { cacheTtl: 604800, cacheEverything: true },
  });
  const resp = new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
  if (upstream.ok) await cache.put(cacheKey, resp.clone());
  return resp;
}

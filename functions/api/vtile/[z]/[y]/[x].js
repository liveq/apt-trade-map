/**
 * VWorld 베이스 지도 타일(WMTS) 프록시
 * key 는 Pages 시크릿(env.VWORLD_API_KEY)에만 존재. 프론트는 /api/vtile/{z}/{y}/{x} 로 요청.
 * 상류 응답이 캐시 불가(Set-Cookie 등)여도 함수가 죽지 않도록 전부 방어 처리.
 */
const BLANK_PNG = Uint8Array.from(atob(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
), c => c.charCodeAt(0));

function blank(status) {
  return new Response(BLANK_PNG, {
    status: status || 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function onRequestGet({ params, env }) {
  const { z, y, x } = params;
  if (!/^\d{1,2}$/.test(z) || !/^\d{1,7}$/.test(y) || !/^\d{1,7}$/.test(x)) return blank(400);
  if (!env.VWORLD_API_KEY) return blank(503);

  const cache = caches.default;
  const cacheKey = new Request(`https://apt-vtile.local/${z}/${y}/${x}`);
  try {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch (_) { /* 캐시 조회 실패는 무시 */ }

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
  let upstream, buf;
  try {
    upstream = await fetch(
      `https://api.vworld.kr/req/wmts/1.0.0/${env.VWORLD_API_KEY}/Base/${z}/${y}/${x}.png`,
      { headers: { 'User-Agent': UA, 'Accept': 'image/png,*/*', 'Referer': 'https://apt.baal.co.kr/' }, signal: AbortSignal.timeout(8000) }
    );
    buf = await upstream.arrayBuffer();
  } catch (_) {
    return blank(502);
  }
  const resp = new Response(buf, {
    status: upstream.ok ? 200 : upstream.status,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': upstream.ok ? 'public, max-age=604800' : 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
  if (upstream.ok) {
    try { await cache.put(cacheKey, resp.clone()); } catch (_) { /* 캐시 저장 실패는 무시 */ }
  }
  return resp;
}

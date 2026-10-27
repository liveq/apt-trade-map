/**
 * VWorld 장소검색(지오코딩) 프록시
 * key 는 Pages 시크릿(env.VWORLD_API_KEY)에만 존재. 기존 JSONP 를 서버사이드 fetch 로 대체.
 * ※ vworld 가 응답에 Connection: Upgrade / Upgrade: h2c 를 실어 보내 workerd 가 520 을 내는 문제가 있어,
 *   응답을 즉시 arrayBuffer 로 버퍼링해 완전히 새 Response 로 재구성한다(hop-by-hop 헤더 차단).
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

function err(status) {
  return new Response(JSON.stringify({ response: { status: 'ERROR' } }), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestGet({ request, env }) {
  const query = (new URL(request.url).searchParams.get('query') || '').slice(0, 120);
  if (!query) return err(400);
  if (!env.VWORLD_API_KEY) return err(503);

  const url = new URL('https://api.vworld.kr/req/search');
  url.searchParams.set('service', 'search');
  url.searchParams.set('request', 'search');
  url.searchParams.set('version', '2.0');
  url.searchParams.set('crs', 'epsg:4326');
  url.searchParams.set('query', query);
  url.searchParams.set('type', 'place');
  url.searchParams.set('format', 'json');
  url.searchParams.set('size', '1');
  url.searchParams.set('key', env.VWORLD_API_KEY);

  try {
    const upstream = await fetch(url.toString(), {
      headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://apt.baal.co.kr/' },
      signal: AbortSignal.timeout(8000),
    });
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      status: upstream.ok ? 200 : (upstream.status || 502),
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (_) {
    return err(502);
  }
}

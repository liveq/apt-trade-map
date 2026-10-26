/**
 * VWorld 장소검색(지오코딩) 프록시
 * key 는 Pages 시크릿(env.VWORLD_API_KEY)에만 존재. 기존 JSONP 를 서버사이드 fetch 로 대체.
 * 도메인 제한 키 대응으로 Referer 를 apt.baal.co.kr 로 보냄.
 */
export async function onRequestGet({ request, env }) {
  const query = (new URL(request.url).searchParams.get('query') || '').slice(0, 120);
  if (!query) {
    return new Response(JSON.stringify({ response: { status: 'ERROR' } }), {
      status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
  if (!env.VWORLD_API_KEY) {
    return new Response(JSON.stringify({ response: { status: 'ERROR' } }), {
      status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
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

  let upstream, body;
  try {
    upstream = await fetch(url, { headers: { 'Referer': 'https://apt.baal.co.kr/' } });
    body = await upstream.text();
  } catch (_) {
    return new Response(JSON.stringify({ response: { status: 'ERROR' } }), {
      status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
  return new Response(body, {
    status: upstream.ok ? 200 : upstream.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
}

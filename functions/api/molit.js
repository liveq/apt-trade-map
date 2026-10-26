/**
 * MOLIT(국토부) 아파트 실거래가 프록시
 * serviceKey 는 Pages 시크릿(env.MOLIT_API_KEY)에만 존재 — 프론트에 노출 안 됨.
 * 같은 출처(/api/molit)라 CORS 불필요.
 */
const ENDPOINT = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const lawdCd = q.get('lawdCd') || '';
  const dealYmd = q.get('dealYmd') || '';
  // 오픈 릴레이/쿼터 남용 방지: 형식 검증된 요청만 상류로 전달
  if (!/^\d{5}$/.test(lawdCd) || !/^\d{6}$/.test(dealYmd)) {
    return new Response('<error>bad request</error>', {
      status: 400, headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
  if (!env.MOLIT_API_KEY) {
    return new Response('<error>key not configured</error>', {
      status: 503, headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
  const numOfRows = (q.get('numOfRows') || '1000').replace(/\D/g, '').slice(0, 4) || '1000';
  const pageNo = (q.get('pageNo') || '1').replace(/\D/g, '').slice(0, 4) || '1';

  const url = new URL(ENDPOINT);
  url.searchParams.set('serviceKey', env.MOLIT_API_KEY);
  url.searchParams.set('LAWD_CD', lawdCd);
  url.searchParams.set('DEAL_YMD', dealYmd);
  url.searchParams.set('numOfRows', numOfRows);
  url.searchParams.set('pageNo', pageNo);

  const upstream = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}

/**
 * 앱 설정
 * ※ API 키는 더 이상 프론트에 두지 않는다. 키는 Cloudflare Pages 시크릿에만 존재하고,
 *   브라우저는 같은 출처의 프록시(/api/molit, /api/vsearch, /api/vtile)만 호출한다.
 *   키 교체 시: wrangler pages secret put MOLIT_API_KEY / VWORLD_API_KEY --project-name apt-trade-map
 */

export const CONFIG = {
  // 백엔드 프록시 베이스 (같은 출처)
  API_BASE: '/api',

  // 기본 지도 중심 (서울시청)
  DEFAULT_CENTER: {
    lat: 37.5666805,
    lng: 126.9784147
  },

  // 지도 기본 줌 레벨
  DEFAULT_ZOOM: 13,

  // 베이스 타일 (VWorld 키는 서버에서 주입)
  VWORLD_TILE_URL: '/api/vtile/{z}/{y}/{x}'
};

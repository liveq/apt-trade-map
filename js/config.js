/**
 * API 설정
 * README.md 참고하여 API 키를 발급받고 입력하세요
 */

export const CONFIG = {
  // VWorld 공간정보 오픈플랫폼에서 발급
  // https://www.vworld.kr/ 에서 회원가입 후 API 신청
  // 일일 30,000건 무료, 완전 무료 (과금 없음)
  VWORLD_API_KEY: 'CEC49C43-B827-37EF-A619-2A166E3497E3',

  // 공공데이터포털에서 발급 (이미 발급됨)
  MOLIT_API_KEY: '096e8755105adfd94fadc91447e890d57376f6f62cde0d7b4e2235f2497d256b',

  // 기본 지도 중심 (서울시청)
  DEFAULT_CENTER: {
    lat: 37.5666805,
    lng: 126.9784147
  },

  // 지도 기본 줌 레벨
  DEFAULT_ZOOM: 13,

  // VWorld 지도 타일 URL
  VWORLD_TILE_URL: 'https://api.vworld.kr/req/wmts/1.0.0/{key}/Base/{z}/{y}/{x}.png'
};

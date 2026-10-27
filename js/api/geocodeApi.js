/**
 * 주소 → 좌표 (지오코딩)
 * ※ VWorld 검색 키 의존을 제거했다. 현재는 네트워크 지오코딩을 하지 않고,
 *   MapView 가 DONG_COORDS / REGION_COORDS(로컬 좌표)로 마커를 배치한다.
 *   건물 단위 정밀 지오코딩이 필요하면 도메인 제한 VWorld 키 발급 후 복구.
 */

/**
 * @returns {Promise<null>} 항상 null (로컬 좌표 폴백 사용)
 */
export async function geocodeAddress() {
  return null;
}

/**
 * 일괄 지오코딩 — 네트워크 호출 없이 빈 결과 반환(로컬 좌표 폴백).
 * @returns {Promise<Map<string, {lat: number, lng: number}>>}
 */
export async function batchGeocode() {
  return new Map();
}

export function clearGeocodeCache() {
  /* no-op */
}

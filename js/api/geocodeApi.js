/**
 * VWorld 지오코딩 API (JSONP 방식 - CORS 우회)
 * 주소 → 좌표 변환
 */

import { CONFIG } from '../config.js';

// 지오코딩 결과 캐시 (같은 주소 중복 호출 방지)
const geocodeCache = new Map();

// JSONP 콜백 카운터
let jsonpCounter = 0;

/**
 * JSONP 요청
 */
function jsonpRequest(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `vworldCallback_${++jsonpCounter}`;
    const script = document.createElement('script');

    // 타임아웃 설정 (1.5초)
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 1500);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.src = `${url}&callback=${callbackName}`;
    script.onerror = () => {
      console.error(`[JSONP 오류] ${callbackName}`);
      cleanup();
      resolve(null); // reject 대신 null 반환
    };

    document.head.appendChild(script);
  });
}

/**
 * 장소 검색으로 좌표 찾기 (VWorld Search API)
 * @param {string} query - 검색어 (예: "자양동 현대아파트")
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
export async function geocodeAddress(query) {
  if (!query) return null;

  // 캐시 확인
  if (geocodeCache.has(query)) {
    return geocodeCache.get(query);
  }

  try {
    const baseUrl = 'https://api.vworld.kr/req/search';
    const params = new URLSearchParams({
      service: 'search',
      request: 'search',
      version: '2.0',
      crs: 'epsg:4326',
      query: query,
      type: 'place',
      key: CONFIG.VWORLD_API_KEY,
      format: 'json',
      size: '1'
    });

    const url = `${baseUrl}?${params.toString()}`;
    const data = await jsonpRequest(url);

    // 응답이 없으면 실패
    if (!data) {
      console.warn(`[지오코딩 실패] ${query} - 응답 없음`);
      geocodeCache.set(query, null);
      return null;
    }

    // 결과 확인
    if (data.response?.status === 'OK' && data.response?.result?.items?.length > 0) {
      const item = data.response.result.items[0];
      const point = item.point;
      if (point && point.x && point.y) {
        const coords = {
          lat: parseFloat(point.y),
          lng: parseFloat(point.x)
        };
        geocodeCache.set(query, coords);
        console.log(`[지오코딩 성공] ${query} → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        return coords;
      }
    }

    console.warn(`[지오코딩 실패] ${query} - 결과 없음`);
    geocodeCache.set(query, null);
    return null;
  } catch (error) {
    console.error('[지오코딩 예외]', query, error);
    geocodeCache.set(query, null);
    return null;
  }
}

/**
 * 여러 주소를 일괄 지오코딩 (병렬 처리)
 * @param {Array<{id: string, address: string}>} items
 * @returns {Promise<Map<string, {lat: number, lng: number}>>}
 */
export async function batchGeocode(items) {
  const results = new Map();

  // 중복 제거
  const uniqueAddresses = [...new Set(items.map(i => i.address))];

  // 병렬로 지오코딩 (최대 10개씩)
  const batchSize = 10;
  for (let i = 0; i < uniqueAddresses.length; i += batchSize) {
    const batch = uniqueAddresses.slice(i, i + batchSize);
    const promises = batch.map(addr => geocodeAddress(addr));
    const coords = await Promise.all(promises);

    batch.forEach((addr, idx) => {
      if (coords[idx]) {
        results.set(addr, coords[idx]);
      }
    });
  }

  return results;
}

/**
 * 캐시 초기화
 */
export function clearGeocodeCache() {
  geocodeCache.clear();
}

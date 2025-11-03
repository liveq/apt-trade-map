/**
 * 유틸리티 헬퍼 함수
 */

import { REGIONS } from '../../data/regions.js';

/**
 * 숫자를 한글 금액으로 변환
 * @param {number} price - 만원 단위 가격
 * @returns {string} 한글 금액 (예: "15억 2,000만원")
 */
export function formatPrice(price) {
  if (!price || isNaN(price)) return '0원';

  const priceNum = parseInt(price.toString().replace(/,/g, ''));
  const 억 = Math.floor(priceNum / 10000);
  const 만 = priceNum % 10000;

  let result = '';
  if (억 > 0) {
    result += `${억}억 `;
  }
  if (만 > 0) {
    result += `${만.toLocaleString()}만원`;
  } else if (억 > 0) {
    result += '원';
  } else {
    result = '0원';
  }

  return result.trim();
}

/**
 * 면적을 평수로 변환
 * @param {number} area - 제곱미터
 * @returns {string} 평수 (예: "32평")
 */
export function areaToPyung(area) {
  if (!area || isNaN(area)) return '0평';
  return `${Math.round(parseFloat(area) / 3.3058)}평`;
}

/**
 * 날짜 포맷팅 (YYYYMMDD -> YYYY.MM.DD)
 * @param {string} dateStr - YYYYMMDD 형식
 * @returns {string} YYYY.MM.DD 형식
 */
export function formatDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}.${month}.${day}`;
}

/**
 * 지역코드 데이터 (regions.js에서 가져옴)
 */
export const REGION_DATA = {
  sido: REGIONS.sido,
  sigungu: REGIONS.sigungu
};

/**
 * 현재 날짜를 YYYYMM 형식으로 반환
 * @returns {string} YYYYMM
 */
export function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

/**
 * 최근 N개월 목록 생성 (2개월 전부터 시작 - 부동산 데이터 지연 고려)
 * @param {number} months - 개월 수
 * @returns {Array} [{value: 'YYYYMM', label: 'YYYY년 MM월'}]
 */
export function getRecentMonths(months = 12) {
  const result = [];
  const now = new Date();

  // 부동산 거래 데이터는 보통 1-2개월 지연되므로 2개월 전부터 시작
  for (let i = 2; i < months + 2; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    result.push({
      value: `${year}${month}`,
      label: `${year}년 ${month}월`
    });
  }

  return result;
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 로딩 상태 표시/숨김
 */
export function showLoading() {
  document.getElementById('loadingState')?.classList.remove('hidden');
  document.getElementById('contentGrid')?.classList.add('hidden');
  document.getElementById('statsSection')?.classList.add('hidden');
  document.getElementById('emptyState')?.classList.add('hidden');
  document.getElementById('errorState')?.classList.add('hidden');
}

export function hideLoading() {
  document.getElementById('loadingState')?.classList.add('hidden');
}

export function showEmpty() {
  document.getElementById('emptyState')?.classList.remove('hidden');
  document.getElementById('contentGrid')?.classList.add('hidden');
  document.getElementById('statsSection')?.classList.add('hidden');
  document.getElementById('errorState')?.classList.add('hidden');
}

export function showResults() {
  document.getElementById('contentGrid')?.classList.remove('hidden');
  document.getElementById('statsSection')?.classList.remove('hidden');
  document.getElementById('emptyState')?.classList.add('hidden');
  document.getElementById('errorState')?.classList.add('hidden');
}

export function showError(message) {
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');

  if (errorState && errorMessage) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
  }

  document.getElementById('contentGrid')?.classList.add('hidden');
  document.getElementById('statsSection')?.classList.add('hidden');
  document.getElementById('emptyState')?.classList.add('hidden');
}

export function hideError() {
  document.getElementById('errorState')?.classList.add('hidden');
}

/**
 * 아파트 실거래가 API 연동
 */

const API_KEY = '096e8755105adfd94fadc91447e890d57376f6f62cde0d7b4e2235f2497d256b';
const API_ENDPOINT = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

/**
 * 아파트 실거래가 조회
 * @param {Object} params
 * @param {string} params.lawdCd - 지역코드 (5자리)
 * @param {string} params.dealYmd - 계약년월 (YYYYMM)
 * @returns {Promise<Array>} 거래 목록
 */
export async function fetchApartmentTrades({ lawdCd, dealYmd }) {
  try {
    const url = new URL(API_ENDPOINT);
    url.searchParams.append('serviceKey', API_KEY);
    url.searchParams.append('LAWD_CD', lawdCd);
    url.searchParams.append('DEAL_YMD', dealYmd);
    url.searchParams.append('numOfRows', '1000'); // 최대 1000건
    url.searchParams.append('pageNo', '1');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // 에러 체크
    const resultCode = xmlDoc.querySelector('resultCode')?.textContent?.trim();
    const resultMsg = xmlDoc.querySelector('resultMsg')?.textContent?.trim();

    // resultCode가 '00'으로 시작하면 성공 (00, 000 등)
    if (resultCode && !resultCode.startsWith('00')) {
      throw new Error(`API 오류 (코드: ${resultCode}): ${resultMsg || '알 수 없는 오류'}`);
    }

    // 데이터 파싱
    const items = xmlDoc.querySelectorAll('item');
    const trades = [];

    items.forEach((item) => {
      // 법정동명 추출 (umdNm 또는 지번에서 추출)
      let dongName = item.querySelector('umdNm')?.textContent?.trim() || '';
      if (!dongName) {
        // 지번(jibun)에서 동명 추출 시도
        const jibun = item.querySelector('jibun')?.textContent?.trim() || '';
        const jibunMatch = jibun.match(/^([가-힣]+동|[가-힣]+리)/);
        dongName = jibunMatch ? jibunMatch[1] : '';
      }

      const trade = {
        거래금액: item.querySelector('dealAmount')?.textContent?.trim() || '',
        건축년도: item.querySelector('buildYear')?.textContent?.trim() || '',
        년: item.querySelector('dealYear')?.textContent?.trim() || '',
        월: item.querySelector('dealMonth')?.textContent?.trim() || '',
        일: item.querySelector('dealDay')?.textContent?.trim() || '',
        도로명: item.querySelector('roadName')?.textContent?.trim() || '',
        도로명건물본번호코드: item.querySelector('roadNameBonbun')?.textContent?.trim() || '',
        도로명건물부번호코드: item.querySelector('roadNameBubun')?.textContent?.trim() || '',
        도로명시군구코드: item.querySelector('roadNameSigunguCode')?.textContent?.trim() || '',
        도로명일련번호코드: item.querySelector('roadNameSeq')?.textContent?.trim() || '',
        도로명지상지하코드: item.querySelector('roadNameBasementCode')?.textContent?.trim() || '',
        도로명코드: item.querySelector('roadNameCode')?.textContent?.trim() || '',
        법정동: dongName,
        법정동본번코드: item.querySelector('bonbun')?.textContent?.trim() || '',
        법정동부번코드: item.querySelector('bubun')?.textContent?.trim() || '',
        법정동시군구코드: item.querySelector('sggCd')?.textContent?.trim() || '',
        법정동읍면동코드: item.querySelector('umdCd')?.textContent?.trim() || '',
        법정동지번코드: item.querySelector('landCode')?.textContent?.trim() || '',
        아파트: item.querySelector('aptNm')?.textContent?.trim() || '',
        전용면적: item.querySelector('excluUseAr')?.textContent?.trim() || '',
        지번: item.querySelector('jibun')?.textContent?.trim() || '',
        지역코드: item.querySelector('rgnn')?.textContent?.trim() || '',
        층: item.querySelector('floor')?.textContent?.trim() || '',
        해제사유발생일: item.querySelector('cdealDay')?.textContent?.trim() || '',
        해제여부: item.querySelector('cdealType')?.textContent?.trim() || '',
        거래유형: item.querySelector('dealingGbn')?.textContent?.trim() || '',
        중개사소재지: item.querySelector('estateAgent Addr')?.textContent?.trim() || '',
        등기일자: item.querySelector('rgstDate')?.textContent?.trim() || '',
        매도자: item.querySelector('seller')?.textContent?.trim() || '',
        매수자: item.querySelector('buyer')?.textContent?.trim() || '',
        일련번호: item.querySelector('sn')?.textContent?.trim() || ''
      };

      trades.push(trade);
    });

    return trades;
  } catch (error) {
    console.error('API 조회 오류:', error);
    throw error;
  }
}

/**
 * 거래 데이터를 표시용으로 변환
 * @param {Object} trade - 원본 거래 데이터
 * @returns {Object} 변환된 데이터
 */
export function transformTrade(trade) {
  // 거래일자 조합
  const dealDate = `${trade.년}${trade.월.padStart(2, '0')}${trade.일.padStart(2, '0')}`;

  // 주소 조합 (도로명 우선, 없으면 지번)
  let address = '';
  if (trade.도로명) {
    address = `${trade.도로명} ${trade.도로명건물본번호코드}`;
    if (trade.도로명건물부번호코드 && trade.도로명건물부번호코드 !== '0') {
      address += `-${trade.도로명건물부번호코드}`;
    }
  } else {
    address = `${trade.법정동} ${trade.지번}`;
  }

  return {
    id: trade.일련번호 || Math.random().toString(36).substr(2, 9),
    아파트명: trade.아파트,
    주소: address,
    법정동: trade.법정동,
    시군구코드: trade.법정동시군구코드, // 동 좌표 조회용
    거래금액: parseInt(trade.거래금액.replace(/,/g, '')),
    거래금액_원본: trade.거래금액,
    전용면적: parseFloat(trade.전용면적),
    층: parseInt(trade.층) || 0,
    건축년도: parseInt(trade.건축년도) || 0,
    거래일자: dealDate,
    거래년: trade.년,
    거래월: trade.월,
    거래일: trade.일,
    거래유형: trade.거래유형 || '직거래',
    해제여부: trade.해제여부 === 'O' ? '해제' : ''
  };
}
/* Cache Buster 1762180461 */

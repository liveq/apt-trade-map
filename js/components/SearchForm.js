/**
 * SearchForm Component
 */

import { REGION_DATA, getRecentMonths } from '../utils/helpers.js';
import { DONG_DATA } from '../../data/dongData.js';

/**
 * 동 이름으로 시군구 코드 역방향 검색
 * @param {string} dongName - 검색할 동 이름
 * @returns {Array} 매칭된 시군구 정보 배열 [{sigunguCode, sigunguName, sidoCode, sidoName, dongName}]
 */
function findSigunguByDong(dongName) {
  const results = [];

  for (const [sigunguCode, dongList] of Object.entries(DONG_DATA)) {
    for (const dong of dongList) {
      // 정확히 일치하거나, 입력값이 동 이름에 포함되는 경우
      if (dong === dongName || dong.includes(dongName) || dongName.includes(dong)) {
        // 시도 코드 추출 (앞 2자리)
        const sidoCode = sigunguCode.substring(0, 2);

        // 시도 이름 찾기
        const sido = REGION_DATA.sido.find(s => s.code === sidoCode);

        // 시군구 이름 찾기
        let sigunguName = '';
        const sigunguList = REGION_DATA.sigungu[sidoCode];
        if (sigunguList) {
          const sigungu = sigunguList.find(s => s.code === sigunguCode);
          if (sigungu) sigunguName = sigungu.name;
        }

        results.push({
          sigunguCode,
          sigunguName,
          sidoCode,
          sidoName: sido ? sido.name : '',
          dongName: dong
        });
        break; // 같은 시군구에서 중복 매칭 방지
      }
    }
  }

  return results;
}

export class SearchForm {
  constructor(containerId, onSearch) {
    this.container = document.getElementById(containerId);
    this.onSearch = onSearch;
    this.state = {
      sido: '',
      sigungu: '',
      dong: '',
      dealYmd: ''
    };
    this.render();
    this.attachEvents();
    this.attachAddressInput();

    // 초기 거래년월 설정
    const months = getRecentMonths(12);
    this.state.dealYmd = months[0].value;
    // 검색 버튼 상태 업데이트
    this.updateSearchButton();
  }

  render() {
    const months = getRecentMonths(12);

    this.container.innerHTML = `
      <div class="form-field">
        <label class="form-label-inline">시/도</label>
        <select id="sidoSelect" class="form-select-inline">
          <option value="">선택하세요</option>
          ${REGION_DATA.sido.map(item =>
            `<option value="${item.code}">${item.name}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-field">
        <label class="form-label-inline">구/군</label>
        <select id="sigunguSelect" class="form-select-inline" disabled>
          <option value="">시/도 먼저 선택</option>
        </select>
      </div>

      <div class="form-field">
        <label class="form-label-inline">동</label>
        <select id="dongSelect" class="form-select-inline" disabled>
          <option value="">구/군 먼저 선택</option>
        </select>
      </div>

      <div class="form-field">
        <label class="form-label-inline">거래년월</label>
        <select id="dealYmdSelect" class="form-select-inline">
          ${months.map(month =>
            `<option value="${month.value}">${month.label}</option>`
          ).join('')}
        </select>
      </div>
    `;
  }

  attachEvents() {
    const sidoSelect = document.getElementById('sidoSelect');
    const sigunguSelect = document.getElementById('sigunguSelect');
    const dongSelect = document.getElementById('dongSelect');
    const dealYmdSelect = document.getElementById('dealYmdSelect');
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');

    // 시/도 선택
    sidoSelect.addEventListener('change', (e) => {
      const sido = e.target.value;
      this.state.sido = sido;
      this.state.sigungu = '';
      this.state.dong = '';

      if (sido) {
        this.updateSigunguOptions(sido);
      } else {
        sigunguSelect.disabled = true;
        sigunguSelect.innerHTML = '<option value="">시/도를 먼저 선택하세요</option>';
        dongSelect.disabled = true;
        dongSelect.innerHTML = '<option value="">구/군 먼저 선택</option>';
      }

      this.updateSearchButton();
    });

    // 구/군 선택
    sigunguSelect.addEventListener('change', (e) => {
      this.state.sigungu = e.target.value;
      this.state.dong = '';

      if (this.state.sigungu) {
        this.updateDongOptions(this.state.sigungu);
      } else {
        dongSelect.disabled = true;
        dongSelect.innerHTML = '<option value="">구/군 먼저 선택</option>';
      }

      this.updateSearchButton();
    });

    // 동 선택
    dongSelect.addEventListener('change', (e) => {
      this.state.dong = e.target.value;
      this.updateSearchButton();
    });

    // 거래년월 선택
    dealYmdSelect.addEventListener('change', (e) => {
      this.state.dealYmd = e.target.value;
      this.updateSearchButton();
    });

    // 검색 버튼
    searchBtn.addEventListener('click', () => {
      if (this.isFormValid()) {
        this.onSearch(this.state);
      }
    });

    // 초기화 버튼
    resetBtn.addEventListener('click', () => {
      this.reset();
    });
  }

  updateSigunguOptions(sido) {
    const sigunguSelect = document.getElementById('sigunguSelect');
    const sigunguList = REGION_DATA.sigungu[sido] || [];

    if (sigunguList.length > 0) {
      // 가나다순으로 정렬
      const sortedList = [...sigunguList].sort((a, b) =>
        a.name.localeCompare(b.name, 'ko-KR')
      );

      sigunguSelect.disabled = false;
      sigunguSelect.innerHTML = `
        <option value="">선택하세요</option>
        ${sortedList.map(item =>
          `<option value="${item.code}">${item.name}</option>`
        ).join('')}
      `;
    } else {
      sigunguSelect.disabled = true;
      sigunguSelect.innerHTML = '<option value="">시군구 데이터가 없습니다</option>';
    }
  }

  updateDongOptions(sigungu) {
    const dongSelect = document.getElementById('dongSelect');
    const dongList = DONG_DATA[sigungu] || [];

    if (dongList.length > 0) {
      // 가나다순으로 정렬
      const sortedList = [...dongList].sort((a, b) =>
        a.localeCompare(b, 'ko-KR')
      );

      dongSelect.disabled = false;
      dongSelect.innerHTML = `
        <option value="">전체 동</option>
        ${sortedList.map(dong =>
          `<option value="${dong}">${dong}</option>`
        ).join('')}
      `;
    } else {
      dongSelect.disabled = false;
      dongSelect.innerHTML = '<option value="">동 데이터 없음</option>';
    }
  }

  updateSearchButton() {
    const searchBtn = document.getElementById('searchBtn');
    if (this.isFormValid()) {
      searchBtn.disabled = false;
    } else {
      searchBtn.disabled = true;
    }
  }

  isFormValid() {
    // 동은 선택 안 해도 검색 가능 (전체 동 검색)
    // 아무것도 선택하지 않으면 현재 화면 검색
    if (this.state.sido && this.state.sigungu && this.state.dealYmd) {
      return true; // 일반 검색
    }
    // 아무것도 선택하지 않았지만 거래년월은 있으면 현재 화면 검색
    if (!this.state.sido && !this.state.sigungu && this.state.dealYmd) {
      return true; // 현재 화면 검색
    }
    return false;
  }

  reset() {
    document.getElementById('sidoSelect').value = '';
    document.getElementById('sigunguSelect').value = '';
    document.getElementById('sigunguSelect').disabled = true;
    document.getElementById('dongSelect').value = '';
    document.getElementById('dongSelect').disabled = true;
    const months = getRecentMonths(12);
    document.getElementById('dealYmdSelect').value = months[0].value;

    // 주소 입력창 초기화
    const addressInput = document.getElementById('addressInput');
    if (addressInput) {
      addressInput.value = '';
    }

    this.state = {
      sido: '',
      sigungu: '',
      dong: '',
      dealYmd: months[0].value
    };

    this.updateSearchButton();
  }

  getState() {
    return this.state;
  }

  attachAddressInput() {
    const addressInput = document.getElementById('addressInput');
    if (!addressInput) return;

    addressInput.addEventListener('input', (e) => {
      const input = e.target.value.trim();
      if (input.length >= 2) {
        this.parseAndSetAddress(input);
      }
    });

    addressInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.isFormValid()) {
        this.onSearch(this.state);
      }
    });
  }

  parseAndSetAddress(input) {
    // 주소 파싱 로직
    // 예: "강남구 역삼동" 또는 "서울 강남구 역삼동" 또는 "대치동"

    // 전체 시/도, 구/군, 동 목록에서 매칭
    let foundSido = null;
    let foundSigungu = null;
    let foundDong = null;

    // 시/도 찾기
    for (const sido of REGION_DATA.sido) {
      if (input.includes(sido.name)) {
        foundSido = sido.code;
        break;
      }
    }

    // 구/군 찾기
    if (foundSido) {
      const sigunguList = REGION_DATA.sigungu[foundSido] || [];
      for (const sigungu of sigunguList) {
        if (input.includes(sigungu.name)) {
          foundSigungu = sigungu.code;
          break;
        }
      }
    } else {
      // 시/도가 없으면 전국 구/군에서 찾기
      for (const sidoCode in REGION_DATA.sigungu) {
        const sigunguList = REGION_DATA.sigungu[sidoCode];
        for (const sigungu of sigunguList) {
          if (input.includes(sigungu.name)) {
            foundSigungu = sigungu.code;
            // 해당 구/군의 시/도 찾기
            foundSido = sidoCode.substring(0, 2) + '000';
            // 정확한 시/도 코드 찾기
            for (const sido of REGION_DATA.sido) {
              if (sido.code.substring(0, 2) === sidoCode.substring(0, 2)) {
                foundSido = sido.code;
                break;
              }
            }
            break;
          }
        }
        if (foundSigungu) break;
      }
    }

    // 동 찾기
    if (foundSigungu) {
      const dongList = DONG_DATA[foundSigungu] || [];
      for (const dong of dongList) {
        if (input.includes(dong)) {
          foundDong = dong;
          break;
        }
      }
    }

    // ★ 시/도, 구/군을 못 찾았지만 동 이름만 입력된 경우 역방향 검색
    if (!foundSido && !foundSigungu) {
      const dongMatches = findSigunguByDong(input.trim());

      if (dongMatches.length > 0) {
        // 첫 번째 매칭 결과 사용 (서울 우선 정렬)
        const seoulFirst = dongMatches.sort((a, b) => {
          if (a.sidoCode === '11' && b.sidoCode !== '11') return -1;
          if (a.sidoCode !== '11' && b.sidoCode === '11') return 1;
          return 0;
        });

        const match = seoulFirst[0];
        foundSido = match.sidoCode;
        foundSigungu = match.sigunguCode;
        foundDong = match.dongName;

        console.log(`[동 역방향 검색] "${input}" → ${match.sidoName} ${match.sigunguName} ${match.dongName}`);
      }
    }

    // 드롭다운 자동 설정
    if (foundSido) {
      document.getElementById('sidoSelect').value = foundSido;
      this.state.sido = foundSido;
      this.updateSigunguOptions(foundSido);

      if (foundSigungu) {
        setTimeout(() => {
          document.getElementById('sigunguSelect').value = foundSigungu;
          this.state.sigungu = foundSigungu;
          this.updateDongOptions(foundSigungu);

          if (foundDong) {
            setTimeout(() => {
              document.getElementById('dongSelect').value = foundDong;
              this.state.dong = foundDong;
              this.updateSearchButton();
            }, 50);
          } else {
            this.updateSearchButton();
          }
        }, 50);
      } else {
        this.updateSearchButton();
      }
    }
  }
}

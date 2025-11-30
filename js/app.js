/**
 * BAAL 아파트 실거래가 - 메인 앱
 */

import { SearchForm } from './components/SearchForm.js';
import { MapView } from './components/MapView.js';
import { fetchApartmentTrades, transformTrade } from './api/aptApi.js';
import { REGION_DATA } from './utils/helpers.js';
import {
  formatPrice,
  areaToPyung,
  formatDate,
  showLoading,
  hideLoading,
  showEmpty,
  showResults,
  showError
} from './utils/helpers.js';

class App {
  constructor() {
    this.trades = [];
    this.currentSort = 'date-desc';
    this.currentDongFilter = '';
    this.searchedDong = ''; // 검색 시 선택한 동
    this.currentTab = 'all'; // 현재 활성 탭
    this.apartmentTabs = new Map(); // 아파트별 탭 저장
    this.init();
  }

  init() {
    // SearchForm 초기화
    this.searchForm = new SearchForm('searchForm', this.handleSearch.bind(this));

    // MapView 초기화 (마커 클릭 콜백 전달)
    this.mapView = new MapView('map', this.handleMarkerClick.bind(this));

    // 이벤트 리스너
    this.attachGlobalEvents();
  }

  /**
   * 마커 클릭 시 우측 패널에서 해당 항목으로 스크롤
   */
  handleMarkerClick(trade) {
    // 우측 패널 열기
    const rightPanel = document.getElementById('rightPanel');
    const togglePanelBtn = document.getElementById('togglePanelBtn');

    if (!rightPanel.classList.contains('show')) {
      rightPanel.classList.add('show');
      togglePanelBtn.classList.add('active');
    }

    // 아파트 탭 추가 및 전환
    this.addApartmentTab(trade);

    // 해당 거래 카드로 스크롤
    setTimeout(() => {
      // 기존 강조 제거
      document.querySelectorAll('.result-card').forEach(card => {
        card.classList.remove('highlighted');
      });

      // 같은 아파트의 모든 거래 찾기
      const sameAptCards = Array.from(document.querySelectorAll('.result-card')).filter(card => {
        const titleElement = card.querySelector('.result-card-title');
        const addressElement = card.querySelector('.result-card-address');
        if (titleElement && addressElement) {
          const cardAptName = titleElement.textContent.trim();
          const cardAddress = addressElement.textContent.trim();
          return cardAptName === trade.아파트명 && cardAddress === trade.주소;
        }
        return false;
      });

      if (sameAptCards.length > 0) {
        // 모든 같은 아파트 카드 강조
        sameAptCards.forEach(card => {
          card.classList.add('highlighted');
        });

        // 첫 번째 카드로 스크롤 (항목이 상단에 보이도록)
        sameAptCards[0].scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // 5초 후 강조 제거 (여러 건이므로 더 길게)
        setTimeout(() => {
          sameAptCards.forEach(card => {
            card.classList.remove('highlighted');
          });
        }, 5000);
      }
    }, 100);
  }

  /**
   * 아파트 탭 추가
   */
  addApartmentTab(trade) {
    const tabKey = `${trade.아파트명}_${trade.주소}`;

    // 이미 있는 탭이면 활성화만
    if (this.apartmentTabs.has(tabKey)) {
      this.switchTab(tabKey);
      return;
    }

    // 같은 아파트 거래 건수 계산
    const sameAptTrades = this.trades.filter(t =>
      t.아파트명 === trade.아파트명 && t.주소 === trade.주소
    );

    // 탭 정보 저장
    this.apartmentTabs.set(tabKey, {
      name: trade.아파트명,
      address: trade.주소,
      count: sameAptTrades.length
    });

    // 탭 UI 추가
    this.renderTabs();

    // 새 탭으로 전환
    this.switchTab(tabKey);

    // 새 탭 알람 효과 및 스크롤
    setTimeout(() => {
      const tabsContainer = document.getElementById('tabsContainer');
      const newTab = tabsContainer.querySelector(`[data-tab="${tabKey}"]`);

      if (newTab) {
        // 알람 애니메이션 추가
        newTab.classList.add('tab-new-alert');

        // 새 탭으로 스크롤
        newTab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });

        // 애니메이션 완료 후 클래스 제거
        setTimeout(() => {
          newTab.classList.remove('tab-new-alert');
        }, 1500);
      }
    }, 100);
  }

  /**
   * 탭 UI 렌더링
   */
  renderTabs() {
    const tabsContainer = document.getElementById('tabsContainer');

    let tabsHTML = `<button class="tab-item ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all">전체 목록</button>`;

    this.apartmentTabs.forEach((info, key) => {
      const isActive = this.currentTab === key;
      tabsHTML += `
        <button class="tab-item ${isActive ? 'active' : ''}" data-tab="${key}">
          ${info.name} ${info.count}건
          <span class="tab-close" data-close="${key}">×</span>
        </button>
      `;
    });

    tabsContainer.innerHTML = tabsHTML;

    // 탭 클릭 이벤트
    tabsContainer.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
          // 닫기 버튼 클릭
          const closeKey = e.target.getAttribute('data-close');
          this.closeTab(closeKey);
        } else {
          // 탭 전환
          const tabKey = tab.getAttribute('data-tab');
          this.switchTab(tabKey);
        }
      });
    });
  }

  /**
   * 탭 전환
   */
  switchTab(tabKey) {
    this.currentTab = tabKey;
    this.renderTabs();

    // 탭에 따라 필터링된 결과 표시
    if (tabKey === 'all') {
      // 전체 목록
      this.currentDongFilter = '';
      this.renderStats();
      this.renderResults();
    } else {
      // 특정 아파트
      const tabInfo = this.apartmentTabs.get(tabKey);
      if (tabInfo) {
        // 아파트 필터링은 renderResults에서 처리
        this.renderStats();
        this.renderResults();
      }
    }
  }

  /**
   * 탭 닫기
   */
  closeTab(tabKey) {
    this.apartmentTabs.delete(tabKey);

    // 현재 탭을 닫았으면 전체 목록으로 전환
    if (this.currentTab === tabKey) {
      this.switchTab('all');
    } else {
      this.renderTabs();
    }
  }

  attachGlobalEvents() {
    // 패널 토글 버튼
    const togglePanelBtn = document.getElementById('togglePanelBtn');
    const rightPanel = document.getElementById('rightPanel');
    if (togglePanelBtn) {
      togglePanelBtn.addEventListener('click', () => {
        const isOpen = rightPanel.classList.contains('show');
        if (isOpen) {
          rightPanel.classList.remove('show');
          togglePanelBtn.classList.remove('active');
        } else {
          rightPanel.classList.add('show');
          togglePanelBtn.classList.add('active');
        }
      });
    }

    // 동 필터 선택 (우측 패널)
    const dongFilter = document.getElementById('dongFilter');
    if (dongFilter) {
      dongFilter.addEventListener('change', (e) => {
        this.currentDongFilter = e.target.value;
        // 상단 동 필터도 동기화
        const dongFilterTop = document.getElementById('dongFilterTopSelect');
        if (dongFilterTop) dongFilterTop.value = e.target.value;
        this.renderStats();  // 통계 업데이트
        this.renderResults();
      });
    }

    // 동 필터 선택 (상단)
    const dongFilterTopSelect = document.getElementById('dongFilterTopSelect');
    if (dongFilterTopSelect) {
      dongFilterTopSelect.addEventListener('change', (e) => {
        this.currentDongFilter = e.target.value;
        // 우측 패널 동 필터도 동기화
        const dongFilter = document.getElementById('dongFilter');
        if (dongFilter) dongFilter.value = e.target.value;
        this.renderStats();  // 통계 업데이트
        this.renderResults();
      });
    }

    // 정렬 선택
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.renderResults();
      });
    }

    // 패널 토글 버튼 (플로팅)
    const panelToggle = document.getElementById('panelToggle');
    if (panelToggle) {
      panelToggle.addEventListener('click', () => {
        const isOpen = rightPanel.classList.contains('show');
        if (isOpen) {
          rightPanel.classList.remove('show');
          togglePanelBtn.classList.remove('active');
        } else {
          rightPanel.classList.add('show');
          togglePanelBtn.classList.add('active');
        }
      });
    }

    // 개인정보처리방침 모달
    const privacyBtn = document.getElementById('privacyBtn');
    const closeModal = document.getElementById('closeModal');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modal = document.getElementById('privacyModal');

    if (privacyBtn) {
      privacyBtn.addEventListener('click', () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      });
    }

    const closeModalFn = () => {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    };

    if (closeModal) closeModal.addEventListener('click', closeModalFn);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModalFn);

    // ESC 키로 모달/패널 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modal.classList.contains('show')) {
          closeModalFn();
        } else if (rightPanel.classList.contains('show')) {
          rightPanel.classList.remove('show');
          togglePanelBtn.classList.remove('active');
        }
      }
    });

    // 다시 시도 버튼
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        const state = this.searchForm.getState();
        if (state.sido && state.sigungu && state.dealYmd) {
          this.handleSearch(state);
        }
      });
    }

    // 에러 닫기 버튼
    const closeErrorBtn = document.getElementById('closeErrorBtn');
    if (closeErrorBtn) {
      closeErrorBtn.addEventListener('click', () => {
        document.getElementById('errorState')?.classList.add('hidden');
      });
    }

    // 에러창 바깥 클릭 시 닫기
    const errorState = document.getElementById('errorState');
    if (errorState) {
      errorState.addEventListener('click', (e) => {
        // 배경(자기 자신) 클릭 시에만 닫기 (내부 요소 클릭은 제외)
        if (e.target === errorState) {
          errorState.classList.add('hidden');
        }
      });
    }

    // 지도 초기화 버튼
    const resetMapBtn = document.getElementById('resetMap');
    if (resetMapBtn) {
      resetMapBtn.addEventListener('click', () => {
        this.resetAll();
      });
    }
  }

  /**
   * 전체 초기화 (마커, 데이터, 패널, 지도 위치)
   */
  resetAll() {
    // 거래 데이터 초기화
    this.trades = [];

    // 마커 제거
    this.mapView.clearMarkers();

    // 지도 위치 초기화
    this.mapView.resetView();

    // 패널 닫기
    const rightPanel = document.getElementById('rightPanel');
    const togglePanelBtn = document.getElementById('togglePanelBtn');
    rightPanel.classList.remove('show');
    togglePanelBtn.classList.remove('active');
    togglePanelBtn.classList.add('hidden');

    // 통계 섹션 숨기기
    document.getElementById('statsSection').classList.add('hidden');

    // 탭 초기화
    this.currentTab = 'all';
    this.apartmentTabs.clear();
    this.renderTabs();
  }

  async handleCurrentViewSearch(dealYmd) {
    try {
      // 현재 화면에 보이는 시군구 찾기
      const visibleRegions = this.mapView.getVisibleRegions();

      console.log('현재 화면 검색:', visibleRegions.length, '개 지역');
      console.log('지역 목록:', visibleRegions);

      if (visibleRegions.length === 0) {
        hideLoading();
        showError('현재 화면에 검색 가능한 지역이 없습니다. 지도를 확대해주세요.');
        return;
      }

      if (visibleRegions.length > 20) {
        hideLoading();
        showError('검색 범위가 너무 넓습니다. 지도를 더 확대해주세요. (최대 20개 지역)');
        return;
      }

      // 모든 시군구를 병렬로 검색
      const promises = visibleRegions.map(sigunguCode =>
        fetchApartmentTrades({
          lawdCd: sigunguCode,
          dealYmd: dealYmd
        }).catch(err => {
          console.error(`${sigunguCode} 검색 실패:`, err);
          return []; // 실패한 지역은 빈 배열 반환
        })
      );

      // 모든 API 호출 완료 대기
      const results = await Promise.all(promises);

      // 모든 거래 데이터 합치기
      const allRawTrades = results.flat();
      this.trades = allRawTrades.map(transformTrade);

      console.log(`총 ${this.trades.length}건의 거래 데이터 로드`);

      hideLoading();

      if (this.trades.length === 0) {
        showEmpty();
        this.mapView.clearMarkers();
        document.getElementById('statsSection').classList.add('hidden');
        document.getElementById('rightPanel').classList.remove('show');
        document.getElementById('togglePanelBtn').classList.add('hidden');
        document.getElementById('togglePanelBtn').classList.remove('active');
        return;
      }

      // Empty state 숨기기
      document.getElementById('emptyState').classList.add('hidden');

      // 통계와 결과 표시
      document.getElementById('statsSection').classList.remove('hidden');
      this.renderStats();
      this.updateDongFilter();
      this.renderResults();

      // 우측 패널 표시
      document.getElementById('rightPanel').classList.add('show');

      // 토글 버튼 표시 및 활성화
      const togglePanelBtn = document.getElementById('togglePanelBtn');
      togglePanelBtn.classList.remove('hidden');
      togglePanelBtn.classList.add('active');

      // 지도에 마커 표시 (현재 화면 검색 모드 - 뷰 유지)
      if (visibleRegions.length > 0) {
        await this.mapView.addTradeMarkers(this.trades, visibleRegions[0], 'keepView');
      }

    } catch (error) {
      hideLoading();
      showError(`현재 화면 검색 오류: ${error.message}`);
      console.error(error);
    }
  }

  async handleSearch(params) {
    try {
      showLoading();

      // 검색한 동 저장
      this.searchedDong = params.dong || '';

      // 현재 화면 검색 모드 체크
      if (!params.sido && !params.sigungu) {
        // 현재 화면의 모든 시군구 검색
        await this.handleCurrentViewSearch(params.dealYmd);
        return;
      }

      // 지도를 해당 지역으로 이동
      this.mapView.moveToRegion(params.sigungu);

      // API 호출
      const rawTrades = await fetchApartmentTrades({
        lawdCd: params.sigungu,
        dealYmd: params.dealYmd
      });

      // 데이터 변환 및 동 필터링
      let allTrades = rawTrades.map(transformTrade);

      // 동이 선택된 경우 필터링
      if (params.dong) {
        allTrades = allTrades.filter(trade => trade.법정동 === params.dong);
      }

      this.trades = allTrades;

      hideLoading();

      if (this.trades.length === 0) {
        showEmpty();
        this.mapView.clearMarkers();
        document.getElementById('statsSection').classList.add('hidden');
        document.getElementById('rightPanel').classList.remove('show');
        // 상단 동 필터 숨기기
        document.getElementById('dongFilterTop')?.classList.add('hidden');
        // 토글 버튼 숨기기
        document.getElementById('togglePanelBtn').classList.add('hidden');
        document.getElementById('togglePanelBtn').classList.remove('active');
        return;
      }

      // Empty state 숨기기
      document.getElementById('emptyState').classList.add('hidden');

      // 통계와 결과 표시
      document.getElementById('statsSection').classList.remove('hidden');
      this.renderStats();
      this.updateDongFilter();
      this.renderResults();

      // 우측 패널 표시
      document.getElementById('rightPanel').classList.add('show');

      // 토글 버튼 표시 및 활성화
      const togglePanelBtn = document.getElementById('togglePanelBtn');
      togglePanelBtn.classList.remove('hidden');
      togglePanelBtn.classList.add('active');

      // 지도에 마커 표시
      await this.mapView.addTradeMarkers(this.trades, params.sigungu, false);

    } catch (error) {
      hideLoading();
      showError(`오류가 발생했습니다: ${error.message}`);
      console.error(error);
    }
  }

  renderStats() {
    if (this.trades.length === 0) return;

    // 탭 필터링 적용
    let filtered = this.getFilteredTrades();

    if (filtered.length === 0) return;

    const prices = filtered.map(t => t.거래금액);
    const totalCount = filtered.length;
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / totalCount);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    document.getElementById('totalCount').textContent = `${totalCount}건`;
    document.getElementById('avgPrice').textContent = formatPrice(avgPrice);
    document.getElementById('maxPrice').textContent = formatPrice(maxPrice);
    document.getElementById('minPrice').textContent = formatPrice(minPrice);
  }

  /**
   * 탭과 동 필터에 따라 필터링된 거래 반환
   */
  getFilteredTrades() {
    let filtered = this.trades;

    // 탭 필터링
    if (this.currentTab !== 'all') {
      const tabInfo = this.apartmentTabs.get(this.currentTab);
      if (tabInfo) {
        filtered = filtered.filter(t =>
          t.아파트명 === tabInfo.name && t.주소 === tabInfo.address
        );
      }
    }

    // 동 필터링
    if (this.currentDongFilter) {
      filtered = filtered.filter(t => t.법정동 === this.currentDongFilter);
    }

    return filtered;
  }

  updateDongFilter() {
    const dongFilter = document.getElementById('dongFilter');
    const dongFilterTopSelect = document.getElementById('dongFilterTopSelect');
    const dongFilterTop = document.getElementById('dongFilterTop');

    // 고유한 동 목록 추출 (가나다순 정렬)
    const dongSet = new Set(this.trades.map(t => t.법정동).filter(d => d));
    const dongList = Array.from(dongSet).sort((a, b) =>
      a.localeCompare(b, 'ko-KR')
    );

    // 첫 번째 옵션 텍스트 결정 및 중복 방지
    let firstOptionText;
    let filteredDongList = dongList;

    if (this.searchedDong) {
      // 검색 시 동을 선택한 경우
      firstOptionText = `${this.searchedDong} (${this.trades.length}건)`;
      // 중복 방지: dongList에서 검색한 동 제거
      filteredDongList = dongList.filter(dong => dong !== this.searchedDong);
    } else {
      // 전체 동으로 검색한 경우
      firstOptionText = `전체 동 (${this.trades.length}건)`;
    }

    const optionsHTML = `
      <option value="">${firstOptionText}</option>
      ${filteredDongList.map(dong => {
        const count = this.trades.filter(t => t.법정동 === dong).length;
        return `<option value="${dong}">${dong} (${count}건)</option>`;
      }).join('')}
    `;

    // 우측 패널 드롭다운 업데이트
    if (dongFilter) {
      dongFilter.innerHTML = optionsHTML;
    }

    // 상단 드롭다운 업데이트 및 표시
    if (dongFilterTopSelect) {
      dongFilterTopSelect.innerHTML = optionsHTML;
    }
    if (dongFilterTop) {
      dongFilterTop.classList.remove('hidden');
    }

    // 필터 초기화
    this.currentDongFilter = '';
  }

  renderResults() {
    const resultList = document.getElementById('resultList');
    if (!resultList) return;

    // 탭과 동 필터링 적용
    let filtered = this.getFilteredTrades();

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      switch (this.currentSort) {
        case 'date-desc':
          return b.거래일자.localeCompare(a.거래일자);
        case 'date-asc':
          return a.거래일자.localeCompare(b.거래일자);
        case 'price-desc':
          return b.거래금액 - a.거래금액;
        case 'price-asc':
          return a.거래금액 - b.거래금액;
        case 'area-desc':
          return b.전용면적 - a.전용면적;
        case 'area-asc':
          return a.전용면적 - b.전용면적;
        default:
          return 0;
      }
    });

    // 렌더링
    resultList.innerHTML = sorted.map(trade => `
      <div class="result-card" data-id="${trade.id}">
        <div class="result-card-header">
          <div>
            <div class="result-card-title">${trade.아파트명}</div>
            <div class="result-card-address">${trade.주소}</div>
          </div>
          <div class="result-card-price">${formatPrice(trade.거래금액)}</div>
        </div>
        <div class="result-card-body">
          <div class="result-card-info">
            <span class="result-card-label">거래일</span>
            <span>${formatDate(trade.거래일자)}</span>
          </div>
          <div class="result-card-info">
            <span class="result-card-label">면적</span>
            <span>${trade.전용면적}㎡ (${areaToPyung(trade.전용면적)})</span>
          </div>
          <div class="result-card-info">
            <span class="result-card-label">층</span>
            <span>${trade.층}층</span>
          </div>
          <div class="result-card-info">
            <span class="result-card-label">건축년도</span>
            <span>${trade.건축년도}년</span>
          </div>
        </div>
        ${trade.해제여부 ? `<div class="result-card-warning">거래 해제</div>` : ''}
      </div>
    `).join('');

    // 거래 카드 클릭 이벤트 추가
    document.querySelectorAll('.result-card').forEach(card => {
      card.addEventListener('click', () => {
        const tradeId = card.getAttribute('data-id');

        // 기존 강조 제거
        document.querySelectorAll('.result-card').forEach(c => {
          c.classList.remove('highlighted');
        });

        // 클릭한 카드 강조
        card.classList.add('highlighted');

        // 지도에서 마커 강조
        this.mapView.highlightMarker(tradeId);

        // 3초 후 강조 제거
        setTimeout(() => {
          card.classList.remove('highlighted');
        }, 3000);
      });
    });
  }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

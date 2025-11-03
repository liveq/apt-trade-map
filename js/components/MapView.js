/**
 * MapView Component - OpenLayers + VWorld
 * 대중적인 부동산 앱 스타일 (네이버 부동산, 직방, 다방)
 */

import { CONFIG } from '../config.js';
import { REGION_COORDS } from '../../data/regionCoords.js';

export class MapView {
  constructor(containerId, onMarkerClick) {
    this.containerId = containerId;
    this.map = null;
    this.markerLayer = null;
    this.popupOverlay = null;
    this.currentRegion = null;
    this.onMarkerClick = onMarkerClick; // 마커 클릭 콜백
    this.init();
  }

  /**
   * 지도 초기화
   */
  init() {
    // VWorld 타일 소스
    const vworldSource = new ol.source.XYZ({
      url: `https://api.vworld.kr/req/wmts/1.0.0/${CONFIG.VWORLD_API_KEY}/Base/{z}/{y}/{x}.png`,
      crossOrigin: 'anonymous'
    });

    // 타일 레이어
    const tileLayer = new ol.layer.Tile({
      source: vworldSource,
      minZoom: 5,
      maxZoom: 19
    });

    // 마커 레이어 (빈 상태로 생성)
    this.markerLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      zIndex: 10
    });

    // 팝업 엘리먼트
    const popupElement = document.createElement('div');
    popupElement.className = 'ol-popup';
    popupElement.innerHTML = `
      <div class="ol-popup-content"></div>
      <div class="ol-popup-closer"></div>
    `;

    // 팝업 오버레이
    this.popupOverlay = new ol.Overlay({
      element: popupElement,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10]
    });

    // 서울시청 좌표 (EPSG:3857 투영)
    const seoulCenter = ol.proj.fromLonLat([
      CONFIG.DEFAULT_CENTER.lng,
      CONFIG.DEFAULT_CENTER.lat
    ]);

    // 지도 생성
    this.map = new ol.Map({
      target: this.containerId,
      layers: [tileLayer, this.markerLayer],
      overlays: [this.popupOverlay],
      view: new ol.View({
        projection: 'EPSG:3857',
        center: seoulCenter,
        zoom: CONFIG.DEFAULT_ZOOM
      })
    });

    // 팝업 닫기 버튼 이벤트
    const closer = popupElement.querySelector('.ol-popup-closer');
    closer.addEventListener('click', () => {
      this.popupOverlay.setPosition(undefined);
    });

    // 마커 클릭 이벤트
    this.map.on('click', (evt) => {
      const feature = this.map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
      if (feature && feature.get('trade')) {
        const trade = feature.get('trade');
        const count = feature.get('count') || 1;
        this.showPopup(trade, evt.coordinate, count);

        // 마커 클릭 콜백 호출 (우측 패널 연동)
        if (this.onMarkerClick) {
          this.onMarkerClick(trade);
        }
      } else {
        this.popupOverlay.setPosition(undefined);
      }
    });

    // 마커 호버 커서 변경
    this.map.on('pointermove', (evt) => {
      const pixel = this.map.getEventPixel(evt.originalEvent);
      const hit = this.map.hasFeatureAtPixel(pixel);
      const targetElement = this.map.getTargetElement();
      if (targetElement) {
        targetElement.style.cursor = hit ? 'pointer' : '';
      }
    });

    // 지도 이동/확대축소 시 팝업 닫기
    this.map.on('movestart', () => {
      this.popupOverlay.setPosition(undefined);
    });

    // 컨트롤 버튼 이벤트
    this.attachControls();

    console.log('지도 초기화 완료');
  }

  /**
   * 컨트롤 버튼 이벤트
   */
  attachControls() {
    const myLocationBtn = document.getElementById('myLocation');

    // resetMap 버튼은 app.js에서 처리 (마커, 데이터 등 전체 초기화)

    if (myLocationBtn) {
      myLocationBtn.addEventListener('click', () => {
        this.goToUserLocation();
      });
    }
  }

  /**
   * 지도 초기화 (서울시청)
   */
  resetView() {
    const seoulCenter = ol.proj.fromLonLat([
      CONFIG.DEFAULT_CENTER.lng,
      CONFIG.DEFAULT_CENTER.lat
    ]);
    this.map.getView().animate({
      center: seoulCenter,
      zoom: CONFIG.DEFAULT_ZOOM,
      duration: 500
    });
  }

  /**
   * 내 위치로 이동
   */
  goToUserLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const userCoords = ol.proj.fromLonLat([longitude, latitude]);
          this.map.getView().animate({
            center: userCoords,
            zoom: 15,
            duration: 500
          });
        },
        (error) => {
          alert('위치 정보를 가져올 수 없습니다.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
    }
  }

  /**
   * 특정 지역으로 이동 (하드코딩된 좌표 사용)
   */
  moveToRegion(sigunguCode) {
    // 하드코딩된 좌표 가져오기
    const coords = REGION_COORDS[sigunguCode] || REGION_COORDS['default'];

    const center = ol.proj.fromLonLat([coords.lng, coords.lat]);
    this.map.getView().animate({
      center: center,
      zoom: 13,
      duration: 500
    });

    console.log(`지도 이동: ${sigunguCode} -> ${coords.lat}, ${coords.lng}`);
  }

  /**
   * 거래 마커 추가 (부동산 앱 스타일)
   */
  async addTradeMarkers(trades, sigunguCode) {
    if (!trades || trades.length === 0) {
      this.clearMarkers();
      return;
    }

    this.clearMarkers();

    // 기본 좌표 (시군구 중심)
    const baseCoords = REGION_COORDS[sigunguCode] || REGION_COORDS['default'];

    // 같은 아파트별로 그룹화
    const groups = {};
    trades.forEach(trade => {
      const key = `${trade.법정동}_${trade.아파트명}`;
      if (!groups[key]) {
        groups[key] = {
          trades: [],
          representative: trade
        };
      }
      groups[key].trades.push(trade);
    });

    const features = [];

    // 각 그룹별로 마커 생성 (랜덤 오프셋으로 분산 배치)
    Object.values(groups).forEach((group, index) => {
      const trade = group.representative;

      // 기본 좌표에서 랜덤 오프셋 추가 (0.005도 = 약 500m)
      const offset = 0.01;
      const randomLat = baseCoords.lat + (Math.random() - 0.5) * offset;
      const randomLng = baseCoords.lng + (Math.random() - 0.5) * offset;

      const feature = this.createPriceMarker(
        { lng: randomLng, lat: randomLat },
        trade,
        group.trades.length
      );
      features.push(feature);
    });

    // 마커 레이어에 추가
    const source = this.markerLayer.getSource();
    source.addFeatures(features);

    // 모든 마커가 보이도록 뷰 조정
    if (features.length > 0) {
      const extent = source.getExtent();
      this.map.getView().fit(extent, {
        padding: [80, 80, 80, 80],
        maxZoom: 14,
        duration: 500
      });
    }

    console.log(`${features.length}개 마커 표시 완료`);
  }

  /**
   * 가격 표시 마커 생성 (부동산 앱 스타일)
   */
  createPriceMarker(coords, trade, count) {
    const lonLat = [coords.lng, coords.lat];
    const position = ol.proj.fromLonLat(lonLat);

    // 마커 스타일 생성 (재사용 가능한 메서드 사용)
    const markerStyle = this.createPriceMarkerStyle(trade, count);

    const feature = new ol.Feature({
      geometry: new ol.geom.Point(position)
    });

    feature.setStyle(markerStyle);
    feature.set('trade', trade);
    feature.set('count', count);

    return feature;
  }

  /**
   * 가격 짧은 형식 (마커용)
   */
  formatPriceShort(price) {
    if (!price || isNaN(price)) return '0';

    const priceNum = parseInt(price.toString().replace(/,/g, ''));
    const 억 = Math.floor(priceNum / 10000);
    const 만 = Math.floor((priceNum % 10000) / 1000) * 1000;

    if (억 > 0 && 만 > 0) {
      return `${억}.${Math.floor(만/1000)}억`;
    } else if (억 > 0) {
      return `${억}억`;
    } else if (만 > 0) {
      return `${만/1000}천만`;
    } else {
      return `${priceNum}만`;
    }
  }

  /**
   * 가격 긴 형식 (팝업용)
   */
  formatPriceLong(price) {
    if (!price || isNaN(price)) return '0원';

    const priceNum = parseInt(price.toString().replace(/,/g, ''));
    const 억 = Math.floor(priceNum / 10000);
    const 만 = priceNum % 10000;

    let result = '';
    if (억 > 0) result += `${억}억 `;
    if (만 > 0) result += `${만.toLocaleString()}만원`;
    else if (억 > 0) result += '원';
    else result = '0원';

    return result.trim();
  }

  /**
   * 면적 평수 변환
   */
  areaToPyung(area) {
    if (!area || isNaN(area)) return '0평';
    return `${Math.round(parseFloat(area) / 3.3058)}평`;
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
  }

  /**
   * 팝업 표시
   */
  showPopup(trade, coordinate, tradeCount = 1) {
    const content = this.popupOverlay.getElement().querySelector('.ol-popup-content');

    content.innerHTML = `
      <div class="popup-title">${trade.아파트명}</div>
      <div class="popup-address">${trade.주소}</div>
      <div class="popup-price">${this.formatPriceLong(trade.거래금액)}</div>
      <div class="popup-info">
        <div>${trade.전용면적}㎡ (${this.areaToPyung(trade.전용면적)})</div>
        <div>${trade.층}층 · ${trade.건축년도}년</div>
        <div>${this.formatDate(trade.거래일자)} 거래</div>
      </div>
      ${tradeCount > 1 ? `
        <button class="popup-show-all" data-trade-id="${trade.id}">
          ${tradeCount}건 모두 보기 →
        </button>
      ` : ''}
    `;

    // "모두 보기" 버튼 클릭 이벤트
    const showAllBtn = content.querySelector('.popup-show-all');
    if (showAllBtn && this.onMarkerClick) {
      showAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onMarkerClick(trade);
      });
    }

    this.popupOverlay.setPosition(coordinate);
  }

  /**
   * 모든 마커 제거
   */
  clearMarkers() {
    const source = this.markerLayer.getSource();
    source.clear();
    this.popupOverlay.setPosition(undefined);
  }

  /**
   * 현재 지도 화면에 보이는 영역의 경계 좌표 가져오기
   * @returns {Object} { minLng, minLat, maxLng, maxLat }
   */
  getCurrentBounds() {
    const view = this.map.getView();
    const extent = view.calculateExtent(this.map.getSize());

    // EPSG:3857 -> EPSG:4326 (경위도) 변환
    const bottomLeft = ol.proj.toLonLat([extent[0], extent[1]]);
    const topRight = ol.proj.toLonLat([extent[2], extent[3]]);

    return {
      minLng: bottomLeft[0],
      minLat: bottomLeft[1],
      maxLng: topRight[0],
      maxLat: topRight[1]
    };
  }

  /**
   * 현재 화면 영역에 포함되는 시군구 코드 찾기
   * @returns {Array<string>} 시군구 코드 배열
   */
  getVisibleRegions() {
    const bounds = this.getCurrentBounds();
    const visibleRegions = [];

    // REGION_COORDS에서 화면 안에 있는 시군구 찾기
    for (const [code, coords] of Object.entries(REGION_COORDS)) {
      if (code === 'default') continue;

      // 시군구 좌표가 현재 화면 bounds 안에 있는지 확인
      if (
        coords.lng >= bounds.minLng &&
        coords.lng <= bounds.maxLng &&
        coords.lat >= bounds.minLat &&
        coords.lat <= bounds.maxLat
      ) {
        visibleRegions.push(code);
      }
    }

    return visibleRegions;
  }

  /**
   * 특정 거래의 마커를 강조
   * @param {string} tradeId - 거래 ID
   */
  highlightMarker(tradeId) {
    // 기존 팝업 닫기
    this.popupOverlay.setPosition(undefined);

    const source = this.markerLayer.getSource();
    const features = source.getFeatures();

    let targetFeature = null;

    features.forEach(feature => {
      const trade = feature.get('trade');
      const count = feature.get('count');

      if (trade && trade.id === tradeId) {
        // 강조된 마커 스타일 (빨간색)
        const highlightStyle = this.createHighlightMarkerStyle(trade, count);
        feature.setStyle(highlightStyle);

        // 마커 위치 저장
        targetFeature = feature;

        // 마커 위치로 지도 이동 (부드럽게)
        const geometry = feature.getGeometry();
        const coordinate = geometry.getCoordinates();
        this.map.getView().animate({
          center: coordinate,
          duration: 500
        });
      } else {
        // 다른 마커는 기본 스타일로
        const normalStyle = this.createPriceMarkerStyle(trade, count);
        feature.setStyle(normalStyle);
      }
    });

    // 팝업 표시
    if (targetFeature) {
      const trade = targetFeature.get('trade');
      const count = targetFeature.get('count') || 1;
      const geometry = targetFeature.getGeometry();
      const coordinate = geometry.getCoordinates();

      // 약간의 딜레이 후 팝업 표시 (지도 이동 애니메이션 후)
      setTimeout(() => {
        this.showPopup(trade, coordinate, count);
      }, 300);
    }
  }

  /**
   * 강조된 마커 스타일 생성
   */
  createHighlightMarkerStyle(trade, count) {
    const priceText = this.formatPriceShort(trade.거래금액);

    return new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
          <svg width="80" height="40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="3" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect x="5" y="5" width="70" height="28" rx="14"
              fill="#ef4444" filter="url(#shadow)"/>
            <text x="40" y="23" text-anchor="middle"
              font-family="Noto Sans KR, sans-serif"
              font-size="13" font-weight="700" fill="#ffffff">${priceText}</text>
            ${count > 1 ? `
              <circle cx="70" cy="10" r="8" fill="#ffffff"/>
              <text x="70" y="13" text-anchor="middle"
                font-family="sans-serif" font-size="10"
                font-weight="bold" fill="#ef4444">${count}</text>
            ` : ''}
          </svg>
        `)
      })
    });
  }

  /**
   * 기본 마커 스타일 생성 (재사용 가능하도록 별도 메서드)
   */
  createPriceMarkerStyle(trade, count) {
    const priceText = this.formatPriceShort(trade.거래금액);

    return new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
          <svg width="80" height="40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect x="5" y="5" width="70" height="28" rx="14"
              fill="#d4af37" filter="url(#shadow)"/>
            <text x="40" y="23" text-anchor="middle"
              font-family="Noto Sans KR, sans-serif"
              font-size="13" font-weight="700" fill="#ffffff">${priceText}</text>
            ${count > 1 ? `
              <circle cx="70" cy="10" r="8" fill="#ef4444"/>
              <text x="70" y="13" text-anchor="middle"
                font-family="sans-serif" font-size="10"
                font-weight="bold" fill="#ffffff">${count}</text>
            ` : ''}
          </svg>
        `)
      })
    });
  }
}

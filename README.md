# 🏢 BAAL 아파트 실거래가 조회

[![Live Demo](https://img.shields.io/badge/Demo-apt.baal.co.kr-blue)](https://apt.baal.co.kr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

대한민국 전국 아파트 실거래가를 **지도에서 실시간**으로 확인할 수 있는 무료 부동산 정보 서비스입니다.

🔗 **[apt.baal.co.kr](https://apt.baal.co.kr)**

---

## ✨ 주요 기능

- 🗺️ **지도 기반 시각화** - VWorld Maps를 활용한 인터랙티브 지도
- 🔍 **지역별 검색** - 시/도, 구/군, 동 단위 검색
- 📅 **기간별 조회** - 최근 12개월 거래 데이터
- 📊 **실시간 통계** - 평균가, 최고가, 최저가 자동 계산
- 🏷️ **다중 거래 표시** - 같은 아파트의 여러 거래 건수 표시
- 📍 **현재 화면 검색** - 지도에 보이는 모든 지역 일괄 조회
- 🎯 **양방향 연동** - 지도 마커 ↔ 거래 목록 실시간 연동
- 📑 **탭 시스템** - 아파트별 거래 정보 탭으로 구분
- 📱 **반응형 디자인** - 모바일/태블릿/데스크톱 최적화

---

## 🚀 기술 스택

### Frontend
- **Vanilla JavaScript (ES6 Modules)** - 프레임워크 없는 순수 JavaScript
- **OpenLayers 8** - 오픈소스 지도 렌더링 라이브러리
- **CSS3** - 커스텀 디자인 시스템

### API & Data
- **국토교통부 아파트 실거래가 API** - 공공데이터포털
- **VWorld Maps API** - 브이월드 무료 지도 타일

### Deployment
- **Cloudflare Pages** - 자동 배포 및 CDN
- **GitHub Actions** - CI/CD 파이프라인

---

## 📁 프로젝트 구조

```
apt-trade-map/
├── index.html              # 메인 HTML
├── css/
│   └── map-layout.css      # 스타일시트
├── js/
│   ├── app.js              # 메인 앱 로직
│   ├── api/
│   │   └── aptApi.js       # API 통신 모듈
│   ├── components/
│   │   ├── MapView.js      # 지도 컴포넌트
│   │   └── SearchForm.js   # 검색 폼 컴포넌트
│   └── utils/
│       └── helpers.js      # 유틸리티 함수
├── data/
│   └── dongData.js         # 전국 행정동 데이터
├── robots.txt              # SEO 크롤러 설정
├── sitemap.xml             # 사이트맵
└── README.md               # 프로젝트 문서
```

---

## 🛠️ 로컬 개발 환경

### 1. 리포지토리 클론

```bash
git clone https://github.com/liveq/apt-trade-map.git
cd apt-trade-map
```

### 2. 로컬 서버 실행

정적 파일이므로 간단한 HTTP 서버로 실행:

```bash
# Python 3
python -m http.server 8080

# Node.js (http-server)
npx http-server -p 8080

# PHP
php -S localhost:8080
```

### 3. 브라우저에서 열기

```
http://localhost:8080
```

---

## 🌐 배포

### Cloudflare Pages 자동 배포

1. **GitHub 리포지토리 연결**
   - Cloudflare Pages에서 `liveq/apt-trade-map` 연동

2. **빌드 설정**
   - Build command: (비워두기)
   - Build output directory: `/`

3. **커스텀 도메인 설정**
   - `apt.baal.co.kr` 연결
   - DNS 자동 설정

4. **자동 배포**
   - `main` 브랜치에 푸시하면 자동 배포

---

## 📊 데이터 출처

- **아파트 실거래가**: [국토교통부 실거래가 공개시스템](http://rtms.molit.go.kr/)
- **지도 타일**: [VWorld (브이월드)](https://www.vworld.kr/)
- **행정구역 코드**: [행정표준코드관리시스템](https://www.code.go.kr/)

---

## 🔒 개인정보처리방침

본 서비스는 **사용자 정보를 수집하지 않습니다**.
- 모든 데이터 조회는 브라우저 내에서 직접 수행
- 서버로 개인정보 전송 없음
- Google AdSense 광고 쿠키 사용 가능

자세한 내용은 [개인정보처리방침](https://apt.baal.co.kr)을 참고하세요.

---

## 📝 라이선스

이 프로젝트는 [MIT License](LICENSE)로 배포됩니다.

```
MIT License

Copyright (c) 2025 BAAL

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 문의

- **이메일**: summon@baal.co.kr
- **웹사이트**: [https://baal.co.kr](https://baal.co.kr)
- **서비스**: [https://apt.baal.co.kr](https://apt.baal.co.kr)

---

## 🌟 Star History

프로젝트가 도움이 되었다면 ⭐️ 스타를 눌러주세요!

---

**Made with ❤️ by BAAL**

# intern_project

2026년 상반기 청년인턴 정책제안 프로젝트 성과 발표회 대상 수상

국가데이터처 청년인턴으로서 국가 통계 데이터(KOSIS, SGIS)를 활용해 제안한 정책 4건을 모은 저장소입니다.

## 프로젝트 구성

### 1. [`API/`](./API) — KOSIS 메타데이터 기반 통계 AI 가드레일
비정형 통계 주석(유의사항, 조사연혁 등)을 파싱해 `[시계열단절]`, `[단위주의]` 같은 구조화 태그로 변환하고 이 태그가 있을 때/없을 때 LLM 응답이 어떻게 달라지는지 비교 실험한 결과물입니다.
- 자세한 내용: [`API/README.md`](./API/README.md)
- 수집 파이프라인: [`STEP1_파이썬_api_호출.md`](./API/STEP1_파이썬_api_호출.md)
- 실험 설계: [`STEP2_챗봇_실험_가이드라인.md`](./API/STEP2_챗봇_실험_가이드라인.md)

### 2. [`Dest/`](./Dest) — 데스트(Data+Test): 국민 참여형 데이터 체험 콘텐츠
국가데이터처「생활시간조사」통계를 기반으로 개인의 일상 피로도를 또래 평균과 비교해주는 MBTI형 진단 테스트("번아웃 식빵 테스트"). 

React + Vite + TypeScript 프론트엔드.

실제 데모: https://dest-jkwdxylr8-huihui6.vercel.app/

### 3. [`SGIS 지역현안 소통지도/`](./SGIS%20지역현안%20소통지도) — "가까울지도"
SGIS(통계지리정보서비스) 지역현안 소통지도를 활용해 영유아·반려동물 동반·이동약자·외국인 거주자 등 사회적 약자를 위한 생활편의 정보를 지도에 등록·공유하는 정책 제안서.

### 4. 공공데이터 지역격차 실시간 모니터링 BI 대시보드 구축 (별도 산출물 없음)
전국 기초지자체 간 공공데이터 제공 수준 격차를 모니터링하는 BI 대시보드 구축 제안. 별도 코드/폴더 없이 제안서(PDF) 내용 참고.

## 실행 방법 (Dest 웹 데모)

```bash
cd Dest/dest
npm install
npm run dev
```

## 디렉토리 구조

```text
intern_project/
├── API/                          # KOSIS 메타데이터 태그화 & LLM 가드레일 실험
├── Dest/                         # 데스트(Data+Test) 웹 서비스 (React + Vite)
└── SGIS 지역현안 소통지도/        # "가까울지도" 정책 제안서
```

## Tech Stack

Python, Pandas · React, TypeScript, Vite · KOSIS/SGIS Open API

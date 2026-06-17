---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section { font-family: 'Malgun Gothic', sans-serif; }
  h1 { color: #574e45; }
  strong { color: #FFB700; }
---

# admin-portal + admin-marketing
## Module Federation 기반 관리자 포털 아키텍처

- GitHub: dmsej108/admin-portal · admin-marketing

---

# 왜 MFE인가?

**문제**
- 관리자 포털 메뉴: 개인 / 기업 / 공통 / 마케팅 / …
- 팀·도메인별로 개발·배포 주기가 다름
- 모놀리식 앱 → 빌드 느림, 배포 영향 범위 큼

**해결: Shell + Remote**

| 구분 | 역할 |
|------|------|
| Host (admin-portal) | 레이아웃, 메뉴, 라우팅 껍데기 |
| Remote (admin-marketing 등) | 업무 페이지 실제 구현 |

→ 팀별 독립 개발·배포 + 하나의 UI처럼 통합

---

# 전체 아키텍처

```
[사용자 브라우저]
       ↓
[admin-portal Host]  Header / Sidebar / Router
       ↓ fetch manifest
[admin-marketing Remote]
  mf-manifest.json → remoteEntry.js → EventListPage
```

**배포 URL**
- Host: https://dmsej108.github.io/admin-portal/
- Remote: https://dmsej108.github.io/admin-marketing/

**기술 스택:** React 19 · Vite 6 · TypeScript · Module Federation

---

# Host vs Remote 비교

| | admin-portal (Host) | admin-marketing (Remote) |
|--|---------------------|--------------------------|
| 역할 | Shell | 업무 앱 |
| UI | Header, Sidebar | 페이지만 |
| 메뉴 | menu.ts | 없음 |
| MFE | remotes (불러오기) | exposes (보내기) |
| manifest | URL 읽기 | JSON 생성·배포 |
| 라우팅 | React Router 소유 | Host Router 안에서 동작 |

---

# admin-portal 구조

```
admin-portal/
├── components/layout/   Header, Sidebar, Container
├── lib/config/
│   ├── menu.ts          전체 메뉴
│   ├── mf.registry.ts   Remote 목록
│   ├── remoteRoutes.ts  URL → remote/module
│   └── remoteModules.ts lazy import
├── vite/mf.build.ts
└── App.tsx
```

**핵심:** 어떤 URL에 어떤 Remote 페이지를 붙일지 Host가 결정

---

# admin-portal — Remote 등록

**mf.registry.ts**
- adminMarketing → enabled: true
- adminPersonal → enabled: false (예정)
- adminCommon → enabled: false (예정)

**remoteRoutes.ts**
- /marketing/event → EventListPage
- /marketing/event/regist → EventRegistPage
- /marketing/event/detail/:id → EventDetailPage

새 Remote 추가 = registry + routes + modules + remote.d.ts

---

# admin-marketing 구조

```
admin-marketing/
├── src/pages/           EventList / Regist / Detail
├── vite.config.ts       federation exposes
├── scripts/generate-mf-manifest.mjs
└── dist/
    ├── mf-manifest.json
    └── releases/0.1.0/assets/remoteEntry.js
```

**핵심:** 페이지 구현 + expose + manifest 생성·배포

---

# admin-marketing — expose

```ts
federation({
  name: 'adminMarketing',
  exposes: {
    './EventListPage':  './src/pages/EventListPage.tsx',
    './EventRegistPage': './src/pages/EventRegistPage.tsx',
    './EventDetailPage': './src/pages/EventDetailPage.tsx',
  },
})
```

Host에서: `import('adminMarketing/EventListPage')`

---

# manifest — 연결 계약서

**marketing이 생성**
```json
"remoteEntry": "https://dmsej108.github.io/admin-marketing/releases/0.1.0/assets/remoteEntry.js"
```

**portal이 참조**
```
VITE_MF_MARKETING_MANIFEST_URL
= https://dmsej108.github.io/admin-marketing/mf-manifest.json
```

**왜 manifest?** remoteEntry 경로가 버전별로 바뀔 수 있어서

---

# 빌드 — admin-marketing

```
pnpm build
  ① tsc
  ② vite build → remoteEntry.js
  ③ postbuild → mf-manifest.json
  ④ releases/0.1.0/assets/ 복사
```

```
VITE_MF_PUBLIC_ORIGIN=https://dmsej108.github.io
VITE_BASE_PATH=/admin-marketing/
```

---

# 빌드 — admin-portal

```
pnpm build
  ① loadEnv(.env.production)
  ② mf.registry → remotes 등록
  ③ vite build → Host 번들
```

```
VITE_MF_MARKETING_MANIFEST_URL=https://.../mf-manifest.json
```

**배포 순서:** marketing 먼저 → portal 나중

---

# 런타임 흐름 (1/2)

**사용자가 /marketing/event 접속**

1. admin-portal 로드 (Host)
2. React Router → /marketing/event 매칭
3. remoteRoutes → adminMarketing/EventListPage

---

# 런타임 흐름 (2/2)

4. fetch(mf-manifest.json) → remoteEntry URL
5. remoteEntry.js 로드
6. import('adminMarketing/EventListPage')
7. Host 레이아웃 안에 Remote 페이지 렌더링

```
┌──────────────────────────────┐
│ Header (portal)              │
├────────┬─────────────────────┤
│ Sidebar│ EventList (marketing)│
└────────┴─────────────────────┘
```

---

# 환경 변수 설계

| 변수 | 프로젝트 | 용도 |
|------|----------|------|
| VITE_BASE_PATH | 양쪽 | Pages 서브경로 |
| VITE_MF_PUBLIC_ORIGIN | marketing | manifest 도메인 |
| VITE_MF_MARKETING_MANIFEST_URL | portal | manifest URL |

- localhost fallback 없음
- env 없으면 빌드 실패

---

# GitHub Pages 배포

| Repo | URL |
|------|-----|
| admin-marketing | dmsej108.github.io/admin-marketing |
| admin-portal | dmsej108.github.io/admin-portal |

**확인:** manifest 200 · remoteEntry 200 · 이벤트 목록 로드

---

# Remote 확장 (admin-personal)

1. **admin-personal repo** — 페이지 + exposes + manifest + 배포
2. **admin-portal** — registry enabled + env + routes + modules

→ marketing과 동일 패턴 반복

---

# 정리

| | portal | marketing |
|--|--------|-----------|
| 비유 | 앱 껍데기 | 화면 조각 |
| 연결 | manifest 읽기 | manifest 생성 |
| 배포 | Remote URL 참조 | 먼저 배포 필요 |

**기업 MFE:** 팀별 독립 repo → Host가 런타임에 조합

---

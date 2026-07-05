# admin-portal + admin-marketing MFE 아키텍처 가이드

> 외부 업체·협업 팀 onboarding용 설명서  
> 기준: 실제 코드 (Next.js 14 + Module Federation)  
> 최종 갱신: 2026-07-05

| 저장소 | GitHub | 역할 |
|--------|--------|------|
| admin-portal | [dmsej108/admin-portal](https://github.com/dmsej108/admin-portal) | Host — 레이아웃, 메뉴, 라우팅 |
| admin-marketing | [dmsej108/admin-marketing](https://github.com/dmsej108/admin-marketing) | Remote — 마케팅 페이지 구현 |

---

## 1. 한 줄 요약

**admin-portal**은 관리자 화면의 **Shell(껍데기)** 이고, **admin-marketing**은 마케팅 업무 **페이지 조각(Remote)** 입니다.

두 저장소는 **Webpack Module Federation**(`@module-federation/nextjs-mf`)으로 런타임에 연결되며, 사용자에게는 **하나의 관리자 포털**처럼 보입니다.

---

## 2. 왜 MFE(마이크로 프론트엔드)인가?

### 2.1 배경

관리자 포털 메뉴는 **개인 / 기업 / 공통 / 마케팅 / 금융상품 / 고객서비스 / 데이터 / 권한** 등 도메인별로 나뉩니다.  
팀·도메인마다 개발·배포 주기가 다르고, 모놀리식으로 묶으면:

- 빌드 시간 증가
- 한 팀 배포가 전체에 영향
- 코드 소유권·저장소 경계가 불명확

### 2.2 해결 방식: Shell + Remote

```
┌─────────────────────────────────────────────────────────┐
│  admin-portal (Host)                                     │
│  ┌──────────┬──────────────────────────────────────────┐ │
│  │ Header   │  (공통 상단)                              │ │
│  ├──────────┼──────────────────────────────────────────┤ │
│  │ Sidebar  │  Remote 페이지 영역                       │ │
│  │ (메뉴)   │  ← admin-marketing 등에서 동적 로드       │ │
│  └──────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

| 구분 | 역할 |
|------|------|
| **Host** | 공통 UI(Header, Sidebar, Breadcrumb) + URL → Remote 매핑 |
| **Remote** | 업무 페이지만 구현하고 **expose**로 외부에 공개 |

→ **팀별 독립 repo·배포** + **하나의 UX** 유지

---

## 3. 기술 스택

| 항목 | admin-portal | admin-marketing |
|------|--------------|-----------------|
| 프레임워크 | Next.js 14 (Pages Router) | Next.js 14 (Pages Router) |
| MFE | `@module-federation/nextjs-mf` 8.8.56 | 동일 |
| UI | `@dmsej108/design-system` | 동일 + ag-grid, react-hook-form |
| 상태 | zustand, react-query | zustand, react-query |
| 빌드 | Webpack (Next 내장) | Webpack (Next 내장) |
| 배포 | GitHub Pages (정적 export) | GitHub Pages (정적 export) |
| 로컬 포트 | **3000** | **3001** |

---

## 4. 전체 연동 구조

```
[사용자 브라우저]
       │
       ▼  /admin-portal/marketing/event/
┌──────────────────────────────────────────────────┐
│ admin-portal (Host)                               │
│  Header + Sidebar + Breadcrumb                    │
│  pages/[...slug].tsx                              │
│    → matchRemoteRoute()                           │
│    → RemotePageLoader                             │
│    → import('adminMarketing/EventListPage')       │
└──────────────────────┬───────────────────────────┘
                       │ fetch remoteEntry.js
                       ▼
┌──────────────────────────────────────────────────┐
│ admin-marketing (Remote)                          │
│  _next/static/chunks/remoteEntry.js               │
│    → EventListPage / EventRegistPage / Detail     │
│  styles/admin.css (Host가 <link>로 주입)          │
└──────────────────────────────────────────────────┘
```

### 4.1 배포 URL (GitHub Pages)

| 앱 | URL |
|----|-----|
| Host | `https://dmsej108.github.io/admin-portal/` |
| Remote | `https://dmsej108.github.io/admin-marketing/` |
| remoteEntry | `https://dmsej108.github.io/admin-marketing/_next/static/chunks/remoteEntry.js` |
| Remote CSS | `https://dmsej108.github.io/admin-marketing/styles/admin.css` |

---

## 5. admin-portal (Host) 상세

### 5.1 책임

| 영역 | 담당 | 파일 |
|------|------|------|
| 공통 레이아웃 | Header, Sidebar, Breadcrumb | `components/layout/Container.tsx` |
| 전체 메뉴 정의 | 8개 대메뉴, 수백 개 leaf 메뉴 | `lib/config/menu.ts` |
| URL → Remote 매핑 | 실제 연결된 페이지만 등록 | `lib/config/remoteModules.ts` |
| Remote 로딩 | dynamic import + CSS 주입 | `components/remote/RemotePageLoader.tsx` |
| MFE remotes 등록 | webpack federation plugin | `next.config.mjs` |
| 미연결 페이지 | "페이지 준비 중" 표시 | `components/pages/PlaceholderPage.tsx` |

### 5.2 디렉터리 구조

```
admin-portal/
├── components/
│   ├── layout/          # Header, Sidebar, Container, Navigations
│   ├── remote/          # RemotePageLoader, useRemoteStyles
│   └── pages/           # PlaceholderPage
├── lib/config/
│   ├── menu.ts          # 전체 메뉴 트리 (Host 전용)
│   ├── mf.registry.ts   # Remote repo 목록 (enabled/disabled)
│   ├── remoteModules.ts # URL ↔ remote/module ↔ lazy loader
│   ├── remoteRoutes.ts  # remoteModules 파생
│   └── remoteStyles.ts  # Remote CSS URL 계산
├── pages/
│   ├── _app.tsx         # ShellLayout 적용
│   ├── index.tsx        # / → /marketing/event 리다이렉트
│   └── [...slug].tsx    # 모든 Remote 경로 catch-all
├── types/remote.d.ts    # federation import 타입
├── next.config.mjs      # NextFederationPlugin (remotes)
└── scripts/prepare-gh-pages.mjs
```

### 5.3 Remote 등록 (`mf.registry.ts`)

현재 Remote 후보 3개, **marketing만 활성화**:

```typescript
{ key: 'adminMarketing', remoteEntryEnvKey: 'NEXT_PUBLIC_MARKETING_REMOTE_ENTRY', enabled: true }
{ key: 'adminPersonal',  remoteEntryEnvKey: 'NEXT_PUBLIC_PERSONAL_REMOTE_ENTRY',  enabled: false }
{ key: 'adminCommon',    remoteEntryEnvKey: 'NEXT_PUBLIC_COMMON_REMOTE_ENTRY',    enabled: false }
```

### 5.4 URL → 페이지 매핑 (`remoteModules.ts`)

Host가 **어떤 URL에 어떤 Remote 컴포넌트를 붙일지** 결정합니다:

| URL | Remote | Module |
|-----|--------|--------|
| `/marketing/event` | adminMarketing | EventListPage |
| `/marketing/event/regist` | adminMarketing | EventRegistPage |
| `/marketing/event/detail/:eventId` | adminMarketing | EventDetailPage |

```typescript
loader: () => import('adminMarketing/EventListPage')
```

`menu.ts`에는 마케팅 메뉴가 40개 이상 있지만, **실제 Remote로 연결된 건 위 3개**입니다. 나머지는 PlaceholderPage가 표시됩니다.

### 5.5 라우팅 방식

- Next.js **catch-all** 페이지 `pages/[...slug].tsx` 하나로 Remote 경로 처리
- `getStaticPaths`에서 `REMOTE_MODULES` 기반으로 정적 경로 생성 (`output: 'export'`)
- 동적 파라미터(`:eventId`)는 빌드 시 `_` placeholder slug로 변환
- `matchRemoteRoute()`가 URL 패턴 매칭 (정적 > 동적 우선)

### 5.6 Module Federation 설정 (`next.config.mjs`)

```javascript
new NextFederationPlugin({
  name: 'adminPortal',
  remotes: {
    adminMarketing: 'adminMarketing@http://localhost:3001/_next/static/chunks/remoteEntry.js'
    // production: env의 NEXT_PUBLIC_MARKETING_REMOTE_ENTRY 사용
  },
})
```

---

## 6. admin-marketing (Remote) 상세

저장소: [https://github.com/dmsej108/admin-marketing](https://github.com/dmsej108/admin-marketing.git)

### 6.1 책임

| 영역 | 담당 |
|------|------|
| 마케팅 업무 페이지 UI/로직 | 이벤트 목록·등록·상세 |
| Module Federation expose | Host가 import할 진입점 |
| 단독 개발용 페이지 | `pages/marketing/event/*` |
| Remote 전용 CSS | `public/styles/admin.css` |

### 6.2 디렉터리 구조

```
admin-marketing/
├── exposes/                    # ★ Host에 expose하는 진입점
│   ├── EventListPage.tsx
│   ├── EventRegistPage.tsx
│   └── EventDetailPage.tsx
├── components/
│   ├── event/                  # 이벤트 도메인 컴포넌트
│   └── ui/                     # Searchbox, FormTitle 등
├── pages/
│   ├── marketing/event/        # 단독 dev/preview용 라우트
│   └── _app.tsx                # Shell 없음 (페이지만)
├── data/                       # mock 데이터
├── lib/                        # validate, ag-grid 설정
├── styles/ + public/styles/    # CSS (GH Pages에 복사)
├── next.config.mjs             # exposes 설정
└── scripts/prepare-gh-pages.mjs
```

### 6.3 expose vs pages — 이중 구조

| 경로 | 용도 |
|------|------|
| `exposes/EventListPage.tsx` | **Host가 import하는 공식 진입점** |
| `pages/marketing/event/index.tsx` | marketing 단독 실행 시 preview |

```tsx
// pages/marketing/event/index.tsx
import EventListPage from '@/exposes/EventListPage'
export default function EventListRoutePage() {
  return <EventListPage />
}
```

**실제 UI 로직은 `exposes/`에 한 번만 작성**하고, `pages/`는 thin wrapper입니다.

### 6.4 Module Federation expose (`next.config.mjs`)

```javascript
new NextFederationPlugin({
  name: 'adminMarketing',
  filename: 'static/chunks/remoteEntry.js',
  exposes: {
    './EventListPage':  './exposes/EventListPage.tsx',
    './EventRegistPage': './exposes/EventRegistPage.tsx',
    './EventDetailPage': './exposes/EventDetailPage.tsx',
  },
})
```

Host에서 사용:

```typescript
import('adminMarketing/EventListPage')
// = adminMarketing repo의 ./exposes/EventListPage.tsx
```

### 6.5 Remote 페이지 특성

- **Header/Sidebar 없음** — Host 레이아웃 안에 들어가는 **콘텐츠 영역만** 렌더
- `useRouter()`로 페이지 간 이동 (`/marketing/event/regist` 등) — Host URL 기준으로 동작
- ag-grid, react-hook-form, yup 등 **마케팅 도메인 전용 의존성**은 marketing repo에만 존재

---

## 7. Host ↔ Remote 연결 계약

외부 업체와 협업할 때 맞춰야 할 **인터페이스**입니다.

### 7.1 Federation 이름

| 항목 | 값 |
|------|-----|
| Remote name | `adminMarketing` (`next.config` `name`과 동일) |
| import 패턴 | `adminMarketing/{ModuleName}` |
| remoteEntry 경로 | `{origin}/_next/static/chunks/remoteEntry.js` |

### 7.2 expose 모듈명 ↔ URL (Host 기준)

| expose key | Host URL | 컴포넌트 |
|------------|----------|----------|
| `./EventListPage` | `/marketing/event` | 이벤트 목록 |
| `./EventRegistPage` | `/marketing/event/regist` | 이벤트 등록 |
| `./EventDetailPage` | `/marketing/event/detail/:eventId` | 이벤트 상세 |

**규칙**: Remote는 `exposes`만 추가하면 되고, Host는 `remoteModules.ts` + `remote.d.ts` + env + registry에 대응 항목을 추가해야 합니다.

### 7.3 스타일 분리

Remote CSS는 Host가 `<link>`로 주입합니다:

```
NEXT_PUBLIC_MARKETING_STYLES_PATH=/admin-marketing/styles/admin.css
→ remoteEntry origin + path = 절대 URL
```

marketing의 ag-grid, form 등 **도메인 전용 스타일**은 marketing repo에서 관리하고, design-system CSS는 양쪽 `_app.tsx`에서 각각 import합니다.

### 7.4 공유 라이브러리

현재 `shared: {}` — React 등을 federation shared로 강제 공유하지 않습니다.  
양쪽이 **동일 major 버전**(React 18, Next 14)을 맞추는 것이 중요합니다.

---

## 8. 런타임 흐름

사용자가 `/marketing/event` 접속 시:

```
1. 브라우저 → admin-portal HTML/JS 로드
2. _app.tsx → ShellLayout (Header + Sidebar + Breadcrumb)
3. pages/[...slug].tsx → matchRemoteRoute('/marketing/event')
4. RemotePageLoader 마운트
   ├─ useRemoteStyles('adminMarketing') → admin.css <link> 주입
   └─ dynamic(() => import('adminMarketing/EventListPage'))
5. Webpack MF → remoteEntry.js fetch (admin-marketing origin)
6. remoteEntry → EventListPage chunk 로드
7. Host contents 영역에 EventListPage 렌더
```

화면 결과:

```
┌──────────────────────────────────────────────┐
│ Header                          (portal)     │
├──────────┬───────────────────────────────────┤
│ Sidebar  │ Breadcrumb: 이벤트 > 이벤트목록조회 │
│ (portal) ├───────────────────────────────────┤
│          │ EventListPage (marketing)         │
│          │  - Searchbox, ag-grid, Pagination │
└──────────┴───────────────────────────────────┘
```

---

## 9. 로컬 개발 방법

### 9.1 터미널 1 — Remote (marketing)

```bash
cd admin-marketing
pnpm install
pnpm dev    # http://localhost:3001
```

단독 확인: `http://localhost:3001/marketing/event`

### 9.2 터미널 2 — Host (portal)

```bash
cd admin-portal
pnpm install
pnpm dev    # http://localhost:3000
```

연동 확인: `http://localhost:3000/marketing/event`

### 9.3 로컬 env (admin-portal `.env.development`)

```
NEXT_PUBLIC_MARKETING_REMOTE_ENTRY=http://localhost:3001/_next/static/chunks/remoteEntry.js
NEXT_PUBLIC_MARKETING_STYLES_PATH=/styles/admin.css
```

**marketing을 먼저 띄운 뒤 portal을 띄워야** Remote 로딩이 됩니다.

---

## 10. 빌드 & 배포

### 10.1 admin-marketing 빌드

```
pnpm build
  ① next build → remoteEntry.js + 페이지 chunk 생성
  ② postbuild (prepare-gh-pages.mjs)
     - .next/static → out/_next/static
     - public/styles → out/styles
     - index.html (placeholder)
```

배포 결과물: `out/` → GitHub Pages

### 10.2 admin-portal 빌드

```
pnpm build
  ① next build (output: 'export') → 정적 HTML
  ② postbuild → .nojekyll, 404.html 복사
```

CI env (`.github/workflows/deploy.yml`):

```
NEXT_PUBLIC_BASE_PATH=/admin-portal
NEXT_PUBLIC_MARKETING_REMOTE_ENTRY=https://dmsej108.github.io/admin-marketing/_next/static/chunks/remoteEntry.js
NEXT_PUBLIC_MARKETING_STYLES_PATH=/admin-marketing/styles/admin.css
```

### 10.3 배포 순서 (중요)

```
① admin-marketing 배포 (remoteEntry.js + CSS 먼저)
② admin-portal 배포 (remoteEntry URL 참조)
```

marketing을 redeploy하지 않고 portal만 redeploy해도 되지만, **remoteEntry URL이 바뀌면 portal env/재빌드가 필요**합니다.

### 10.4 배포 검증 체크리스트

- [ ] `https://.../admin-marketing/_next/static/chunks/remoteEntry.js` → 200
- [ ] `https://.../admin-marketing/styles/admin.css` → 200
- [ ] `https://.../admin-portal/marketing/event/` → 이벤트 목록 표시
- [ ] Sidebar/Breadcrumb + ag-grid 테이블 동시 표시
- [ ] 등록/상세 페이지 이동 정상

---

## 11. 환경 변수 정리

| 변수 | 프로젝트 | 용도 |
|------|----------|------|
| `NEXT_PUBLIC_BASE_PATH` | 양쪽 | GitHub Pages 서브경로 (`/admin-portal`, `/admin-marketing`) |
| `NEXT_PUBLIC_MARKETING_REMOTE_ENTRY` | portal | marketing remoteEntry 절대 URL |
| `NEXT_PUBLIC_MARKETING_STYLES_PATH` | portal | marketing CSS 경로 (origin은 remoteEntry에서 추출) |
| `NEXT_PRIVATE_LOCAL_WEBPACK=true` | 양쪽 | nextjs-mf 로컬 webpack 사용 |

---

## 12. 새 Remote / 새 페이지 추가 절차

### 12.1 Case A: 새 Remote repo 추가 (예: admin-personal)

**Remote 팀 (admin-personal)**

1. Next.js + `@module-federation/nextjs-mf` 프로젝트 생성
2. `name: 'adminPersonal'` 설정
3. `exposes: { './SomePage': './exposes/SomePage.tsx' }` 등록
4. GitHub Pages 배포 → remoteEntry URL 확정

**Host 팀 (admin-portal)**

1. `mf.registry.ts` — `{ key: 'adminPersonal', enabled: true }`
2. `.env` / `deploy.yml` — `NEXT_PUBLIC_PERSONAL_REMOTE_ENTRY`
3. `remoteModules.ts` — path + loader 추가
4. `types/remote.d.ts` — `declare module 'adminPersonal/*'`
5. (선택) `remoteStyles.ts` — CSS URL
6. `menu.ts` — 메뉴 href는 이미 있을 수 있음

### 12.2 Case B: 기존 marketing에 페이지 추가

**marketing 팀**

1. `exposes/NewPage.tsx` 작성
2. `next.config.mjs` exposes에 `'./NewPage'` 추가
3. 배포

**portal 팀**

1. `remoteModules.ts`에 path/loader 1줄 추가
2. (필요 시) `menu.ts` href 확인
3. portal 재빌드·배포

---

## 13. Host vs Remote 역할 비교 (협업용)

| 구분 | admin-portal | admin-marketing |
|------|--------------|-----------------|
| 비유 | 앱 Store + OS Shell | 설치 가능한 앱 모듈 |
| UI | Header, Sidebar, Breadcrumb | 업무 콘텐츠만 |
| 메뉴 | `menu.ts` 전체 소유 | 없음 |
| 라우팅 | URL 소유, catch-all | `useRouter`로 in-app navigation |
| MFE | `remotes` (불러옴) | `exposes` (내보냄) |
| 배포 | Remote URL을 env로 참조 | **먼저** 배포 |
| 독립 실행 | 전체 포털 | `localhost:3001/marketing/...` |
| 도메인 의존성 | 최소 (design-system) | ag-grid, hook-form 등 |

---

## 14. 현재 구현 현황

| 항목 | 상태 |
|------|------|
| marketing Remote 연동 | ✅ 3페이지 (목록/등록/상세) |
| personal Remote | ⏸ registry만, disabled |
| common Remote | ⏸ registry만, disabled |
| menu.ts 전체 메뉴 | ✅ 정의됨 (대부분 Placeholder) |
| GitHub Pages 배포 | ✅ CI/CD 구성 |

---

## 15. Marp 문서와의 차이 (내부 참고)

`docs/mfe-architecture.marp.md`는 초기 설계안이며, 아래는 **현재 코드와 다른 점**입니다:

| Marp 문서 | 실제 구현 |
|-----------|-----------|
| Vite 6 | Next.js 14 |
| 포트 5173 / 5174 | 3000 / 3001 |
| `mf-manifest.json` | env의 `remoteEntry` URL 직접 사용 |
| React 19 | React 18 |
| `src/pages/` | `exposes/` + `pages/` |

외부 설명 시에는 **이 문서(실제 Next.js 구현)** 기준으로 전달하는 것을 권장합니다.

---

## 16. 외부 업체 설명용 핵심 메시지 (30초 버전)

> 우리 관리자 포털은 **Shell(admin-portal)** 과 **도메인별 Remote(admin-marketing 등)** 로 나뉩니다.  
> Shell은 메뉴·레이아웃·URL만 관리하고, 실제 화면은 각 팀 repo에서 Module Federation으로 **런타임에 동적 로드**합니다.  
> 마케팅 팀은 [admin-marketing](https://github.com/dmsej108/admin-marketing) repo만 개발·배포하면 되고, 포털 팀은 URL 매핑 1줄과 env만 추가하면 통합됩니다.  
> 사용자 URL은 `admin-portal/marketing/event` 하나이고, 배포는 **Remote 먼저 → Host 나중** 순서입니다.

---

## 관련 문서

- [MFE 아키텍처 발표 슬라이드](./mfe-architecture.marp.md) — Marp 슬라이드 (초기 설계안, 일부 내용 outdated)

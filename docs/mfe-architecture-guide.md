# admin-portal + admin-marketing MFE 아키텍처 가이드

> 외부 업체·협업 팀 onboarding용 설명서  
> 기준: 실제 코드 (Next.js 14 + Module Federation)  
> 최종 갱신: 2026-07-05 (아키텍처 비교·운영 FAQ 추가)

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

## 17. Module Federation vs Next.js Multi-Zones

### 17.1 한 줄 비교

| | **우리 (Module Federation)** | **Next.js Multi-Zones** |
|---|---|---|
| 연결 지점 | Webpack 런타임 (`remoteEntry.js`) | URL 라우팅 / 리버스 프록시 |
| 화면 합치기 | Host React 트리 **안에** Remote 컴포넌트 삽입 | 경로별로 **별도 Next.js 앱**으로 분기 |
| Shell 유지 | Header/Sidebar **항상 유지** | Zone마다 레이아웃이 따로일 수 있음 |
| 페이지 전환 | Remote chunk만 동적 로드 | Zone 간 이동 시 **앱 전환**에 가깝음 |

### 17.2 Next.js Multi-Zones란?

여러 **독립 Next.js 앱**을 URL prefix로 나눠 붙이는 방식입니다.

```
/admin-portal/*     → admin-portal 앱 (Next.js #1)
/admin-marketing/*  → admin-marketing 앱 (Next.js #2)
         ↑
   Nginx / ALB / Vercel rewrites 로 경로 분기
```

- 각 zone은 **자기 `_app.tsx`, 레이아웃, 빌드, 배포**를 가짐
- zone 간 이동은 사실상 **다른 앱으로 넘어가는 것** (hard navigation)

### 17.3 업체 문서와의 차이

다른 업체가 말하는 *"여러 Next.js 애플리케이션을 하나의 도메인 아래에 통합"* 은 보통 **Multi-Zones** 설명에 가깝습니다.

| | Multi-Zones (다른 업체) | 우리 MFE |
|---|---|---|
| 도메인 통합 | ✅ 하나의 도메인 | ✅ 하나의 도메인 (portal 기준) |
| Next.js 앱 (체감) | zone마다 **앱 전체** | 사용자에게는 **Host 1개** |
| URL 분기 | **인프라/rewrites** (Nginx, ALB…) | **Host 라우터** (`[...slug].tsx`) |
| Remote/marketing 역할 | **독립 Next.js 앱** (자기 레이아웃 가능) | **페이지 조각 제공** (Shell 없음) |
| Shell(Header/Sidebar) | zone마다 따로 or 중복 | **portal만** 소유 |

> **Multi-Zones** = URL로 Next.js 앱 여러 개를 이어 붙이기  
> **Module Federation** = 한 앱(Shell) 안에 다른 앱의 컴포넌트를 런타임에 끼워 넣기

### 17.4 Multi-Zones ≠ Turborepo

| | **Next.js Multi-Zones** | **Turborepo** |
|---|---|---|
| 성격 | Next.js **아키텍처 패턴** | **모노레포 빌드 도구** |
| 하는 일 | URL별로 Next.js 앱 여러 개를 이어 붙임 | repo 안 여러 패키지의 build/dev를 캐싱·병렬 실행 |
| 배포 | 각 zone을 **각자 배포** | 배포 방식을 정해 주지 않음 — **빌드만** orchestration |

Multi-Zones는 Turborepo **없이**, repo 분리 + 각자 CI/CD로도 충분히 운영 가능합니다.

---

## 18. 단일 Endpoint URL 설계

### 18.1 요구사항 예시 (금융권)

- **단일 endpoint**: `https://pi-web.kbstar.com`
- **경로별 분기**: `/home`, `/bank`, `/marketing/event` …
- **독립 개발·배포**: 팀/repo별로 build/deploy

### 18.2 우리 MFE로 매핑

```
https://pi-web.kbstar.com          ← admin-portal (Host) 배포
├── /home                          ← adminHome Remote (추가)
├── /bank                          ← adminBank Remote (추가)
├── /marketing/event               ← adminMarketing Remote (현재)
└── /corp/list                     ← adminCorp Remote (추가)
```

Host `remoteModules.ts` 예시:

```typescript
{ path: '/home',  remote: 'adminHome',      module: 'HomePage',     loader: () => import('adminHome/HomePage') },
{ path: '/bank',  remote: 'adminBank',      module: 'BankListPage', loader: () => import('adminBank/BankListPage') },
{ path: '/marketing/event', remote: 'adminMarketing', module: 'EventListPage', ... },
```

### 18.3 basePath 옵션

| 설정 | URL 예시 |
|------|----------|
| `NEXT_PUBLIC_BASE_PATH=` (비움) | `pi-web.kbstar.com/marketing/event` |
| `NEXT_PUBLIC_BASE_PATH=/admin` | `pi-web.kbstar.com/admin/marketing/event` |

현재 GitHub Pages는 `basePath=/admin-portal` 이므로 `.../admin-portal/marketing/event` 형태입니다. 운영 도메인에서는 basePath만 변경하면 됩니다.

### 18.4 HTTP "응답 주체" 차이

**Multi-Zones**

```
pi-web.kbstar.com/home  ──Nginx──▶  home Next.js 앱 서버
pi-web.kbstar.com/bank  ──Nginx──▶  bank Next.js 앱 서버
```

**Module Federation (우리)**

```
pi-web.kbstar.com/*     ──CDN──▶  admin-portal (항상 Host가 1차 응답)
                                    └─ 경로별 Remote chunk만 추가 로드
```

- **"독립 개발·배포 + 단일 URL"** → MFE로 충분
- **"HTTP 1차 응답도 path마다 다른 서버/앱"** → Multi-Zones + 리버스 프록시 검토

### 18.5 운영 인프라 (MFE)

```
pi-web.kbstar.com/*
  → admin-portal 정적 파일 (out/)
  → 없는 경로는 index.html 또는 404.html fallback
```

Remote는 `pi-web.kbstar.com/bank`로 직접 노출할 필요 없고, 별도 origin에 `remoteEntry.js`만 두면 됩니다.

---

## 19. 저장소 구조 — 우리 vs Monorepo vs 연합형 Monorepo

### 19.1 우리 구조 (Multi-repo + MFE)

```
admin-portal/          ← 단일 repo (Host)
admin-marketing/       ← 별도 repo (Remote)
admin-personal/        ← (예정) 또 다른 repo
```

- **모노레po 아님** — repo 하나에 앱 여러 개 없음
- **연합형 모노레po 아님** — Super repo + Submodule 없음
- **각 repo가 자기 `pnpm build` + 자기 CI/CD로 독립 build/deploy**
- runtime 연결만 **Module Federation**

### 19.2 일반 Monorepo

```
my-monorepo/           ← git repo 1개
├── apps/admin-portal/
├── apps/admin-marketing/
└── packages/design-system/
```

### 19.3 연합형 Monorepo (Git Submodule + Turborepo)

업체에서 말하는 *"Git Submodule 기반 Turborepo로 물리적으로 분리된 저장소를 상위 저장소에 종속"* 구조:

```
admin-platform/                    ← Super repo
├── .gitmodules
├── turbo.json
├── pnpm-workspace.yaml
└── apps/
    ├── admin-portal/              ← git submodule (별도 repo 포인터)
    ├── admin-marketing/           ← git submodule
    └── admin-bank/
```

| | Super repo | Sub repo |
|---|------------|----------|
| 역할 | Turbo, workspace, 공통 스크립트 | 실제 앱 코드 |
| 개발 | `turbo dev`로 한 번에 | 각 repo에서도 단독 개발 |
| 빌드 | `turbo build --filter=앱명` | repo CI에서 단독 build |
| 배포 | 보통 조율만 | **앱마다 독립 deploy** |
| Git | submodule pointer(커밋 SHA) 관리 | commit/push/PR |

**"종속"의 의미**: Sub repo **안에** Super가 있는 게 아니라, Super repo가 Sub repo **특정 커밋을 가리키는 참조(포인터)** 관계입니다.

- marketing 팀: **자기 repo만** clone → 개발 → push → **단독 배포** ✅
- Super repo: "지금 플랫폼이 쓰는 marketing **버전**"을 submodule pointer로 기록

### 19.4 구조 비교표

| | **우리** | **일반 Monorepo** | **연합형 Monorepo** |
|---|---|---|---|
| git repo | 앱마다 **독립** | **1개** | Super 1 + Sub N |
| Turborepo | ❌ | 선택 | ✅ (보통) |
| Submodule | ❌ | ❌ | ✅ |
| 앱 연결 (runtime) | Module Federation | workspace import / MF / Multi-Zones | Turbo + (선택) MF |
| 로컬 dev | repo마다 터미널 | `pnpm dev` 한 번 | Super에서 `turbo dev` |

### 19.5 Turborepo와 Module Federation 관계

**서로 다른 층** — 같이 쓸 수 있지만 필수 조합은 아닙니다.

```
[연합형 Monorepo]  → 개발·빌드·repo를 어떻게 묶을지
[Module Federation] → pi-web.kbstar.com에서 runtime에 어떻게 붙일지
```

---

## 20. Turborepo 필요 여부

**현재 구조에서는 Turborepo가 필요 없습니다.**

Turborepo는 **한 repo(workspace) 안에 앱·패키지가 여러 개**일 때 build/dev/lint를 orchestration하는 도구입니다. 우리는 앱 연결을 **Module Federation(runtime)** 으로 하므로 Turborepo가 할 "여러 패키지 orchestration" 대상이 없습니다.

Turborepo를 **나중에** 고려할 경우:

- Super repo + Submodule로 **로컬 dev를 한 번에** 띄우고 싶을 때
- 공통 `packages/*` workspace의 **빌드 순서·캐시**를 통합하고 싶을 때

→ **개발 편의용 선택**이지, MFE multi-repo 운영의 **필수 조건이 아님**

---

## 21. @dmsej108/design-system (Nexus)

`@dmsej108/design-system`이 Nexus(사내 npm registry)에 publish되어 있으면 **각 프로젝트(repo)마다 독립적으로 install**해서 사용할 수 있습니다.

```json
// 각 repo의 package.json
"dependencies": {
  "@dmsej108/design-system": "^2.3.1"
}
```

```ini
# .npmrc (프로젝트 또는 CI)
@dmsej108:registry=https://your-nexus.company.com/repository/npm-hosted/
//your-nexus.company.com/repository/npm-hosted/:_authToken=${NPM_TOKEN}
```

| 프로젝트 | design-system |
|----------|---------------|
| admin-portal | ✅ 각자 dependencies |
| admin-marketing | ✅ 각자 dependencies |
| admin-personal (예정) | ✅ 동일 |

주의사항:

- React / Next / design-system **major 버전 통일** 권장
- 각 repo `_app.tsx`에서 `@dmsej108/design-system/dist/index.css` import
- CI/CD에 Nexus 토큰(`NPM_TOKEN`) secret 필요

---

## 22. Multi-repo + MFE 장단점

### 22.1 장점

| 항목 | 설명 |
|------|------|
| 팀·도메인 독립성 | repo·CI/CD·배포 일정 완전 분리, repo 단위 권한 |
| 배포 영향 최소 | marketing만 수정 → marketing만 redeploy |
| 기술 자유도 | Remote repo별 전용 라이브러리(ag-grid 등) 독립 관리 |
| Monorepo/Submodule 부담 없음 | submodule pointer, Turbo 설정 불필요 |
| Shell 공통화 | Header/Sidebar/Breadcrumb portal 한곳에서만 관리 |
| 단일 URL | Host + remoteModules로 path prefix 설계 가능 |

### 22.2 단점

| 항목 | 설명 |
|------|------|
| 로컬 dev DX | portal + marketing 터미널·포트 분리 (3000 / 3001) |
| 버전 호환 | React, Next, design-system repo마다 수동 맞춤 |
| MF 복잡도 | remoteEntry, env, registry, remoteModules 연동·디버깅 |
| 공통 코드 공유 | Nexus 패키지화 또는 복붙 (Monorepo `packages/shared`보다 번거로움) |
| Host 변경 | 새 URL 추가 시 Remote deploy + portal remoteModules·재빌드 |
| 정적 export | `output: 'export'` — 새 경로마다 getStaticPaths 재빌드 |
| 운영·관측 | portal vs Remote vs remoteEntry 404 원인 분리 필요 |

### 22.3 연합형 Monorepo 대비

| | **우리** | **연합형 Monorepo** |
|---|---|---|
| repo 독립 | ✅ 완전 | ✅ Sub repo 독립, Super 조율 |
| 로컬 dev | △ repo 여러 개 | ✅ `turbo dev` |
| 버전 통일 | △ 수동 | ✅ Super pin |
| Submodule 복잡도 | ✅ 없음 | △ pointer 관리 |
| runtime | MFE | MFE/Multi-Zones 별도 선택 |

---

## 23. 금융권·대규모 프로젝트 적용

### 23.1 가능 여부

**가능합니다.** Module Federation + Shell/Remote는 금융·대기업 admin 포털에서도 사용되는 패턴입니다.  
Turborepo/Monorepo는 **필수가 아니라 선택**입니다.

| 요구 | 우리 구조 |
|------|-----------|
| 팀/도메인별 독립 개발·배포 | ✅ |
| 단일 endpoint | ✅ Host + path routing |
| 공통 Shell·권한·메뉴 | ✅ portal Host |
| 변경 영향 범위 축소 | ✅ Remote 단위 deploy |

### 23.2 금융권에서 추가로 필요한 것

| 영역 | 내용 |
|------|------|
| 보안·네트워크 | remoteEntry 내부 CDN, Nexus, CSP/SRI, origin whitelist |
| 버전 거버넌스 | React/Next/design-system 호환 매트릭스, 계약 테스트 |
| 권한·감사 | Shell에서 인증·메뉴·menuCode 중앙 관리, CI/CD 감사 로그 |
| 운영 | remoteEntry 404 fallback, RUM, runbook |
| SSR/성능 | 현재 Remote `ssr: false` — 내부 admin에는 often OK, 대외 서비스는 재검토 |

### 23.3 규모별 전망

| 규모 | 평가 |
|------|------|
| Remote 2~3개 (현재) | ✅ 충분 |
| Remote 10~30개 | ✅ 가능 — registry·공통 pkg·플랫폼팀 강화 |
| Remote 50+ | ⚠️ Host URL registry·자동화·계약 테스트 필수 |

### 23.4 운영 수준으로 갈 때 권장 보강

1. Remote onboarding 가이드 (본 문서)
2. 호환성 매트릭스 (React/Next/design-system)
3. Remote 로드 실패 fallback UI
4. 사내 배포 (Nexus, 내부 CDN, env별 remoteEntry)
5. (선택) 주요 path smoke/E2E 테스트

### 23.5 업체 미팅 확인 질문

1. "다른 앱이 응답" = HTTP 1차 응답도 앱별 분리가 필요한가?
2. 관리자 전체가 `pi-web.kbstar.com` 루트인가, `/admin` prefix가 있는가?
3. Remote 배포 origin은 내부 CDN만 허용인가?

---

## 24. FAQ — 자주 나오는 질문

| 질문 | 답 |
|------|-----|
| admin-portal은 모노레po인가? | **아니오.** 단일 repo Host 앱 |
| Turborepo가 필요한가? | **현재는 아니오.** repo별 build/deploy + MF로 충분 |
| 각 repo별로만 build/deploy? | **예.** Monorepo/Turbo 개념과 무관 |
| kb.com/marketing/event 같은 URL 가능? | **예.** Host remoteModules + basePath로 설계 |
| design-system Nexus install? | **예.** repo마다 dependencies + .npmrc |
| Multi-Zones와 같은가? | **아니오.** HTTP 앱 분기 vs Shell + Remote chunk |
| 연합형 Monorepo와 같은가? | **아니오.** Submodule/Super repo 없음 |
| 금융권 대규모 가능? | **가능** — 사내 인프라·거버넌스·운영 체계 전제 |

---

## 관련 문서

- [MFE 아키텍처 발표 슬라이드](./mfe-architecture.marp.md) — Marp 슬라이드 (초기 설계안, 일부 내용 outdated)

# admin-portal 회의용 설명

> 회의·발표 시 3~5분 내외로 설명하기 위한 요약 문서  
> 상세 기술 내용: [mfe-architecture-guide.md](./mfe-architecture-guide.md)

---

## 1. 한 문장으로

**admin-portal은 관리자 화면의 공통 껍데기(Shell)이고, 마케팅·개인·기업 등 업무 화면은 팀별 repo에서 따로 만들어 Module Federation으로 붙이는 구조입니다.**

---

## 2. 왜 이렇게 했는가

### 문제

- 관리자 메뉴가 **개인 / 기업 / 공통 / 마케팅** 등 도메인별로 많음
- 팀마다 **개발·배포 주기**가 다름
- 한 repo에 다 넣으면 빌드가 느리고, 한 팀 배포가 전체에 영향

### 해결

| 구분 | 역할 |
|------|------|
| **Shell (admin-portal)** | Header, Sidebar, 메뉴, URL 관리 |
| **Remote (admin-marketing 등)** | 실제 업무 페이지만 구현 |

→ 팀은 **자기 repo만** 개발·배포, 사용자는 **하나의 포털**처럼 사용

---

## 3. 구조 (설명용)

```
[사용자] → https://pi-web.kbstar.com/marketing/event  (단일 주소)

┌─────────────────────────────────────┐
│  admin-portal (Host)                 │
│  ┌────────┬────────────────────────┐ │
│  │ Sidebar│  이벤트 목록 화면       │ │  ← admin-marketing에서 로드
│  │ Header │  (Remote 페이지)        │ │
│  └────────┴────────────────────────┘ │
└─────────────────────────────────────┘
```

- **portal**: 레이아웃 + 메뉴 + "이 URL → 어느 Remote" 매핑
- **marketing**: 이벤트 목록/등록/상세 **페이지만** 제공
- 연결: 빌드 시 합치지 않고, 브라우저에서 **remoteEntry.js**를 fetch해서 runtime에 붙임

---

## 4. repo / 배포

| | admin-portal | admin-marketing |
|---|---|---|
| 역할 | Host (Shell) | Remote (마케팅 화면) |
| repo | 독립 | 독립 |
| build / deploy | 각자 CI/CD | 각자 CI/CD |
| 연결 | env에 marketing remoteEntry URL | expose로 페이지 내보냄 |

**우리는 모노레po·Turborepo를 쓰지 않습니다.**

- repo마다 `pnpm build` → 각자 deploy
- 배포 순서: **Remote 먼저 → portal 나중**

---

## 5. URL 설계

| 경로 | 화면 |
|------|------|
| `/marketing/event` | 이벤트 목록 |
| `/marketing/event/regist` | 이벤트 등록 |
| `/marketing/event/detail/:id` | 이벤트 상세 |

운영 예: `https://pi-web.kbstar.com/marketing/event`

- **주소는 하나** (단일 endpoint)
- `/bank`, `/home` 등은 Remote 추가 + portal에 URL 매핑 1줄 등록

---

## 6. 다른 업체 방식과의 차이

| | 다른 업체 (흔한 패턴) | 우리 |
|---|---|---|
| repo 묶기 | Git Submodule + Turborepo (연합형 Monorepo) | **repo 완전 분리** |
| runtime 통합 | Next.js **Multi-Zones** (경로마다 Next 앱 전체) | **Module Federation** (Shell + Remote 조각) |
| Shell | zone마다 레이아웃 중복 가능 | **portal 한곳**에서만 관리 |
| Turborepo | Super repo에서 build orchestration | **불필요** (repo별 CI) |

**한 줄 요약**

> 업체는 "앱 여러 개를 도메인으로 묶기", 우리는 "Shell 하나 + 업무 화면만 runtime에 조합"

---

## 7. 현재 진행 상황

| 항목 | 상태 |
|------|------|
| portal Shell (Header / Sidebar / 메뉴) | ✅ |
| marketing 연동 (목록 / 등록 / 상세 3페이지) | ✅ |
| GitHub Pages PoC 배포 | ✅ |
| personal, common Remote | registry만, 추후 |
| design-system | `@dmsej108/design-system` — repo마다 install (Nexus 가능) |

---

## 8. 장점 / 한계

### 장점

- 팀·배포 **완전 분리**
- 공통 Shell **한곳** 관리
- 단일 URL + 경로 prefix **가능**

### 한계

- 새 URL 추가 → Remote 배포 + **portal URL 매핑 추가**
- React / Next / design-system **버전 맞춤** 필요
- 로컬 개발 시 portal + marketing **두 서버** (3000 / 3001)

---

## 9. 금융권·운영 관점

- **구조 자체는** 금융·대규모 admin 포털에 **적용 가능**
- PoC (GitHub Pages) → 운영 시 **사내 CDN, Nexus, 보안·감사·모니터링** 추가 필요

---

## 10. 마무리 멘트 (30초)

> admin-portal은 관리자 포털 **Shell**이고, marketing 같은 업무는 **별도 repo**에서 개발·배포합니다.  
> Module Federation으로 **하나의 URL** 아래에서 Shell은 유지하고 업무 화면만 바꿉니다.  
> Monorepo / Turborepo 없이 **repo별 독립 배포**가 가능하고, 공통 UI는 portal에서만 관리합니다.  
> 지금은 marketing 3페이지 PoC까지 완료했고, 다른 도메인도 **같은 패턴**으로 확장할 수 있습니다.

---

## 11. 발표 순서 제안 (3~5분)

| 순서 | 내용 | 시간 |
|------|------|------|
| 1 | **문제** — 메뉴 많고 팀·배포 분리 필요 | 30초 |
| 2 | **구조** — Host + Remote, 구조 그림 | 1분 |
| 3 | **데모 흐름** — `/marketing/event` 접속 시 portal + marketing 로드 | 1분 |
| 4 | **업체와 차이** — Multi-Zones / 연합형 Monorepo 아님 | 1분 |
| 5 | **현황·다음** — marketing 3페이지, 확장 방법 | 30초 |

---

## 12. 예상 Q&A

| 질문 | 답 |
|------|-----|
| 모노레po인가? | 아니오. repo별 독립 (multi-repo) |
| Turborepo 필요한가? | 현재 구조에서는 불필요 |
| 단일 URL 가능한가? | 가능. portal Host가 URL 소유 |
| Multi-Zones와 같은가? | 아니오. Shell + Remote chunk 방식 |
| 팀별 독립 배포 가능? | 가능. Remote repo만 deploy |
| design-system 공유? | Nexus 등 npm registry로 repo마다 install |

---

## 관련 문서

- [MFE 아키텍처 상세 가이드](./mfe-architecture-guide.md)
- [MFE 아키텍처 발표 슬라이드](./mfe-architecture.marp.md)

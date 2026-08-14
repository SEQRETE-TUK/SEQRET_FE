
# AGENTS.md

이 지침은 SEQRET 프론트엔드 저장소 전체에 적용된다. 사람과 AI 작업자는 코드를 수정하기 전에 반드시 이 문서를 읽는다.

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Build Tool | Vite 7 | SPA 개발·빌드 |
| UI Library | React 19 | Client-rendered SPA |
| Language | TypeScript 5 (strict) | `allowJs: false` |
| Styling | TailwindCSS v4 | PostCSS 통합 |
| Component Library | shadcn/ui (base-nova) | `@/components/ui` |
| Icon | Lucide React | |
| Font | Pretendard (`@fontsource/pretendard`) | |
| Server State | TanStack Query 5 | 조회 캐시와 요청 수명주기 |
| Package Manager | pnpm 11 | workspace 활성 |
| Path Alias | `@/*` → `./src/*` | |

## 프로젝트 구조

```text
src/
├── app.tsx             # SPA 루트와 화면 라우팅
├── main.tsx            # React·전역 provider 진입점
├── app/
│   ├── globals.css     # TailwindCSS 전역 스타일
│   └── design-system/  # 디자인 시스템 확인 화면
├── components/
│   ├── ui/             # shadcn/ui 기본 컴포넌트 (자동 생성, 직접 수정 최소화)
│   └── demos/          # 데모·프로토타입용 컴포넌트
└── lib/
    ├── api-client.ts   # Bearer API·서명 업로드 클라이언트
    ├── query-client.ts # TanStack Query 공통 정책
    └── utils.ts        # cn() 등 공용 유틸리티

public/
└── manifest.webmanifest
```

## 작업 시작 전 필수 절차

- 작업 ID를 먼저 확정한다: `FE-*`.
- 현재 branch, base commit, `git status`와 기존 미커밋 변경을 확인한다.
- 한 사람 또는 AI agent마다 별도 branch를 사용한다.
- 두 작업자가 같은 branch나 같은 working directory에서 동시에 수정하지 않는다.
- 최신 `origin/main`에서 작업 branch를 만들고, 장기 feature branch를 만들지 않는다.
- 수정 예정 경로, 공용 파일, 선행 PR을 작업 시작 전에 명시한다.
- 기존 사용자 변경이나 다른 작업자의 변경을 삭제·복원·덮어쓰지 않는다.

## 코드 작성 규칙

### 컴포넌트

- 이 저장소는 Vite 기반 client-rendered SPA다. Next.js 전용 지시어인 `'use client'`를 추가하지 않는다.
- 브라우저 전역과 hook은 컴포넌트 또는 전용 hook 안에서 사용하고 render 중 부수 효과를 만들지 않는다.
- 컴포넌트 파일명은 kebab-case(`my-component.tsx`)를 사용한다.
- 한 파일에 하나의 export 컴포넌트만 둔다. 내부 하위 컴포넌트는 같은 파일에 선언할 수 있다.
- Props 타입은 컴포넌트 파일 상단에 `interface`로 정의한다. 공용 타입은 `src/types/`에 분리한다.

### 스타일링

- TailwindCSS v4 유틸리티 클래스를 기본으로 사용한다.
- `cn()` 헬퍼(`@/lib/utils`)로 조건부 클래스를 결합한다.
- 인라인 `style` 속성은 동적 값(CSS 변수 주입 등)이 필요한 경우에만 사용한다.
- `globals.css`에 전역 CSS 변수와 커스텀 스타일을 정의한다.
- 컴포넌트별 CSS 모듈은 사용하지 않는다.

### shadcn/ui

- `npx shadcn@latest add <component>` 명령으로 컴포넌트를 추가한다.
- `src/components/ui/` 내 자동 생성된 파일은 최소한으로만 수정한다. 커스터마이징이 필요하면 래퍼 컴포넌트를 만든다.
- shadcn/ui 컴포넌트에 없는 UI가 필요하면 `src/components/`에 직접 구현한다.

### TypeScript

- `any` 타입을 사용하지 않는다. 불가피한 경우 `unknown`과 타입 가드를 사용한다.
- non-null assertion(`!`)을 최소화하고, 대신 적절한 타입 체크를 수행한다.

### 상태 관리

- 로컬 상태는 `useState`, `useReducer`를 사용한다.
- API에서 가져온 server state는 TanStack Query를 사용한다.
- 조회는 일시적 네트워크 오류에 한해 최대 1회만 재시도하고, mutation은 중복 업무 처리를 막기 위해 기본적으로 자동 재시도하지 않는다.
- 전역 상태가 필요하면 React Context를 우선 사용한다.

### API와 보안

- 현재 백엔드 OpenAPI의 `/api/v1` 계약만 구현 근거로 사용한다. 제안 문서의 미구현 endpoint를 호출하지 않는다.
- 백엔드 origin은 비밀값이 아닌 `VITE_API_BASE_URL`로 주입하며 코드에 고정하지 않는다.
- access token은 요청 시 명시적으로 전달하고 메모리에서만 보유한다. `localStorage`, `sessionStorage`, URL query, 빌드 환경 변수에 저장하지 않는다.
- token, signed upload URL과 signed header를 로그·오류 메시지·분석 이벤트에 남기지 않는다.
- signed upload URL은 opaque capability로 취급한다. URL을 파싱·재조합·정렬하지 않고 백엔드가 준 header를 추가·변형 없이 업로드 요청에 전달한다.

## 공용 파일 규칙

다음은 충돌 위험이 높은 공용 파일이다.

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
vite.config.ts
tsconfig.json
components.json
postcss.config.mjs
eslint.config.mjs
index.html
src/main.tsx
src/app/globals.css
src/lib/utils.ts
.github/workflows/**
```

- 공용 파일은 동시에 두 branch에서 수정하지 않는다.
- 두 작업에 필요한 공통 변경은 작은 선행 PR로 먼저 main에 병합한다.
- dependency와 lockfile 변경은 기능 변경과 가능하면 분리한다.
- 코드 전체 formatting, import 정리, rename과 광범위한 refactor를 기능 PR에 섞지 않는다.

## 성능과 접근성

- 이미지는 native `<img>` 또는 공용 이미지 래퍼를 사용하고, 가능한 경우 `width`, `height`, `loading`과 적절한 `alt`를 지정한다.
- 내부·외부 링크는 semantic `<a>`를 사용하며 새 창 링크에는 필요한 보안 속성을 추가한다.
- 폰트는 `@fontsource/pretendard`를 통해 로드한다. 외부 CDN 폰트를 추가하지 않는다.
- 큰 화면 단위 코드는 필요할 때 `React.lazy`와 dynamic import로 분할한다.
- Semantic HTML을 사용하고 ARIA 속성을 적절히 추가한다.
- 색상 대비, 키보드 네비게이션, 스크린 리더 호환을 고려한다.

## AI 작업 금지 사항

- 명시적 요청 없이 `main`에 직접 commit 또는 push하지 않는다.
- 명시적 요청 없이 다른 작업자의 branch를 rebase, force-push 또는 삭제하지 않는다.
- `git reset --hard`, `git clean -fd`, 전체 경로 checkout·restore로 변경을 제거하지 않는다.
- 충돌 파일 전체에 `ours` 또는 `theirs`를 적용하지 않는다.
- 테스트를 통과시키기 위해 작업 범위 밖의 모듈이나 설정을 임의로 변경하지 않는다.
- 사용자 또는 다른 작업자의 미커밋 변경을 자신의 변경으로 간주하지 않는다.
- 생성 파일과 lockfile을 손으로 합치지 않는다. 원본 설정을 해결한 뒤 공식 명령으로 다시 생성한다.
- `src/components/ui/` 내 shadcn/ui 자동 생성 파일을 대폭 수정하지 않는다.

## PR과 merge

- 하나의 작업 ID마다 하나의 짧은 branch와 PR을 사용한다.
- Draft PR을 일찍 열고 수정 경로, 공용 파일과 의존 PR을 표시한다.
- 리뷰 요청 전과 merge 직전에 최신 `origin/main`으로 rebase한다.
- 담당자의 승인 1개, 모든 필수 CI와 대화 해결 이후 Squash Merge한다.
- merge 후 branch를 삭제한다.
- 충돌이 공용 파일에 발생하면 자동 해결하지 않고 해당 소유자와 함께 의미를 확인한다.

## 커밋 메시지와 PR 제목

- 형식은 `<type>(<Task-ID>): <간결한 한국어 요약>`을 사용한다.
- Task ID가 없는 저장소 공통 작업만 `<type>: <간결한 한국어 요약>`을 허용한다.
- type은 `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `revert`, `style` 중 하나를 사용한다.
- 요약은 구체적인 한국어로 작성하고 가능하면 50자 이내로 제한한다.
- 마침표, 이모지, AI 도구명과 `update`, `수정`, `작업` 같은 모호한 단독 표현을 사용하지 않는다.
- 하나의 commit에는 하나의 목적만 포함한다.
- Squash Merge를 사용하므로 PR 제목도 같은 형식을 따른다.

예시:

```text
feat(FE-01): 크루 목록 페이지 레이아웃 구현
fix(FE-03): 모바일 뷰포트 사이드바 오버플로우 수정
style(FE-02): 공통 버튼 hover 애니메이션 추가
refactor(FE-05): API fetch 래퍼 공용 모듈 분리
docs: 프론트엔드 개발 규칙 정리
```

## 검증과 인계

작업 종료 전에 다음을 수행한다.

- `git status --short`와 전체 diff를 확인한다.
- `git diff --check`로 충돌 표식, trailing whitespace와 patch 오류를 확인한다.
- `pnpm lint`와 `pnpm build`를 실행하여 lint 에러와 빌드 에러가 없는지 확인한다.
- 변경 사항에 대해 간단한 수동 테스트를 수행한다.
- 최종 보고에 작업 ID, 변경 파일, 실행한 테스트, 미해결 위험과 필요한 merge 순서를 포함한다.

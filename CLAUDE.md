# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js (App Router) + Supabase 공식 스타터 킷(`with-supabase` 예제)에서 출발한 프로젝트. `@supabase/ssr`로 쿠키 기반 인증 세션을 브라우저/서버/proxy 전 영역에서 공유한다. 스타터 킷의 튜토리얼 UI(`components/tutorial/*`, 홈 화면 안내 카드 등)가 아직 남아 있는 상태다.

## 명령어

```
npm run dev     # Next.js dev 서버 (기본 localhost:3000)
npm run build   # 프로덕션 빌드 (타입 체크 포함)
npm run start   # 빌드 결과 실행
npm run lint    # ESLint (next/core-web-vitals + next/typescript)
```

- 단위 테스트 러너는 아직 구성되어 있지 않다 (Vitest/Jest 등 미설치, `package.json`에 test 스크립트 없음). `.claude/skills/unit-test`는 별도 Java/Spring Boot 프로젝트용이라 이 저장소에는 적용되지 않는다.
- 환경변수는 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 2개만 필요하다.

## 아키텍처

### Supabase 클라이언트 3분할

- `lib/supabase/client.ts` — `createBrowserClient`. Client Component에서만 사용
- `lib/supabase/server.ts` — `createServerClient` + `next/headers`의 `cookies()`. **요청/함수 호출마다 새로 생성**해야 하며 전역 변수에 담아 재사용하면 안 된다 (파일 상단 주석에 Fluid compute 관련 경고 명시)
- `lib/supabase/proxy.ts` — `updateSession()`. 세션 쿠키 refresh와 라우트 보호를 담당하며 루트 `proxy.ts`에서만 호출된다

셋 다 `lib/supabase/database.types.ts`의 `Database` 타입을 제네릭으로 사용한다(단, 아래 "타입 재생성" 참고).

### Next.js 16 "Proxy" (구 Middleware)

루트의 `proxy.ts`는 `middleware()`가 아니라 **`proxy()`**를 export한다 — 설치된 Next.js 16(`next@16.3.6`)에서 Middleware가 Proxy로 이름이 바뀌었다. `lib/supabase/proxy.ts`의 `updateSession()`을 호출해 매 요청마다 세션을 갱신하고, 비로그인 사용자를 `/auth/login`으로 리다이렉트한다.

로그인 없이 접근 가능한 경로는 `lib/supabase/proxy.ts` 안에 **하드코딩된 허용 목록**으로 관리된다 (`/`, `/login*`, `/auth*`, `/instruments`, `/instruments/*`). 새 공개 라우트를 추가하면 이 목록도 같이 갱신해야 한다.

`lib/utils.ts`의 `hasEnvVars`가 false면(즉 Supabase 환경변수 미설정 시) `updateSession()`은 아무 것도 하지 않고 바로 통과시킨다 — 스타터 킷의 "설정 전 안내" 동작이다.

### 라우트 구조

- `app/auth/*` — 로그인/회원가입/비밀번호 재설정 등 공개 인증 플로우
- `app/protected/*` — `layout.tsx`가 상단 nav(로고·`AuthButton`)와 하단 footer(`ThemeSwitcher`)를 공통 렌더링. `page.tsx`는 서버 컴포넌트 안에서 `supabase.auth.getClaims()`로 세션을 확인하고 없으면 `redirect("/auth/login")` — proxy의 리다이렉트와 별개로 페이지 자체도 이중으로 인증을 확인하는 패턴
- `app/instruments/page.tsx` — proxy 허용 목록에 예외로 등록된 예시 서버 컴포넌트 데이터 페칭 페이지 (`supabase.from("instruments").select()`)

### 타입 재생성 필요 (주의)

`lib/supabase/database.types.ts`는 Supabase CLI(`generate_typescript_types`)로 자동 생성되며 파일 상단 주석대로 직접 수정하면 안 된다. 현재 이 파일에는 `profiles` 테이블만 정의돼 있고, `app/instruments/page.tsx`가 조회하는 `instruments` 테이블은 반영되어 있지 않다 — 스키마를 바꾸거나 새 테이블을 다루기 전에 `mcp__supabase__generate_typescript_types`(또는 `supabase gen types`)로 먼저 재생성할 것.

### UI 구성

- shadcn/ui, `components.json` 기준 style `new-york` / baseColor `neutral` / `rsc: true` / icon `lucide`. `components/ui/*`는 shadcn CLI 관리 영역
- `components/*.tsx`(`auth-button`, `hero`, `theme-switcher` 등)는 앱 자체 컴포넌트, `components/tutorial/*`는 스타터 킷 튜토리얼 전용 컴포넌트
- `app/layout.tsx`의 `next-themes` `ThemeProvider`(`attribute="class"`, `defaultTheme="system"`)가 앱 전체를 감싼다
- 경로 별칭 `@/*` → 프로젝트 루트(`tsconfig.json`)

### MCP 서버 (`.mcp.json`)

- `supabase` — 프로젝트 고정(`project_ref` 하드코딩)로 스키마/마이그레이션/타입 생성/로그 조회 등에 사용
- `shadcn` — 컴포넌트 레지스트리 검색·설치
- `shrimp-task-manager` — 작업 계획/추적용, 경로는 환경변수(`SHRIMP_TASK_MANAGER_PATH`, `SHRIMP_DATA_DIR`)로 주입

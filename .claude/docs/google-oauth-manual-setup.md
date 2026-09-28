# 구글(Google) 로그인 - 사용자가 직접 해야 할 설정

이 문서는 코드로 자동화할 수 없는, Google Cloud Console 및 Supabase 대시보드에서 직접 진행해야 하는 설정을 정리한 것이다.
코드 구현(`app/auth/callback/route.ts`, `components/login-form.tsx`)은 Shrimp Task Manager에 등록된 작업으로 별도 진행된다.

## 1. Google Cloud Console 설정

1. https://console.cloud.google.com 접속 후 프로젝트 선택 (없으면 새로 생성)
2. 좌측 메뉴 "API 및 서비스" → "OAuth 동의 화면"으로 이동
   - User Type: 테스트 단계라면 "외부(External)" 선택
   - 앱 이름, 지원 이메일 등 필수 항목 입력 후 저장
   - "테스트 사용자" 단계에서 실제 로그인 테스트에 쓸 구글 계정(본인 이메일)을 추가해야
     게시(Publish) 전에도 로그인 테스트가 가능하다
3. "API 및 서비스" → "사용자 인증 정보" → 상단 "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" 선택
   - 애플리케이션 유형: **웹 애플리케이션**
   - 이름: 자유롭게 지정 (예: `nextjs-supabase-app`)
   - **승인된 리디렉션 URI**에 아래 URL을 정확히 입력한다.
     이 프로젝트 앱 주소가 아니라 **Supabase가 관리하는 고정 콜백 URL**이다.

     ```
     https://iykymhadltxknfdzjmkx.supabase.co/auth/v1/callback
     ```

     (Supabase 공식 문서 기준 형식은 `https://<프로젝트 도메인>/auth/v1/callback`이며, 이 프로젝트의 도메인은
     `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`과 동일하다. 직접 타이핑하는 대신 Supabase 대시보드
     Authentication → Providers → **Google** 설정 화면에 이 콜백 URL이 그대로 표시되어 있으니
     복사해서 붙여넣어도 된다.)

   - "만들기" 클릭 후 발급된 **클라이언트 ID**와 **클라이언트 보안 비밀(Client Secret)**을 복사해 안전한 곳에 보관

## 2. Supabase 대시보드 설정

1. https://app.supabase.com 접속 → 해당 프로젝트 선택
2. 좌측 메뉴 "Authentication" → "Sign In / Providers"로 이동
3. Provider 목록에서 **Google** 항목을 찾아 활성화(Enable)
4. 위에서 복사한 **클라이언트 ID**, **클라이언트 보안 비밀**을 각각 입력
5. "Save" 클릭

## 3. 완료 후 확인 사항

- 두 설정이 모두 끝나면, 로컬에서 `npm run dev` 실행 후 `/auth/login` 페이지의 "Google로 로그인" 버튼으로
  실제 로그인 플로우(버튼 클릭 → 구글 인증 화면 → `/auth/callback` → `/protected` 도착)를 테스트한다.
- 로그인 실패 시 `/auth/error?error=...` 페이지로 이동하며, 에러 메시지로 원인을 확인할 수 있다.
- 동의 화면을 "테스트" 상태로 둔 경우, 1번에서 등록한 테스트 사용자 계정으로만 로그인이 가능하다.
  실제 서비스 오픈 전에는 동의 화면을 "게시(Publish)" 상태로 전환해야 모든 구글 계정이 로그인할 수 있다.

## 참고: 두 콜백 URL을 헷갈리지 말 것

- `https://iykymhadltxknfdzjmkx.supabase.co/auth/v1/callback` → **Google Cloud Console**에 등록하는 URL (Supabase가 구글의 인증 응답을 받는 곳)
- `{앱 주소}/auth/callback` (예: `http://localhost:3000/auth/callback`) → **우리 앱 코드**가 Supabase로부터 최종 리다이렉트를 받아 세션 쿠키를 설정하는 곳 (Google Console에는 등록하지 않음)

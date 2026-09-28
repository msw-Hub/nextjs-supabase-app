import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// 구글 OAuth는 이메일 OTP(app/auth/confirm)와 달리 PKCE code를 돌려받으므로
// exchangeCodeForSession으로 세션을 교환하는 별도 콜백 라우트가 필요하다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // next는 외부 사이트로 리다이렉트시키는 open redirect에 악용될 수 있으므로,
  // "/"로 시작하면서 "//"(프로토콜 상대 URL)는 아닌 내부 경로만 허용한다.
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/protected";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${error.message}`);
    }
  }

  redirect(`/auth/error?error=No code provided`);
}

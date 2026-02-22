// signup.js
// ナビのユーザー名表示を担う。
// window.supabase は supabase-client.js で初期化済みであることを前提とする。

document.addEventListener("DOMContentLoaded", async () => {

  const usernameLink = document.getElementById("nav-username")
  if (!usernameLink) return

  if (!window.supabase) {
    console.error("[signup.js] window.supabase が見つかりません。supabase-client.js が先に読み込まれているか確認してください。")
    return
  }

  const supabase = window.supabase

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      usernameLink.textContent = "ログイン"
      usernameLink.href = "/contest/register?tab=login"
      return
    }

    const userId = session.user.id

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("[signup.js] プロフィール取得エラー:", error.message)
      return
    }

    if (profile) {
      usernameLink.textContent = profile.username
      usernameLink.href = "/contest/account"
    }

  } catch (err) {
    console.error("[signup.js] 予期しないエラー:", err)
  }
})
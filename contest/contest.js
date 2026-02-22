// contest.js
// ログイン状態を確認し、コンテストページのEnterボタンを切り替える。
// type="module" で読み込まれるため DOMContentLoaded 不要（自動 defer）。

(async () => {

  if (!window.supabase) {
    console.error("[contest.js] window.supabase が見つかりません")
    return
  }

  const btn = document.getElementById("contest-btn")
  if (!btn) return

  const { data: { session } } = await window.supabase.auth.getSession()

  if (session) {
    // ログイン済み → Enter ボタン（青・塗り）
    btn.textContent = "Enter"
    btn.href = "/contest/problems/"
    btn.classList.remove("secondary")
  } else {
    // 未ログイン → Register or Login ボタン（白抜き）
    btn.textContent = "Register / Login"
    btn.href = "/account"
    btn.classList.add("secondary")
  }

  btn.style.visibility = "visible"

})()
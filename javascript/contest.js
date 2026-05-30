// contest.js

(async () => {
  if (!window.supabase) {
    console.error("[contest.js] window.supabase が見つかりません")
    return
  }

  const btn        = document.getElementById("contest-btn")
  const blockedMsg = document.getElementById("blocked-msg")
  if (!btn) return

  // 各文字を <span class="char"> で包んでセットする
  // → margin-right アニメーションで滑らかな letter-spacing 効果を実現
  function setBtnText(text) {
    btn.innerHTML = [...text].map(c =>
      c === ' '
        ? '<span class="char" aria-hidden="true">&nbsp;</span>'
        : `<span class="char" aria-hidden="true">${c}</span>`
    ).join('')
    btn.setAttribute('aria-label', text)
  }

  // ① status と セッションを並列取得
  const [
    { data: settings },
    { data: { session } }
  ] = await Promise.all([
    window.supabase.from('contest_settings').select('status').eq('id', 1).single(),
    window.supabase.auth.getSession()
  ])

  const status  = settings?.status
  const isLogin = !!session

  if (isLogin) {
    // ② is_admin を確認
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single()

    const isAdmin = !!profile?.is_admin

    if (status === 'running' || status === 'finished' || isAdmin) {
      // アクティブな Enter ボタン
      setBtnText("Enter")
      btn.href = "/contest/problems/"
      btn.classList.remove("secondary", "disabled")
      btn.removeAttribute("aria-disabled")
    } else {
      // status === 'before' かつ一般ユーザー：非アクティブ化 & メッセージ表示
      setBtnText("Enter")
      btn.href = "#"
      btn.classList.add("disabled")
      btn.setAttribute("aria-disabled", "true")
      btn.addEventListener("click", e => e.preventDefault())

      if (blockedMsg) blockedMsg.style.display = "block"
    }
  } else {
    // 未ログイン → Register / Login（常にアクティブ）
    setBtnText("Create an account / Login")
    btn.href = "/account"
    btn.classList.add("secondary")
    btn.classList.remove("disabled")
  }

  btn.style.visibility = "visible"
})()
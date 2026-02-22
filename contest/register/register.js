// register.js
// supabase-client.js が先に読み込まれていることを前提とする（window.supabase を使用）

document.addEventListener("DOMContentLoaded", () => {

  // ── 共通：エラーをUIに表示するヘルパー ──────────────────────────
  function showError(elementId, message) {
    const el = document.getElementById(elementId)
    if (el) el.textContent = message
  }

  function clearError(elementId) {
    const el = document.getElementById(elementId)
    if (el) el.textContent = ""
  }

  // supabase クライアントが初期化されているか確認
  if (!window.supabase) {
    showError("register-error", "初期化エラー: Supabaseクライアントが読み込まれていません")
    showError("login-error",    "初期化エラー: Supabaseクライアントが読み込まれていません")
    return
  }

  const supabase = window.supabase

  // ─────────────────────────────────────────────
  // ① 新規登録フォーム
  // ─────────────────────────────────────────────
  const registerForm = document.getElementById("register-form")

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      clearError("register-error")

      const username = document.getElementById("register-username").value.trim()
      const grade    = document.getElementById("grade").value
      const password        = document.getElementById("password").value
      const passwordConfirm = document.getElementById("password-confirm").value
      const higaKey  = document.getElementById("higa_key").value.trim()
      const agree    = document.getElementById("agree").checked

      if (!agree) {
        showError("register-error", "規約に同意してください")
        return
      }

      if (!username) {
        showError("register-error", "ユーザー名を入力してください")
        return
      }

      if (!grade) {
        showError("register-error", "学年を選択してください")
        return
      }

      if (password.length < 6) {
        showError("register-error", "パスワードは6文字以上で入力してください")
        return
      }

      if (password !== passwordConfirm) {
        showError("register-error", "パスワードが一致しません")
        return
      }

      try {
        // contest_settings 取得
        const { data: setting, error: settingError } = await supabase
          .from("contest_settings")
          .select("status, higa_key")
          .eq("id", 1)
          .single()

        if (settingError) {
          showError("register-error", "設定取得エラー: " + settingError.message)
          return
        }

        if (setting.status !== "before") {
          showError("register-error", "現在登録期間ではありません")
          return
        }

        if (setting.higa_key !== higaKey) {
          showError("register-error", "HiGA Key が違います")
          return
        }

        // Auth 登録（ユーザー名を疑似メールに変換）
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: `${username}@higa.local`,
          password: password,
        })

        if (authError) {
          if (authError.message.includes("already registered")) {
            showError("register-error", "このユーザー名はすでに使われています")
          } else {
            showError("register-error", "登録エラー: " + authError.message)
          }
          return
        }

        const user = authData.user

        if (!user) {
          // メール確認が有効になっている場合はここに来る
          showError("register-error", "Supabaseのメール確認が有効です。ダッシュボードで Email Confirmations をオフにしてください。")
          return
        }

        // profiles に INSERT
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([{ user_id: user.id, username, grade }])

        if (profileError) {
          if (profileError.code === "23505") {
            showError("register-error", "このユーザー名はすでに使われています")
          } else {
            showError("register-error", "プロフィール作成エラー: " + profileError.message)
          }
          return
        }

        alert("登録成功！コンテストページへ移動します。")
        window.location.href = "/contest"

      } catch (err) {
        // 予期しないエラーを必ずUIに表示
        showError("register-error", "予期しないエラー: " + err.message)
        console.error("[register] unexpected error:", err)
      }
    })
  }

  // ─────────────────────────────────────────────
  // ② ログインフォーム（既存アカウント復帰用）
  // ─────────────────────────────────────────────
  const loginForm = document.getElementById("login-form")

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      clearError("login-error")

      const username = document.getElementById("login-username").value.trim()
      const password = document.getElementById("login-password").value

      if (!username || !password) {
        showError("login-error", "ユーザー名とパスワードを入力してください")
        return
      }

      try {
        // username → Auth メールアドレスの変換は登録時と同じルール（username@higa.local）。
        // ※ /contest/account で username を変更する場合は Auth 側のメールも同時に更新すること。
        const email = `${username}@higa.local`

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
          // エラー詳細は意図的に曖昧にしてユーザー名の存在を漏らさない
          showError("login-error", "ユーザー名またはパスワードが違います")
          console.error("[login] auth error:", error.message)
          return
        }

        // セッション（JWT）はSupabaseが自動管理。user_idはlocalStorageに保存しない。
        window.location.href = "/contest"

      } catch (err) {
        showError("login-error", "予期しないエラー: " + err.message)
        console.error("[login] unexpected error:", err)
      }
    })
  }

})
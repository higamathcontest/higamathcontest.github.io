// account.js
// register.js を置き換える統合ファイル。
// 未ログイン → 新規登録 / ログイン を表示
// ログイン済み → アカウント設定（ユーザー名変更・削除）を表示
// type="module" で読み込まれるため DOMContentLoaded 不要（自動 defer）。

(async () => {
  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msg;
    }
  }
  function showSuccess(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msg;
    }
  }
  function clearMsg(...ids) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    });
  }

  if (!window.supabase) {
    showError("register-error", TEXT.initError);
    return;
  }
  const supabase = window.supabase;

  //en ver
  const isEnglishPage = location.pathname.startsWith("/en/");

  const PATHS = {
    home: isEnglishPage ? "/en/" : "/",
    contest: isEnglishPage ? "/en/contest/" : "/contest",
    account: isEnglishPage ? "/en/account/" : "/account/",
    detail: isEnglishPage ? "/en/detail/" : "/detail",
  };

  const TEXT = {
    initError: isEnglishPage
      ? "Initialization error: Supabase is not loaded."
      : "初期化エラー: Supabaseが読み込まれていません",

    agreeRequired: isEnglishPage
      ? "Please agree to the terms."
      : "規約に同意してください",

    usernameRequired: isEnglishPage
      ? "Please enter a username."
      : "ユーザー名を入力してください",

    gradeRequired: isEnglishPage
      ? "Please select your grade."
      : "学年を選択してください",

    passwordLength: isEnglishPage
      ? "Password must be at least 6 characters."
      : "パスワードは6文字以上で入力してください",

    passwordMismatch: isEnglishPage
      ? "Passwords do not match."
      : "パスワードが一致しません",

    settingError: isEnglishPage ? "Settings error: " : "設定取得エラー: ",

    unknown: isEnglishPage ? "Unknown" : "不明",

    wrongHigaKey: isEnglishPage
      ? "HiGA Key is incorrect."
      : "HiGA Key が違います",

    usernameTaken: isEnglishPage
      ? "This username is already taken."
      : "このユーザー名はすでに使われています",

    registerError: isEnglishPage ? "Registration error: " : "登録エラー: ",

    emailConfirmOff: isEnglishPage
      ? "Please turn off Email Confirmations in Supabase."
      : "Supabase の Email Confirmations をオフにしてください",

    profileCreateError: isEnglishPage
      ? "Profile creation error: "
      : "プロフィール作成エラー: ",

    registerSuccess: isEnglishPage
      ? "Registration successful! Redirecting to the contest page."
      : "登録成功！コンテストページへ移動します。",

    unexpectedError: isEnglishPage
      ? "Unexpected error: "
      : "予期しないエラー: ",

    loginRequired: isEnglishPage
      ? "Please enter your username and password."
      : "ユーザー名とパスワードを入力してください",

    loginFailed: isEnglishPage
      ? "Username or password is incorrect."
      : "ユーザー名またはパスワードが違います",

    profileLoadFailed: isEnglishPage
      ? "Failed to load your profile."
      : "プロフィールの取得に失敗しました",

    newUsernameRequired: isEnglishPage
      ? "Please enter a new username."
      : "新しいユーザー名を入力してください",

    sameUsername: isEnglishPage
      ? "This is the same as your current username."
      : "現在と同じユーザー名です",

    updateError: isEnglishPage ? "Update error: " : "更新エラー: ",

    usernameUpdated: isEnglishPage
      ? "Username changed successfully."
      : "ユーザー名を変更しました",

    deleteConfirm: isEnglishPage
      ? "Are you sure you want to delete your account?\nThis action cannot be undone. All submission history will also be deleted."
      : "本当にアカウントを削除しますか？\nこの操作は取り消せません。提出履歴もすべて削除されます。",

    deleteError: isEnglishPage ? "Delete error: " : "削除エラー: ",

    deleteSuccess: isEnglishPage
      ? "Your account has been deleted."
      : "アカウントを削除しました。",
  };
  //

  const authSection = document.getElementById("auth-section");
  const accountSection = document.getElementById("account-section");

  // ── セッション確認 → 表示切り替え ────────────────────────────────
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // ログイン済み → アカウント設定を表示
    authSection.style.display = "none";
    accountSection.style.display = "block";
    await loadProfile(session.user.id);
  } else {
    // 未ログイン → 登録/ログインフォームを表示
    authSection.style.display = "block";
    accountSection.style.display = "none";
    initRegisterForm();
    initLoginForm();
  }

  // ════════════════════════════════════════════════════════════════
  // ① 新規登録
  // ════════════════════════════════════════════════════════════════
  function initRegisterForm() {
    const form = document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMsg("register-error");

      const username = document
        .getElementById("register-username")
        .value.trim();
      const grade = document.getElementById("grade").value;
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("password-confirm").value;
      const higaKey = document.getElementById("higa_key").value.trim();
      const agree = document.getElementById("agree").checked;

      // ── バリデーション ──
      if (!agree) return showError("register-error", TEXT.agreeRequired);
      if (!username) return showError("register-error", TEXT.usernameRequired);
      if (!grade) return showError("register-error", TEXT.gradeRequired);
      if (password.length < 6)
        return showError("register-error", TEXT.passwordLength);
      if (password !== passwordConfirm)
        return showError("register-error", TEXT.passwordMismatch);

      try {
        // contest_settings を直接参照（pg_cron が毎分 status を更新している）
        const { data: setting, error: settingError } = await supabase
          .from("contest_settings")
          .select("status, higa_key")
          .eq("id", 1)
          .single();

        if (settingError || !setting) {
          return showError(
            "register-error",
            TEXT.settingError + (settingError?.message ?? TEXT.unknown),
          );
        }
        if (setting.higa_key !== higaKey) {
          return showError("register-error", TEXT.wrongHigaKey);
        }

        // Auth 登録
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: `${username}@higa.local`,
            password,
          },
        );

        if (authError) {
          return showError(
            "register-error",
            authError.message.includes("already registered")
              ? TEXT.usernameTaken
              : TEXT.registerError + authError.message,
          );
        }

        const user = authData.user;
        if (!user) return showError("register-error", TEXT.emailConfirmOff);

        // profiles INSERT
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([{ user_id: user.id, username, grade }]);

        if (profileError) {
          return showError(
            "register-error",
            profileError.code === "23505"
              ? TEXT.usernameTaken
              : TEXT.profileCreateError + profileError.message,
          );
        }

        alert(TEXT.registerSuccess);
        window.location.href = PATHS.contest;
      } catch (err) {
        showError("register-error", "予期しないエラー: " + err.message);
        console.error("[register]", err);
      }
    });
  }

  // ════════════════════════════════════════════════════════════════
  // ② ログイン
  // ════════════════════════════════════════════════════════════════
  function initLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMsg("login-error");

      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value;

      if (!username || !password)
        return showError("login-error", TEXT.loginRequired);

      try {
        // username → Auth メールを DB 関数で解決する。
        // Auth 側のメールは登録時から変更しないため、username 変更後も正しく動作する。
        const { data: email, error: emailError } = await supabase.rpc(
          "get_auth_email_by_username",
          { p_username: username },
        );

        if (emailError || !email) {
          return showError("login-error", TEXT.loginFailed);
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("[login]", error.message);
          return showError("login-error", TEXT.loginFailed);
        }

        window.location.href = PATHS.contest;
      } catch (err) {
        showError("login-error", "予期しないエラー: " + err.message);
        console.error("[login]", err);
      }
    });
  }

  // ════════════════════════════════════════════════════════════════
  // ③ アカウント設定（ログイン済み時のみ）
  // ════════════════════════════════════════════════════════════════
  async function loadProfile(userId) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .single();

    if (error || !profile) {
      showError("username-error", TEXT.profileLoadFailed);
      return;
    }

    // 現在のユーザー名を表示
    const display = document.getElementById("current-username-display");
    if (display) display.textContent = profile.username;

    initUsernameForm(userId, profile.username);
    initLogout();
    initDeleteAccount();
  }

  // ── ユーザー名変更 ──────────────────────────────────────────────
  function initUsernameForm(userId, currentUsername) {
    const form = document.getElementById("username-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMsg("username-error", "username-success");

      const newUsername = document.getElementById("new-username").value.trim();

      if (!newUsername)
        return showError("username-error", TEXT.newUsernameRequired);
      if (newUsername === currentUsername)
        return showError("username-error", TEXT.sameUsername);

      try {
        // profiles を更新
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username: newUsername })
          .eq("user_id", userId);

        if (profileError) {
          return showError(
            "username-error",
            profileError.code === "23505"
              ? TEXT.usernameTaken
              : TEXT.updateError + profileError.message,
          );
        }

        // Auth のメールはそのまま（username@higa.local のまま変更しない）。
        // ログイン時は get_auth_email_by_username() で解決するため問題なし。

        // 画面の表示を更新
        const display = document.getElementById("current-username-display");
        if (display) display.textContent = newUsername;

        // nav も更新
        const navLink = document.getElementById("nav-username");
        if (navLink) {
          navLink.textContent = newUsername;
          navLink.style.textTransform = "none";
        }

        // 次回ログインのために currentUsername を更新
        currentUsername = newUsername;
        showSuccess("username-success", TEXT.usernameUpdated);
      } catch (err) {
        showError("username-error", "予期しないエラー: " + err.message);
        console.error("[username-update]", err);
      }
    });
  }

  // ── ログアウト ──────────────────────────────────────────────────
  function initLogout() {
    const btn = document.getElementById("logout-btn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = PATHS.contest;
    });
  }

  // ── アカウント削除 ──────────────────────────────────────────────
  function initDeleteAccount() {
    const btn = document.getElementById("delete-btn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const confirmed = window.confirm(TEXT.deleteConfirm);
      if (!confirmed) return;

      clearMsg("delete-error");

      try {
        // DB関数 delete_own_account() を呼び出す
        // （auth.users を削除 → profiles/submissions がカスケード削除される）
        const { error } = await supabase.rpc("delete_own_account");

        if (error) {
          return showError("delete-error", TEXT.deleteError + error.message);
        }

        await supabase.auth.signOut();
        alert(TEXT.deleteSuccess);
        window.location.href = PATHS.home;
      } catch (err) {
        showError("delete-error", "予期しないエラー: " + err.message);
        console.error("[delete-account]", err);
      }
    });
  }
})();

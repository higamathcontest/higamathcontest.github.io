// /contest/question/questionbox.js
// JOIN（profiles:user_id(...)）を使わず、
// ①questions を取得 → ②profiles を user_id の集合で取得 → ③JSで合体 する方式
// これで PGRST200（relationship not found）を回避できます。

(function () {
  const titleEl = document.getElementById("q-title");
  const bodyEl  = document.getElementById("q-body");
  const btnEl   = document.getElementById("post-question");
  const listEl  = document.getElementById("question-list");

  // 画面にメッセージを出したいなら HTML に <span id="q-msg"></span> を置いてOK
  const msgEl = document.getElementById("q-msg");

  if (!titleEl || !bodyEl || !btnEl || !listEl) {
    console.error("[questionbox] required elements not found");
    return;
  }

  function setMsg(text, isError = false) {
    if (!msgEl) {
      if (text) console.log("[questionbox]", text);
      return;
    }
    msgEl.textContent = text || "";
    msgEl.style.color = isError ? "#c00" : "";
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  async function getSupabase() {
    if (!window.supabase) {
      console.error("[questionbox] window.supabase not found. supabase-client.js loaded?");
      setMsg("Supabaseが読み込めていません。", true);
      return null;
    }
    return window.supabase;
  }

  async function getMe(supabase) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (!session) {
      // ログイン必須ページならここに来ないはずだけど念のため
      location.replace("/account?tab=login");
      return null;
    }

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, username, is_admin")
      .eq("user_id", session.user.id)
      .single();

    if (pErr) throw pErr;
    return profile;
  }

  async function loadQuestions() {
    listEl.innerHTML = `<p class="muted">読み込み中...</p>`;

    const supabase = await getSupabase();
    if (!supabase) return;

    let me;
    try {
      me = await getMe(supabase);
      if (!me) return;
    } catch (e) {
      console.error("[questionbox] getMe error:", e);
      listEl.innerHTML = `<p class="muted">読み込み失敗（profile）</p>`;
      return;
    }

    // ① questions を取得（profiles埋め込みはしない）
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select(`
        id, created_at, user_id, title, body,
        question_answers (id, created_at, admin_user_id, body)
      `)
      .order("created_at", { ascending: false });

    if (qErr) {
      console.error("[questionbox] questions select error:", qErr);
      listEl.innerHTML = `<p class="muted">読み込み失敗（questions）</p>`;
      return;
    }

    const list = questions || [];
    if (!list.length) {
      listEl.innerHTML = `<p class="muted">まだ質問がありません。</p>`;
      return;
    }

    // ② user_id の集合 → profiles をまとめて取得
    const userIds = [...new Set(list.map(q => q.user_id).filter(Boolean))];

    let nameMap = new Map();
    if (userIds.length) {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      if (pErr) {
        console.error("[questionbox] profiles select error:", pErr);
        // profilesが取れなくても質問は表示する
      } else {
        nameMap = new Map((profiles || []).map(p => [p.user_id, p.username]));
      }
    }

    // ③ username を付けて描画
    const merged = list.map(q => ({
      ...q,
      _username: nameMap.get(q.user_id) || "unknown"
    }));

    renderQuestions(merged, me, supabase);
  }

  function renderQuestions(list, me, supabase) {
    listEl.innerHTML = "";

    for (const q of list) {
      const wrap = document.createElement("div");
      wrap.className = "qa-item";

      const answers = Array.isArray(q.question_answers) ? q.question_answers : [];
      // 回答は1件のみ
      const existingAnswer = answers[0] ?? null;

      wrap.innerHTML = `
        <div class="qa-title">${escapeHtml(q.title)}</div>
        <div class="qa-body">${escapeHtml(q.body).replaceAll("\n", "<br>")}</div>

        ${existingAnswer ? `
          <div class="qa-answer">
            <div class="qa-meta">運営回答</div>
            <div>${escapeHtml(existingAnswer.body).replaceAll("\n", "<br>")}</div>
          </div>
        ` : ""}

        ${me.is_admin ? `
          <div class="qa-admin">
            <textarea id="ans-${q.id}" class="qa-textarea" placeholder="回答を書く">${existingAnswer ? escapeHtml(existingAnswer.body) : ""}</textarea>
            <div class="qa-admin-actions">
              <button type="button" class="qa-btn" data-act="answer" data-id="${q.id}">
                <span>${existingAnswer ? "回答を更新" : "回答送信"}</span>
              </button>
              <button type="button" class="qa-btn danger" data-act="delete" data-id="${q.id}"><span>質問削除</span></button>
            </div>
            <p class="muted" id="adminmsg-${q.id}"></p>
          </div>
        ` : ""}
      `;

      if (me.is_admin) {
        // 回答送信 or 更新
        wrap.querySelector(`[data-act="answer"][data-id="${q.id}"]`)?.addEventListener("click", async () => {
          const ta  = wrap.querySelector(`#ans-${q.id}`);
          const msg = wrap.querySelector(`#adminmsg-${q.id}`);
          const body = (ta?.value || "").trim();

          if (!body) { msg.textContent = "回答を入力してください。"; return; }

          msg.textContent = "送信中…";

          let error;
          if (existingAnswer) {
            // 既存回答を UPDATE
            ({ error } = await supabase
              .from("question_answers")
              .update({ body })
              .eq("id", existingAnswer.id));
          } else {
            // 新規 INSERT
            ({ error } = await supabase
              .from("question_answers")
              .insert({ question_id: q.id, admin_user_id: me.user_id, body }));
          }

          if (error) {
            console.error("[questionbox] answer save error:", error);
            msg.textContent = "保存に失敗しました。";
            return;
          }

          msg.textContent = "保存しました。";
          await loadQuestions();
        });

        // 質問削除
        wrap.querySelector(`[data-act="delete"][data-id="${q.id}"]`)?.addEventListener("click", async () => {
          if (!confirm("この質問を削除しますか？（回答も消えます）")) return;

          const { error } = await supabase
            .from("questions")
            .delete()
            .eq("id", q.id);

          if (error) {
            console.error("[questionbox] delete question error:", error);
            alert("削除に失敗しました。");
            return;
          }

          await loadQuestions();
        });
      }

      listEl.appendChild(wrap);
    }
  }

  // 質問投稿
  btnEl.addEventListener("click", async () => {
    const title = titleEl.value.trim();
    const body  = bodyEl.value.trim();

    if (!title || !body) {
      alert("タイトルと質問内容を入力してください。");
      return;
    }

    const supabase = await getSupabase();
    if (!supabase) return;

    let me;
    try {
      me = await getMe(supabase);
      if (!me) return;
    } catch (e) {
      console.error("[questionbox] getMe error:", e);
      alert("プロフィール取得に失敗しました（console見て）");
      return;
    }

    btnEl.disabled = true;
    setMsg("送信中…");

    const { error } = await supabase
      .from("questions")
      .insert({
        user_id: me.user_id,
        title,
        body
      });

    btnEl.disabled = false;

    if (error) {
      console.error("[questionbox] insert question error:", error);
      setMsg("送信に失敗しました（console見て）", true);
      alert("送信に失敗しました（console見て）");
      return;
    }

    titleEl.value = "";
    bodyEl.value  = "";
    setMsg("送信しました！");
    await loadQuestions();
  });

  // 初期ロード
  loadQuestions().catch(e => {
    console.error("[questionbox] init error:", e);
    listEl.innerHTML = `<p class="muted">エラー（console見て）</p>`;
  });

})();
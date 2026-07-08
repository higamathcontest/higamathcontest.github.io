// contest.js
// 日本語版・英語版のコンテストトップで共通して使用する

(async () => {
  if (!window.supabase) {
    console.error('[contest.js] window.supabase が見つかりません。');
    return;
  }

  const btn = document.getElementById('contest-btn');
  const blockedMsg = document.getElementById('blocked-msg');

  if (!btn) return;

  const isEnglish = document.documentElement.lang
    .toLowerCase()
    .startsWith('en');

  const problemsPath = isEnglish
    ? '/en/contest/problems/'
    : '/contest/problems/';

  const accountPath = isEnglish
    ? '/en/account/'
    : '/account/';

  function setBtnText(text) {
    btn.innerHTML = [...text]
      .map((character) =>
        character === ' '
          ? '<span class="char" aria-hidden="true">&nbsp;</span>'
          : `<span class="char" aria-hidden="true">${character}</span>`
      )
      .join('');

    btn.setAttribute('aria-label', text);
  }

  const [
    { data: settings, error: settingsError },
    { data: sessionData, error: sessionError },
  ] = await Promise.all([
    window.supabase
      .from('contest_settings')
      .select('status')
      .eq('id', 1)
      .single(),

    window.supabase.auth.getSession(),
  ]);

  if (settingsError) {
    console.error(
      '[contest.js] contest_settings の取得エラー:',
      settingsError.message
    );
  }

  if (sessionError) {
    console.error(
      '[contest.js] セッション取得エラー:',
      sessionError.message
    );
  }

  const status = settings?.status;
  const session = sessionData?.session ?? null;
  const isLogin = Boolean(session);

  if (isLogin) {
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error(
        '[contest.js] profiles の取得エラー:',
        profileError.message
      );
    }

    const isAdmin = Boolean(profile?.is_admin);

    if (
      status === 'running' ||
      status === 'finished' ||
      isAdmin
    ) {
      setBtnText('Enter');
      btn.href = problemsPath;
      btn.classList.remove('secondary', 'disabled');
      btn.removeAttribute('aria-disabled');
    } else {
      setBtnText('Enter');
      btn.href = '#';
      btn.classList.add('disabled');
      btn.setAttribute('aria-disabled', 'true');

      btn.addEventListener('click', (event) => {
        event.preventDefault();
      });

      if (blockedMsg) {
        blockedMsg.style.display = 'block';
      }
    }
  } else {
    setBtnText('Create an account / Login');
    btn.href = accountPath;
    btn.classList.add('secondary');
    btn.classList.remove('disabled');
    btn.removeAttribute('aria-disabled');
  }

  btn.style.visibility = 'visible';
})();
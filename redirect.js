import { supabase } from '/supabase-client.js';

(async () => {
  // ① contest_settings から status を取得
  const { data: settings } = await supabase
    .from('contest_settings')
    .select('status')
    .eq('id', 1)
    .single();

  const status = settings?.status;

  // before 以外（running / finished）はそのまま通過
  if (status !== 'before') return;

  // ② before の場合：ログイン中ユーザーの is_admin を確認
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // 未ログイン → トップへ
    location.replace('/');
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', session.user.id)
    .single();

  if (!profile?.is_admin) {
    // 一般ユーザー → トップへ
    location.replace('/');
  }

  // is_admin === true はそのまま通過
})();
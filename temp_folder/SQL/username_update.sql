-- ログイン時に username → Auth メールアドレスを解決するための関数。
-- security definer により anon でも実行可能（auth.users に直接アクセスさせない）。
-- username から email を返すだけで、パスワードや他の情報は一切返さない。

create or replace function get_auth_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select au.email into v_email
  from auth.users au
  join public.profiles p on p.user_id = au.id
  where p.username = p_username;

  return v_email; -- 存在しない場合は null を返す
end;
$$;

-- anon（未ログイン）からも呼び出せるようにする（ログイン前に必要なため）
grant execute on function get_auth_email_by_username(text) to anon, authenticated;
-- アカウント削除用DB関数
-- クライアントから auth.users を直接削除できないため、
-- security definer 関数を経由して自分自身のアカウントを削除する。
-- profiles と submissions は ON DELETE CASCADE で自動削除される。

create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 呼び出し元が自分自身であることを確認してから削除
  delete from auth.users where id = auth.uid();
end;
$$;

-- 認証済みユーザーのみ実行可能にする
revoke execute on function delete_own_account() from anon;
grant execute on function delete_own_account() to authenticated;

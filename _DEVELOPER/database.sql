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


create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  grade text,
  score int default 0
);

create table problems (
  id uuid primary key default gen_random_uuid(),
  problem_number int not null,
  field text not null,
  correct_answer text not null,
  point int not null
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade,
  problem_id uuid references problems(id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  submitted_at timestamp with time zone default now()
);

create table contest_settings (
  id int primary key default 1,
  status text not null,
  start_time timestamp not null,
  end_time timestamp not null,
  higa_key text not null,
  submission_limit int not null,
  penalty_minutes int not null
);

insert into contest_settings
(id, status, start_time, end_time, higa_key, submission_limit, penalty_minutes)
values
(
  1,
  'before',
  '2026-06-20 13:00:00+09',
  '2026-06-21 13:00:00+09',
  'HIGA2026',
  10,
  10
);

alter table profiles enable row level security;
alter table submissions enable row level security;
alter table problems enable row level security;
alter table contest_settings enable row level security;

create policy "select own profile"
on profiles
for select
using (auth.uid() = user_id);

create policy "update own profile"
on profiles
for update
using (auth.uid() = user_id);

create policy "insert own profile"
on profiles
for insert
with check (auth.uid() = user_id);

create policy "delete own profile"
on profiles
for delete
using (auth.uid() = user_id);

create policy "select own submissions"
on submissions
for select
using (auth.uid() = user_id);

create policy "no direct insert submissions"
on submissions
for insert
with check (false);

create policy "no update submissions"
on submissions
for update
using (false);

create policy "no delete submissions"
on submissions
for delete
using (false);

create policy "select problems"
on problems
for select
using (true);

create policy "public read settings"
on contest_settings
for select
using (true);

revoke select (correct_answer) on problems from anon, authenticated;
revoke all on submissions from anon, authenticated;
revoke all on problems from anon, authenticated;


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




-- ================================================================
-- コンテスト status 自動管理
-- ================================================================
-- 方針：
--   ① update_contest_status() 関数：now() と start/end_time を比較して
--      status カラムを before/running/finished に更新する
--   ② pg_cron で1分ごとに ① を実行（Supabase では標準で有効）
--   ③ get_contest_status() 関数：クエリ時に動的計算（cron の隙間を埋める）
--
-- フロント側は get_contest_status() を呼ぶだけでよい。
-- ================================================================


-- ----------------------------------------------------------------
-- ② pg_cron で1分ごとに実行
--    ※ Supabase Dashboard → Database → Extensions → pg_cron が
--      有効になっていることを確認してから実行する
-- ----------------------------------------------------------------
select cron.schedule(
  'update-contest-status',   -- ジョブ名（重複登録防止のため一意にする）
  '* * * * *',               -- 毎分実行
  $$select update_contest_status()$$
);


-- ----------------------------------------------------------------
-- ③ クエリ時に動的計算する関数（cron の ±1分の誤差を埋める）
--    フロントは contest_settings を直接 SELECT する代わりに
--    この関数を呼ぶ → 常にリアルタイムな status が得られる
-- ----------------------------------------------------------------
create or replace function get_contest_status()
returns table (
  status          text,
  start_time      timestamp,
  end_time        timestamp,
  submission_limit int,
  penalty_minutes  int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    case
      when now() < cs.start_time                        then 'before'
      when now() between cs.start_time and cs.end_time  then 'running'
      else                                                   'finished'
    end as status,
    cs.start_time,
    cs.end_time,
    cs.submission_limit,
    cs.penalty_minutes
  from contest_settings cs
  where cs.id = 1;
end;
$$;

-- 誰でも呼べるようにする（higa_key は含めない）
grant execute on function get_contest_status() to anon, authenticated;


-- ----------------------------------------------------------------
-- ④ 即時反映：この SQL を実行した瞬間に status を正しい値にする
-- ----------------------------------------------------------------
select update_contest_status();
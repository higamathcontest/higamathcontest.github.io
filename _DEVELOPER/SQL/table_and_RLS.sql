create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  grade text,
  score int default 0
);

ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
-- 自分のアカウントだけ true にする
UPDATE users SET is_admin = true WHERE username = 'your_name';

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

-- カラムを timestamptz（タイムゾーンあり）に変更
alter table contest_settings
  alter column start_time type timestamptz using start_time at time zone 'Asia/Tokyo',
  alter column end_time   type timestamptz using end_time   at time zone 'Asia/Tokyo';

-- start_time を正しい JST 時刻で入れ直す
update contest_settings
set
  start_time = '2026-06-20 13:00:00+09',
  end_time   = '2026-06-21 13:00:00+09'
where id = 1;

-- 即時反映
select update_contest_status();
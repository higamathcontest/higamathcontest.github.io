-- ① status を更新する関数
create or replace function update_contest_status()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update contest_settings
  set status = case
    when now() < start_time                    then 'before'
    when now() between start_time and end_time then 'running'
    else                                            'finished'
  end
  where id = 1;
end;
$$;

-- ② pg_cron で毎分実行
select cron.schedule(
  'update-contest-status',
  '* * * * *',
  $$select update_contest_status()$$
);

-- ③ 即時反映
select update_contest_status();
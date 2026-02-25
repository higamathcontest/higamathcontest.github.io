/**
 * problems-top.js
 * /contest/problems/ の問題一覧ページで読み込む
 *
 * - ユーザーのスコア・ペナルティを表示
 * - AC 済みの問題 <li> を緑色にする
 */

import { supabase } from './supabase-client.js';

// problem_number ('A1', 'G6' など) → href のプレフィックスに変換
const CATEGORY_MAP = {
  A: 'algebra',
  C: 'combinatorics',
  G: 'geometry',
  N: 'number-theory',
};

function problemNumberToHref(problemNumber) {
  // 例: 'A1' → '/contest/problems/algebra/1/'
  const letter = problemNumber[0].toUpperCase();
  const number = problemNumber.slice(1);
  const category = CATEGORY_MAP[letter];
  if (!category) return null;
  return `/contest/problems/${category}/${number}/`;
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const userId = session.user.id;

  // ① プロフィール ② AC済み提出 ③ 全問題のpoint を並列取得
  const [
    { data: profile, error: profileErr },
    { data: solvedRows, error: solvedErr },
    { data: allProblems, error: problemsErr },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('score, penalty')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('submissions')
      .select('problem_id')
      .eq('user_id', userId)
      .eq('is_correct', true),
    supabase
      .from('problems')
      .select('problem_number, point'),
  ]);

  if (profileErr)  console.error('profiles 取得エラー:', profileErr.message);
  if (solvedErr)   console.error('submissions 取得エラー:', solvedErr.message);
  if (problemsErr) console.error('problems 取得エラー:', problemsErr.message);

  // ── スコア・ペナルティ表示 ────────────────────────────────────
  const scoreEl   = document.getElementById('my-score');
  const penaltyEl = document.getElementById('my-penalty');

  if (scoreEl)   scoreEl.textContent   = `${profile?.score   ?? 0} pnt.`;
  if (penaltyEl) penaltyEl.textContent = `${profile?.penalty ?? 0} min.`;

  // ── 各問題の point を表示 ────────────────────────────────────
  // problem_number → point のマップを作成
  const pointMap = Object.fromEntries(
    (allProblems ?? []).map(p => [p.problem_number, p.point])
  );

  document.querySelectorAll('.contest-links li[data-problem-number]').forEach(li => {
    const pn    = li.dataset.problemNumber;
    const point = pointMap[pn];
    const span  = li.querySelector('.score');
    if (span && point != null) span.textContent = `${point} pts`;
  });

  // ── AC 済み問題を緑色に ──────────────────────────────────────
  const solvedIds = (solvedRows ?? []).map(r => r.problem_id);
  const { data: solvedProblems } = solvedIds.length > 0
    ? await supabase
        .from('problems')
        .select('problem_number')
        .in('id', solvedIds)
    : { data: [] };

  const solvedHrefs = new Set(
    (solvedProblems ?? [])
      .map(r => problemNumberToHref(r.problem_number))
      .filter(Boolean)
  );

  document.querySelectorAll('.contest-links li a').forEach(a => {
    if (solvedHrefs.has(a.getAttribute('href'))) {
      a.closest('li').classList.add('ac');
    }
  });
}

init();
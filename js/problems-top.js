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

  // ① プロフィール（スコア・ペナルティ）と ② AC 済み提出の problem_id を並列取得
  const [
    { data: profile, error: profileErr },
    { data: solvedRows, error: solvedErr },
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
  ]);

  if (profileErr) console.error('profiles 取得エラー:', profileErr.message);
  if (solvedErr)  console.error('submissions 取得エラー:', solvedErr.message);

  // ── スコア・ペナルティ表示 ────────────────────────────────────
  const scoreEl   = document.getElementById('my-score');
  const penaltyEl = document.getElementById('my-penalty');

  if (scoreEl)   scoreEl.textContent   = `${profile?.score   ?? 0} pnt.`;
  if (penaltyEl) penaltyEl.textContent = `${profile?.penalty ?? 0} min.`;

  // ── AC 済み問題を緑色に ──────────────────────────────────────
  // problem_id 一覧から problems テーブルの problem_number を取得
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
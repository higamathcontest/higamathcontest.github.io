/**
 * problems-top.js
 * /contest/problems/
 * /en/contest/problems/
 * の問題一覧ページで共通して読み込む
 *
 * - ユーザーのスコア・ペナルティを表示
 * - 各問題の点数を表示
 * - AC済みの問題を緑色にする
 */

import { supabase } from './supabase-client.js';

async function loadProblemPoints() {
  const { data: allProblems, error } = await supabase
    .from('problems')
    .select('problem_number, point');

  if (error) {
    console.error('problems 取得エラー:', error.message);
    return;
  }

  const pointMap = Object.fromEntries(
    (allProblems ?? []).map((problem) => [
      problem.problem_number,
      problem.point,
    ])
  );

  document
    .querySelectorAll('.contest-links li[data-problem-number]')
    .forEach((item) => {
      const problemNumber = item.dataset.problemNumber;
      const point = pointMap[problemNumber];
      const scoreElement = item.querySelector('.score');

      if (scoreElement && point != null) {
        scoreElement.textContent = `${point} pts`;
      }
    });
}

async function loadUserStatus(session) {
  if (!session) return;

  const userId = session.user.id;

  const [
    { data: profile, error: profileError },
    { data: solvedRows, error: solvedError },
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

  if (profileError) {
    console.error(
      'profiles 取得エラー:',
      profileError.message
    );
  }

  if (solvedError) {
    console.error(
      'submissions 取得エラー:',
      solvedError.message
    );
  }

  const scoreElement =
    document.getElementById('my-score');

  const penaltyElement =
    document.getElementById('my-penalty');

  if (scoreElement) {
    scoreElement.textContent =
      `${profile?.score ?? 0} pnt.`;
  }

  if (penaltyElement) {
    penaltyElement.textContent =
      `${profile?.penalty ?? 0} min.`;
  }

  const solvedIds = [
    ...new Set(
      (solvedRows ?? [])
        .map((row) => row.problem_id)
        .filter(Boolean)
    ),
  ];

  if (solvedIds.length === 0) return;

  const { data: solvedProblems, error: problemError } =
    await supabase
      .from('problems')
      .select('problem_number')
      .in('id', solvedIds);

  if (problemError) {
    console.error(
      'AC済み問題の取得エラー:',
      problemError.message
    );
    return;
  }

  const solvedNumbers = new Set(
    (solvedProblems ?? []).map(
      (problem) => problem.problem_number
    )
  );

  document
    .querySelectorAll('.contest-links li[data-problem-number]')
    .forEach((item) => {
      if (solvedNumbers.has(item.dataset.problemNumber)) {
        item.classList.add('ac');
      }
    });
}

async function init() {
  const [sessionResult] = await Promise.all([
    supabase.auth.getSession(),
    loadProblemPoints(),
  ]);

  if (sessionResult.error) {
    console.error(
      'セッション取得エラー:',
      sessionResult.error.message
    );
    return;
  }

  await loadUserStatus(sessionResult.data.session);
}

init();
/**
 * problems-detail.js
 * /contest/problems/:category/:number  の問題ページで読み込む
 *
 * 依存: supabase-client.js が window.supabase にクライアントを export していること
 *       <html data-problem-number="A1"> で問題番号を埋め込んでいること
 */

import { supabase } from './supabase-client.js';

// ── 問題番号 → カテゴリ表示名 ────────────────────────────────────
const CATEGORY_LABEL = {
  A: '代数 Algebra',
  C: '組み合わせ Combinatorics',
  G: '幾何 Geometry',
  N: '整数 Number Theory',
};

// ── DOM 参照 ─────────────────────────────────────────────────────
const form      = document.getElementById('answer-form');
const input     = form?.querySelector('input[name="answer"]');
const submitBtn = form?.querySelector('button[type="submit"]');
const remainMsg = document.getElementById('remaining-count');

// 問題番号は <html data-problem-number="A1"> から取得
const PROBLEM_NUMBER = document.documentElement.dataset.problemNumber
                    || document.querySelector('[data-problem-number]')?.dataset.problemNumber;

// ── ヘッダーに問題情報を反映 ──────────────────────────────────────
async function fetchProblemMeta() {
  if (!PROBLEM_NUMBER) return;

  const { data, error } = await supabase
    .from('problems')
    .select('point')
    .eq('problem_number', PROBLEM_NUMBER)
    .single();

  if (error) {
    console.error('問題情報の取得エラー:', error.message);
    return;
  }

  const letter        = PROBLEM_NUMBER[0].toUpperCase();
  const number        = PROBLEM_NUMBER.slice(1);
  const categoryLabel = CATEGORY_LABEL[letter] ?? letter;

  const titleEl = document.querySelector('.problem-title');
  if (titleEl) titleEl.textContent = `${categoryLabel} - Problem ${number}`;

  const ptsEl = document.querySelector('.pts');
  if (ptsEl) ptsEl.textContent = data.point ?? '--';

  document.title = `Problem ${PROBLEM_NUMBER} | HiGA Math Contest`;
}

// ── ユーティリティ ───────────────────────────────────────────────
function setInputDisabled(reason) {
  if (!input || !submitBtn) return;
  input.disabled     = true;
  submitBtn.disabled = true;
  submitBtn.classList.add('disabled');

  const messages = {
    already_solved:    'この問題はすでに正解しています。',
    limit_reached:     '提出回数の上限に達しました。',
    not_authenticated: 'ログインが必要です。',
    problem_not_found: '問題が見つかりません。',
  };

  if (remainMsg) remainMsg.textContent = messages[reason] ?? '';
}

// ── checkSubmittable：ページロード時に呼び出す ────────────────────
async function checkSubmittable() {
  if (!PROBLEM_NUMBER) {
    console.error('data-problem-number が設定されていません。');
    return;
  }

  const { data, error } = await supabase.rpc('is_submittable', {
    p_problem_number: PROBLEM_NUMBER,
  });

  if (error) {
    console.error('is_submittable エラー:', error.message);
    if (remainMsg) remainMsg.textContent = '読み込みに失敗しました。';
    return;
  }

  if (data.status !== 'ok') {
    setInputDisabled(data.status);
    return;
  }

  if (remainMsg) remainMsg.textContent = `あと ${data.remaining} 回提出できます。`;
}

// ── handleSubmit：フォーム送信時に呼び出す ───────────────────────
async function handleSubmit(e) {
  e.preventDefault();

  const answer = input?.value?.trim();
  if (!answer || !PROBLEM_NUMBER) return;

  submitBtn.disabled = true;
  if (remainMsg) remainMsg.textContent = '判定中...';

  const { data: result, error } = await supabase.rpc('submit_and_check', {
    p_problem_number: PROBLEM_NUMBER,
    p_answer:         answer,
  });

  if (error) {
    console.error('submit_and_check エラー:', error.message);
    submitBtn.disabled = false;
    if (remainMsg) remainMsg.textContent = '送信エラーが発生しました。再度お試しください。';
    return;
  }

  if (result.error) {
    setInputDisabled(result.error);
    return;
  }

  window.location.href = '/contest/submissions/';
}

// ── 初期化 ───────────────────────────────────────────────────────
if (form) {
  fetchProblemMeta();
  checkSubmittable();
  form.addEventListener('submit', handleSubmit);
} else {
  console.warn('#answer-form が見つかりません。');
}
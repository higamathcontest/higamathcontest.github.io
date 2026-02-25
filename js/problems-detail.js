/**
 * problems-detail.js
 * /contest/problems/:category/:number  の問題ページで読み込む
 *
 * 依存: supabase-client.js が window.supabase にクライアントを export していること
 *       <html data-problem-id="UUID"> で問題IDを埋め込んでいること
 */

import { supabase } from './supabase-client.js';

// ── DOM 参照 ─────────────────────────────────────────────────────
const form      = document.getElementById('answer-form');
const input     = form?.querySelector('input[name="answer"]');
const submitBtn = form?.querySelector('button[type="submit"]');
const remainMsg = document.getElementById('remaining-count');

// 問題IDは <html data-problem-id="..."> または <main data-problem-id="..."> から取得
const PROBLEM_ID = document.documentElement.dataset.problemId
                || document.querySelector('[data-problem-id]')?.dataset.problemId;

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
  };

  if (remainMsg) remainMsg.textContent = messages[reason] ?? '';
}

// ── checkSubmittable：ページロード時に呼び出す ────────────────────
async function checkSubmittable() {
  if (!PROBLEM_ID) {
    console.error('data-problem-id が設定されていません。');
    return;
  }

  // is_submittable RPC 1本で status と remaining を取得（サーバー側で完結）
  const { data, error } = await supabase.rpc('is_submittable', {
    p_problem_id: PROBLEM_ID,
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
  if (!answer || !PROBLEM_ID) return;

  // 二重送信防止・UI を送信中状態に
  submitBtn.disabled = true;
  if (remainMsg) remainMsg.textContent = '判定中...';

  const { data: result, error } = await supabase.rpc('submit_and_check', {
    p_problem_id: PROBLEM_ID,
    p_answer:     answer,
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

  // 結果は /submissions で表示するため、ここでは即リダイレクト
  window.location.href = '/contest/submissions/';
}

// ── 初期化 ───────────────────────────────────────────────────────
if (form) {
  checkSubmittable();
  form.addEventListener('submit', handleSubmit);
} else {
  console.warn('#answer-form が見つかりません。');
}
/**
 * submissions.js
 * /contest/submissions/  の提出履歴ページで読み込む
 *
 * 依存: supabase-client.js が window.supabase にクライアントを export していること
 *       HTML 側に <div id="submissions-container"> を用意すること
 */

import { supabase } from './supabase-client.js';

// ── 問題番号 → href 変換 ──────────────────────────────────────────
const CATEGORY_MAP = {
  A: 'algebra',
  C: 'combinatorics',
  G: 'geometry',
  N: 'number-theory',
};

function problemNumberToHref(problemNumber) {
  const letter   = problemNumber[0].toUpperCase();
  const number   = problemNumber.slice(1);
  const category = CATEGORY_MAP[letter];
  if (!category) return '#';
  return `/contest/problems/${category}/${number}/`;
}

// ── DOM 参照 ─────────────────────────────────────────────────────
const container = document.getElementById('submissions-container');

// ── 提出履歴を取得して描画 ────────────────────────────────────────
async function loadSubmissions() {
  if (!container) return;

  container.innerHTML = '<p class="loading-msg">読み込み中...</p>';

  const { data: rows, error } = await supabase.rpc('get_my_submissions');

  if (error) {
    console.error('get_my_submissions エラー:', error.message);
    container.innerHTML = '<p class="error-msg">提出履歴の取得に失敗しました。</p>';
    return;
  }


  if (rows.length === 0) {
    container.innerHTML = '<p class="empty-msg">まだ提出がありません。</p>';
    return;
  }

  // テーブル生成
  const table = document.createElement('table');
  table.className = 'submissions-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>問題</th>
        <th>解答</th>
        <th>結果</th>
        <th>提出日時</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  rows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.className = row.is_correct ? 'row-correct' : 'row-wrong';

    const date = new Date(row.submitted_at);
    const dateStr = date.toLocaleString('ja-JP', {
      year:   'numeric',
      month:  '2-digit',
      day:    '2-digit',
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    tr.innerHTML = `
      <td>${rows.length - idx}</td>
      <td>
        <a href="${problemNumberToHref(row.problem_number)}">
          Problem ${row.problem_number}
        </a>
      </td>
      <td class="answer-cell">${escapeHtml(row.answer)}</td>
      <td>
        <span class="badge ${row.is_correct ? 'badge-ac' : 'badge-wa'}">
          ${row.is_correct ? 'AC' : 'WA'}
        </span>
      </td>
      <td class="date-cell">${dateStr}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}

// XSS 対策
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── 初期化 ───────────────────────────────────────────────────────
loadSubmissions();
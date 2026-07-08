/**
 * submissions.js
 * /contest/submissions/
 * /en/contest/submissions/
 * の提出履歴ページで共通して読み込む
 */

import { supabase } from './supabase-client.js';

const isEnglish = document.documentElement.lang
  .toLowerCase()
  .startsWith('en');

const TEXT = isEnglish
  ? {
      loading: 'Loading...',
      loadError:
        'Failed to load submission history.',
      empty:
        'There are no submissions yet.',
      problem:
        'Problem',
      answer:
        'Answer',
      result:
        'Result',
      submittedAt:
        'Submitted at',
    }
  : {
      loading:
        '読み込み中...',
      loadError:
        '提出履歴の取得に失敗しました。',
      empty:
        'まだ提出がありません。',
      problem:
        '問題',
      answer:
        '解答',
      result:
        '結果',
      submittedAt:
        '提出日時',
    };

const locale =
  isEnglish ? 'en-GB' : 'ja-JP';

const problemsBasePath = isEnglish
  ? '/en/contest/problems'
  : '/contest/problems';

const CATEGORY_MAP = {
  A: 'algebra',
  C: 'combinatorics',
  G: 'geometry',
  N: 'number-theory',
};

function problemNumberToHref(problemNumber) {
  if (!problemNumber) return '#';

  const letter =
    problemNumber[0].toUpperCase();

  const number =
    problemNumber.slice(1);

  const category =
    CATEGORY_MAP[letter];

  if (!category) return '#';

  return (
    `${problemsBasePath}/` +
    `${category}/${number}/`
  );
}

const container =
  document.getElementById(
    'submissions-container'
  );

async function loadSubmissions() {
  if (!container) return;

  container.innerHTML =
    `<p class="loading-msg">` +
    `${TEXT.loading}</p>`;

  const { data: rows, error } =
    await supabase.rpc(
      'get_my_submissions'
    );

  if (error) {
    console.error(
      'get_my_submissions エラー:',
      error.message
    );

    container.innerHTML =
      `<p class="error-msg">` +
      `${TEXT.loadError}</p>`;

    return;
  }

  if (!rows || rows.length === 0) {
    container.innerHTML =
      `<p class="empty-msg">` +
      `${TEXT.empty}</p>`;

    return;
  }

  const table =
    document.createElement('table');

  table.className =
    'submissions-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>${TEXT.problem}</th>
        <th>${TEXT.answer}</th>
        <th>${TEXT.result}</th>
        <th>${TEXT.submittedAt}</th>
      </tr>
    </thead>
  `;

  const tbody =
    document.createElement('tbody');

  rows.forEach((row, index) => {
    const tr =
      document.createElement('tr');

    tr.className = row.is_correct
      ? 'row-correct'
      : 'row-wrong';

    const date =
      new Date(row.submitted_at);

    const dateString =
      date.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    tr.innerHTML = `
      <td>${rows.length - index}</td>

      <td>
        <a href="${
          problemNumberToHref(
            row.problem_number
          )
        }">
          Problem ${
            escapeHtml(
              row.problem_number
            )
          }
        </a>
      </td>

      <td class="answer-cell">
        ${escapeHtml(row.answer)}
      </td>

      <td>
        <span class="badge ${
          row.is_correct
            ? 'badge-ac'
            : 'badge-wa'
        }">
          ${
            row.is_correct
              ? 'AC'
              : 'WA'
          }
        </span>
      </td>

      <td class="date-cell">
        ${dateString}
      </td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  container.innerHTML = '';
  container.appendChild(table);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

loadSubmissions();
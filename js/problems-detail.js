/**
 * problems-detail.js
 * /contest/problems/:category/:number/
 * /en/contest/problems/:category/:number/
 * の問題ページで共通して読み込む
 *
 * 必要なHTML:
 * <html lang="ja" data-problem-number="A1">
 * または
 * <html lang="en" data-problem-number="A1">
 */

import { supabase } from './supabase-client.js';

const isEnglish = document.documentElement.lang
  .toLowerCase()
  .startsWith('en');

const CATEGORY_LABEL = isEnglish
  ? {
      A: 'Algebra',
      C: 'Combinatorics',
      G: 'Geometry',
      N: 'Number Theory',
    }
  : {
      A: '代数 Algebra',
      C: '組み合わせ Combinatorics',
      G: '幾何 Geometry',
      N: '整数 Number Theory',
    };

const MESSAGES = isEnglish
  ? {
      already_solved:
        'You have already solved this problem.',
      limit_reached:
        'You have reached the submission limit.',
      not_authenticated:
        'You must be logged in to submit an answer.',
      problem_not_found:
        'The problem could not be found.',
      load_failed:
        'Failed to load the submission information.',
      judging:
        'Judging...',
      submit_failed:
        'A submission error occurred. Please try again.',
      missing_problem_number:
        'The problem number has not been configured.',
    }
  : {
      already_solved:
        'この問題はすでに正解しています。',
      limit_reached:
        '提出回数の上限に達しました。',
      not_authenticated:
        'ログインが必要です。',
      problem_not_found:
        '問題が見つかりません。',
      load_failed:
        '読み込みに失敗しました。',
      judging:
        '判定中...',
      submit_failed:
        '送信エラーが発生しました。再度お試しください。',
      missing_problem_number:
        '問題番号が設定されていません。',
    };

const form =
  document.getElementById('answer-form');

const input =
  form?.querySelector('input[name="answer"]');

const submitBtn =
  form?.querySelector('button[type="submit"]');

const remainMsg =
  document.getElementById('remaining-count');

const PROBLEM_NUMBER =
  document.documentElement.dataset.problemNumber ||
  document
    .querySelector('[data-problem-number]')
    ?.dataset.problemNumber;

async function fetchProblemMeta() {
  if (!PROBLEM_NUMBER) {
    console.error(
      'data-problem-number が設定されていません。'
    );

    const titleElement =
      document.querySelector('.problem-title');

    if (titleElement) {
      titleElement.textContent =
        MESSAGES.missing_problem_number;
    }

    return;
  }

  const { data, error } = await supabase
    .from('problems')
    .select('point')
    .eq('problem_number', PROBLEM_NUMBER)
    .single();

  if (error) {
    console.error(
      '問題情報の取得エラー:',
      error.message
    );

    const titleElement =
      document.querySelector('.problem-title');

    if (titleElement) {
      titleElement.textContent =
        MESSAGES.problem_not_found;
    }

    return;
  }

  const letter =
    PROBLEM_NUMBER[0].toUpperCase();

  const number =
    PROBLEM_NUMBER.slice(1);

  const categoryLabel =
    CATEGORY_LABEL[letter] ?? letter;

  const titleElement =
    document.querySelector('.problem-title');

  if (titleElement) {
    titleElement.textContent =
      `${categoryLabel} - Problem ${number}`;
  }

  const pointsElement =
    document.querySelector('.pts');

  if (pointsElement) {
    pointsElement.textContent =
      data?.point ?? '--';
  }

  document.title =
    `Problem ${PROBLEM_NUMBER} | HiGA Math Contest`;
}

function setInputDisabled(reason) {
  if (input) {
    input.disabled = true;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('disabled');
  }

  if (remainMsg) {
    remainMsg.textContent =
      MESSAGES[reason] ?? '';
  }
}

function showRemainingCount(remaining) {
  if (!remainMsg) return;

  if (isEnglish) {
    const unit =
      remaining === 1
        ? 'submission'
        : 'submissions';

    remainMsg.textContent =
      `${remaining} ${unit} remaining.`;
  } else {
    remainMsg.textContent =
      `あと ${remaining} 回提出できます。`;
  }
}

async function checkSubmittable() {
  if (!PROBLEM_NUMBER) {
    console.error(
      'data-problem-number が設定されていません。'
    );

    if (remainMsg) {
      remainMsg.textContent =
        MESSAGES.missing_problem_number;
    }

    return;
  }

  const { data, error } = await supabase.rpc(
    'is_submittable',
    {
      p_problem_number: PROBLEM_NUMBER,
    }
  );

  if (error) {
    console.error(
      'is_submittable エラー:',
      error.message
    );

    if (remainMsg) {
      remainMsg.textContent =
        MESSAGES.load_failed;
    }

    return;
  }

  if (!data) {
    if (remainMsg) {
      remainMsg.textContent =
        MESSAGES.load_failed;
    }

    return;
  }

  if (data.status !== 'ok') {
    setInputDisabled(data.status);
    return;
  }

  showRemainingCount(data.remaining);
}

async function handleSubmit(event) {
  event.preventDefault();

  const answer =
    input?.value?.trim();

  if (
    !answer ||
    !PROBLEM_NUMBER ||
    !submitBtn
  ) {
    return;
  }

  submitBtn.disabled = true;

  if (remainMsg) {
    remainMsg.textContent =
      MESSAGES.judging;
  }

  const { data: result, error } =
    await supabase.rpc(
      'submit_and_check',
      {
        p_problem_number: PROBLEM_NUMBER,
        p_answer: answer,
      }
    );

  if (error) {
    console.error(
      'submit_and_check エラー:',
      error.message
    );

    submitBtn.disabled = false;

    if (remainMsg) {
      remainMsg.textContent =
        MESSAGES.submit_failed;
    }

    return;
  }

  if (!result) {
    submitBtn.disabled = false;

    if (remainMsg) {
      remainMsg.textContent =
        MESSAGES.submit_failed;
    }

    return;
  }

  if (result.error) {
    setInputDisabled(result.error);
    return;
  }

  window.location.href = isEnglish
    ? '/en/contest/submissions/'
    : '/contest/submissions/';
}

if (form) {
  fetchProblemMeta();
  checkSubmittable();

  form.addEventListener(
    'submit',
    handleSubmit
  );
} else {
  console.warn(
    '#answer-form が見つかりません。'
  );
}
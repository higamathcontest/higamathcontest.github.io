/**
 * 解答・解説を取得し、「問題 / Problem」の横のボタンから
 * 同じページ内のモーダルとして表示する。
 *
 * 英語版の解答・解説を表示する。
 * 表示可否はSupabase側の get_problem_solution_en が判定する。
 */

import { supabase } from './supabase-client.js';

const problemNumber =
  document.documentElement.dataset.problemNumber;

const openButton =
  document.getElementById('solution-open-btn');

const modal =
  document.getElementById('solution-modal');

const closeButton =
  document.getElementById('solution-close-btn');

const answerElement =
  document.getElementById('solution-answer');

const explanationElement =
  document.getElementById('solution-explanation');

let isLoaded = false;
let retryTimer = null;
let lastFocusedElement = null;

function getFirstRow(data) {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

async function typesetSolution() {
  if (!modal) return;

  if (window.MathJax?.typesetPromise) {
    await window.MathJax.typesetPromise([modal]);
    return;
  }

  window.addEventListener(
    'load',
    () => {
      if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([modal]);
      }
    },
    { once: true }
  );
}

function openModal() {
  if (!modal || !isLoaded) return;

  lastFocusedElement = document.activeElement;

  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.setAttribute('open', '');
  }

  document.body.classList.add('solution-modal-open');
  openButton?.setAttribute('aria-expanded', 'true');

  window.requestAnimationFrame(() => {
    closeButton?.focus();
  });
}

function closeModal() {
  if (!modal) return;

  if (typeof modal.close === 'function' && modal.open) {
    modal.close();
  } else {
    modal.removeAttribute('open');
  }

  document.body.classList.remove('solution-modal-open');
  openButton?.setAttribute('aria-expanded', 'false');

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

async function loadSolution() {
  if (
    isLoaded ||
    !problemNumber ||
    !openButton ||
    !modal ||
    !answerElement ||
    !explanationElement
  ) {
    return isLoaded;
  }

  const { data, error } = await supabase.rpc(
    'get_problem_solution_en',
    {
      p_problem_number: problemNumber,
    }
  );

  if (error) {
    console.error('get_problem_solution_en error:', error.message);
    return false;
  }

  const row = getFirstRow(data);

  if (!row) {
    return false;
  }

  answerElement.textContent = row.answer ?? '';
  explanationElement.innerHTML = row.explanation_html ?? '';

  isLoaded = true;
  openButton.hidden = false;

  if (retryTimer) {
    window.clearInterval(retryTimer);
    retryTimer = null;
  }

  await typesetSolution();
  return true;
}

openButton?.addEventListener('click', openModal);
closeButton?.addEventListener('click', closeModal);

modal?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeModal();
});

modal?.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

modal?.addEventListener('close', () => {
  document.body.classList.remove('solution-modal-open');
  openButton?.setAttribute('aria-expanded', 'false');
});

async function init() {
  await loadSolution();

  if (!isLoaded) {
    retryTimer = window.setInterval(loadSolution, 60_000);
  }
}

supabase.auth.onAuthStateChange(() => {
  loadSolution();
});

init();

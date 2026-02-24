// countdown.js
// contest_settings テーブルから status / start_time / end_time を取得し、
// #countdown にカウントダウン or "finished" を表示する。
// supabase-client.js が window.supabase を export していることを前提とする。

import { supabase } from '/supabase-client.js';

const el = document.getElementById('countdown');

/**
 * 残り秒数を HH:MM:SS 形式の文字列に変換する
 */
function formatRemaining(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * カウントダウンラベルをセットする
 */
function setLabel(text) {
  const label = el.querySelector('.countdown-label');
  if (label) label.textContent = text;
}

/**
 * 各桁を個別の span に分解して DOM を初期化する
 */
function buildDigitDom(timeStr) {
  // "HH:MM:SS" → ["H","H",":","M","M",":","S","S"]
  el.innerHTML = `
    <div class="countdown-label"></div>
    <div class="countdown-digits">
      ${[...timeStr]
        .map((ch) =>
          ch === ':'
            ? `<span class="countdown-sep">:</span>`
            : `<span class="countdown-digit"><span class="digit-inner">${ch}</span></span>`
        )
        .join('')}
    </div>
  `;
}

/**
 * カウントダウン文字列を更新し、変化した桁にアニメーションを付与する
 */
function updateDigits(timeStr) {
  const digits = el.querySelectorAll('.countdown-digit');
  const chars = [...timeStr].filter((c) => c !== ':');
  digits.forEach((span, i) => {
    const inner = span.querySelector('.digit-inner');
    const newChar = chars[i] ?? '0';
    if (inner && inner.textContent !== newChar) {
      inner.classList.remove('flip');
      void inner.offsetWidth; // reflow
      inner.classList.add('flip');
      inner.textContent = newChar;
    }
  });
}

let intervalId = null;

function startCountdown(targetTime, label) {
  // 初回描画
  const initial = formatRemaining(targetTime - Date.now());
  buildDigitDom(initial);
  setLabel(label);

  // 毎秒更新
  intervalId = setInterval(() => {
    const remaining = targetTime - Date.now();
    if (remaining <= 0) {
      clearInterval(intervalId);
      updateDigits('00:00:00');
      // 終了したらページをリロードして状態を再取得
      setTimeout(() => location.reload(), 1500);
      return;
    }
    updateDigits(formatRemaining(remaining));
  }, 1000);
}

function showFinished() {
  el.innerHTML = `
    <div class="countdown-label">コンテスト終了</div>
    <div class="countdown-finished">Finished</div>
  `;
}

function showError(msg) {
  el.innerHTML = `<div class="countdown-error">${msg}</div>`;
}

async function init() {
  el.innerHTML = `<div class="countdown-loading">読み込み中…</div>`;

  const { data, error } = await supabase
    .from('contest_settings')
    .select('status, start_time, end_time')
    .single();

  if (error || !data) {
    showError('設定の取得に失敗しました');
    console.error(error);
    return;
  }

  const { status, start_time, end_time } = data;

  if (status === 'before') {
    const target = new Date(start_time).getTime();
    startCountdown(target, '開始まで');
  } else if (status === 'running') {
    const target = new Date(end_time).getTime();
    startCountdown(target, '終了まで');
  } else {
    // finished
    showFinished();
  }
}

// DOM 構築後に実行
document.addEventListener('DOMContentLoaded', init);
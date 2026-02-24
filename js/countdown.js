// countdown.js
import { supabase } from '/js/supabase-client.js';

const el = document.getElementById('countdown');

function pad(n) { return String(n).padStart(2, '0'); }

function calcParts(ms) {
  if (ms <= 0) return { h: '00', m: '00', s: '00' };
  const total = Math.floor(ms / 1000);
  return {
    h: pad(Math.floor(total / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
  };
}

function buildDom(parts, label) {
  el.innerHTML = `
    <div class="countdown-label">${label}</div>
    <div class="countdown-digits">
      <div class="countdown-unit">
        <span class="countdown-num" id="cd-h">${parts.h}</span>
        <span class="countdown-unit-label">時間</span>
      </div>
      <span class="countdown-sep">:</span>
      <div class="countdown-unit">
        <span class="countdown-num" id="cd-m">${parts.m}</span>
        <span class="countdown-unit-label">分</span>
      </div>
      <span class="countdown-sep">:</span>
      <div class="countdown-unit">
        <span class="countdown-num" id="cd-s">${parts.s}</span>
        <span class="countdown-unit-label">秒</span>
      </div>
    </div>
  `;
}

function updateDom(parts) {
  const h = document.getElementById('cd-h');
  const m = document.getElementById('cd-m');
  const s = document.getElementById('cd-s');
  if (h) h.textContent = parts.h;
  if (m) m.textContent = parts.m;
  if (s) s.textContent = parts.s;
}

let intervalId = null;

function startCountdown(targetTime, label) {
  const initial = calcParts(targetTime - Date.now());
  buildDom(initial, label);

  intervalId = setInterval(() => {
    const remaining = targetTime - Date.now();
    if (remaining <= 0) {
      clearInterval(intervalId);
      updateDom({ h: '00', m: '00', s: '00' });
      setTimeout(() => location.reload(), 1500);
      return;
    }
    updateDom(calcParts(remaining));
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
    startCountdown(new Date(start_time).getTime(), '開始まで');
  } else if (status === 'running') {
    startCountdown(new Date(end_time).getTime(), '終了まで');
  } else {
    showFinished();
  }
}

document.addEventListener('DOMContentLoaded', init);
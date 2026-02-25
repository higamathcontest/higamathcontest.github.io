/**
 * ranking.js（学年フィルターを「右の画像っぽいカスタムUI」にした版）
 *
 * 前提:
 *  - window.supabase に初期化済みの Supabase クライアントが存在
 *  - HTML 側に #rankingBody が存在
 *  - 学年セレクトは以下のID構造（HTML側）:
 *      #gradeSelect
 *      #gradeSelectTrigger
 *      #gradeSelectLabel
 *      #gradeSelectDropdown
 */

(async () => {
  // =========================
  // 1) profiles 取得
  // =========================
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, username, grade, score, penalty');

  if (profilesError) {
    showError('プロフィールの取得に失敗しました: ' + profilesError.message);
    return;
  }

  // =========================
  // 2) submissions 取得
  // =========================
  const { data: submissions, error: subError } = await supabase
    .from('submissions')
    .select('user_id, problem_id, is_correct, submitted_at');

  if (subError) {
    showError('提出データの取得に失敗しました: ' + subError.message);
    return;
  }

  // =========================
  // 3) ユーザーごとの集計
  // =========================
  const userMap = new Map(); // user_id -> { solvedSet:Set, attemptMap:Map, lastCorrectAt:Date|null }

  for (const sub of submissions) {
    const uid = sub.user_id;
    if (!userMap.has(uid)) {
      userMap.set(uid, { solvedSet: new Set(), attemptMap: new Map(), lastCorrectAt: null });
    }
    const u = userMap.get(uid);

    const pid = sub.problem_id;
    u.attemptMap.set(pid, (u.attemptMap.get(pid) || 0) + 1);

    if (sub.is_correct) {
      u.solvedSet.add(pid);
      const t = new Date(sub.submitted_at);
      if (!u.lastCorrectAt || t > u.lastCorrectAt) u.lastCorrectAt = t;
    }
  }

  // 試行10回到達も「解いた問題」に含める
  for (const [, u] of userMap) {
    for (const [pid, cnt] of u.attemptMap) {
      if (cnt >= 10) u.solvedSet.add(pid);
    }
  }

  // =========================
  // 4) rankingData 作成
  // =========================
  const rankingData = profiles.map((p) => {
    const u = userMap.get(p.user_id);
    const solvedCount = u ? u.solvedSet.size : 0;
    const lastCorrectAt = u ? u.lastCorrectAt : null;

    const penaltyMs = (p.penalty || 0) * 60 * 1000;
    const tiebreak = lastCorrectAt ? lastCorrectAt.getTime() + penaltyMs : Infinity;

    return {
      user_id: p.user_id,
      username: p.username || '(名前なし)',
      grade: p.grade ?? '',
      score: p.score || 0,
      solvedCount,
      tiebreak,
    };
  });

  // score 降順 → tiebreak 昇順
  rankingData.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.tiebreak - b.tiebreak;
  });

  // 同点同順位
  for (let i = 0; i < rankingData.length; i++) {
    if (i === 0) {
      rankingData[i].rank = 1;
    } else if (
      rankingData[i].score === rankingData[i - 1].score &&
      rankingData[i].tiebreak === rankingData[i - 1].tiebreak
    ) {
      rankingData[i].rank = rankingData[i - 1].rank;
    } else {
      rankingData[i].rank = i + 1;
    }
  }

  // =========================
  // 5) テーブル描画
  // =========================
  function renderTable(filterGrade) {
    const tbody = document.getElementById('rankingBody');

    const filtered = filterGrade
      ? rankingData.filter((r) => String(r.grade) === String(filterGrade))
      : rankingData;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">データがありません。</td></tr>';
      return;
    }

    // フィルター時は rank を振り直す（同点同順位維持）
    let rows;
    if (filterGrade) {
      rows = [];
      for (let i = 0; i < filtered.length; i++) {
        let rank;
        if (i === 0) {
          rank = 1;
        } else if (
          filtered[i].score === filtered[i - 1].score &&
          filtered[i].tiebreak === filtered[i - 1].tiebreak
        ) {
          rank = rows[i - 1]._filteredRank;
        } else {
          rank = i + 1;
        }
        rows.push({ ...filtered[i], _filteredRank: rank });
      }
    } else {
      rows = filtered.map((r) => ({ ...r, _filteredRank: r.rank }));
    }

    tbody.innerHTML = rows
      .map((r) => {
        return `
          <tr>
            <td class="rank-cell">${r._filteredRank}</td>
            <td>${escHtml(r.username)}</td>
            <td>${escHtml(String(r.grade))}</td>
            <td class="score-cell">${Number(r.score).toLocaleString()}</td>
            <td>${r.solvedCount}</td>
          </tr>
        `;
      })
      .join('');
  }

  // =========================
  // 6) 学年フィルター（カスタムUI）
  // =========================
const grades = [...new Set(profiles.map((p) => p.grade).filter((g) => g != null && g !== ''))]
  .map(String)
  .sort();

const selectWrap = document.getElementById('gradeSelect');
const trigger = document.getElementById('gradeSelectTrigger');
const labelEl = document.getElementById('gradeSelectLabel');
const dropdown = document.getElementById('gradeSelectDropdown');

if (!selectWrap || !trigger || !labelEl || !dropdown) {
  showError('学年フィルターUIの要素が見つかりません（gradeSelect一式のIDをHTMLに追加してね）');
  return;
}

let currentValue = ''; // '' は「すべて」

// 選択肢作成
dropdown.innerHTML = '';
dropdown.appendChild(makeOpt('', 'すべて'));
for (const g of grades) dropdown.appendChild(makeOpt(g, g));

function makeOpt(value, text) {
  const li = document.createElement('li');
  li.className = 'custom-select-option'; // ★CSSと一致
  li.dataset.value = value;
  li.textContent = text;
  if (value === currentValue) li.classList.add('selected');
  return li;
}

function openSelect() {
  selectWrap.classList.add('open');
  trigger.setAttribute('aria-expanded', 'true');
}
function closeSelect() {
  selectWrap.classList.remove('open');
  trigger.setAttribute('aria-expanded', 'false');
}

function setValue(v) {
  currentValue = v;

  labelEl.textContent = currentValue === '' ? 'すべて' : currentValue;

  if (currentValue) trigger.classList.add('has-value');
  else trigger.classList.remove('has-value');

  dropdown.querySelectorAll('.custom-select-option').forEach((opt) => {
    opt.classList.toggle('selected', opt.dataset.value === currentValue);
  });

  renderTable(currentValue);
}

// 開閉
trigger.addEventListener('click', () => {
  if (selectWrap.classList.contains('open')) closeSelect();
  else openSelect();
});

// 外側クリックで閉じる
document.addEventListener('click', (e) => {
  if (!selectWrap.contains(e.target)) closeSelect();
});

// 選択
dropdown.addEventListener('click', (e) => {
  const li = e.target.closest('.custom-select-option');
  if (!li) return;
  setValue(li.dataset.value);
  closeSelect();
});
  // =========================
  // 7) 初期描画
  // =========================
  setValue(''); // これが renderTable('') も呼ぶ

  // =========================
  // Utils
  // =========================
  function escHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  function showError(msg) {
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="error-msg">⚠️ ${escHtml(msg)}</td></tr>`;
  }
})();
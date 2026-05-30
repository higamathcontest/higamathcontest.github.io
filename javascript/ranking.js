/**
 * ranking.js
 *
 * 前提:
 *   - window.supabase に初期化済みの Supabase クライアントが存在する
 *   - HTML 側に #rankingBody, #gradeSelect 一式が存在する
 *   - contest_settings テーブルに end_time カラムが存在する
 */

(async () => {

  // =========================
  // 1) contest_settings から end_time を取得
  // =========================
  const { data: contestSettings, error: contestError } = await supabase
    .from('contest_settings')
    .select('end_time')
    .single();

  if (contestError) {
    showError('コンテスト設定の取得に失敗しました: ' + contestError.message);
    return;
  }

  const endTime = contestSettings?.end_time ?? null;

  // =========================
  // 2) profiles 取得
  // =========================
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, username, grade, score, penalty');

  if (profilesError) {
    showError('プロフィールの取得に失敗しました: ' + profilesError.message);
    return;
  }

  // =========================
  // 3) submissions 取得（end_time 以前のみ）
  // =========================
  let subQuery = supabase
    .from('submissions')
    .select('user_id, problem_id, is_correct, submitted_at');

  if (endTime) {
    subQuery = subQuery.lte('submitted_at', endTime);
  }

  const { data: submissions, error: subError } = await subQuery;

  if (subError) {
    showError('提出データの取得に失敗しました: ' + subError.message);
    return;
  }

  // =========================
  // 4) ユーザーごとの集計
  // =========================
  const userMap = new Map();

  for (const sub of submissions) {
    const key = sub.user_id;
    if (!userMap.has(key)) {
      userMap.set(key, { solvedSet: new Set(), attemptMap: new Map(), lastCorrectAt: null });
    }
    const u = userMap.get(key);

    const pid = sub.problem_id;
    u.attemptMap.set(pid, (u.attemptMap.get(pid) || 0) + 1);

    if (sub.is_correct) {
      u.solvedSet.add(pid);
      const t = new Date(sub.submitted_at);
      if (!u.lastCorrectAt || t > u.lastCorrectAt) {
        u.lastCorrectAt = t;
      }
    }
  }

  // 試行10回到達も「解いた問題」に含める
  for (const [, u] of userMap) {
    for (const [pid, cnt] of u.attemptMap) {
      if (cnt >= 10) u.solvedSet.add(pid);
    }
  }

  // =========================
  // 5) rankingData 作成
  // =========================
  const rankingData = profiles.map(p => {
    const u = userMap.get(p.user_id);
    const solvedCount = u ? u.solvedSet.size : 0;
    const lastCorrectAt = u ? u.lastCorrectAt : null;

    const penaltyMs = (p.penalty || 0) * 60 * 1000;
    const tiebreak = lastCorrectAt
      ? lastCorrectAt.getTime() + penaltyMs
      : Infinity;

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
  // 6) 学年フィルター（カスタムセレクト）
  // =========================
  const grades = [...new Set(profiles.map(p => p.grade).filter(g => g != null && g !== ''))].sort();

  const selectWrap = document.getElementById('gradeSelect');
  const trigger    = document.getElementById('gradeSelectTrigger');
  const labelEl    = document.getElementById('gradeSelectLabel');
  const dropdown   = document.getElementById('gradeSelectDropdown');
  let currentValue = '';

  // 「すべて」を先頭に追加
  const allLi = document.createElement('li');
  allLi.className = 'custom-select-option selected';
  allLi.dataset.value = '';
  allLi.textContent = 'すべて';
  dropdown.appendChild(allLi);

  for (const g of grades) {
    const li = document.createElement('li');
    li.className = 'custom-select-option';
    li.dataset.value = g;
    li.textContent = g;
    dropdown.appendChild(li);
  }

  trigger.addEventListener('click', () => {
    selectWrap.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!selectWrap.contains(e.target)) selectWrap.classList.remove('open');
  });

  dropdown.addEventListener('click', (e) => {
    const li = e.target.closest('.custom-select-option');
    if (!li) return;

    currentValue = li.dataset.value;
    labelEl.textContent = currentValue === '' ? 'すべて' : currentValue;

    if (currentValue) trigger.classList.add('has-value');
    else trigger.classList.remove('has-value');

    dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.value === currentValue);
    });

    selectWrap.classList.remove('open');
    renderTable(currentValue);
  });

  // =========================
  // 7) テーブル描画
  // =========================
  function renderTable(filterGrade) {
    const tbody = document.getElementById('rankingBody');
    const filtered = filterGrade
      ? rankingData.filter(r => String(r.grade) === String(filterGrade))
      : rankingData;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">データがありません。</td></tr>';
      return;
    }

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
      rows = filtered.map(r => ({ ...r, _filteredRank: r.rank }));
    }

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td class="rank-cell">${r._filteredRank}</td>
        <td>${escHtml(r.username)}</td>
        <td>${escHtml(String(r.grade))}</td>
        <td class="score-cell">${r.score.toLocaleString()}</td>
        <td>${r.solvedCount}</td>
      </tr>`
    ).join('');
  }

  // =========================
  // 8) 初回描画
  // =========================
  renderTable('');

  // =========================
  // Utils
  // =========================
  function escHtml(str) {
    return str.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function showError(msg) {
    document.getElementById('rankingBody').innerHTML =
      `<tr><td colspan="5" class="error-msg">⚠️ ${msg}</td></tr>`;
  }

})();
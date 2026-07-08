/**
 * ranking.js
 *
 * 前提:
 * - window.supabase に初期化済みのSupabaseクライアントが存在する
 * - HTML側に #rankingBody, #gradeSelect 一式が存在する
 * - contest_settings テーブルに end_time カラムが存在する
 */

(async () => {
  // ─────────────────────────────────────────────
  // 順位表から除外するユーザー名
  // 大文字・小文字の違いと、前後の空白は無視する
  // ─────────────────────────────────────────────
  const EXCLUDED_USERNAMES = new Set([
    'nosuke1729',
    'user.nosuke1729',
    'niit',
    'test-user',
    'test_user2',
  ]);

  function isExcludedUsername(username) {
    const normalized = String(username ?? '')
      .trim()
      .toLowerCase();

    return EXCLUDED_USERNAMES.has(normalized);
  }

  // =========================
  // 1) contest_settings から end_time を取得
  // =========================
  const {
    data: contestSettings,
    error: contestError,
  } = await supabase
    .from('contest_settings')
    .select('end_time')
    .single();

  if (contestError) {
    showError(
      'コンテスト設定の取得に失敗しました: ' +
      contestError.message
    );
    return;
  }

  const endTime =
    contestSettings?.end_time ?? null;

  // =========================
  // 2) profiles 取得
  // =========================
  const {
    data: profiles,
    error: profilesError,
  } = await supabase
    .from('profiles')
    .select(
      'user_id, username, grade, score, penalty'
    );

  if (profilesError) {
    showError(
      'プロフィールの取得に失敗しました: ' +
      profilesError.message
    );
    return;
  }

  // 除外対象を順位計算の前に取り除く
  const visibleProfiles = (profiles ?? []).filter(
    (profile) =>
      !isExcludedUsername(profile.username)
  );

  // =========================
  // 3) submissions 取得
  // end_time以前の提出のみ
  // =========================
  let subQuery = supabase
    .from('submissions')
    .select(
      'user_id, problem_id, is_correct, submitted_at'
    );

  if (endTime) {
    subQuery = subQuery.lte(
      'submitted_at',
      endTime
    );
  }

  const {
    data: submissions,
    error: subError,
  } = await subQuery;

  if (subError) {
    showError(
      '提出データの取得に失敗しました: ' +
      subError.message
    );
    return;
  }

  // =========================
  // 4) ユーザーごとの集計
  // =========================
  const userMap = new Map();

  for (const sub of submissions ?? []) {
    const key = sub.user_id;

    if (!userMap.has(key)) {
      userMap.set(key, {
        solvedSet: new Set(),
        attemptMap: new Map(),
        lastCorrectAt: null,
      });
    }

    const userData = userMap.get(key);
    const problemId = sub.problem_id;

    userData.attemptMap.set(
      problemId,
      (
        userData.attemptMap.get(problemId) || 0
      ) + 1
    );

    if (sub.is_correct) {
      userData.solvedSet.add(problemId);

      const submittedAt =
        new Date(sub.submitted_at);

      if (
        !userData.lastCorrectAt ||
        submittedAt > userData.lastCorrectAt
      ) {
        userData.lastCorrectAt =
          submittedAt;
      }
    }
  }

  // 試行10回到達も「解いた問題」に含める
  for (const [, userData] of userMap) {
    for (
      const [problemId, attemptCount]
      of userData.attemptMap
    ) {
      if (attemptCount >= 10) {
        userData.solvedSet.add(problemId);
      }
    }
  }

  // =========================
  // 5) rankingData 作成
  // =========================
  const rankingData = visibleProfiles.map(
    (profile) => {
      const userData =
        userMap.get(profile.user_id);

      const solvedCount = userData
        ? userData.solvedSet.size
        : 0;

      const lastCorrectAt = userData
        ? userData.lastCorrectAt
        : null;

      const penaltyMs =
        (profile.penalty || 0) *
        60 *
        1000;

      const tiebreak = lastCorrectAt
        ? lastCorrectAt.getTime() +
          penaltyMs
        : Infinity;

      return {
        user_id: profile.user_id,
        username:
          profile.username || '(名前なし)',
        grade: profile.grade ?? '',
        score: profile.score || 0,
        solvedCount,
        tiebreak,
      };
    }
  );

  // スコア降順 → タイブレーク昇順
  rankingData.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.tiebreak - b.tiebreak;
  });

  // 同点同順位
  for (
    let index = 0;
    index < rankingData.length;
    index++
  ) {
    if (index === 0) {
      rankingData[index].rank = 1;
    } else if (
      rankingData[index].score ===
        rankingData[index - 1].score &&
      rankingData[index].tiebreak ===
        rankingData[index - 1].tiebreak
    ) {
      rankingData[index].rank =
        rankingData[index - 1].rank;
    } else {
      rankingData[index].rank =
        index + 1;
    }
  }

  // =========================
  // 6) 学年フィルター
  // =========================
  const grades = [
    ...new Set(
      visibleProfiles
        .map((profile) => profile.grade)
        .filter(
          (grade) =>
            grade != null &&
            grade !== ''
        )
    ),
  ].sort();

  const selectWrap =
    document.getElementById(
      'gradeSelect'
    );

  const trigger =
    document.getElementById(
      'gradeSelectTrigger'
    );

  const labelElement =
    document.getElementById(
      'gradeSelectLabel'
    );

  const dropdown =
    document.getElementById(
      'gradeSelectDropdown'
    );

  let currentValue = '';

  // 「すべて」を先頭に追加
  const allOption =
    document.createElement('li');

  allOption.className =
    'custom-select-option selected';

  allOption.dataset.value = '';
  allOption.textContent = 'すべて';

  dropdown.appendChild(allOption);

  for (const grade of grades) {
    const option =
      document.createElement('li');

    option.className =
      'custom-select-option';

    option.dataset.value = grade;
    option.textContent = grade;

    dropdown.appendChild(option);
  }

  trigger.addEventListener(
    'click',
    () => {
      selectWrap.classList.toggle('open');
    }
  );

  document.addEventListener(
    'click',
    (event) => {
      if (
        !selectWrap.contains(event.target)
      ) {
        selectWrap.classList.remove(
          'open'
        );
      }
    }
  );

  dropdown.addEventListener(
    'click',
    (event) => {
      const option = event.target.closest(
        '.custom-select-option'
      );

      if (!option) return;

      currentValue =
        option.dataset.value;

      labelElement.textContent =
        currentValue === ''
          ? 'すべて'
          : currentValue;

      if (currentValue) {
        trigger.classList.add(
          'has-value'
        );
      } else {
        trigger.classList.remove(
          'has-value'
        );
      }

      dropdown
        .querySelectorAll(
          '.custom-select-option'
        )
        .forEach((item) => {
          item.classList.toggle(
            'selected',
            item.dataset.value ===
              currentValue
          );
        });

      selectWrap.classList.remove('open');

      renderTable(currentValue);
    }
  );

  // =========================
  // 7) テーブル描画
  // =========================
  function renderTable(filterGrade) {
    const tbody =
      document.getElementById(
        'rankingBody'
      );

    const filtered = filterGrade
      ? rankingData.filter(
          (row) =>
            String(row.grade) ===
            String(filterGrade)
        )
      : rankingData;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td
            colspan="5"
            class="empty-msg"
          >
            データがありません。
          </td>
        </tr>
      `;

      return;
    }

    let rows;

    if (filterGrade) {
      rows = [];

      for (
        let index = 0;
        index < filtered.length;
        index++
      ) {
        let rank;

        if (index === 0) {
          rank = 1;
        } else if (
          filtered[index].score ===
            filtered[index - 1].score &&
          filtered[index].tiebreak ===
            filtered[index - 1].tiebreak
        ) {
          rank =
            rows[index - 1]._filteredRank;
        } else {
          rank = index + 1;
        }

        rows.push({
          ...filtered[index],
          _filteredRank: rank,
        });
      }
    } else {
      rows = filtered.map((row) => ({
        ...row,
        _filteredRank: row.rank,
      }));
    }

    tbody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td class="rank-cell">
              ${row._filteredRank}
            </td>

            <td>
              ${escapeHtml(row.username)}
            </td>

            <td>
              ${escapeHtml(
                String(row.grade)
              )}
            </td>

            <td class="score-cell">
              ${row.score.toLocaleString()}
            </td>

            <td>
              ${row.solvedCount}
            </td>
          </tr>
        `
      )
      .join('');
  }

  // =========================
  // 8) 初回描画
  // =========================
  renderTable('');

  // =========================
  // Utils
  // =========================
  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character]
    );
  }

  function showError(message) {
    document.getElementById(
      'rankingBody'
    ).innerHTML = `
      <tr>
        <td
          colspan="5"
          class="error-msg"
        >
          ⚠️ ${message}
        </td>
      </tr>
    `;
  }
})();
/* ===============================
   （/tools）ツール全体
=============================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     タブ切替
  =============================== */

  const tabs = document.querySelectorAll(".tool-tab");
  const panels = document.querySelectorAll(".tool-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {

      tabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      const target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add("active");
    });
  });


  /* ===============================
     素数ナンバリング
  =============================== */

  const primeCells = document.querySelectorAll(".prime-table td");
  primeCells.forEach((td, i) => {
    td.dataset.i = i + 1;
  });


  /* ===============================
     累乗表ツール
  =============================== */

  const head = document.getElementById("power-head");
  const tbody = document.getElementById("power-body");
  const basesEl = document.querySelector(".power-bases");

  if (!head || !tbody || !basesEl) return;

  const MAX_EXP = 100;
  const BASE_MIN = 2;
  const BASE_MAX = 20;

  let currentBase = 2;

  function buildTable(base) {
    head.innerHTML = `${base}<sup>n</sup>`;
    tbody.innerHTML = "";

    let value = 1n;
    const b = BigInt(base);

    for (let n = 1; n <= MAX_EXP; n++) {
      value *= b;
      const str = value.toString();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-n">${n}</td>
        <td class="power-val" data-copy="${str}">${str}</td>
        <td class="col-digits">${str.length}</td>
      `;

      tbody.appendChild(tr);
    }
  }

  function setActiveBaseButton() {
    basesEl.querySelectorAll(".power-base-btn").forEach(btn => {
      btn.classList.toggle(
        "active",
        Number(btn.dataset.base) === currentBase
      );
    });
  }

  function buildBaseButtons() {
    basesEl.innerHTML = "";

    for (let a = BASE_MIN; a <= BASE_MAX; a++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "power-base-btn";
      btn.textContent = a;
      btn.dataset.base = a;

      btn.addEventListener("click", () => {
        currentBase = a;
        setActiveBaseButton();
        buildTable(currentBase);
      });

      basesEl.appendChild(btn);
    }

    setActiveBaseButton();
  }

  /* 初期化 */
  buildBaseButtons();
  buildTable(currentBase);

});
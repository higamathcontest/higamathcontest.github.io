
//電卓
function inputNumber(number) {
          var display = document.getElementById('display');
          display.value += number;
      }
      function inputOperator(operator) {
          var display = document.getElementById('display');
          display.value += operator;
      }
      function calculateResult() {
          var display = document.getElementById('display');
          try {
              display.value = eval(display.value); 
          } catch (e) {
              display.value = 'エラー'; 
          }
      }
      function outputResult() {
          var display = document.getElementById('display').value;
          var resultElement = document.getElementById('calculation-result');
          try {
              var result = eval(display);
              resultElement.innerText = result; 
          } catch (e) {
              resultElement.innerText = 'エラー'; 
          }
      }
      function clearDisplay() {
          var display = document.getElementById('display');
          display.value = '';
          document.getElementById('calculation-result').innerText = ''; 
      }

//素数表
  document.addEventListener("DOMContentLoaded", () => {
    const primePanel = document.getElementById("prime");
    if (!primePanel) return;

    const cells = primePanel.querySelectorAll("td");
    cells.forEach((td, idx) => {
      td.setAttribute("data-i", String(idx + 1));
    });
  });

//累乗表
document.addEventListener("DOMContentLoaded", () => {
  const baseMin = 2;
  const baseMax = 20;
  const defaultBase = 2;
  const defaultMaxExp = 30;

  const basesEl = document.querySelector("#power .power-bases");
  const tbody = document.getElementById("power-body");
  const head = document.getElementById("power-head");
  const maxExpInput = document.getElementById("power-max-exp");
  const resetBtn = document.getElementById("power-reset");

  if (!basesEl || !tbody || !head || !maxExpInput || !resetBtn) return;

  let currentBase = defaultBase;

  function clampMaxExp(v){
    if (Number.isNaN(v)) return defaultMaxExp;
    return Math.max(5, Math.min(200, v));
  }

  // BigInt で a^n（オーバーフローしない）
  function buildTable(a, maxExp){
    head.textContent = `${a}^n`;
    tbody.innerHTML = "";

    let val = 1n;
    const base = BigInt(a);

    for (let n = 1; n <= maxExp; n++){
      val *= base;
      const s = val.toString();

      const tr = document.createElement("tr");

      const tdN = document.createElement("td");
      tdN.className = "col-n";
      tdN.textContent = String(n);

      const tdV = document.createElement("td");
      tdV.className = "power-val";
      tdV.textContent = s;

      const tdD = document.createElement("td");
      tdD.className = "col-digits";
      tdD.textContent = String(s.length);

      tr.append(tdN, tdV, tdD);
      tbody.appendChild(tr);
    }
  }

  function setActiveBaseButton(){
    basesEl.querySelectorAll(".power-base-btn").forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.base) === currentBase);
    });
  }

  // 基数ボタン生成
  function buildBaseButtons(){
    basesEl.innerHTML = "";
    for (let a = baseMin; a <= baseMax; a++){
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "power-base-btn";
      btn.textContent = String(a);
      btn.dataset.base = String(a);

      btn.addEventListener("click", () => {
        currentBase = a;
        setActiveBaseButton();
        buildTable(currentBase, clampMaxExp(parseInt(maxExpInput.value, 10)));
      });

      basesEl.appendChild(btn);
    }
    setActiveBaseButton();
  }

  // 入力変更で更新
  maxExpInput.addEventListener("input", () => {
    const maxExp = clampMaxExp(parseInt(maxExpInput.value, 10));
    maxExpInput.value = String(maxExp);
    buildTable(currentBase, maxExp);
  });

  // リセット
  resetBtn.addEventListener("click", () => {
    currentBase = defaultBase;
    maxExpInput.value = String(defaultMaxExp);
    setActiveBaseButton();
    buildTable(currentBase, defaultMaxExp);
  });

  // 初期化
  buildBaseButtons();
  buildTable(currentBase, clampMaxExp(parseInt(maxExpInput.value, 10)));
});

  const tabs = document.querySelectorAll(".tool-tab");
  const panels = document.querySelectorAll(".tool-panel");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      // タブの見た目
      tabs.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      // 表示領域切り替え
      const targetId = btn.dataset.target;
      panels.forEach(p => p.classList.remove("active"));
      document.getElementById(targetId).classList.add("active");
    });
  });
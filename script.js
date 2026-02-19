
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


//以下電卓
// ===== Calculator (5x5, 15 sig digits, keyboard, memory) =====
document.addEventListener("DOMContentLoaded", () => {
  const display = document.getElementById("calc-display");
  if (!display) return;

  // ===== UI helper =====
  const setActiveOpButton = (btnOrNull) => {
    document
      .querySelectorAll(".calc-btn.op.is-active")
      .forEach((b) => b.classList.remove("is-active"));
    if (btnOrNull) btnOrNull.classList.add("is-active");
  };

  // 最後に押したボタン（灰色で残す）
  const setLastPressed = (btnOrNull) => {
    document
      .querySelectorAll(".calc-btn.is-last")
      .forEach((b) => b.classList.remove("is-last"));
    if (btnOrNull) btnOrNull.classList.add("is-last");
  };

  // キーボード入力でも該当ボタンを光らせるための検索
  const findOpButton = (op) =>
    document.querySelector(`.calc-btn.op[data-op="${CSS.escape(op)}"]`);
  const findNumButton = (ch) =>
    document.querySelector(`.calc-btn[data-num="${CSS.escape(ch)}"]`);
  const findActButton = (act) =>
    document.querySelector(`.calc-btn[data-act="${CSS.escape(act)}"]`);

  // ===== state =====
  let entry = "0";
  let stored = null;
  let pendingOp = null;
  let memory = 0;
  let justEvaluated = false;

  let lastOp = null;
  let lastOperand = null;

  const isFiniteNumber = (x) => Number.isFinite(x);

  const format15 = (n) => {
    if (!isFiniteNumber(n)) return "Error";
    if (Object.is(n, -0)) n = 0;

    let s = n.toPrecision(15);

    if (s.includes("e")) {
      const [coef, exp] = s.split("e");
      let c = coef.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
      return `${c}e${exp}`;
    } else {
      s = s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
      return s;
    }
  };

  const setDisplay = (text) => {
    display.value = text;
  };

  const currentNumber = () => {
    const n = Number(entry);
    return Number.isFinite(n) ? n : NaN;
  };

  const resetAll = () => {
    entry = "0";
    stored = null;
    pendingOp = null;
    lastOp = null;
    lastOperand = null;
    justEvaluated = false;

    setActiveOpButton(null);
    setDisplay(entry);
  };

  const clearEntry = () => {
    entry = "0";
    justEvaluated = false;

    setActiveOpButton(null);
    setDisplay(entry);
  };

  const backspace = () => {
    setActiveOpButton(null);

    if (justEvaluated) {
      entry = "0";
      justEvaluated = false;
      setDisplay(entry);
      return;
    }
    if (entry.length <= 1 || (entry.length === 2 && entry.startsWith("-"))) {
      entry = "0";
    } else {
      entry = entry.slice(0, -1);
    }
    setDisplay(entry);
  };

  const inputDigit = (ch) => {
    // 数字を入力したら「演算子選択中」は解除（電卓っぽい）
    setActiveOpButton(null);

    if (justEvaluated) {
      entry = "0";
      justEvaluated = false;
    }

    if (ch === ".") {
      if (!entry.includes(".")) entry += ".";
      setDisplay(entry);
      return;
    }

    if (entry === "0") entry = ch;
    else if (entry === "-0") entry = "-" + ch;
    else entry += ch;

    setDisplay(entry);
  };

  const applyUnary = (type) => {
    setActiveOpButton(null);

    const x = currentNumber();
    if (!isFiniteNumber(x)) {
      setDisplay("Error");
      entry = "0";
      return;
    }

    let y = x;
    if (type === "sqrt") {
      if (x < 0) {
        setDisplay("Error");
        entry = "0";
        return;
      }
      y = Math.sqrt(x);
    } else if (type === "sq") {
      y = x * x;
    } else if (type === "cube") {
      y = x * x * x;
    }

    entry = format15(y);
    setDisplay(entry);
    justEvaluated = false;
  };

  const compute = (a, op, b) => {
    if (!isFiniteNumber(a) || !isFiniteNumber(b)) return NaN;
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return NaN;
    }
  };

  const pressOp = (op) => {
    const x = currentNumber();
    if (!isFiniteNumber(x)) {
      setDisplay("Error");
      entry = "0";
      return;
    }

    if (pendingOp && stored !== null && !justEvaluated) {
      const r = compute(stored, pendingOp, x);
      if (!isFiniteNumber(r)) {
        setDisplay("Error");
        resetAll();
        return;
      }
      stored = r;
      entry = format15(r);
      setDisplay(entry);
    } else if (stored === null) {
      stored = x;
    }

    pendingOp = op;
    justEvaluated = true;
    lastOp = null;
    lastOperand = null;
  };

  const pressEq = () => {
    setActiveOpButton(null);

    const x = currentNumber();
    if (!isFiniteNumber(x)) {
      setDisplay("Error");
      resetAll();
      return;
    }

    if (!pendingOp && lastOp && stored !== null && lastOperand !== null) {
      const r2 = compute(stored, lastOp, lastOperand);
      if (!isFiniteNumber(r2)) {
        setDisplay("Error");
        resetAll();
        return;
      }
      stored = r2;
      entry = format15(r2);
      setDisplay(entry);
      justEvaluated = true;
      return;
    }

    if (pendingOp === null || stored === null) {
      entry = format15(x);
      setDisplay(entry);
      justEvaluated = true;
      return;
    }

    const r = compute(stored, pendingOp, x);
    if (!isFiniteNumber(r)) {
      setDisplay("Error");
      resetAll();
      return;
    }

    lastOp = pendingOp;
    lastOperand = x;

    stored = r;
    entry = format15(r);
    setDisplay(entry);

    pendingOp = null;
    justEvaluated = true;
  };

  // memory
  const memClear = () => {
    memory = 0;
  };
  const memRecall = () => {
    setActiveOpButton(null);
    entry = format15(memory);
    setDisplay(entry);
    justEvaluated = true;
  };
  const memPlus = () => {
    const x = currentNumber();
    if (isFiniteNumber(x)) memory += x;
  };
  const memMinus = () => {
    const x = currentNumber();
    if (isFiniteNumber(x)) memory -= x;
  };

  // ===== click =====
  const grid = document.querySelector(".calc-grid5");
  grid?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    setLastPressed(btn); // ←最後に押したボタンを灰色で残す

    if (btn.dataset.num != null) {
      inputDigit(btn.dataset.num);
      return;
    }

    if (btn.dataset.op) {
      setActiveOpButton(btn); // ←演算子は青で残す
      pressOp(btn.dataset.op);
      return;
    }

    if (btn.dataset.act) {
      const act = btn.dataset.act;

      if (act === "eq") pressEq();
      else if (act === "c") clearEntry();
      else if (act === "ac") resetAll();
      else if (act === "sqrt" || act === "sq" || act === "cube") applyUnary(act);
      else if (act === "mc") memClear();
      else if (act === "mr") memRecall();
      else if (act === "mplus") memPlus();
      else if (act === "mminus") memMinus();

      // 単項・メモリ系は「演算子選択」ではないので解除したい
      if (act !== "eq" && act !== "c" && act !== "ac") setActiveOpButton(null);
    }
  });

  // ===== keyboard =====
  window.addEventListener("keydown", (e) => {
    const k = e.key;

    // 数字・小数点
    if ((k >= "0" && k <= "9") || k === ".") {
      e.preventDefault();
      inputDigit(k);

      const b = findNumButton(k);
      if (b) setLastPressed(b);
      return;
    }

    // 演算子
    if (k === "+" || k === "-" || k === "*" || k === "/") {
      e.preventDefault();
      pressOp(k);

      const b = findOpButton(k);
      if (b) {
        setActiveOpButton(b);
        setLastPressed(b);
      }
      return;
    }

    // Enter / =
    if (k === "Enter" || k === "=") {
      e.preventDefault();
      pressEq();

      const b = findActButton("eq");
      if (b) setLastPressed(b);
      return;
    }

    // Backspace
    if (k === "Backspace") {
      e.preventDefault();
      backspace();
      // ボタンが無いので lastPressed は変えない
      return;
    }

    // Esc -> AC
    if (k === "Escape") {
      e.preventDefault();
      resetAll();

      const b = findActButton("ac");
      if (b) setLastPressed(b);
      return;
    }
  });

  setDisplay(entry);
});

//以上電卓
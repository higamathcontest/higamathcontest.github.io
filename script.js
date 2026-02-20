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

/* ===============================
(/contest/..)電卓
=============================== */

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

// ===== Calculator (5x5, 15 sig digits, keyboard, memory) =====
document.addEventListener("DOMContentLoaded", () => {
  const display = document.getElementById("calc-display");
  if (!display) return;
  const setActiveOpButton = (btnOrNull) => {
    document
      .querySelectorAll(".calc-btn.op.is-active")
      .forEach((b) => b.classList.remove("is-active"));
    if (btnOrNull) btnOrNull.classList.add("is-active");
  };

  // ===== copy button (left-top icon) =====
const copyBtn = document.getElementById("calc-copy");

copyBtn?.addEventListener("click", async () => {
  const text = display.value;
  let ok = false;

  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    try {
      // fallback
      display.focus();
      display.select();
      ok = document.execCommand("copy");
    } catch {}
  }

  if (!ok) return;

  // ✓ に一瞬変化
  copyBtn.classList.add("is-copied");
  setTimeout(() => copyBtn.classList.remove("is-copied"), 900);
});



  // 最後に押したボタン
  const setLastPressed = (btnOrNull) => {
    document
      .querySelectorAll(".calc-btn.is-last")
      .forEach((b) => b.classList.remove("is-last"));
    if (btnOrNull) btnOrNull.classList.add("is-last");
  };

  // キーボード入力用
  const findOpButton = (op) =>
    document.querySelector(`.calc-btn.op[data-op="${CSS.escape(op)}"]`);
  const findNumButton = (ch) =>
    document.querySelector(`.calc-btn[data-num="${CSS.escape(ch)}"]`);
  const findActButton = (act) =>
    document.querySelector(`.calc-btn[data-act="${CSS.escape(act)}"]`);

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

    setLastPressed(btn); //灰色で残す

    if (btn.dataset.num != null) {
      inputDigit(btn.dataset.num);
      return;
    }

    if (btn.dataset.op) {
      setActiveOpButton(btn);
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
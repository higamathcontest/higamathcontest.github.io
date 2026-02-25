class MyCalculator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
<style>
:host {
  display: block;
  max-width: 100%;
  font-family: sans-serif;
}

/* --- head --- */
.calc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.calc-title { margin: 0; font-size: 1.05rem; }
.calc-sub   { margin: 4px 0 0; opacity: .7; font-size: .7rem; }

/* --- display --- */
.calc-display-wrap { position: relative; }

.calc-display {
  width: 100%;
  box-sizing: border-box;
  height: 64px;
  border-radius: 0;
  border: 1px solid rgba(0,0,0,.12);
  padding: 0 14px 0 36px;
  font-size: 1.6rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  outline: none;
  background-color: transparent;
}

.calc-copy-btn,
.calc-transfer-btn {
  position: absolute;
  left: 6px;
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  color: #666;
  opacity: .75;
  transition: all .15s ease;
}
.calc-copy-btn     { top: 4px; }
.calc-transfer-btn { top: 28px; }
.calc-copy-btn:hover,
.calc-transfer-btn:hover  { opacity: 1; color: #111; transform: scale(1.08); }
.calc-copy-btn:active,
.calc-transfer-btn:active { transform: scale(.95); }

.icon-check { display: none; color: #16a34a; }
.calc-copy-btn.is-copied .icon-copy  { display: none; }
.calc-copy-btn.is-copied .icon-check { display: block; }

.calc-transfer-btn.is-sent .icon-transfer { display: none; }
.calc-transfer-btn.is-sent .icon-sent     { display: block; }
.icon-sent { display: none; color: #2563eb; }

/* --- grid --- */
.calc-grid5 {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
}

.calc-btn {
  height: 56px;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(0,0,0,.60);
  cursor: pointer;
  user-select: none;
  transition: background .12s ease, transform .12s ease, color .12s ease;
  border-right:  1px solid rgba(0,0,0,.06);
  border-bottom: 1px solid rgba(0,0,0,.06);
}
.calc-btn[data-num]        { color: rgba(0,0,0,.68); }
.calc-btn:nth-child(5n)    { border-right: none; }
.calc-btn:nth-last-child(-n+5) { border-bottom: none; }
.calc-btn:active           { background: rgba(0,0,0,.06); transform: translateY(1px); }
.calc-btn.is-last          { background: rgba(0,0,0,.07); color: rgba(0,0,0,.78); }
.calc-btn.op.is-active     { background: rgba(0,0,0,.10); color: rgba(0,0,0,.78); }
.calc-btn:focus-visible    { outline: 3px solid rgba(120,160,255,.55); outline-offset: 2px; }

/* --- hint --- */
.calc-hint { margin: 12px 2px 0; font-size: .85rem; opacity: .7; }
</style>

<div class="calc-head">
  <div>
    <h2 class="calc-title">電卓</h2>
    <p class="calc-sub">有効桁数15桁。キーボード対応。</p>
  </div>
</div>

<div class="calc-shell" aria-label="calculator">

  <div class="calc-display-wrap">
    <input class="calc-display" value="0" readonly aria-label="display" />
    <button class="calc-copy-btn" aria-label="Copy">
      <svg class="icon-copy"  viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <rect x="4" y="4" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
      </svg>
      <svg class="icon-check" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <polyline points="5 13 10 18 19 7" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <button class="calc-transfer-btn" aria-label="解答欄に転送">
      <svg class="icon-transfer" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg class="icon-sent" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <polyline points="5 13 10 18 19 7" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <div class="calc-grid5">
    <button class="calc-btn" data-act="sqrt">√</button>
    <button class="calc-btn" data-act="mc">MC</button>
    <button class="calc-btn" data-act="mr">MR</button>
    <button class="calc-btn" data-act="mminus">M-</button>
    <button class="calc-btn" data-act="mplus">M+</button>

    <button class="calc-btn" data-act="sq">x²</button>
    <button class="calc-btn" data-num="7">7</button>
    <button class="calc-btn" data-num="8">8</button>
    <button class="calc-btn" data-num="9">9</button>
    <button class="calc-btn op" data-op="/">÷</button>

    <button class="calc-btn" data-act="cube">x³</button>
    <button class="calc-btn" data-num="4">4</button>
    <button class="calc-btn" data-num="5">5</button>
    <button class="calc-btn" data-num="6">6</button>
    <button class="calc-btn op" data-op="*">×</button>

    <button class="calc-btn" data-act="c">C</button>
    <button class="calc-btn" data-num="1">1</button>
    <button class="calc-btn" data-num="2">2</button>
    <button class="calc-btn" data-num="3">3</button>
    <button class="calc-btn op" data-op="-">−</button>

    <button class="calc-btn" data-act="ac">AC</button>
    <button class="calc-btn" data-num="0">0</button>
    <button class="calc-btn" data-num=".">.</button>
    <button class="calc-btn eq" data-act="eq">=</button>
    <button class="calc-btn op" data-op="+">+</button>
  </div>
</div>
`;
  }

  connectedCallback() {
    const sr = this.shadowRoot;
    const display  = sr.querySelector(".calc-display");
    const copyBtn  = sr.querySelector(".calc-copy-btn");
    const transferBtn = sr.querySelector(".calc-transfer-btn");
    const grid     = sr.querySelector(".calc-grid5");

    // ── helpers ──────────────────────────────────────────────────────────
    const setActiveOp = (btn) => {
      sr.querySelectorAll(".calc-btn.op.is-active")
        .forEach(b => b.classList.remove("is-active"));
      if (btn) btn.classList.add("is-active");
    };
    const setLastPressed = (btn) => {
      sr.querySelectorAll(".calc-btn.is-last")
        .forEach(b => b.classList.remove("is-last"));
      if (btn) btn.classList.add("is-last");
    };
    const findBtn = (attr, val) =>
      sr.querySelector(`.calc-btn[${attr}="${CSS.escape(val)}"]`);

    const isOk  = n => Number.isFinite(n);
    const fmt15 = n => {
      if (!isOk(n)) return "Error";
      if (Object.is(n, -0)) n = 0;
      let s = n.toPrecision(15);
      if (s.includes("e")) {
        const [c, e] = s.split("e");
        return `${c.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")}e${e}`;
      }
      return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    };

    // ── state ─────────────────────────────────────────────────────────────
    let entry = "0", stored = null, pendingOp = null, memory = 0;
    let justEvaluated = false, lastOp = null, lastOperand = null;

    const setDisp   = v  => { display.value = v; };
    const curNum    = () => { const n = Number(entry); return isOk(n) ? n : NaN; };

    const resetAll  = () => {
      entry = "0"; stored = null; pendingOp = null;
      lastOp = null; lastOperand = null; justEvaluated = false;
      setActiveOp(null); setDisp("0");
    };
    const clearEntry = () => {
      entry = "0"; justEvaluated = false;
      setActiveOp(null); setDisp("0");
    };
    const backspace = () => {
      setActiveOp(null);
      if (justEvaluated) { entry = "0"; justEvaluated = false; setDisp("0"); return; }
      entry = (entry.length <= 1 || (entry.length === 2 && entry.startsWith("-")))
        ? "0" : entry.slice(0, -1);
      setDisp(entry);
    };
    const inputDigit = ch => {
      setActiveOp(null);
      if (justEvaluated) { entry = "0"; justEvaluated = false; }
      if (ch === ".") { if (!entry.includes(".")) entry += "."; setDisp(entry); return; }
      entry = entry === "0" ? ch : entry === "-0" ? "-" + ch : entry + ch;
      setDisp(entry);
    };
    const applyUnary = type => {
      setActiveOp(null);
      const x = curNum();
      if (!isOk(x)) { setDisp("Error"); entry = "0"; return; }
      let y = x;
      if (type === "sqrt") {
        if (x < 0) { setDisp("Error"); entry = "0"; return; }
        y = Math.sqrt(x);
      } else if (type === "sq")   { y = x * x; }
        else if (type === "cube") { y = x * x * x; }
      entry = fmt15(y); setDisp(entry);
    };
    const compute = (a, op, b) => {
      if (!isOk(a) || !isOk(b)) return NaN;
      return op === "+" ? a + b : op === "-" ? a - b
           : op === "*" ? a * b : b === 0 ? NaN : a / b;
    };
    const pressOp = op => {
      const x = curNum();
      if (!isOk(x)) { setDisp("Error"); entry = "0"; return; }
      if (pendingOp && stored !== null && !justEvaluated) {
        const r = compute(stored, pendingOp, x);
        if (!isOk(r)) { setDisp("Error"); resetAll(); return; }
        stored = r; entry = fmt15(r); setDisp(entry);
      } else if (stored === null) { stored = x; }
      pendingOp = op; justEvaluated = true; lastOp = null; lastOperand = null;
    };
    const pressEq = () => {
      setActiveOp(null);
      const x = curNum();
      if (!isOk(x)) { setDisp("Error"); resetAll(); return; }
      if (!pendingOp && lastOp && stored !== null && lastOperand !== null) {
        const r = compute(stored, lastOp, lastOperand);
        if (!isOk(r)) { setDisp("Error"); resetAll(); return; }
        stored = r; entry = fmt15(r); setDisp(entry); justEvaluated = true; return;
      }
      if (pendingOp === null || stored === null) {
        entry = fmt15(x); setDisp(entry); justEvaluated = true; return;
      }
      const r = compute(stored, pendingOp, x);
      if (!isOk(r)) { setDisp("Error"); resetAll(); return; }
      lastOp = pendingOp; lastOperand = x;
      stored = r; entry = fmt15(r); setDisp(entry);
      pendingOp = null; justEvaluated = true;
    };

    // ── click ─────────────────────────────────────────────────────────────
    grid.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      setLastPressed(btn);

      if (btn.dataset.num != null) { inputDigit(btn.dataset.num); return; }
      if (btn.dataset.op)          { setActiveOp(btn); pressOp(btn.dataset.op); return; }
      if (btn.dataset.act) {
        const act = btn.dataset.act;
        if (act === "eq")                              pressEq();
        else if (act === "c")                          clearEntry();
        else if (act === "ac")                         resetAll();
        else if (["sqrt","sq","cube"].includes(act))   applyUnary(act);
        else if (act === "mc")                         { memory = 0; }
        else if (act === "mr")  { setActiveOp(null); entry = fmt15(memory); setDisp(entry); justEvaluated = true; }
        else if (act === "mplus")  { const x = curNum(); if (isOk(x)) memory += x; }
        else if (act === "mminus") { const x = curNum(); if (isOk(x)) memory -= x; }
        if (act !== "eq" && act !== "c" && act !== "ac") setActiveOp(null);
      }
    });

    // ── copy ──────────────────────────────────────────────────────────────
    copyBtn.addEventListener("click", async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(display.value); ok = true; } catch {}
      if (!ok) try { display.select(); ok = document.execCommand("copy"); } catch {}
      if (!ok) return;
      copyBtn.classList.add("is-copied");
      setTimeout(() => copyBtn.classList.remove("is-copied"), 900);
    });

    // ── transfer ──────────────────────────────────────────────────────────
    transferBtn.addEventListener("click", () => {
      const answerInput = document.querySelector('input[name="answer"]');
      if (!answerInput || answerInput.disabled) return;
      answerInput.value = display.value;
      answerInput.focus();
      transferBtn.classList.add("is-sent");
      setTimeout(() => transferBtn.classList.remove("is-sent"), 900);
    });
    this.tabIndex = 0;
    let active = false;
    sr.addEventListener("pointerdown", () => {
      active = true;
      this.focus();
});

// フォーカス外れたら解除
this.addEventListener("blur", () => { active = false; });

this._keyHandler = (e) => {
  if (!active) return; // ← 電卓がアクティブな時だけ反応

  const k = e.key;
  if ((k >= "0" && k <= "9") || k === ".") {
    e.preventDefault(); inputDigit(k);
    const b = findBtn("data-num", k); if (b) setLastPressed(b);
    return;
  }
  if (["+","-","*","/"].includes(k)) {
    e.preventDefault(); pressOp(k);
    const b = findBtn("data-op", k);
    if (b) { setActiveOp(b); setLastPressed(b); }
    return;
  }
  if (k === "Enter" || k === "=") {
    e.preventDefault(); pressEq();
    const b = findBtn("data-act", "eq"); if (b) setLastPressed(b);
    return;
  }
  if (k === "Backspace") { e.preventDefault(); backspace(); return; }
  if (k === "Escape") {
    e.preventDefault(); resetAll();
    const b = findBtn("data-act", "ac"); if (b) setLastPressed(b);
    return;
  }
};

// capture:true で「先に止められる」問題を回避しやすい
window.addEventListener("keydown", this._keyHandler, { capture: true });

    setDisp("0");
  }

  disconnectedCallback() {
  if (this._keyHandler) window.removeEventListener("keydown", this._keyHandler, { capture: true });
}
}

customElements.define("my-calculator", MyCalculator);
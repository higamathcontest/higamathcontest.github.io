/**
 * calculator-en.js
 *
 * 英語ページでのみ、共通calculator.js内の
 * 日本語テキストを英語へ置き換える。
 */

const isEnglish =
  document.documentElement.lang
    .toLowerCase()
    .startsWith('en');

async function translateCalculator() {
  if (!isEnglish) return;

  await customElements.whenDefined(
    'my-calculator'
  );

  const calculator =
    document.querySelector(
      'my-calculator'
    );

  if (!calculator) return;

  let attempts = 0;

  const timerId =
    window.setInterval(() => {
      attempts += 1;

      const root =
        calculator.shadowRoot;

      if (!root) {
        if (attempts >= 50) {
          window.clearInterval(
            timerId
          );
        }

        return;
      }

      const title =
        root.querySelector(
          '.calc-title'
        );

      const subtitle =
        root.querySelector(
          '.calc-sub'
        );

      const transferButton =
        root.querySelector(
          '.calc-transfer-btn'
        );

      const pasteButton =
        root.querySelector(
          '.calc-paste-btn'
        );

      if (title) {
        title.textContent =
          'Calculator';
      }

      if (subtitle) {
        subtitle.textContent =
          '15 significant digits. Keyboard supported.';
      }

      if (transferButton) {
        transferButton.setAttribute(
          'aria-label',
          'Transfer to answer field'
        );
      }

      if (pasteButton) {
        pasteButton.setAttribute(
          'aria-label',
          'Paste from clipboard'
        );
      }

      window.clearInterval(
        timerId
      );
    }, 20);
}

if (
  document.readyState === 'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    translateCalculator,
    { once: true }
  );
} else {
  translateCalculator();
}
/**
 * VirtualOS Calculator Application
 * Basic arithmetic with keyboard support
 */
VOS.CalculatorApp = {
    init(winId, container) {
        const state = { expression: '', result: '0', lastOp: false };

        container.innerHTML = `
            <div class="calculator-app">
                <div class="calc-display">
                    <div class="calc-expression" id="${winId}-calc-expr"></div>
                    <div class="calc-result" id="${winId}-calc-result">0</div>
                </div>
                <div class="calc-buttons">
                    <button class="calc-btn clear-btn" data-val="AC">AC</button>
                    <button class="calc-btn operator" data-val="±">±</button>
                    <button class="calc-btn operator" data-val="%">%</button>
                    <button class="calc-btn operator" data-val="/">÷</button>
                    <button class="calc-btn" data-val="7">7</button>
                    <button class="calc-btn" data-val="8">8</button>
                    <button class="calc-btn" data-val="9">9</button>
                    <button class="calc-btn operator" data-val="*">×</button>
                    <button class="calc-btn" data-val="4">4</button>
                    <button class="calc-btn" data-val="5">5</button>
                    <button class="calc-btn" data-val="6">6</button>
                    <button class="calc-btn operator" data-val="-">−</button>
                    <button class="calc-btn" data-val="1">1</button>
                    <button class="calc-btn" data-val="2">2</button>
                    <button class="calc-btn" data-val="3">3</button>
                    <button class="calc-btn operator" data-val="+">+</button>
                    <button class="calc-btn wide" data-val="0">0</button>
                    <button class="calc-btn" data-val=".">.</button>
                    <button class="calc-btn equals" data-val="=">=</button>
                </div>
            </div>
        `;

        const exprEl = document.getElementById(`${winId}-calc-expr`);
        const resultEl = document.getElementById(`${winId}-calc-result`);

        const updateDisplay = () => {
            exprEl.textContent = state.expression;
            resultEl.textContent = state.result;
        };

        const handleInput = (val) => {
            if (val === 'AC') {
                state.expression = '';
                state.result = '0';
                state.lastOp = false;
            } else if (val === '±') {
                if (state.result !== '0') {
                    state.result = String(-parseFloat(state.result));
                    state.expression = state.result;
                }
            } else if (val === '%') {
                if (state.result !== '0') {
                    state.result = String(parseFloat(state.result) / 100);
                    state.expression = state.result;
                }
            } else if (val === '=') {
                try {
                    // Safely evaluate expression
                    let expr = state.expression;
                    if (!expr) return;
                    // Replace display operators with JS operators
                    let result = Function('"use strict"; return (' + expr + ')')();
                    if (isNaN(result) || !isFinite(result)) {
                        state.result = 'Error';
                    } else {
                        state.result = String(parseFloat(result.toFixed(10)));
                    }
                    state.expression = state.result;
                    state.lastOp = false;
                } catch {
                    state.result = 'Error';
                    state.expression = '';
                }
            } else if (['+', '-', '*', '/'].includes(val)) {
                if (state.expression && !state.lastOp) {
                    state.expression += val;
                    state.lastOp = true;
                } else if (state.expression && state.lastOp) {
                    // Replace the last operator
                    state.expression = state.expression.slice(0, -1) + val;
                }
            } else if (val === '.') {
                // Avoid double decimals in the current number segment
                const parts = state.expression.split(/[+\-*/]/);
                const lastPart = parts[parts.length - 1];
                if (!lastPart.includes('.')) {
                    state.expression += '.';
                    state.lastOp = false;
                }
            } else {
                // Number input
                state.expression += val;
                state.lastOp = false;
                // Try live evaluation
                try {
                    let liveResult = Function('"use strict"; return (' + state.expression + ')')();
                    if (!isNaN(liveResult) && isFinite(liveResult)) {
                        state.result = String(parseFloat(liveResult.toFixed(10)));
                    }
                } catch { /* ignore parse errors while typing */ }
            }
            updateDisplay();
        };

        // Button click handler
        container.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', () => handleInput(btn.dataset.val));
        });

        // Keyboard support (scoped to window focus)
        const keyHandler = (e) => {
            // Only process if this window is active
            if (VOS.State.activeWindowId !== winId) return;

            const key = e.key;
            if (key >= '0' && key <= '9') handleInput(key);
            else if (key === '.') handleInput('.');
            else if (key === '+') handleInput('+');
            else if (key === '-') handleInput('-');
            else if (key === '*') handleInput('*');
            else if (key === '/') { e.preventDefault(); handleInput('/'); }
            else if (key === 'Enter' || key === '=') handleInput('=');
            else if (key === 'Escape' || key === 'Delete') handleInput('AC');
            else if (key === 'Backspace') {
                if (state.expression.length > 0) {
                    state.expression = state.expression.slice(0, -1);
                    state.lastOp = false;
                    updateDisplay();
                }
            }
            else if (key === '%') handleInput('%');
        };

        document.addEventListener('keydown', keyHandler);

        // Cleanup when the window is removed (use MutationObserver)
        const observer = new MutationObserver(() => {
            if (!document.getElementById(winId)) {
                document.removeEventListener('keydown', keyHandler);
                observer.disconnect();
            }
        });
        observer.observe(document.getElementById('windows-container'), { childList: true });
    }
};

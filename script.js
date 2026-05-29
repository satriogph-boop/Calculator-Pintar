class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement, historyListElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.historyListElement = historyListElement;
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.clear();
        this.renderHistory();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.updateDisplay();
    }

    delete() {
        if (this.currentOperand === 'Error') {
            this.clear();
            return;
        }
        if (this.currentOperand === '0') return;
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '') this.currentOperand = '0';
        this.updateDisplay();
    }

    appendNumber(number) {
        if (this.currentOperand === 'Error') this.currentOperand = '0';
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
        this.updateDisplay();
    }

    chooseOperation(operation) {
        if (this.currentOperand === 'Error') return;
        if (this.currentOperand === '0' && this.previousOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute(false);
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '0';
        this.updateDisplay();
    }

    compute(shouldSaveHistory = true) {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '*':
                computation = prev * current;
                break;
            case '/':
                computation = current === 0 ? 'Error' : prev / current;
                break;
            default:
                return;
        }

        const expression = `${this.getDisplayNumber(prev)} ${this.getOperationSymbol(this.operation)} ${this.getDisplayNumber(current)}`;
        this.currentOperand = computation;
        this.operation = undefined;
        this.previousOperand = '';
        this.updateDisplay();

        if (shouldSaveHistory) {
            this.addHistory(expression, this.currentOperand);
        }
    }

    addHistory(expression, result) {
        const item = {
            expression,
            result: this.getDisplayNumber(result)
        };

        this.history.unshift(item);
        this.history = this.history.slice(0, 8);
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.renderHistory();
    }

    renderHistory() {
        this.historyListElement.innerHTML = '';

        if (this.history.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'history-empty';
            emptyItem.innerText = 'Belum ada perhitungan';
            this.historyListElement.appendChild(emptyItem);
            return;
        }

        this.history.forEach(item => {
            const historyItem = document.createElement('li');
            historyItem.className = 'history-item';
            historyItem.tabIndex = 0;
            historyItem.innerHTML = `
                <span>${item.expression}</span>
                <strong>${item.result}</strong>
            `;
            historyItem.addEventListener('click', () => this.useHistoryResult(item.result));
            historyItem.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.useHistoryResult(item.result);
                }
            });
            this.historyListElement.appendChild(historyItem);
        });
    }

    useHistoryResult(result) {
        this.currentOperand = result.replace(/,/g, '');
        this.previousOperand = '';
        this.operation = undefined;
        this.updateDisplay();
    }

    getDisplayNumber(number) {
        if (number === 'Error') return number;
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;

        if (isNaN(integerDigits)) {
            integerDisplay = '0';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }

        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        }

        return integerDisplay;
    }

    getOperationSymbol(operation) {
        const symbols = {
            '*': 'x',
            '/': '/',
            '+': '+',
            '-': '-'
        };
        return symbols[operation] || operation;
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOperandTextElement.innerText =
                `${this.getDisplayNumber(this.previousOperand)} ${this.getOperationSymbol(this.operation)}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }
    }
}

const previousOperandTextElement = document.getElementById('previous-operand');
const currentOperandTextElement = document.getElementById('current-operand');
const historyListElement = document.getElementById('history-list');
const clearHistoryButton = document.getElementById('clear-history');
const themeToggleButton = document.getElementById('theme-toggle');

const calculator = new Calculator(
    previousOperandTextElement,
    currentOperandTextElement,
    historyListElement
);
window.calculator = calculator;

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

function playBeep(frequency, type = 'sine', duration = 0.1) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        if (button.classList.contains('btn-operator')) {
            playBeep(440, 'triangle', 0.1);
        } else if (button.classList.contains('btn-clear') || button.classList.contains('btn-delete')) {
            playBeep(300, 'square', 0.15);
        } else if (button.classList.contains('btn-equal')) {
            playBeep(520, 'triangle', 0.12);
        } else {
            playBeep(600, 'sine', 0.1);
        }
    });
});

clearHistoryButton.addEventListener('click', () => {
    calculator.clearHistory();
    playBeep(260, 'square', 0.12);
});

function setTheme(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    themeToggleButton.innerText = theme === 'light' ? 'Light' : 'Dark';
    localStorage.setItem('calculatorTheme', theme);
}

themeToggleButton.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    setTheme(nextTheme);
    playBeep(700, 'sine', 0.08);
});

document.addEventListener('keydown', event => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        calculator.appendNumber(key);
        playBeep(600, 'sine', 0.08);
        return;
    }

    if (['+', '-', '*', '/'].includes(key)) {
        calculator.chooseOperation(key);
        playBeep(440, 'triangle', 0.08);
        return;
    }

    if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculator.compute();
        playBeep(520, 'triangle', 0.1);
        return;
    }

    if (key === 'Backspace') {
        calculator.delete();
        playBeep(300, 'square', 0.1);
        return;
    }

    if (key === 'Escape') {
        calculator.clear();
        playBeep(300, 'square', 0.12);
    }
});

setTheme(localStorage.getItem('calculatorTheme') || 'dark');

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const expressionDisplay = document.getElementById('expression-display');
    const numbersGrid = document.getElementById('numbers-grid');
    const operatorsContainer = document.getElementById('operators');
    const checkBtn = document.getElementById('check-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const statusMessage = document.getElementById('status-message');
    const undoBtn = document.getElementById('undo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const hintBtn = document.getElementById('hint-btn');
    const difficultySelector = document.querySelector('.difficulty-selector');
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    const closeOnboardingBtn = document.getElementById('close-onboarding');

    // --- Game State ---
    let activeCards = []; // Simpan data kartu yg aktif { value: number, id: string }
    let firstCard = null;
    let selectedOperator = null;
    let history = []; // Untuk fitur Undo
    
    let currentSolution = "";
    let difficulty = 'easy';
    let initialNumbers = [];

    // Pre-defined number sets
    const numberSets = {
        easy: [
            { numbers: [1, 2, 3, 4], solution: "(1+2+3)*4" },
            { numbers: [2, 3, 4, 6], solution: "6*4*(3-2)" },
            { numbers: [1, 1, 5, 5], solution: "5*(5 - 1/1)" },
        ],
        hard: [
            { numbers: [3, 3, 8, 8], solution: "8/(3-8/3)" },
            { numbers: [1, 5, 5, 5], solution: "5*(5 - 1/5)" },
            { numbers: [1, 3, 4, 6], solution: "6/(1-3/4)" },
        ]
    };

    // --- Game Core Logic ---

    function startGame() {
        const sets = numberSets[difficulty];
        const { numbers, solution } = sets[Math.floor(Math.random() * sets.length)];
        
        initialNumbers = [...numbers];
        currentSolution = solution;
        history = []; // Kosongkan riwayat
        resetTurn();
        
        activeCards = initialNumbers.map((num, index) => ({
            value: num,
            id: `card-${Date.now()}-${index}`
        }));

        renderCards();
    }
    
    function resetTurn() {
        if (firstCard) {
            document.getElementById(firstCard.id)?.classList.remove('selected');
        }
        firstCard = null;
        selectedOperator = null;
        statusMessage.textContent = '';
        statusMessage.className = 'status';
        updateExpressionDisplay();
    }

    function renderCards() {
        numbersGrid.innerHTML = '';
        activeCards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'number-card';
            cardEl.textContent = card.value;
            cardEl.id = card.id;
            numbersGrid.appendChild(cardEl);
        });
        updateExpressionDisplay();
    }

    function updateExpressionDisplay() {
        let text = '';
        if (firstCard) {
            text += firstCard.value;
            if (selectedOperator) {
                text += ` ${selectedOperator} `;
            }
        }
        expressionDisplay.textContent = text;
    }

    function performOperation(secondCard) {
        if (!firstCard || !selectedOperator || !secondCard) return;

        // Simpan state sebelum operasi untuk Undo
        history.push(JSON.parse(JSON.stringify(activeCards)));

        const val1 = firstCard.value;
        const val2 = secondCard.value;
        let result;

        // Validasi pembagian dengan nol
        if (selectedOperator === '÷' && val2 === 0) {
            displayMessage('Tidak bisa membagi dengan nol!', 'incorrect');
            resetTurn();
            return;
        }

        switch (selectedOperator) {
            case '+': result = val1 + val2; break;
            case '-': result = val1 - val2; break;
            case '×': result = val1 * val2; break;
            case '÷': result = val1 / val2; break;
        }
        
        // Handle hasil non-integer (misal: 8/3) dengan 2 angka desimal
        if (result % 1 !== 0) {
            result = parseFloat(result.toFixed(2));
        }

        // Hapus kartu lama, tambahkan kartu hasil
        activeCards = activeCards.filter(c => c.id !== firstCard.id && c.id !== secondCard.id);
        activeCards.push({ value: result, id: `card-${Date.now()}` });

        renderCards();
        checkWinCondition(result);
        resetTurn();
    }

    function checkWinCondition(lastResult) {
        if (activeCards.length === 1) {
            if (lastResult === 24) {
                displayMessage('BENAR! Anda berhasil mendapatkan 24!', 'correct');
                triggerConfetti();
                // Highlight kartu terakhir yang benar
                document.getElementById(activeCards[0].id).classList.add('selected');
            } else {
                displayMessage(`Hanya tersisa ${lastResult}. Coba lagi!`, 'incorrect');
            }
        }
    }

    function undo() {
        if (history.length > 0) {
            activeCards = history.pop();
            renderCards();
            resetTurn();
        } else {
            displayMessage('Tidak ada langkah untuk diurungkan.', 'info');
        }
    }
    
    // --- Event Handlers ---

    numbersGrid.addEventListener('click', (e) => {
        const cardEl = e.target.closest('.number-card');
        if (!cardEl || activeCards.length === 1) return;

        const cardData = activeCards.find(c => c.id === cardEl.id);

        if (!firstCard) {
            firstCard = cardData;
            cardEl.classList.add('selected');
        } else if (cardData.id === firstCard.id) {
            // Deselect jika kartu yang sama diklik lagi
            resetTurn();
        } else if (selectedOperator) {
            // Ini adalah kartu kedua, lakukan operasi
            performOperation(cardData);
        } else {
            // Ganti kartu pertama yang dipilih
            document.getElementById(firstCard.id).classList.remove('selected');
            firstCard = cardData;
            cardEl.classList.add('selected');
        }
        updateExpressionDisplay();
    });

    operatorsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.operator-btn');
        if (!button || !firstCard) return;
        
        // Ganti simbol visual dengan operator internal
        const operatorValue = button.textContent;
        if (operatorValue === '×') selectedOperator = '×';
        else if (operatorValue === '÷') selectedOperator = '÷';
        else selectedOperator = operatorValue;
        
        updateExpressionDisplay();
    });
    
    // Adaptasi fungsi lama
    function displayMessage(msg, type) {
        statusMessage.textContent = msg;
        statusMessage.className = `status ${type}`;
    }
    
    function triggerConfetti() {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }

    hintBtn.addEventListener('click', () => {
        const firstStep = currentSolution.match(/[\(\d]+.[\(\d]+/)[0];
        displayMessage(`Petunjuk: Coba mulai dengan ${firstStep.replace('*','×')}`, 'info');
    });

    clearBtn.addEventListener('click', () => {
        // Clear mengembalikan ke awal puzzle saat ini, bukan game baru
        if(history.length > 0) {
            activeCards = history[0];
            history = [];
            renderCards();
            resetTurn();
        }
    });

    difficultySelector.addEventListener('click', (e) => {
        const button = e.target.closest('.difficulty-btn');
        if (!button || button.classList.contains('active')) return;

        document.querySelector('.difficulty-btn.active').classList.remove('active');
        button.classList.add('active');
        difficulty = button.dataset.difficulty;
        startGame();
    });
    
    if (!localStorage.getItem('math24_visited')) {
        onboardingOverlay.classList.add('visible');
    }

    closeOnboardingBtn.addEventListener('click', () => {
        onboardingOverlay.classList.remove('visible');
        localStorage.setItem('math24_visited', 'true');
    });
    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').catch(err => console.log('SW reg failed: ', err));
        });
    }

    // Initial setup
    checkBtn.style.display = 'none'; // Tombol Cek tidak lagi relevan
    undoBtn.addEventListener('click', undo);
    newGameBtn.addEventListener('click', startGame);
    startGame();
});
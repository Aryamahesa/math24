document.addEventListener('DOMContentLoaded', () => {
    // === DATA & STATE (Bisa diakses oleh semua halaman) ===
    const levelData = {
        "Beginner": [
            { numbers: [1, 2, 3, 4], solution: "(1+2+3)*4" }, { numbers: [2, 3, 4, 6], solution: "6*4*(3-2)" },
            { numbers: [1, 1, 5, 5], solution: "5*(5-1/1)" },  { numbers: [1, 4, 1, 6], solution: "1*4*1*6" },
            { numbers: [4, 2, 1, 3], solution: "4*2*3/1" },   { numbers: [3, 5, 6, 7], solution: "(6-5)+7*3" },
            { numbers: [4, 4, 4, 6], solution: "4/4*4*6" },   { numbers: [1, 3, 6, 8], solution: "(6-3)*8*1" },
            { numbers: [3, 4, 5, 6], solution: "(5-4+3)*6" }, { numbers: [1, 1, 2, 12], solution: "1*1*2*12" }
        ],
        "Junior": [
            { numbers: [3, 3, 8, 8], solution: "8/(3-8/3)" },   { numbers: [1, 5, 5, 5], solution: "5*(5-1/5)" },
            { numbers: [1, 3, 4, 6], solution: "6/(1-3/4)" },   { numbers: [3, 3, 7, 7], solution: "(3+3/7)*7" },
            { numbers: [2, 4, 8, 8], solution: "8*4-8/2" },     { numbers: [3, 8, 8, 9], solution: "(9-8)*8*3" },
            { numbers: [4, 4, 7, 7], solution: "(7*7-4)/4" },   { numbers: [3, 6, 6, 7], solution: "3*6+7-6" },
            { numbers: [1, 1, 9, 9], solution: "9/1+9+1" },     { numbers: [2, 2, 5, 9], solution: "9*2+5-2" }
        ]
        // Anda bisa menambahkan kategori lain di sini
    };
    let playerProgress = {};

    // Fungsi untuk memuat progres, bisa dipanggil dari halaman mana saja
    function loadProgress() {
        const saved = localStorage.getItem('math24Progress');
        playerProgress = saved ? JSON.parse(saved) : {};
        Object.keys(levelData).forEach(cat => {
            if (!playerProgress[cat]) playerProgress[cat] = [];
        });
    }

    // === ROUTER SEDERHANA: Mengecek halaman mana yang sedang aktif ===
    const path = window.location.pathname.split("/").pop();

    if (path === 'index.html' || path === '') {
        initCategoryPage();
    } else if (path === 'levels.html') {
        initLevelsPage();
    } else if (path === 'game.html') {
        initGamePage();
    }

    // === FUNGSI INISIALISASI UNTUK HALAMAN KATEGORI (index.html) ===
    function initCategoryPage() {
        loadProgress();
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';
        Object.keys(levelData).forEach(catName => {
            const link = document.createElement('a');
            link.className = 'category-btn';
            link.href = `levels.html?category=${catName}`;
            const completedCount = playerProgress[catName].length;
            const totalCount = levelData[catName].length;
            link.innerHTML = `
                <span>${catName}</span>
                <span class="progress-text">${completedCount} / ${totalCount} Selesai</span>
            `;
            categoryList.appendChild(link);
        });
    }

    // === FUNGSI INISIALISASI UNTUK HALAMAN LEVEL (levels.html) ===
    function initLevelsPage() {
        loadProgress();
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        
        if (!category || !levelData[category]) {
            window.location.href = 'index.html'; return;
        }

        document.getElementById('category-title').textContent = category;
        const levelGrid = document.getElementById('level-grid');
        levelGrid.innerHTML = '';
        const levels = levelData[category];
        const completedLevels = playerProgress[category];

        for (let i = 0; i < levels.length; i++) {
            const levelNum = i + 1;
            const isCompleted = completedLevels.includes(levelNum);
            const isUnlocked = levelNum === 1 || completedLevels.includes(levelNum - 1);
            
            const element = document.createElement(isUnlocked ? 'a' : 'div');
            element.className = 'level-btn';
            
            if(isUnlocked) {
                element.href = `game.html?category=${category}&level=${levelNum}`;
                element.innerHTML = isCompleted ? `${levelNum} <i class="fas fa-check"></i>` : levelNum;
                if (isCompleted) element.classList.add('completed');
            } else {
                element.innerHTML = `<i class="fas fa-lock"></i>`;
                element.classList.add('locked');
            }
            levelGrid.appendChild(element);
        }
    }

    // === FUNGSI INISIALISASI UNTUK HALAMAN GAME (game.html) ===
    function initGamePage() {
        loadProgress();
        // Mengambil DOM elements khusus untuk halaman game
        const expressionDisplay = document.getElementById('expression-display');
        const numbersGrid = document.getElementById('numbers-grid');
        const operatorsContainer = document.getElementById('operators');
        const statusMessage = document.getElementById('status-message');
        const undoBtn = document.getElementById('undo-btn');
        const clearBtn = document.getElementById('clear-btn');
        const hintBtn = document.getElementById('hint-btn');
        
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        const levelNum = parseInt(params.get('level'));

        if (!category || !levelNum || !levelData[category][levelNum-1]) {
            window.location.href = 'index.html'; return;
        }
        
        const currentLevel = { ...levelData[category][levelNum - 1], number: levelNum };
        
        document.getElementById('back-to-levels-btn').href = `levels.html?category=${category}`;
        document.getElementById('level-title').textContent = `Level ${levelNum}`;

        // === State khusus untuk gameplay ===
        let activeCards = [], firstCard = null, selectedOperator = null, history = [];

        // === Logika Gameplay (Diambil dari script sebelumnya) ===
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
        
        function resetTurn() {
            if (firstCard) document.getElementById(firstCard.id)?.classList.remove('selected');
            firstCard = null; selectedOperator = null;
            statusMessage.textContent = '';
            updateExpressionDisplay();
        }

        function updateExpressionDisplay() {
            expressionDisplay.textContent = firstCard ? `${firstCard.value}${selectedOperator ? ` ${selectedOperator} ` : ''}`: '';
        }
        
        function performOperation(secondCard) {
            history.push(JSON.parse(JSON.stringify(activeCards)));
            const val1 = firstCard.value, val2 = secondCard.value;
            let result;
            if (selectedOperator === '÷' && val2 === 0) {
                displayMessage('Tidak bisa membagi dengan nol!', 'incorrect');
                resetTurn(); return;
            }
            switch (selectedOperator) {
                case '+': result = val1 + val2; break; case '-': result = val1 - val2; break;
                case '×': result = val1 * val2; break; case '÷': result = val1 / val2; break;
            }
            if (result % 1 !== 0) result = parseFloat(result.toFixed(2));
            activeCards = activeCards.filter(c => c.id !== firstCard.id && c.id !== secondCard.id);
            activeCards.push({ value: result, id: `card-${Date.now()}` });
            renderCards();
            checkWinCondition(result);
            resetTurn();
        }
        
        function checkWinCondition(lastResult) {
            if (activeCards.length === 1 && lastResult === 24) {
                displayMessage('LEVEL SELESAI!', 'correct');
                triggerConfetti();
                markLevelAsCompleted();
                setTimeout(() => {
                    window.location.href = `levels.html?category=${category}`;
                }, 2000);
            } else if (activeCards.length === 1) {
                displayMessage(`Hanya tersisa ${lastResult}. Coba lagi!`, 'incorrect');
            }
        }
        
        function markLevelAsCompleted() {
             if (!playerProgress[category].includes(levelNum)) {
                playerProgress[category].push(levelNum);
                localStorage.setItem('math24Progress', JSON.stringify(playerProgress));
            }
        }

        function displayMessage(msg, type) { statusMessage.textContent = msg; statusMessage.className = `status ${type}`; }
        function triggerConfetti() { confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } }); }

        // === Event Listeners khusus halaman game ===
        numbersGrid.addEventListener('click', (e) => {
            const cardEl = e.target.closest('.number-card');
            if (!cardEl || activeCards.length === 1) return;
            const cardData = activeCards.find(c => c.id === cardEl.id);
            if (!firstCard) {
                firstCard = cardData; cardEl.classList.add('selected');
            } else if (cardData.id === firstCard.id) {
                resetTurn();
            } else if (selectedOperator) {
                performOperation(cardData);
            } else {
                document.getElementById(firstCard.id).classList.remove('selected');
                firstCard = cardData; cardEl.classList.add('selected');
            }
            updateExpressionDisplay();
        });

        operatorsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.operator-btn');
            if (!button || !firstCard) return;
            selectedOperator = button.dataset.value === '*' ? '×' : (button.dataset.value === '/' ? '÷' : button.dataset.value);
            updateExpressionDisplay();
        });

        undoBtn.addEventListener('click', () => {
            if (history.length > 0) {
                activeCards = history.pop();
                renderCards(); 
                resetTurn();
            }
        });

        clearBtn.addEventListener('click', () => {
            // Cukup panggil ulang fungsi start game untuk level ini
            startLevelGame();
        });
        
        hintBtn.addEventListener('click', () => displayMessage(`Solusi: ${currentLevel.solution.replace('*','×')}`, 'info'));

        // === Fungsi untuk memulai logika game di halaman ini ===
        function startLevelGame() {
            history = [];
            resetTurn();
            activeCards = currentLevel.numbers.map((num, index) => ({
                value: num,
                id: `card-${Date.now()}-${index}`
            }));
            renderCards();
        }

        // Jalankan game saat halaman dimuat
        startLevelGame();
    }
});
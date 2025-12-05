// game.js - 단순화된 키보드 대응 버전

// =================== 전역 변수 ===================
const CONFIG = {
    STAGES: 10,
    TIME_LIMIT: 10,
    PLAYER_HP: 100,
    MONSTER_BASE_HP: 300,
    
    BASE_DAMAGE: 24,
    TIME_BONUS: 5,
    COMBO_MULTIPLIER: [1.0, 1.3, 1.6, 1.9, 2.2, 2.5, 2.8, 3.1, 3.4, 3.7],
    
    DEFENSE_CHANCE: [0, 0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55],
    HEAL_CHANCE: [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5],
    HEAL_PERCENT: [0.1, 0.25],
    
    SCORE_BASE: 300,
    SCORE_TIME: 40,
    SCORE_COMBO: 150,
    SCORE_STAGE: 3000,
    
    COMBO_THRESHOLDS: [3, 5, 8, 12],
    COMBO_MULTIPLIERS: [1.6, 1.9, 2.2, 2.5],
    
    POTION_HEAL: 40,
    POTION_COUNT: 2,
    
    LENGTH_MULTIPLIER: {
        2: 1.0,
        3: 1.5,
        4: 2.0,
        5: 2.5
    }
};

const MONSTERS = [
    { level: 1, emoji: "👹", name: "초급", hp: 300, color: "#6366f1", attack: 18 },
    { level: 2, emoji: "👻", name: "중급", hp: 400, color: "#8b5cf6", attack: 26 },
    { level: 3, emoji: "🤖", name: "고급", hp: 560, color: "#06b6d4", attack: 36 },
    { level: 4, emoji: "🧌", name: "전문", hp: 760, color: "#ef4444", attack: 46 },
    { level: 5, emoji: "🐉", name: "달인", hp: 1000, color: "#f59e0b", attack: 55 },
    { level: 6, emoji: "🦄", name: "대가", hp: 1300, color: "#ec4899", attack: 65 },
    { level: 7, emoji: "🧟", name: "거장", hp: 1640, color: "#10b981", attack: 74 },
    { level: 8, emoji: "👽", name: "종결", hp: 2000, color: "#84cc16", attack: 84 },
    { level: 9, emoji: "🔥", name: "신", hp: 2400, color: "#f97316", attack: 94 },
    { level: 10, emoji: "🫅🏻", name: "왕", hp: 15000, color: "#f59e0b", attack: 144 }
];

const MONSTER_DIALOGUES = {
    normal: ["너를 이기고 말겠다!", "이 정도로 날 이길 수 없다!", "한 번 더 덤벼봐!", "내가 질 것 같냐!"],
    hit: ["윽! 상처가...", "이런 공격이 통하다니!", "아프다!", "효과가 굉장하군!"],
    defense: ["방어 성공!", "헛공격이야!", "내 방어막은 완벽해!", "막아냈다!"],
    heal: ["회복했다!", "체력이 돌아왔어!", "다시 힘이 솟는다!", "이제 다시 시작이다!"],
    lowHp: ["위험하다!", "체력이 얼마 안 남았어...", "마지막까지 버틴다!", "이게 마지막이겠지?"],
    death: ["으아악! 패배했다...", "너의 승리야...", "다음에 만나자...", "나를 이기다니..."]
};

const PLAYER_DIALOGUES = {
    normal: ["내가 이길 거야!", "좋은 어휘 실력을 보여주지!", "한 번 덤벼봐!", "이 정도는 쉽지!"],
    hit: ["효과적인 공격!", "단어 하나로 강력하다!", "정확한 답변이야!", "어휘력이 빛난다!"],
    wrong: ["이런 실수를!", "또 틀렸어...", "집중해야 하는데...", "어휘력을 더 키워야겠어"],
    heal: ["체력이 회복됐다!", "다시 힘이 난다!", "물약 효과 좋군!", "이제 다시 싸울 수 있어!"],
    lowHp: ["체력이 위험해...", "물약이 필요해...", "마지막까지 버텨야지...", "이대로 지면 안되는데..."]
};

// 전역 상태
let state = {
    stage: 1,
    playing: false,
    paused: false,
    gameOver: false,
    victory: false,
    startTime: Date.now(),
    gameTime: 0,
    
    player: {
        hp: CONFIG.PLAYER_HP,
        maxHp: CONFIG.PLAYER_HP,
        combo: 0,
        maxCombo: 0,
        score: 0,
        fastTime: 999,
        potions: CONFIG.POTION_COUNT
    },
    
    monster: null,
    monsterHp: 0,
    monsterMaxHp: 0,
    
    currentWord: null,
    timeLeft: CONFIG.TIME_LIMIT,
    timer: null,
    words: [],
    questionTime: 0,
    
    stats: {
        cleared: 0,
        total: 0,
        correct: 0
    }
};

// 전역 DOM 요소
let el = {};
let keyboardActive = false;

// =================== 유틸리티 함수 ===================
function getDeviceId() {
    let deviceId = localStorage.getItem('kjd_device_id');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('kjd_device_id', deviceId);
    }
    return deviceId;
}

// =================== 단순화된 키보드 처리 ===================
function setupKeyboardHandling() {
    // 입력 필드 포커스/블러 이벤트
    if (el.input) {
        el.input.addEventListener('focus', function() {
            keyboardActive = true;
            document.body.classList.add('keyboard-active');
            
            // 작은 화면일 경우 추가 축소
            if (window.innerHeight < 600) {
                const battleArea = document.querySelector('.battle-area');
                const problemArea = document.querySelector('.problem-area');
                
                if (battleArea) {
                    battleArea.style.transform = 'scale(0.8)';
                }
                if (problemArea) {
                    problemArea.style.transform = 'scale(0.8)';
                }
            }
        });
        
        el.input.addEventListener('blur', function() {
            keyboardActive = false;
            document.body.classList.remove('keyboard-active');
            
            // 레이아웃 복원
            const battleArea = document.querySelector('.battle-area');
            const problemArea = document.querySelector('.problem-area');
            
            if (battleArea) {
                battleArea.style.transform = '';
            }
            if (problemArea) {
                problemArea.style.transform = '';
            }
        });
    }
    
    // 윈도우 크기 변경 감지
    window.addEventListener('resize', function() {
        if (keyboardActive) {
            // 키보드가 활성화된 상태에서 크기 변경 시 화면 고정
            window.scrollTo(0, 0);
        }
    });
}

// =================== 진동 시스템 ===================
function vibrate(pattern) {
    if ('vibrate' in navigator) {
        try {
            if (Array.isArray(pattern)) {
                navigator.vibrate(pattern);
            } else {
                navigator.vibrate(pattern);
            }
        } catch (e) {
            console.log('진동 실패:', e);
        }
    }
}

// =================== 화면 관리 ===================
function showScreen(screen) {
    // 오버레이 컨테이너 내부의 모든 오버레이 비활성화
    const overlaysContainer = document.querySelector('.overlays-container');
    if (overlaysContainer) {
        overlaysContainer.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
    }
    
    if (screen === 'game') {
        document.querySelector('.game-header').style.display = 'flex';
        document.querySelector('.battle-area').style.display = 'grid';
        document.querySelector('.problem-area').style.display = 'flex';
        document.querySelector('.input-area').style.display = 'block';
        
        // 오버레이 컨테이너 숨기기
        if (overlaysContainer) {
            overlaysContainer.style.display = 'none';
        }
    } else {
        document.querySelector('.game-header').style.display = 'none';
        document.querySelector('.battle-area').style.display = 'none';
        document.querySelector('.problem-area').style.display = 'none';
        document.querySelector('.input-area').style.display = 'none';
        
        // 오버레이 컨테이너 보이기
        if (overlaysContainer) {
            overlaysContainer.style.display = 'block';
        }
        
        const target = document.querySelector(`.${screen}-screen`);
        if (target) {
            target.classList.add('active');
        }
    }
    
    // 키보드 상태 초기화
    if (keyboardActive && el.input) {
        el.input.blur();
        keyboardActive = false;
        document.body.classList.remove('keyboard-active');
    }
}

// =================== 대사 시스템 ===================
function showSpeech(text, speaker = 'monster', type = 'normal') {
    if (!el.monsterSpeech) return;
    
    const speechContent = el.monsterSpeech.querySelector('.speech-content');
    if (speechContent) {
        speechContent.textContent = text;
    }
    
    el.monsterSpeech.className = 'speech-bubble';
    el.monsterSpeech.classList.add(speaker);
    
    el.monsterSpeech.style.animation = 'none';
    setTimeout(() => {
        el.monsterSpeech.style.animation = 'speechAppear 3s ease-in-out forwards';
    }, 10);
}

function showRandomSpeech(speaker = 'monster', type = 'normal') {
    const dialogues = speaker === 'monster' ? MONSTER_DIALOGUES : PLAYER_DIALOGUES;
    const dialogueList = dialogues[type] || dialogues.normal;
    const randomText = dialogueList[Math.floor(Math.random() * dialogueList.length)];
    showSpeech(randomText, speaker, type);
}

// =================== 이펙트 함수들 (간소화) ===================
function createEffect(emoji, x, y, type = 'primary', size = 'normal') {
    const layer = document.querySelector('.effects-layer');
    if (!layer) return;
    
    const effect = document.createElement('div');
    effect.className = 'dynamic-effect';
    effect.textContent = emoji;
    effect.style.left = `${x}%`;
    effect.style.top = `${y}%`;
    effect.style.fontSize = size === 'large' ? '48px' : size === 'small' ? '20px' : '28px';
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.zIndex = '20';
    effect.style.filter = 'drop-shadow(0 0 15px currentColor)';
    
    if (type === 'explosion') {
        effect.style.animation = 'explode 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    } else if (type === 'float') {
        effect.style.animation = 'float 1.5s ease-in-out forwards';
    } else if (type === 'spin') {
        effect.style.animation = 'spin 0.8s linear forwards';
    } else {
        effect.style.animation = 'scaleIn 0.4s ease-out forwards';
    }
    
    layer.appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.remove();
        }
    }, type === 'explosion' ? 600 : 1000);
}

function createComboEffect(combo) {
    const centerX = 50, centerY = 50;
    
    if (combo >= 3) {
        createEffect('🔥', centerX, centerY, 'explosion', 'large');
        playSound('combo');
        shakeScreen(4, 200);
        vibrate([80, 40, 80]);
        
        const comboText = document.createElement('div');
        comboText.className = 'combo-display';
        comboText.textContent = `${combo} COMBO!`;
        comboText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: 900;
            color: #f59e0b;
            text-shadow: 0 0 15px rgba(245, 158, 11, 0.8), 0 0 30px rgba(245, 158, 11, 0.5);
            z-index: 1000;
            pointer-events: none;
            animation: comboExplosion 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        const effectsLayer = document.querySelector('.effects-layer');
        if (effectsLayer) {
            effectsLayer.appendChild(comboText);
            setTimeout(() => comboText.remove(), 800);
        }
    }
}

function shakeScreen(intensity = 4, duration = 250) {
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    container.style.animation = `screenShake ${duration}ms ease`;
    
    setTimeout(() => {
        container.style.animation = '';
    }, duration);
}

function showDamageNumber(amount, x, y, color = '#ef4444') {
    const damage = document.createElement('div');
    damage.className = 'damage-number';
    damage.textContent = `-${amount}`;
    damage.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        color: ${color};
        font-size: 32px;
        font-weight: 900;
        text-shadow: 0 0 15px ${color}, 0 0 30px ${color};
        z-index: 1000;
        pointer-events: none;
        animation: damageFloat 1.2s ease-out forwards;
    `;
    
    const effectsLayer = document.querySelector('.effects-layer');
    if (effectsLayer) {
        effectsLayer.appendChild(damage);
    }
    
    setTimeout(() => {
        if (damage.parentNode) {
            damage.remove();
        }
    }, 1200);
}

function playSound(type) {
    try {
        const soundMap = {
            'correct': el.soundCorrect,
            'wrong': el.soundWrong,
            'damage': el.soundDamage,
            'hit': el.soundHit,
            'combo': el.soundCombo,
            'victory': el.soundVictory,
            'potion': el.soundPotion
        };
        
        const sound = soundMap[type];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    } catch (err) {}
}

// =================== DOM 초기화 ===================
function initElements() {
    el = {
        input: document.getElementById('wordInput'),
        potionBtn: document.getElementById('potionBtn'),
        potionCount: document.getElementById('potionCount'),
        
        monsterAvatar: document.getElementById('monsterAvatar'),
        playerAvatar: document.getElementById('playerAvatar'),
        monsterSpeech: document.getElementById('monsterSpeech'),
        monsterNameDisplay: document.getElementById('monsterNameDisplay'),
        monsterLevel: document.getElementById('monsterLevel'),
        
        monsterHpBar: document.getElementById('monsterHpBar'),
        monsterHpText: document.getElementById('monsterHpText'),
        playerHpBar: document.getElementById('playerHpBar'),
        playerHpText: document.getElementById('playerHpText'),
        
        currentStage: document.getElementById('currentStage'),
        currentScore: document.getElementById('currentScore'),
        timeDisplay: document.getElementById('timeDisplay'),
        
        initialDisplay: document.getElementById('initialDisplay'),
        meaningDisplay: document.getElementById('meaningDisplay'),
        
        soundCorrect: document.getElementById('soundCorrect'),
        soundWrong: document.getElementById('soundWrong'),
        soundDamage: document.getElementById('soundDamage'),
        soundHit: document.getElementById('soundHit'),
        soundCombo: document.getElementById('soundCombo'),
        soundVictory: document.getElementById('soundVictory'),
        soundPotion: document.getElementById('soundPotion'),
        
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resumeBtn: document.getElementById('resumeBtn'),
        restartBtn: document.getElementById('restartBtn'),
        restartFromLoseBtn: document.getElementById('restartFromLoseBtn'),
        playAgainBtn: document.getElementById('playAgainBtn'),
        quitBtn: document.getElementById('quitBtn'),
        settingsRankingBtn: document.getElementById('settingsRankingBtn'),
        winRankingBtn: document.getElementById('winRankingBtn'),
        loseRankingBtn: document.getElementById('loseRankingBtn'),
        closeRankingBtn: document.getElementById('closeRankingBtn'),
        
        settingsStage: document.getElementById('settingsStage'),
        settingsPotion: document.getElementById('settingsPotion'),
        
        finalScore: document.getElementById('finalScore'),
        finalCombo: document.getElementById('finalCombo'),
        finalAccuracy: document.getElementById('finalAccuracy'),
        finalTime: document.getElementById('finalTime'),
        loseScore: document.getElementById('loseScore'),
        loseCombo: document.getElementById('loseCombo'),
        loseStage: document.getElementById('loseStage')
    };
}

// =================== 단어 로드 ===================
async function loadWords() {
    try {
        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        const wordsUrl = baseUrl + '/words.json';
        
        const response = await fetch(wordsUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        state.words = data.words;
        console.log(`✅ ${state.words.length}개 단어 로드됨`);
    } catch (err) {
        console.error('❌ 단어 로드 실패:', err);
        state.words = getDefaultWords();
        console.log('🔄 기본 단어 데이터 사용');
    }
}

function getDefaultWords() {
    return [
        { word: "감염", hint: "ㄱㅇ", meaning: "병원체가 몸속에 들어와 번식하는 것", difficulty: 1, length: 2 },
        { word: "모순", hint: "ㅁㅅ", meaning: "서로 맞지 않아 서로 어긋나는 상태", difficulty: 1, length: 2 },
        { word: "통찰", hint: "ㅌㅊ", meaning: "사물의 이치나 내용을 꿰뚫어 봄", difficulty: 2, length: 2 },
        { word: "절제", hint: "ㅈㅈ", meaning: "감정이나 욕망을 적당히 제한함", difficulty: 2, length: 2 },
        { word: "개념", hint: "ㄱㄴ", meaning: "사물에 대한 보편적인 생각이나 관념", difficulty: 1, length: 2 },
        { word: "가설", hint: "ㄱㅅ", meaning: "아직 증명되지 않은 잠정적인 주장", difficulty: 2, length: 2 },
        { word: "가독성", hint: "ㄱㄷㅅ", meaning: "문장을 읽고 이해하기 쉬운 정도", difficulty: 3, length: 3 },
        { word: "다양성", hint: "ㄷㅇㅅ", meaning: "여러 가지로 다양하게 갖추어져 있는 성질", difficulty: 3, length: 3 },
        { word: "감정이입", hint: "ㄱㅈㅇㅇ", meaning: "다른 사람의 감정을 자신의 것처럼 느끼는 것", difficulty: 5, length: 4 },
        { word: "사회계약", hint: "ㅅㅎㄱㅇ", meaning: "국가와 국민 사이의 암묵적인 약속", difficulty: 5, length: 4 },
        { word: "공사구분", hint: "ㄱㅅㄱㅂ", meaning: "공적인 일과 사적인 일을 구분하는 것", difficulty: 7, length: 4 },
        { word: "다양성인정", hint: "ㄷㅇㅅㅇㅈ", meaning: "다양한 것을 인정하는 태도", difficulty: 8, length: 5 }
    ];
}

// =================== 이벤트 설정 ===================
function setupEvents() {
    if (el.startBtn) el.startBtn.addEventListener('click', startGame);
    if (el.pauseBtn) el.pauseBtn.addEventListener('click', showSettings);
    if (el.resumeBtn) el.resumeBtn.addEventListener('click', resumeGame);
    if (el.restartBtn) el.restartBtn.addEventListener('click', restartGame);
    if (el.restartFromLoseBtn) el.restartFromLoseBtn.addEventListener('click', restartGame);
    if (el.playAgainBtn) el.playAgainBtn.addEventListener('click', restartGame);
    if (el.quitBtn) el.quitBtn.addEventListener('click', () => showScreen('start'));
    
    if (el.potionBtn) el.potionBtn.addEventListener('click', usePotion);
    
    if (el.input) {
        el.input.addEventListener('input', function(e) {
            let text = this.value;
            text = text.replace(/[^\u3131-\u318E\uAC00-\uD7A3\u1100-\u11FF\uA960-\uA97C\uD7B0-\uD7FF\u318D\u00B7\u2027]/g, '');
            if (text.length > 5) text = text.substring(0, 5);
            this.value = text;
        });
        
        el.input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAnswer();
            }
        });
    }
    
    if (el.settingsRankingBtn) el.settingsRankingBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.winRankingBtn) el.winRankingBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.loseRankingBtn) el.loseRankingBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.closeRankingBtn) el.closeRankingBtn.addEventListener('click', () => showSettings());
    
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const type = this.dataset.type;
            renderRankings(type);
        });
    });
    
    // 키보드 처리 설정 추가
    setupKeyboardHandling();
}

// =================== 게임 초기화 ===================
async function init() {
    console.log('⚔️ 게임 초기화 시작...');
    
    initElements();
    getDeviceId();
    await loadWords();
    setupEvents();
    
    console.log('✅ 게임 준비 완료');
}

// =================== 게임 로직 ===================
function startGame() {
    console.log('⚔️ 대결 시작!');
    
    createEffect('⚔️', 50, 50, 'explosion', 'large');
    shakeScreen(5, 400);
    vibrate([80, 40, 80, 40, 150]);
    
    resetState();
    spawnMonster(1);
    newQuestion();
    updateUI();
    showScreen('game');
    startTimer();
    
    setTimeout(() => {
        if (el.input) {
            el.input.value = '';
            if (!keyboardActive) {
                el.input.focus();
            }
        }
    }, 300);
    
    showRandomSpeech('monster', 'normal');
    playSound('correct');
}

function resetState() {
    state.playing = true;
    state.paused = false;
    state.gameOver = false;
    state.victory = false;
    state.stage = 1;
    state.startTime = Date.now();
    state.gameTime = 0;
    
    state.player = {
        hp: CONFIG.PLAYER_HP,
        maxHp: CONFIG.PLAYER_HP,
        combo: 0,
        maxCombo: 0,
        score: 0,
        fastTime: 999,
        potions: CONFIG.POTION_COUNT
    };
    
    state.monster = null;
    state.monsterHp = 0;
    state.monsterMaxHp = 0;
    
    state.currentWord = null;
    state.timeLeft = CONFIG.TIME_LIMIT;
    state.questionTime = 0;
    
    state.stats = {
        cleared: 0,
        total: 0,
        correct: 0
    };
}

function spawnMonster(level) {
    const monster = MONSTERS[level - 1];
    state.monster = monster;
    state.monsterHp = monster.hp;
    state.monsterMaxHp = monster.hp;
    
    if (el.monsterAvatar) {
        el.monsterAvatar.textContent = monster.emoji;
        el.monsterAvatar.style.animation = 'monsterSpawn 0.8s ease-out forwards';
        el.monsterAvatar.style.filter = '';
        
        setTimeout(() => {
            el.monsterAvatar.style.animation = 'monsterIdle 3s ease-in-out infinite';
        }, 800);
    }
    
    if (el.monsterNameDisplay) el.monsterNameDisplay.textContent = monster.name;
    if (el.monsterLevel) el.monsterLevel.textContent = `Lv.${level}`;
    if (el.currentStage) el.currentStage.textContent = level;
    
    updateHpDisplay();
    
    console.log(`🐉 몬스터 생성: ${monster.name} HP:${monster.hp} ATK:${monster.attack}`);
}

function newQuestion() {
    if (state.words.length === 0) return;
    
    const difficulty = Math.min(8, Math.ceil(state.stage * 0.8));
    const available = state.words.filter(w => w.difficulty <= difficulty);
    
    if (available.length === 0) return;
    
    const idx = Math.floor(Math.random() * available.length);
    state.currentWord = available[idx];
    state.questionTime = Date.now();
    
    if (el.initialDisplay) el.initialDisplay.textContent = state.currentWord.hint;
    if (el.meaningDisplay) el.meaningDisplay.textContent = state.currentWord.meaning;
    
    if (el.input) {
        el.input.value = '';
        
        // 키보드가 활성화되어 있지 않을 때만 포커스
        if (!keyboardActive) {
            setTimeout(() => {
                el.input.focus();
            }, 100);
        }
    }
    
    state.timeLeft = CONFIG.TIME_LIMIT;
    updateTime();
    
    console.log(`📝 문제: ${state.currentWord.word} (${state.currentWord.hint})`);
}

function startTimer() {
    if (state.timer) clearInterval(state.timer);
    
    state.timer = setInterval(() => {
        if (!state.playing || state.paused || state.gameOver) return;
        
        state.gameTime = Math.floor((Date.now() - state.startTime) / 1000);
        state.timeLeft--;
        updateTime();
        
        if (state.timeLeft <= 0) {
            timeOut();
        }
    }, 1000);
}

function updateTime() {
    if (el.timeDisplay) {
        el.timeDisplay.textContent = state.timeLeft;
        
        if (state.timeLeft <= 3) {
            el.timeDisplay.classList.add('critical');
            el.timeDisplay.style.color = '#ef4444';
            
            if (state.timeLeft <= 2) {
                shakeScreen(2, 80);
            }
        } else if (state.timeLeft <= 5) {
            el.timeDisplay.classList.remove('critical');
            el.timeDisplay.style.color = '#f59e0b';
        } else {
            el.timeDisplay.classList.remove('critical');
            el.timeDisplay.style.color = '';
        }
    }
}

function timeOut() {
    console.log('⏰ 시간 초과!');
    
    state.stats.total++;
    resetCombo();
    
    const damage = calculatePlayerDamage();
    state.player.hp = Math.max(0, state.player.hp - damage);
    
    shakeScreen(6, 400);
    vibrate(150);
    
    if (el.playerAvatar) {
        const avatar = el.playerAvatar;
        avatar.style.animation = 'playerHit 0.3s ease-in-out';
        avatar.style.filter = 'brightness(1.8) drop-shadow(0 0 15px #ef4444)';
        
        setTimeout(() => {
            avatar.style.animation = 'playerIdle 3s ease-in-out infinite';
            avatar.style.filter = 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.6))';
        }, 300);
    }
    
    showDamageNumber(damage, 50, 50, '#ef4444');
    showRandomSpeech('player', 'wrong');
    playSound('wrong');
    playSound('damage');
    
    updateHpDisplay();
    
    if (state.player.hp <= 0) {
        gameEnd(false);
        return;
    }
    
    setTimeout(() => {
        newQuestion();
    }, 600);
}

// =================== 정답 확인 ===================
function checkAnswer() {
    if (!state.currentWord || !el.input) return;
    
    const inputText = el.input.value;
    const wordLength = state.currentWord.length;
    
    if (inputText.length < 2) {
        if (el.input) el.input.focus();
        return;
    }
    
    state.stats.total++;
    const time = (Date.now() - state.questionTime) / 1000;
    
    const normalizedInput = inputText.replace(/[ㆍ·]/g, '');
    const normalizedWord = state.currentWord.word.replace(/[ㆍ·]/g, '');
    
    if (normalizedInput === normalizedWord) {
        correct(time, wordLength);
    } else {
        wrong(time);
    }
    
    if (el.input) {
        el.input.value = '';
        
        // 키보드가 활성화되어 있을 때는 포커스를 유지
        if (keyboardActive) {
            setTimeout(() => {
                el.input.focus();
            }, 10);
        }
    }
}

function correct(time, wordLength) {
    console.log(`✅ 정답! (${wordLength}글자)`);
    
    createEffect('✨', 50, 50, 'primary', 'large');
    shakeScreen(3, 200);
    vibrate(80);
    
    state.stats.correct++;
    state.player.fastTime = Math.min(state.player.fastTime, time);
    
    state.player.combo++;
    state.player.maxCombo = Math.max(state.player.maxCombo, state.player.combo);
    
    createComboEffect(state.player.combo);
    
    const lengthMultiplier = CONFIG.LENGTH_MULTIPLIER[wordLength] || 1.0;
    const timeBonus = Math.max(0, CONFIG.TIME_LIMIT - time) * CONFIG.SCORE_TIME;
    const comboBonus = state.player.combo * CONFIG.SCORE_COMBO;
    const baseScore = CONFIG.SCORE_BASE * lengthMultiplier;
    
    state.player.score += Math.round(baseScore + timeBonus + comboBonus);
    
    const baseDamage = calculateDamage(time) * lengthMultiplier;
    
    let finalDamage = baseDamage;
    let defended = false;
    
    if (state.stage >= 2) {
        const defenseChance = CONFIG.DEFENSE_CHANCE[state.stage - 1];
        if (Math.random() < defenseChance) {
            finalDamage = Math.round(baseDamage * 0.4);
            defended = true;
            showRandomSpeech('monster', 'defense');
            createEffect('🛡️', 50, 50, 'primary');
            shakeScreen(2, 150);
            vibrate(40);
        }
    }
    
    state.monsterHp = Math.max(0, state.monsterHp - finalDamage);
    
    if (state.stage >= 2 && state.monsterHp > 0) {
        const healChance = CONFIG.HEAL_CHANCE[state.stage - 1];
        if (Math.random() < healChance) {
            const healRange = CONFIG.HEAL_PERCENT;
            const healPercent = healRange[0] + Math.random() * (healRange[1] - healRange[0]);
            const healAmount = Math.round(state.monsterMaxHp * healPercent);
            state.monsterHp = Math.min(state.monsterMaxHp, state.monsterHp + healAmount);
            showRandomSpeech('monster', 'heal');
            createEffect('💚', 50, 50, 'success');
            shakeScreen(2, 120);
            vibrate([25, 25, 25]);
        }
    }
    
    shakeScreen(5, 300);
    
    if (el.monsterAvatar && !defended) {
        const avatar = el.monsterAvatar;
        avatar.style.animation = 'hitEffect 0.25s ease-in-out';
        setTimeout(() => {
            avatar.style.animation = 'monsterIdle 3s ease-in-out infinite';
        }, 250);
    }
    
    showDamageNumber(finalDamage, 50, 50, defended ? '#6366f1' : '#ef4444');
    showRandomSpeech('player', 'hit');
    
    if (!defended) {
        showRandomSpeech('monster', 'hit');
    }
    
    playSound('correct');
    playSound('hit');
    
    updateHpDisplay();
    updateScoreDisplay();
    
    if (state.monsterHp <= 0) {
        defeatMonster();
        return;
    }
    
    setTimeout(() => {
        newQuestion();
    }, 600);
}

function wrong(time) {
    console.log('❌ 오답!');
    
    createEffect('💥', 50, 50, 'explosion', 'normal');
    shakeScreen(8, 400);
    vibrate(200);
    
    resetCombo();
    
    const damage = calculatePlayerDamage();
    state.player.hp = Math.max(0, state.player.hp - damage);
    
    if (el.playerAvatar) {
        const avatar = el.playerAvatar;
        avatar.style.animation = 'playerHit 0.3s ease-in-out';
        avatar.style.filter = 'brightness(1.8) drop-shadow(0 0 15px #ef4444)';
        
        setTimeout(() => {
            avatar.style.animation = 'playerIdle 3s ease-in-out infinite';
            avatar.style.filter = 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.6))';
        }, 300);
    }
    
    showDamageNumber(damage, 50, 50, '#ef4444');
    showRandomSpeech('player', 'wrong');
    showRandomSpeech('monster', 'normal');
    playSound('wrong');
    playSound('damage');
    
    updateHpDisplay();
    
    if (state.player.hp <= 0) {
        gameEnd(false);
        return;
    }
    
    setTimeout(() => {
        newQuestion();
    }, 600);
}

function calculateDamage(time) {
    const base = CONFIG.BASE_DAMAGE;
    const timeBonus = Math.max(0, CONFIG.TIME_LIMIT - time) * CONFIG.TIME_BONUS;
    
    let comboMulti = 1.0;
    for (let i = 0; i < CONFIG.COMBO_THRESHOLDS.length; i++) {
        if (state.player.combo >= CONFIG.COMBO_THRESHOLDS[i]) {
            comboMulti = CONFIG.COMBO_MULTIPLIERS[i];
        }
    }
    
    const comboIdx = Math.min(state.player.combo - 1, CONFIG.COMBO_MULTIPLIER.length - 1);
    const extraMulti = CONFIG.COMBO_MULTIPLIER[Math.max(0, comboIdx)];
    const stageMulti = 0.7 + (state.stage * 0.08);
    
    let damage = (base + timeBonus) * comboMulti * extraMulti * stageMulti;
    
    return Math.round(damage);
}

function calculatePlayerDamage() {
    const base = 24;
    const stageMulti = 0.8 + (state.stage * 0.1);
    
    let damage = base * stageMulti;
    
    if (state.player.combo >= 5) {
        damage *= (1 + (state.player.combo * 0.12));
    }
    
    return Math.round(damage);
}

function resetCombo() {
    state.player.combo = 0;
}

// =================== 물약 시스템 ===================
function usePotion() {
    if (!state.playing || state.paused || state.gameOver) return;
    if (state.player.potions <= 0) return;
    if (state.player.hp >= state.player.maxHp) return;
    
    state.player.potions--;
    const healAmount = CONFIG.POTION_HEAL;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
    
    playSound('potion');
    createEffect('🧪', 50, 50, 'explosion', 'large');
    shakeScreen(3, 300);
    vibrate([40, 25, 40]);
    
    if (el.playerAvatar) {
        const avatar = el.playerAvatar;
        avatar.style.animation = 'playerHeal 0.5s ease-out';
        avatar.style.filter = 'brightness(1.4) drop-shadow(0 0 20px #10b981)';
        
        setTimeout(() => {
            avatar.style.animation = 'playerIdle 3s ease-in-out infinite';
            avatar.style.filter = 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.6))';
        }, 500);
    }
    
    updateHpDisplay();
    if (el.potionCount) el.potionCount.textContent = state.player.potions;
    if (el.potionBtn) el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
    
    setTimeout(() => {
        newQuestion();
    }, 600);
}

// =================== 몬스터 처치 ===================
function defeatMonster() {
    console.log(`🎉 몬스터 처치!`);
    
    showRandomSpeech('monster', 'death');
    shakeScreen(6, 500);
    vibrate([80, 40, 80, 40, 150]);
    
    if (el.monsterAvatar) {
        const avatar = el.monsterAvatar;
        avatar.style.animation = 'monsterDeath 1s ease-in forwards';
        avatar.style.filter = 'brightness(0.5) grayscale(1)';
        
        setTimeout(() => {
            avatar.style.animation = '';
            avatar.style.filter = '';
        }, 1000);
    }
    
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 30;
            const x = 50 + Math.cos(angle) * distance;
            const y = 50 + Math.sin(angle) * distance;
            
            createEffect('💥', x, y, 'explosion', 'small');
        }, i * 30);
    }
    
    const stageBonus = state.stage * CONFIG.SCORE_STAGE;
    state.player.score += stageBonus;
    state.stats.cleared++;
    
    updateScoreDisplay();
    
    setTimeout(() => {
        state.stage++;
        
        if (state.stage > CONFIG.STAGES) {
            gameEnd(true);
        } else {
            spawnMonster(state.stage);
            newQuestion();
            
            playSound('victory');
            shakeScreen(4, 400);
            vibrate(150);
            
            if (state.stage % 3 === 0 && state.player.potions < CONFIG.POTION_COUNT) {
                state.player.potions++;
                if (el.potionCount) el.potionCount.textContent = state.player.potions;
                if (el.potionBtn) el.potionBtn.classList.remove('disabled');
                createEffect('🧪', 50, 50, 'potion');
                shakeScreen(2, 150);
                vibrate(80);
            }
        }
    }, 1000);
}

// =================== 게임 종료 ===================
async function gameEnd(isWin) {
    console.log(isWin ? '🏆 승리!' : '💀 패배!');
    
    state.playing = false;
    state.gameOver = true;
    state.victory = isWin;
    
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
    
    // 키보드가 활성화되어 있으면 숨기기
    if (keyboardActive && el.input) {
        el.input.blur();
        keyboardActive = false;
        document.body.classList.remove('keyboard-active');
    }
    
    const accuracy = state.stats.total > 0 ? 
        Math.round((state.stats.correct / state.stats.total) * 100) : 0;
    
    const gameData = {
        nickname: '익명',
        deviceId: getDeviceId(),
        score: state.player.score,
        stage: state.stage - (isWin ? 0 : 1),
        cleared: state.stats.cleared,
        maxCombo: state.player.maxCombo,
        accuracy: accuracy,
        gameTime: state.gameTime,
        timestamp: Date.now(),
        isWin: isWin
    };
    
    try {
        if (typeof window.saveRankingToFirebase === 'function') {
            await window.saveRankingToFirebase(gameData);
        }
    } catch (error) {
        console.error('랭킹 저장 실패:', error);
    }
    
    if (isWin) {
        if (el.finalScore) el.finalScore.textContent = state.player.score.toLocaleString();
        if (el.finalCombo) el.finalCombo.textContent = state.player.maxCombo;
        if (el.finalAccuracy) el.finalAccuracy.textContent = `${accuracy}%`;
        if (el.finalTime) el.finalTime.textContent = `${state.gameTime}초`;
        playSound('victory');
        createEffect('🎉', 50, 50, 'warning');
        vibrate([150, 80, 150, 80, 200]);
        showScreen('win');
    } else {
        if (el.loseScore) el.loseScore.textContent = state.player.score.toLocaleString();
        if (el.loseCombo) el.loseCombo.textContent = state.player.maxCombo;
        if (el.loseStage) el.loseStage.textContent = `${state.stats.cleared}/${CONFIG.STAGES}`;
        playSound('wrong');
        createEffect('💀', 50, 50, 'danger');
        vibrate(300);
        showScreen('lose');
    }
}

// =================== 설정 시스템 ===================
function showSettings() {
    if (!state.playing || state.gameOver) {
        showScreen('start');
        return;
    }
    
    state.paused = true;
    
    // 키보드가 활성화되어 있으면 숨기기
    if (keyboardActive && el.input) {
        el.input.blur();
        keyboardActive = false;
        document.body.classList.remove('keyboard-active');
    }
    
    if (el.settingsStage) el.settingsStage.textContent = `Lv.${state.stage}`;
    if (el.settingsPotion) el.settingsPotion.textContent = state.player.potions;
    
    showScreen('settings');
}

function resumeGame() {
    state.paused = false;
    showScreen('game');
    
    setTimeout(() => {
        if (el.input && !keyboardActive) {
            el.input.focus();
        }
    }, 300);
}

function restartGame() {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
    
    // 키보드 상태 초기화
    if (keyboardActive && el.input) {
        el.input.blur();
        keyboardActive = false;
        document.body.classList.remove('keyboard-active');
    }
    
    startGame();
}

// =================== UI 업데이트 ===================
function updateUI() {
    updateHpDisplay();
    updateScoreDisplay();
    if (el.potionCount) el.potionCount.textContent = state.player.potions;
    if (el.potionBtn) el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
}

function updateScoreDisplay() {
    if (el.currentScore) {
        el.currentScore.textContent = state.player.score.toLocaleString();
    }
}

function updateHpDisplay() {
    const monsterPercent = (state.monsterHp / state.monsterMaxHp) * 100;
    const playerPercent = (state.player.hp / CONFIG.PLAYER_HP) * 100;
    
    if (el.monsterHpBar) el.monsterHpBar.style.width = `${monsterPercent}%`;
    if (el.playerHpBar) el.playerHpBar.style.width = `${playerPercent}%`;
    
    if (el.monsterHpText) el.monsterHpText.textContent = `${Math.round(state.monsterHp)}/${state.monsterMaxHp}`;
    if (el.playerHpText) el.playerHpText.textContent = `${Math.round(state.player.hp)}/${CONFIG.PLAYER_HP}`;
    
    if (monsterPercent < 30) {
        if (el.monsterHpBar) el.monsterHpBar.style.animation = 'pulse 1s infinite';
    } else {
        if (el.monsterHpBar) el.monsterHpBar.style.animation = '';
    }
    
    if (playerPercent < 30) {
        if (el.playerHpBar) el.playerHpBar.style.animation = 'pulse 1s infinite';
    } else {
        if (el.playerHpBar) el.playerHpBar.style.animation = '';
    }
}

// =================== 랭킹 시스템 ===================
async function showRankingScreen(type = 'score') {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;
    
    rankingList.innerHTML = `
        <div class="loading-rankings">
            <i class="fas fa-spinner fa-spin"></i> 랭킹 로딩 중...
        </div>
    `;
    
    showScreen('ranking');
    
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.type === type) {
            tab.classList.add('active');
        }
    });
    
    await renderRankings(type);
}

async function renderRankings(type = 'score') {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;
    
    try {
        const rankings = await window.loadRankingsFromFirebase(type, 10);
        
        if (rankings.length === 0) {
            rankingList.innerHTML = `
                <div class="no-rankings">
                    <i class="fas fa-trophy"></i>
                    <p>랭킹 데이터가 없습니다</p>
                </div>
            `;
            return;
        }
        
        const bestRecords = {};
        rankings.forEach(rank => {
            if (!bestRecords[rank.deviceId] || rank.score > bestRecords[rank.deviceId].score) {
                bestRecords[rank.deviceId] = rank;
            }
        });
        
        const uniqueRankings = Object.values(bestRecords)
            .sort((a, b) => b[type] - a[type])
            .slice(0, 10);
        
        const myDeviceId = getDeviceId();
        const rankingItems = uniqueRankings.map((rank, index) => {
            const isMe = rank.deviceId === myDeviceId;
            const rankClass = isMe ? 'ranking-item my-rank' : 'ranking-item';
            const nameClass = isMe ? 'rank-name me' : 'rank-name';
            
            let typeValue = '';
            switch(type) {
                case 'score': 
                    typeValue = rank.score.toLocaleString() + '점'; 
                    break;
                case 'stage': 
                    typeValue = rank.stage + '단계'; 
                    break;
                case 'combo': 
                    typeValue = rank.maxCombo + '콤보'; 
                    break;
            }
            
            return `
                <div class="${rankClass}">
                    <div class="rank-position ${index < 3 ? 'top-' + (index + 1) : ''}">${index + 1}</div>
                    <div class="rank-info">
                        <div class="${nameClass}">${rank.nickname}</div>
                        <div class="rank-details">
                            <div class="rank-stat">${typeValue}</div>
                            <div class="rank-stat">${Math.floor((rank.gameTime || 0) / 60)}분</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        rankingList.innerHTML = rankingItems;
        
    } catch (error) {
        console.error('랭킹 렌더링 실패:', error);
        rankingList.innerHTML = `
            <div class="no-rankings">
                <i class="fas fa-exclamation-triangle"></i>
                <p>랭킹을 불러오는데 실패했습니다</p>
            </div>
        `;
    }
}

// =================== DOM 로드 시 초기화 ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚔️ 권지단 어휘대전 - 단순화된 키보드 대응 버전 로딩...');
    init();
});

// =================== 전역 함수 노출 ===================
window.checkAnswer = checkAnswer;
window.usePotion = usePotion;
window.startGame = startGame;
window.showSettings = showSettings;
window.resumeGame = resumeGame;
window.restartGame = restartGame;
window.showRankingScreen = showRankingScreen;
window.gameState = state;
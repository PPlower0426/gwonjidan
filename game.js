// game.js - 최종 개선 버전

// =================== 전역 변수 ===================
const CONFIG = {
    STAGES: 10,
    TIME_LIMIT: 10,
    PLAYER_HP: 100,
    MONSTER_BASE_HP: 300,
    
    BASE_DAMAGE: 30,
    TIME_BONUS: 5,
    COMBO_MULTIPLIER: [1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.4, 3.8, 4.2, 4.6],
    
    DEFENSE_CHANCE: [0, 0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55],
    HEAL_CHANCE: [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5],
    HEAL_PERCENT: [0.1, 0.25],
    
    SCORE_BASE: 300,
    SCORE_TIME: 40,
    SCORE_COMBO: 150,
    SCORE_STAGE: 3000,
    
    COMBO_THRESHOLDS: [3, 5, 8, 12],
    COMBO_MULTIPLIERS: [1.8, 2.2, 2.6, 3.0],
    
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
    { level: 1, emoji: "👹", name: "초급", hp: 300, color: "#6366f1", attack: 15 },
    { level: 2, emoji: "👻", name: "중급", hp: 400, color: "#8b5cf6", attack: 22 },
    { level: 3, emoji: "🤖", name: "고급", hp: 560, color: "#06b6d4", attack: 30 },
    { level: 4, emoji: "🧌", name: "전문", hp: 760, color: "#ef4444", attack: 38 },
    { level: 5, emoji: "🐉", name: "달인", hp: 1000, color: "#f59e0b", attack: 46 },
    { level: 6, emoji: "🦄", name: "대가", hp: 1300, color: "#ec4899", attack: 54 },
    { level: 7, emoji: "🧟", name: "거장", hp: 1640, color: "#10b981", attack: 62 },
    { level: 8, emoji: "👽", name: "종결", hp: 2000, color: "#84cc16", attack: 70 },
    { level: 9, emoji: "🔥", name: "신", hp: 2400, color: "#f97316", attack: 78 },
    { level: 10, emoji: "🫅🏻", name: "왕", hp: 15000, color: "#f59e0b", attack: 120 }
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

// =================== 유틸리티 함수 ===================
function getDeviceId() {
    let deviceId = localStorage.getItem('kjd_device_id');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('kjd_device_id', deviceId);
    }
    return deviceId;
}

// =================== 화면 관리 ===================
function showScreen(screen) {
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.classList.remove('active');
    });
    
    if (screen === 'game') {
        document.querySelector('.game-header').style.display = 'flex';
        document.querySelector('.battle-area').style.display = 'grid';
        document.querySelector('.problem-area').style.display = 'flex';
        document.querySelector('.input-area').style.display = 'block';
    } else {
        document.querySelector('.game-header').style.display = 'none';
        document.querySelector('.battle-area').style.display = 'none';
        document.querySelector('.problem-area').style.display = 'none';
        document.querySelector('.input-area').style.display = 'none';
        
        const target = document.querySelector(`.${screen}-screen`);
        if (target) {
            target.classList.add('active');
        }
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

// =================== 이펙트 함수들 ===================
function createEffect(emoji, x, y, type = 'primary', size = 'normal') {
    const layer = document.querySelector('.effects-layer');
    if (!layer) return;
    
    const effect = document.createElement('div');
    effect.className = 'dynamic-effect';
    effect.textContent = emoji;
    effect.style.left = `${x}%`;
    effect.style.top = `${y}%`;
    effect.style.fontSize = size === 'large' ? '64px' : size === 'small' ? '24px' : '36px';
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.zIndex = '20';
    effect.style.filter = 'drop-shadow(0 0 20px currentColor)';
    
    // 효과 타입에 따른 애니메이션
    if (type === 'explosion') {
        effect.style.animation = 'explode 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    } else if (type === 'float') {
        effect.style.animation = 'float 2s ease-in-out forwards';
    } else if (type === 'spin') {
        effect.style.animation = 'spin 1s linear forwards';
    } else {
        effect.style.animation = 'scaleIn 0.5s ease-out forwards';
    }
    
    layer.appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.remove();
        }
    }, type === 'explosion' ? 800 : 1200);
}

function createComboEffect(combo) {
    const centerX = 50, centerY = 50;
    
    if (combo >= 3) {
        createEffect('🔥', centerX, centerY, 'explosion', 'large');
        playSound('combo');
        
        // 콤보 수 표시
        const comboText = document.createElement('div');
        comboText.className = 'combo-display';
        comboText.textContent = `${combo} COMBO!`;
        comboText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 72px;
            font-weight: 900;
            color: #f59e0b;
            text-shadow: 0 0 30px rgba(245, 158, 11, 0.9), 0 0 60px rgba(245, 158, 11, 0.6);
            z-index: 1000;
            pointer-events: none;
            animation: comboExplosion 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        const effectsLayer = document.querySelector('.effects-layer');
        if (effectsLayer) {
            effectsLayer.appendChild(comboText);
            setTimeout(() => comboText.remove(), 1000);
        }
    }
    
    if (combo >= 5) {
        // 추가 효과
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const x = centerX + Math.cos(angle) * 30;
            const y = centerY + Math.sin(angle) * 30;
            
            setTimeout(() => {
                createEffect('⭐', x, y, 'float', 'small');
            }, i * 100);
        }
    }
}

function createAttackEffect(fromX, fromY, toX, toY, color = '#ef4444') {
    const layer = document.querySelector('.effects-layer');
    if (!layer) return;
    
    const attackPath = document.createElement('div');
    attackPath.className = 'attack-path';
    attackPath.style.cssText = `
        position: absolute;
        top: ${fromY}%;
        left: ${fromX}%;
        width: 0;
        height: 4px;
        background: linear-gradient(90deg, ${color}, transparent);
        transform-origin: left center;
        z-index: 5;
        animation: attackBeam 0.3s ease-out forwards;
    `;
    
    layer.appendChild(attackPath);
    
    setTimeout(() => {
        if (attackPath.parentNode) attackPath.remove();
    }, 500);
}

function createRippleEffect(x, y, color) {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: 20px;
        height: 20px;
        border: 2px solid ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: ripple 1s linear forwards;
        z-index: 10;
    `;
    
    const effectsLayer = document.querySelector('.effects-layer');
    if (effectsLayer) {
        effectsLayer.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    }
}

function createShootingStar(startX, startY, endX, endY) {
    const star = document.createElement('div');
    star.textContent = '✨';
    star.style.cssText = `
        position: absolute;
        left: ${startX}%;
        top: ${startY}%;
        font-size: 24px;
        z-index: 5;
        animation: shootingStar 1s linear forwards;
    `;
    
    const keyframes = `
        @keyframes shootingStar {
            0% {
                transform: translate(0, 0);
                opacity: 1;
            }
            100% {
                transform: translate(${endX - startX}%, ${endY - startY}%);
                opacity: 0;
            }
        }
    `;
    
    // 스타일 시트에 키프레임 추가
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    const effectsLayer = document.querySelector('.effects-layer');
    if (effectsLayer) {
        effectsLayer.appendChild(star);
        setTimeout(() => {
            star.remove();
            style.remove();
        }, 1000);
    }
}

function shakeScreen(intensity = 5, duration = 300) {
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
        font-size: 40px;
        font-weight: 900;
        text-shadow: 0 0 20px ${color}, 0 0 40px ${color};
        z-index: 1000;
        pointer-events: none;
        animation: damageFloat 1.5s ease-out forwards;
    `;
    
    const effectsLayer = document.querySelector('.effects-layer');
    if (effectsLayer) {
        effectsLayer.appendChild(damage);
    }
    
    setTimeout(() => {
        if (damage.parentNode) {
            damage.remove();
        }
    }, 1500);
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
        // 입력
        input: document.getElementById('wordInput'),
        potionBtn: document.getElementById('potionBtn'),
        potionCount: document.getElementById('potionCount'),
        
        // 대결
        monsterAvatar: document.getElementById('monsterAvatar'),
        playerAvatar: document.getElementById('playerAvatar'),
        monsterSpeech: document.getElementById('monsterSpeech'),
        monsterNameDisplay: document.getElementById('monsterNameDisplay'),
        monsterLevel: document.getElementById('monsterLevel'),
        
        // 체력
        monsterHpBar: document.getElementById('monsterHpBar'),
        monsterHpText: document.getElementById('monsterHpText'),
        playerHpBar: document.getElementById('playerHpBar'),
        playerHpText: document.getElementById('playerHpText'),
        
        // 정보
        currentStage: document.getElementById('currentStage'),
        timeDisplay: document.getElementById('timeDisplay'),
        
        // 문제
        initialDisplay: document.getElementById('initialDisplay'),
        meaningDisplay: document.getElementById('meaningDisplay'),
        
        // 사운드
        soundCorrect: document.getElementById('soundCorrect'),
        soundWrong: document.getElementById('soundWrong'),
        soundDamage: document.getElementById('soundDamage'),
        soundHit: document.getElementById('soundHit'),
        soundCombo: document.getElementById('soundCombo'),
        soundVictory: document.getElementById('soundVictory'),
        soundPotion: document.getElementById('soundPotion'),
        
        // 버튼
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
        
        // 설정
        settingsStage: document.getElementById('settingsStage'),
        settingsPotion: document.getElementById('settingsPotion'),
        
        // 결과
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
        { word: "다양성인정", hint: "ㄷㅇㅅㅇㅈ", meaning: "다양한 것을 인정하는 태도", difficulty: 8, length: 5 },
        { word: "가야금", hint: "ㄱㅇㄱ", meaning: "한국의 전통 현악기", difficulty: 2, length: 3 },
        { word: "아래아", hint: "ㅇㄹㅇ", meaning: "한글 옛글자로 아래에 붙이는 점", difficulty: 3, length: 3 },
        { word: "야여요유", hint: "ㅇㅇㅇㅇ", meaning: "천지인 키보드 연습 단어", difficulty: 4, length: 4 }
    ];
}

// =================== 이벤트 설정 ===================
function setupEvents() {
    // 게임 컨트롤
    if (el.startBtn) el.startBtn.addEventListener('click', startGame);
    if (el.pauseBtn) el.pauseBtn.addEventListener('click', showSettings);
    if (el.resumeBtn) el.resumeBtn.addEventListener('click', resumeGame);
    if (el.restartBtn) el.restartBtn.addEventListener('click', restartGame);
    if (el.restartFromLoseBtn) el.restartFromLoseBtn.addEventListener('click', restartGame);
    if (el.playAgainBtn) el.playAgainBtn.addEventListener('click', restartGame);
    if (el.quitBtn) el.quitBtn.addEventListener('click', () => showScreen('start'));
    
    // 입력 컨트롤
    if (el.potionBtn) el.potionBtn.addEventListener('click', usePotion);
    
    // 천지인 포함 입력 처리 - 확장된 한글 입력 허용
    if (el.input) {
        el.input.addEventListener('input', function(e) {
            // 천지인 입력 허용: 모든 한글, 자음, 모음, 아래아(ㆍ), 가운데점(·)
            let text = this.value;
            
            // 허용할 문자: 모든 한글, 자음/모음, 아래아(U+318D), 가운데점(U+00B7, U+2027)
            text = text.replace(/[^\u3131-\u318E\uAC00-\uD7A3\u1100-\u11FF\uA960-\uA97C\uD7B0-\uD7FF\u318D\u00B7\u2027]/g, '');
            
            if (text.length > 5) text = text.substring(0, 5);
            this.value = text;
        });
        
        el.input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAnswer();
            }
            
            // 천지인 특수 문자 입력 지원
            if (e.key === '.' || e.key === '·' || e.key === 'ㆍ') {
                // 기본 동작 허용
            }
        });
    }
    
    // 랭킹 버튼
    if (el.settingsRankingBtn) el.settingsRankingBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.winRankingBtn) el.winRankingBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.loseRankingBtn) el.loseRankingBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.closeRankingBtn) el.closeRankingBtn.addEventListener('click', () => showSettings());
    
    // 랭킹 탭
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const type = this.dataset.type;
            renderRankings(type);
        });
    });
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
    
    // 시작 효과
    createEffect('⚔️', 50, 50, 'explosion', 'large');
    shakeScreen(5, 500);
    
    // 별똥별 효과
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const startX = Math.random() * 100;
            const startY = -10;
            const endX = startX + (Math.random() * 40 - 20);
            const endY = 110;
            
            createShootingStar(startX, startY, endX, endY);
        }, i * 200);
    }
    
    resetState();
    spawnMonster(1);
    newQuestion();
    updateUI();
    showScreen('game');
    startTimer();
    
    setTimeout(() => {
        if (el.input) {
            el.input.focus();
            el.input.value = '';
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
    
    if (el.monsterAvatar) el.monsterAvatar.textContent = monster.emoji;
    if (el.monsterNameDisplay) el.monsterNameDisplay.textContent = monster.name;
    if (el.monsterLevel) el.monsterLevel.textContent = `Lv.${level}`;
    if (el.currentStage) el.currentStage.textContent = level;
    
    updateHpDisplay();
    
    console.log(`🐉 몬스터 생성: ${monster.name} HP:${monster.hp}`);
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
        el.input.focus();
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
        
        // 시간에 따른 효과
        if (state.timeLeft <= 3) {
            el.timeDisplay.classList.add('critical');
            el.timeDisplay.style.color = '#ef4444';
            
            // 긴박한 효과
            if (state.timeLeft <= 2) {
                shakeScreen(2, 100);
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
    
    shakeScreen(8, 500);
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
    }, 800);
}

// =================== 정답 확인 ===================
function checkAnswer() {
    if (!state.currentWord || !el.input) return;
    
    const inputText = el.input.value;
    const wordLength = state.currentWord.length;
    
    // 입력 길이 검증
    if (inputText.length < 2) {
        if (el.input) el.input.focus();
        return;
    }
    
    state.stats.total++;
    const time = (Date.now() - state.questionTime) / 1000;
    
    // 아래아(ㆍ)와 가운데점(·) 모두 정규화
    const normalizedInput = inputText.replace(/[ㆍ·]/g, '');
    const normalizedWord = state.currentWord.word.replace(/[ㆍ·]/g, '');
    
    if (normalizedInput === normalizedWord) {
        correct(time, wordLength);
    } else {
        wrong(time);
    }
    
    if (el.input) {
        el.input.value = '';
        el.input.focus();
    }
}

function correct(time, wordLength) {
    console.log(`✅ 정답! (${wordLength}글자)`);
    
    // 정답 효과
    createEffect('✨', 50, 50, 'primary', 'large');
    createRippleEffect(50, 50, '#10b981');
    
    state.stats.correct++;
    state.player.fastTime = Math.min(state.player.fastTime, time);
    
    state.player.combo++;
    state.player.maxCombo = Math.max(state.player.maxCombo, state.player.combo);
    
    // 콤보 효과
    createComboEffect(state.player.combo);
    
    // 점수 계산
    const lengthMultiplier = CONFIG.LENGTH_MULTIPLIER[wordLength] || 1.0;
    const timeBonus = Math.max(0, CONFIG.TIME_LIMIT - time) * CONFIG.SCORE_TIME;
    const comboBonus = state.player.combo * CONFIG.SCORE_COMBO;
    const baseScore = CONFIG.SCORE_BASE * lengthMultiplier;
    
    state.player.score += Math.round(baseScore + timeBonus + comboBonus);
    
    // 데미지 계산
    const baseDamage = calculateDamage(time) * lengthMultiplier;
    
    let finalDamage = baseDamage;
    let defended = false;
    
    // 방어 체크
    if (state.stage >= 2) {
        const defenseChance = CONFIG.DEFENSE_CHANCE[state.stage - 1];
        if (Math.random() < defenseChance) {
            finalDamage = Math.round(baseDamage * 0.4);
            defended = true;
            showRandomSpeech('monster', 'defense');
            createEffect('🛡️', 50, 50, 'primary');
        }
    }
    
    state.monsterHp = Math.max(0, state.monsterHp - finalDamage);
    
    // 회복 체크
    if (state.stage >= 2 && state.monsterHp > 0) {
        const healChance = CONFIG.HEAL_CHANCE[state.stage - 1];
        if (Math.random() < healChance) {
            const healRange = CONFIG.HEAL_PERCENT;
            const healPercent = healRange[0] + Math.random() * (healRange[1] - healRange[0]);
            const healAmount = Math.round(state.monsterMaxHp * healPercent);
            state.monsterHp = Math.min(state.monsterMaxHp, state.monsterHp + healAmount);
            showRandomSpeech('monster', 'heal');
            createEffect('💚', 50, 50, 'success');
        }
    }
    
    // 공격 효과
    createAttackEffect(70, 50, 30, 50, '#10b981');
    shakeScreen(6, 400);
    showDamageNumber(finalDamage, 50, 50, defended ? '#6366f1' : '#ef4444');
    showRandomSpeech('player', 'hit');
    
    if (!defended) {
        showRandomSpeech('monster', 'hit');
    }
    
    playSound('correct');
    playSound('hit');
    
    updateHpDisplay();
    
    if (state.monsterHp <= 0) {
        defeatMonster();
        return;
    }
    
    setTimeout(() => {
        newQuestion();
    }, 800);
}

function wrong(time) {
    console.log('❌ 오답!');
    
    // 오답 효과
    createEffect('💥', 50, 50, 'explosion', 'normal');
    createRippleEffect(50, 50, '#ef4444');
    
    resetCombo();
    
    const damage = calculatePlayerDamage();
    state.player.hp = Math.max(0, state.player.hp - damage);
    
    shakeScreen(8, 500);
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
    }, 800);
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
    const base = 20;
    const stageMulti = 0.8 + (state.stage * 0.08);
    
    let damage = base * stageMulti;
    
    if (state.player.combo >= 5) {
        damage *= (1 + (state.player.combo * 0.1));
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
    
    // 물약 효과 강화
    playSound('potion');
    createEffect('🧪', 50, 50, 'explosion', 'large');
    
    // 회복 효과
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const x = 30 + Math.random() * 40;
            const y = 30 + Math.random() * 40;
            createEffect('💚', x, y, 'float', 'small');
        }, i * 150);
    }
    
    updateHpDisplay();
    if (el.potionCount) el.potionCount.textContent = state.player.potions;
    if (el.potionBtn) el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
    
    setTimeout(() => {
        newQuestion();
    }, 800);
}

// =================== 몬스터 처치 ===================
function defeatMonster() {
    console.log(`🎉 몬스터 처치!`);
    
    showRandomSpeech('monster', 'death');
    
    // 처치 효과 강화
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const x = 50 + Math.cos(angle) * distance;
            const y = 50 + Math.sin(angle) * distance;
            
            createEffect('💥', x, y, 'explosion', 'small');
        }, i * 50);
    }
    
    // 별 효과
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const x = 20 + Math.random() * 60;
            const y = 20 + Math.random() * 60;
            createEffect('⭐', x, y, 'float', 'small');
        }, i * 100);
    }
    
    const stageBonus = state.stage * CONFIG.SCORE_STAGE;
    state.player.score += stageBonus;
    state.stats.cleared++;
    
    setTimeout(() => {
        state.stage++;
        
        if (state.stage > CONFIG.STAGES) {
            gameEnd(true);
        } else {
            spawnMonster(state.stage);
            newQuestion();
            
            playSound('victory');
            
            // 물약 획득
            if (state.stage % 3 === 0 && state.player.potions < CONFIG.POTION_COUNT) {
                state.player.potions++;
                if (el.potionCount) el.potionCount.textContent = state.player.potions;
                if (el.potionBtn) el.potionBtn.classList.remove('disabled');
                createEffect('🧪', 50, 50, 'potion');
            }
        }
    }, 1200);
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
    
    const accuracy = state.stats.total > 0 ? 
        Math.round((state.stats.correct / state.stats.total) * 100) : 0;
    
    // 게임 데이터
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
    
    // 랭킹 저장
    try {
        if (typeof window.saveRankingToFirebase === 'function') {
            await window.saveRankingToFirebase(gameData);
        }
    } catch (error) {
        console.error('랭킹 저장 실패:', error);
    }
    
    // 결과 화면
    if (isWin) {
        if (el.finalScore) el.finalScore.textContent = state.player.score.toLocaleString();
        if (el.finalCombo) el.finalCombo.textContent = state.player.maxCombo;
        if (el.finalAccuracy) el.finalAccuracy.textContent = `${accuracy}%`;
        if (el.finalTime) el.finalTime.textContent = `${state.gameTime}초`;
        playSound('victory');
        createEffect('🎉', 50, 50, 'warning');
        showScreen('win');
    } else {
        if (el.loseScore) el.loseScore.textContent = state.player.score.toLocaleString();
        if (el.loseCombo) el.loseCombo.textContent = state.player.maxCombo;
        if (el.loseStage) el.loseStage.textContent = `${state.stats.cleared}/${CONFIG.STAGES}`;
        playSound('wrong');
        createEffect('💀', 50, 50, 'danger');
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
    
    if (el.settingsStage) el.settingsStage.textContent = `Lv.${state.stage}`;
    if (el.settingsPotion) el.settingsPotion.textContent = state.player.potions;
    
    showScreen('settings');
}

function resumeGame() {
    state.paused = false;
    showScreen('game');
    
    setTimeout(() => {
        if (el.input) el.input.focus();
    }, 300);
}

function restartGame() {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
    
    startGame();
}

// =================== UI 업데이트 ===================
function updateUI() {
    updateHpDisplay();
    if (el.potionCount) el.potionCount.textContent = state.player.potions;
    if (el.potionBtn) el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
}

function updateHpDisplay() {
    const monsterPercent = (state.monsterHp / state.monsterMaxHp) * 100;
    const playerPercent = (state.player.hp / CONFIG.PLAYER_HP) * 100;
    
    if (el.monsterHpBar) el.monsterHpBar.style.width = `${monsterPercent}%`;
    if (el.playerHpBar) el.playerHpBar.style.width = `${playerPercent}%`;
    
    if (el.monsterHpText) el.monsterHpText.textContent = `${Math.round(state.monsterHp)}/${state.monsterMaxHp}`;
    if (el.playerHpText) el.playerHpText.textContent = `${Math.round(state.player.hp)}/${CONFIG.PLAYER_HP}`;
    
    // 체력바 색상 효과
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
        
        // 사용자별 최고 기록만 필터링
        const bestRecords = {};
        rankings.forEach(rank => {
            if (!bestRecords[rank.deviceId] || rank.score > bestRecords[rank.deviceId].score) {
                bestRecords[rank.deviceId] = rank;
            }
        });
        
        // 배열로 변환 및 정렬
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
    console.log('⚔️ 권지단 어휘대전 - 최종 버전 로딩...');
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
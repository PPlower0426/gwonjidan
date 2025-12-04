// game.js - 권지단 어휘대전 완전한 버전

// =================== 전역 변수 선언 ===================
const CONFIG = {
    STAGES: 10,
    TIME_LIMIT: 10,
    PLAYER_HP: 100,
    MONSTER_BASE_HP: 300, // 기존 150에서 2배
    
    BASE_DAMAGE: 30, // 기존 20에서 증가
    TIME_BONUS: 5, // 기존 3에서 증가
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
    
    // 글자별 점수 가중치 (2-5글자)
    LENGTH_MULTIPLIER: {
        2: 1.0,
        3: 1.5,
        4: 2.0,
        5: 2.5
    }
};

// 몬스터 HP 강화 (2배, 최종보스 10배)
const MONSTERS = [
    { 
        level: 1, 
        emoji: "👹", 
        name: "초성 도깨비", 
        hp: 300, // 2배
        color: "#6366f1", 
        attack: 15,
        difficulty: 1
    },
    { 
        level: 2, 
        emoji: "👻", 
        name: "맞춤법 유령", 
        hp: 400, // 2배
        color: "#8b5cf6", 
        attack: 22,
        difficulty: 2
    },
    { 
        level: 3, 
        emoji: "🤖", 
        name: "띄어쓰기 로봇", 
        hp: 560, // 2배
        color: "#06b6d4", 
        attack: 30,
        difficulty: 3
    },
    { 
        level: 4, 
        emoji: "🧌", 
        name: "오타 트롤", 
        hp: 760, // 2배
        color: "#ef4444", 
        attack: 38,
        difficulty: 4
    },
    { 
        level: 5, 
        emoji: "🐉", 
        name: "한자어 드래곤", 
        hp: 1000, // 2배
        color: "#f59e0b", 
        attack: 46,
        difficulty: 5
    },
    { 
        level: 6, 
        emoji: "🦄", 
        name: "동음이의어 유니콘", 
        hp: 1300, // 2배
        color: "#ec4899", 
        attack: 54,
        difficulty: 6
    },
    { 
        level: 7, 
        emoji: "🧟", 
        name: "문법 좀비", 
        hp: 1640, // 2배
        color: "#10b981", 
        attack: 62,
        difficulty: 7
    },
    { 
        level: 8, 
        emoji: "👽", 
        name: "외래어 에일리언", 
        hp: 2000, // 2배
        color: "#84cc16", 
        attack: 70,
        difficulty: 8
    },
    { 
        level: 9, 
        emoji: "🔥", 
        name: "고급어휘 불사조", 
        hp: 2400, // 2배
        color: "#f97316", 
        attack: 78,
        difficulty: 9
    },
    { 
        level: 10, 
        emoji: "🫅🏻", 
        name: "훈민정음 세종", 
        hp: 15000, // 기존 1500에서 10배
        color: "#f59e0b", 
        attack: 120,
        difficulty: 10
    }
];

const MONSTER_DIALOGUES = {
    normal: [
        "너를 이기고 말겠다!", 
        "이 정도로 날 이길 수 없다!", 
        "한 번 더 덤벼봐!", 
        "내가 질 것 같냐!", 
        "어휘 실력이 대단하군!"
    ],
    hit: [
        "윽! 상처가...", 
        "이런 공격이 통하다니!", 
        "아프다!", 
        "효과가 굉장하군!", 
        "이 정도는 간지럽지 않아!"
    ],
    defense: [
        "방어 성공!", 
        "헛공격이야!", 
        "내 방어막은 완벽해!", 
        "막아냈다!", 
        "너의 공격은 통하지 않아!"
    ],
    heal: [
        "회복했다!", 
        "체력이 돌아왔어!", 
        "다시 힘이 솟는다!", 
        "이제 다시 시작이다!", 
        "상처가 아물었어!"
    ],
    lowHp: [
        "위험하다!", 
        "체력이 얼마 안 남았어...", 
        "마지막까지 버틴다!", 
        "이게 마지막이겠지?", 
        "아직 끝나지 않았다!"
    ],
    death: [
        "으아악! 패배했다...", 
        "너의 승리야...", 
        "다음에 만나자...", 
        "나를 이기다니...", 
        "좋은 승부였어..."
    ]
};

const PLAYER_DIALOGUES = {
    normal: [
        "내가 이길 거야!", 
        "좋은 어휘 실력을 보여주지!", 
        "한 번 덤벼봐!", 
        "이 정도는 쉽지!", 
        "어휘력으로 승부다!"
    ],
    hit: [
        "효과적인 공격!", 
        "단어 하나로 강력하다!", 
        "정확한 답변이야!", 
        "어휘력이 빛난다!", 
        "이게 바로 실력이지!"
    ],
    wrong: [
        "이런 실수를!", 
        "또 틀렸어...", 
        "집중해야 하는데...", 
        "어휘력을 더 키워야겠어", 
        "다음엔 꼭 맞출 거야!"
    ],
    heal: [
        "체력이 회복됐다!", 
        "다시 힘이 난다!", 
        "물약 효과 좋군!", 
        "이제 다시 싸울 수 있어!", 
        "상처가 아물었어!"
    ],
    lowHp: [
        "체력이 위험해...", 
        "물약이 필요해...", 
        "마지막까지 버텨야지...", 
        "이대로 지면 안되는데...", 
        "집중력이 필요해..."
    ]
};

// 전역 상태 변수
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
    input: "",
    timeLeft: CONFIG.TIME_LIMIT,
    timer: null,
    words: [],
    questionTime: 0,
    
    stats: {
        cleared: 0,
        total: 0,
        correct: 0,
        combos: [],
        damages: []
    }
};

// 전역 DOM 요소
let el = {};

// 닉네임 관련
let userNickname = '';
const NICKNAME_KEY = 'kjd_nickname';
const DEVICE_ID_KEY = 'kjd_device_id';

// =================== 유틸리티 함수 ===================
function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

function loadNickname() {
    const savedNickname = localStorage.getItem(NICKNAME_KEY);
    if (savedNickname) {
        userNickname = savedNickname;
        return true;
    }
    return false;
}

function saveNickname(nickname) {
    if (nickname && nickname.trim().length > 0) {
        userNickname = nickname.trim().substring(0, 10);
        localStorage.setItem(NICKNAME_KEY, userNickname);
        return true;
    }
    return false;
}

// =================== 화면 관리 함수 ===================
function showScreen(screen) {
    console.log(`🖥️ 화면 전환: ${screen}`);
    
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.classList.remove('active');
    });
    
    if (screen === 'game') {
        // 게임 화면 요소들 표시
        document.querySelector('.game-header').style.display = 'flex';
        document.querySelector('.battle-area').style.display = 'grid';
        document.querySelector('.problem-card').style.display = 'flex';
        document.querySelector('.input-area').style.display = 'block';
        document.querySelectorAll('.overlay').forEach(overlay => overlay.classList.remove('active'));
    } else {
        // 오버레이 화면 표시
        document.querySelector('.game-header').style.display = 'none';
        document.querySelector('.battle-area').style.display = 'none';
        document.querySelector('.problem-card').style.display = 'none';
        document.querySelector('.input-area').style.display = 'none';
        
        const target = document.querySelector(`.${screen}-screen`);
        if (target) {
            target.classList.add('active');
        } else {
            console.error(`❌ 화면 찾을 수 없음: ${screen}`);
        }
    }
}

function showStartScreen() {
    if (loadNickname()) {
        showScreen('start');
    } else {
        showScreen('nickname');
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
    el.monsterSpeech.classList.add(type);
    
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
function createEffect(emoji, x, y, type = 'primary') {
    const layer = document.querySelector('.effects-layer');
    if (!layer) return;
    
    const effect = document.createElement('div');
    effect.className = 'dynamic-effect';
    effect.textContent = emoji;
    effect.style.left = `${x}%`;
    effect.style.top = `${y}%`;
    effect.style.position = 'absolute';
    effect.style.fontSize = '36px';
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '20';
    effect.style.animation = 'scaleIn 0.5s ease-out forwards';
    
    switch(type) {
        case 'primary': effect.style.color = '#6366f1'; break;
        case 'danger': effect.style.color = '#ef4444'; break;
        case 'warning': effect.style.color = '#f59e0b'; break;
        case 'success': effect.style.color = '#10b981'; break;
        case 'potion': effect.style.color = '#8b5cf6'; break;
    }
    
    layer.appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.remove();
        }
    }, 800);
}

function createRippleEffect(x, y, color = '#6366f1') {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: 20px;
        height: 20px;
        border-color: ${color};
        z-index: 999;
        pointer-events: none;
    `;
    
    const layer = document.querySelector('.effects-layer');
    if (layer) {
        layer.appendChild(ripple);
    }
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.remove();
        }
    }, 1000);
}

function showAttackBeam(from, to) {
    const beam = document.createElement('div');
    beam.className = 'attack-path';
    beam.style.cssText = `
        position: absolute;
        top: 50%;
        ${from === 'player' ? 'left: 70%; right: 30%;' : 'left: 30%; right: 70%;'}
        height: 3px;
        background: linear-gradient(90deg, 
            ${from === 'player' ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'} 0%,
            ${from === 'player' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'} 50%,
            ${from === 'player' ? 'rgba(239, 68, 68, 0)' : 'rgba(16, 185, 129, 0)'} 100%
        );
        transform: translateY(-50%);
        z-index: 1;
        animation: attackBeam 0.3s ease-out forwards;
        box-shadow: 0 0 20px ${from === 'player' ? '#10b981' : '#ef4444'};
    `;
    
    const battleArea = document.querySelector('.battle-area');
    if (battleArea) {
        battleArea.appendChild(beam);
    }
    
    setTimeout(() => {
        if (beam.parentNode) {
            beam.remove();
        }
    }, 300);
}

function shakeScreen(intensity = 5, duration = 300) {
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    container.style.animation = `screenShake ${duration}ms ease`;
    
    setTimeout(() => {
        container.style.animation = '';
    }, duration);
}

function flashScreen(color = 'red', duration = 200) {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${color === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
        z-index: 9998;
        pointer-events: none;
        animation: ${color === 'red' ? 'flashRed' : 'flashGreen'} ${duration}ms ease;
    `;
    
    const container = document.querySelector('.game-container');
    if (container) {
        container.appendChild(flash);
    }
    
    setTimeout(() => {
        if (flash.parentNode) {
            flash.remove();
        }
    }, duration);
}

function showDamageNumber(amount, x, y, color = '#ef4444', isCritical = false) {
    const damage = document.createElement('div');
    damage.className = 'damage-number';
    damage.textContent = `-${amount}`;
    damage.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        color: ${color};
        font-size: ${isCritical ? '50px' : '40px'};
        font-weight: 900;
        text-shadow: 0 0 20px ${color}, 0 0 40px ${color};
        z-index: 1000;
        pointer-events: none;
        animation: damageFloat 1.5s ease-out forwards, ${isCritical ? 'criticalHit 0.5s ease' : 'none'};
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

function showComboExplosion() {
    const combo = document.createElement('div');
    combo.className = 'combo-display';
    combo.textContent = `${state.player.combo} COMBO!`;
    
    document.querySelector('.effects-layer').appendChild(combo);
    
    setTimeout(() => {
        combo.remove();
    }, 800);
}

function enhanceMonsterHit() {
    const monster = document.querySelector('.monster-circle');
    if (!monster) return;
    
    monster.style.transform = 'scale(1.3)';
    monster.style.transition = 'transform 0.1s ease';
    monster.style.filter = 'brightness(2) saturate(2)';
    
    setTimeout(() => {
        monster.style.transform = 'scale(1)';
        monster.style.filter = '';
    }, 100);
    
    setTimeout(() => {
        monster.style.transition = '';
    }, 200);
}

function enhancePlayerHit() {
    const player = document.querySelector('.player-circle');
    if (!player) return;
    
    player.style.transform = 'scale(0.9)';
    player.style.transition = 'transform 0.1s ease';
    player.style.filter = 'brightness(0.8) saturate(0.8)';
    
    setTimeout(() => {
        player.style.transform = 'scale(1)';
        player.style.filter = '';
    }, 100);
    
    setTimeout(() => {
        player.style.transition = '';
    }, 200);
}

function createSpinEffect(x, y, type = 'primary') {
    const spin = document.createElement('div');
    spin.className = 'spin-effect';
    spin.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        font-size: 24px;
        z-index: 999;
        pointer-events: none;
        transform: translate(-50%, -50%);
    `;
    
    switch(type) {
        case 'primary': spin.textContent = '🌀'; spin.style.color = '#6366f1'; break;
        case 'warning': spin.textContent = '🔥'; spin.style.color = '#f59e0b'; break;
        case 'danger': spin.textContent = '💀'; spin.style.color = '#ef4444'; break;
        case 'success': spin.textContent = '💚'; spin.style.color = '#10b981'; break;
        case 'potion': spin.textContent = '🧪'; spin.style.color = '#8b5cf6'; break;
    }
    
    document.querySelector('.effects-layer').appendChild(spin);
    
    setTimeout(() => {
        spin.remove();
    }, 1000);
}

function createGlowEffect(element, color = '#6366f1', duration = 1000) {
    if (!element) return;
    
    element.classList.add('glow-effect');
    element.style.boxShadow = `0 0 20px ${color}`;
    
    setTimeout(() => {
        element.classList.remove('glow-effect');
        element.style.boxShadow = '';
    }, duration);
}

function createTextShake(element) {
    if (!element) return;
    
    element.classList.add('text-shake');
    
    setTimeout(() => {
        element.classList.remove('text-shake');
    }, 300);
}

function createPulseEffect(element) {
    if (!element) return;
    
    element.style.animation = 'pulse 0.5s ease 3';
    
    setTimeout(() => {
        element.style.animation = '';
    }, 1500);
}

function showEffect(target, type, amount = 0) {
    const effect = document.createElement('div');
    effect.className = 'dynamic-effect';
    
    switch(type) {
        case 'hit':
            effect.textContent = '💥';
            effect.style.color = '#ef4444';
            break;
        case 'wrong':
            effect.textContent = '❌';
            effect.style.color = '#ef4444';
            break;
        case 'defense':
            effect.textContent = '🛡️';
            effect.style.color = '#6366f1';
            break;
        case 'heal':
            effect.textContent = `+${amount}💚`;
            effect.style.color = '#10b981';
            break;
    }
    
    effect.style.position = 'absolute';
    effect.style.left = '50%';
    effect.style.top = '50%';
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.fontSize = '24px';
    effect.style.zIndex = '999';
    effect.style.pointerEvents = 'none';
    effect.style.animation = 'hitEffect 0.8s ease-out forwards';
    
    const effectsLayer = document.querySelector('.effects-layer');
    if (effectsLayer) {
        effectsLayer.appendChild(effect);
    }
    
    setTimeout(() => {
        effect.remove();
    }, 800);
}

function showMessage(text) {
    const message = document.createElement('div');
    message.className = 'battle-message';
    message.textContent = text;
    message.style.position = 'fixed';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.background = 'rgba(0,0,0,0.8)';
    message.style.color = '#f59e0b';
    message.style.padding = '8px 12px';
    message.style.borderRadius = '6px';
    message.style.fontWeight = 'bold';
    message.style.zIndex = '9999';
    message.style.fontSize = '14px';
    message.style.textAlign = 'center';
    message.style.animation = 'fadeIn 0.2s ease';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 300);
    }, 1500);
}

function animateAvatar(type, action) {
    const avatar = type === 'monster' ? el.monsterAvatar : el.playerAvatar;
    if (!avatar) return;
    
    avatar.classList.remove('hit', 'appear', 'death');
    
    if (action === 'hit') {
        avatar.classList.add('hit');
        setTimeout(() => avatar.classList.remove('hit'), 300);
    } else if (action === 'appear') {
        avatar.classList.add('appear');
        setTimeout(() => avatar.classList.remove('appear'), 500);
    } else if (action === 'death') {
        avatar.classList.add('death');
        createEffect('💥', 50, 50, 'danger');
    }
}

// =================== 사운드 & 진동 ===================
function initAudio() {
    try {
        const sounds = [
            el.soundCorrect,
            el.soundWrong,
            el.soundDamage,
            el.soundHit,
            el.soundCombo,
            el.soundVictory,
            el.soundPotion
        ];
        
        sounds.forEach(sound => {
            if (sound) {
                sound.volume = 0.6;
                sound.load();
            }
        });
        console.log('🔊 오디오 초기화 완료');
    } catch (err) {
        console.log('🔇 오디오 초기화 실패');
    }
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
    } catch (err) {
        console.log('🔇 사운드 재생 실패:', err);
    }
}

function vibrate(pattern) {
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch (err) {
            console.log('📳 진동 실패');
        }
    }
}

// =================== DOM 요소 초기화 ===================
function initElements() {
    el = {
        // 입력 관련
        input: document.getElementById('wordInput'),
        clearBtn: document.getElementById('clearBtn'),
        submitBtn: document.getElementById('submitBtn'),
        potionBtn: document.getElementById('potionBtn'),
        potionCount: document.getElementById('potionCount'),
        
        // 대결 관련
        monsterAvatar: document.getElementById('monsterAvatar'),
        playerAvatar: document.getElementById('playerAvatar'),
        monsterSpeech: document.getElementById('monsterSpeech'),
        monsterNameDisplay: document.getElementById('monsterNameDisplay'),
        monsterLevel: document.getElementById('monsterLevel'),
        
        // 체력바 관련 (컴팩트)
        compactMonsterHp: document.getElementById('compactMonsterHp'),
        compactMonsterHpText: document.getElementById('compactMonsterHpText'),
        compactPlayerHp: document.getElementById('compactPlayerHp'),
        compactPlayerHpText: document.getElementById('compactPlayerHpText'),
        
        // 체력바 관련 (인라인)
        inlineMonsterHp: document.getElementById('inlineMonsterHp'),
        inlineMonsterHpText: document.getElementById('inlineMonsterHpText'),
        inlinePlayerHp: document.getElementById('inlinePlayerHp'),
        inlinePlayerHpText: document.getElementById('inlinePlayerHpText'),
        
        // 정보 관련
        currentStage: document.getElementById('currentStage'),
        currentScore: document.getElementById('currentScore'),
        
        // 스탯 관련
        comboStat: document.getElementById('comboStat'),
        timeStat: document.getElementById('timeStat'),
        accuracyStat: document.getElementById('accuracyStat'),
        timeText: document.getElementById('timeText'),
        
        // 문제 관련
        initialDisplay: document.getElementById('initialDisplay'),
        meaningDisplay: document.getElementById('meaningDisplay'),
        wordLengthBadge: document.getElementById('wordLengthBadge'),
        lengthIndicator: document.getElementById('lengthIndicator'),
        
        // 사운드 관련
        soundCorrect: document.getElementById('soundCorrect'),
        soundWrong: document.getElementById('soundWrong'),
        soundDamage: document.getElementById('soundDamage'),
        soundHit: document.getElementById('soundHit'),
        soundCombo: document.getElementById('soundCombo'),
        soundVictory: document.getElementById('soundVictory'),
        soundPotion: document.getElementById('soundPotion'),
        
        // 버튼 관련
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resumeBtn: document.getElementById('resumeBtn'),
        restartBtn: document.getElementById('restartBtn'),
        restartFromLoseBtn: document.getElementById('restartFromLoseBtn'),
        playAgainBtn: document.getElementById('playAgainBtn'),
        saveNicknameBtn: document.getElementById('saveNicknameBtn'),
        skipNicknameBtn: document.getElementById('skipNicknameBtn'),
        rankingBtn: document.getElementById('rankingBtn'),
        headerRankingBtn: document.getElementById('headerRankingBtn'),
        viewRankingFromWinBtn: document.getElementById('viewRankingFromWinBtn'),
        viewRankingFromLoseBtn: document.getElementById('viewRankingFromLoseBtn'),
        closeRankingBtn: document.getElementById('closeRankingBtn'),
        refreshRankingBtn: document.getElementById('refreshRankingBtn'),
        
        // 결과 관련
        finalScore: document.getElementById('finalScore'),
        finalCombo: document.getElementById('finalCombo'),
        finalAccuracy: document.getElementById('finalAccuracy'),
        finalTime: document.getElementById('finalTime'),
        loseScore: document.getElementById('loseScore'),
        loseCombo: document.getElementById('loseCombo'),
        loseStage: document.getElementById('loseStage'),
        loseMonsters: document.getElementById('loseMonsters'),
        pauseStage: document.getElementById('pauseStage'),
        pauseScore: document.getElementById('pauseScore'),
        pauseCombo: document.getElementById('pauseCombo'),
        pausePotion: document.getElementById('pausePotion'),
        
        // 닉네임 관련
        nicknameInput: document.getElementById('nicknameInput'),
        nicknameCount: document.getElementById('nicknameCount')
    };
}

// =================== 단어 데이터 로드 ===================
async function loadWords() {
    try {
        // 현재 페이지의 경로를 기반으로 words.json 경로 생성
        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        const wordsUrl = baseUrl + '/words.json';
        
        console.log('📂 words.json 요청 URL:', wordsUrl);
        
        const response = await fetch(wordsUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
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
        // 2글자 단어
        { word: "감염", hint: "ㄱㅇ", meaning: "병원체가 몸속에 들어와 번식하는 것", difficulty: 1, length: 2 },
        { word: "모순", hint: "ㅁㅅ", meaning: "서로 맞지 않아 서로 어긋나는 상태", difficulty: 1, length: 2 },
        { word: "통찰", hint: "ㅌㅊ", meaning: "사물의 이치나 내용을 꿰뚫어 봄", difficulty: 2, length: 2 },
        { word: "절제", hint: "ㅈㅈ", meaning: "감정이나 욕망을 적당히 제한함", difficulty: 2, length: 2 },
        { word: "개념", hint: "ㄱㄴ", meaning: "사물에 대한 보편적인 생각이나 관념", difficulty: 1, length: 2 },
        { word: "가설", hint: "ㄱㅅ", meaning: "아직 증명되지 않은 잠정적인 주장", difficulty: 2, length: 2 },
        
        // 3글자 단어
        { word: "가독성", hint: "ㄱㄷㅅ", meaning: "문장을 읽고 이해하기 쉬운 정도", difficulty: 3, length: 3 },
        { word: "다양성", hint: "ㄷㅇㅅ", meaning: "여러 가지로 다양하게 갖추어져 있는 성질", difficulty: 3, length: 3 },
        { word: "합리화", hint: "ㅎㄹㅎ", meaning: "자신의 행동을 합리적으로 설명하려는 심리적 기제", difficulty: 4, length: 3 },
        { word: "회의론", hint: "ㅎㅇㄹ", meaning: "의심하고 검증하려는 태도", difficulty: 4, length: 3 },
        
        // 4글자 단어
        { word: "감정이입", hint: "ㄱㅈㅇㅇ", meaning: "다른 사람의 감정을 자신의 것처럼 느끼는 것", difficulty: 5, length: 4 },
        { word: "사회계약", hint: "ㅅㅎㄱㅇ", meaning: "국가와 국민 사이의 암묵적인 약속", difficulty: 5, length: 4 },
        { word: "자기결정", hint: "ㅈㄱㄱㅈ", meaning: "자신의 삶을 스스로 결정하는 권리", difficulty: 6, length: 4 },
        
        // 5글자 단어 (천지인 가운데 점 포함)
        { word: "공·사·구·분", hint: "ㄱ·ㅅ·ㄱ·ㅂ", meaning: "공적인 일과 사적인 일을 구분하는 것", difficulty: 7, length: 5 },
        { word: "국·제·협·력", hint: "ㄱ·ㅈ·ㅎ·ㄹ", meaning: "국가 간의 상호 협력", difficulty: 7, length: 5 },
        { word: "다·양·성·인·정", hint: "ㄷ·ㅇ·ㅅ·ㅇ·ㅈ", meaning: "다양한 것을 인정하는 태도", difficulty: 8, length: 5 },
        { word: "자·기·반·성·적", hint: "ㅈ·ㄱ·ㅂ·ㅅ·ㅈ", meaning: "자신을 되돌아보는 성질", difficulty: 8, length: 5 }
    ];
}

// =================== 이벤트 설정 ===================
function setupEvents() {
    // 게임 컨트롤 버튼
    if (el.startBtn) el.startBtn.addEventListener('click', startGame);
    if (el.pauseBtn) el.pauseBtn.addEventListener('click', togglePause);
    if (el.resumeBtn) el.resumeBtn.addEventListener('click', resumeGame);
    if (el.restartBtn) el.restartBtn.addEventListener('click', restartGame);
    if (el.restartFromLoseBtn) el.restartFromLoseBtn.addEventListener('click', restartGame);
    if (el.playAgainBtn) el.playAgainBtn.addEventListener('click', restartGame);
    
    // 입력 컨트롤 버튼
    if (el.clearBtn) el.clearBtn.addEventListener('click', clearInput);
    if (el.submitBtn) el.submitBtn.addEventListener('click', checkAnswer);
    if (el.potionBtn) el.potionBtn.addEventListener('click', usePotion);
    
    // 입력 필드 이벤트 (2-5글자 + 천지인 가운데 점 지원)
    if (el.input) {
        el.input.addEventListener('input', function(e) {
            // 한글, 천지인 가운데 점(·), 백스페이스, 숫자 허용
            let text = this.value;
            
            // 천지인 가운데 점을 포함한 한글 입력 처리
            text = text.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ·0-9]/g, '');
            
            // 최대 글자수 제한 (5글자)
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
    
    // 닉네임 저장 버튼
    if (el.saveNicknameBtn) {
        el.saveNicknameBtn.addEventListener('click', function() {
            const nickname = el.nicknameInput.value.trim();
            if (nickname.length > 0) {
                saveNickname(nickname);
                
                // 장치 ID 생성 (없는 경우에만)
                if (!localStorage.getItem(DEVICE_ID_KEY)) {
                    getDeviceId();
                }
                
                showScreen('start');
                
                // Firebase 이벤트
                if (window.logGameEvent) {
                    window.logGameEvent('nickname_set', {
                        nickname_length: nickname.length
                    });
                }
            } else {
                showMessage('닉네임을 입력해주세요!');
                createTextShake(el.nicknameInput);
            }
        });
    }
    
    // 닉네임 건너뛰기 버튼
    if (el.skipNicknameBtn) {
        el.skipNicknameBtn.addEventListener('click', function() {
            saveNickname('익명');
            
            // 장치 ID 생성 (없는 경우에만)
            if (!localStorage.getItem(DEVICE_ID_KEY)) {
                getDeviceId();
            }
            
            showScreen('start');
            
            // Firebase 이벤트
            if (window.logGameEvent) {
                window.logGameEvent('nickname_skipped');
            }
        });
    }
    
    // 랭킹 버튼 이벤트
    if (el.rankingBtn) el.rankingBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.headerRankingBtn) el.headerRankingBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.viewRankingFromWinBtn) el.viewRankingFromWinBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.viewRankingFromLoseBtn) el.viewRankingFromLoseBtn.addEventListener('click', () => showRankingScreen('score'));
    if (el.closeRankingBtn) el.closeRankingBtn.addEventListener('click', () => showScreen('start'));
    if (el.refreshRankingBtn) el.refreshRankingBtn.addEventListener('click', () => refreshRankings());
    
    // 랭킹 탭 이벤트
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const type = this.dataset.type;
            showRankingScreen(type);
        });
    });
    
    // 오디오 초기화 (첫 클릭/터치 시)
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    
    // 닉네임 입력 시 카운트 업데이트
    if (el.nicknameInput && el.nicknameCount) {
        el.nicknameInput.addEventListener('input', function() {
            const text = this.value.replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '');
            if (text.length > 10) {
                this.value = text.substring(0, 10);
            }
            el.nicknameCount.textContent = this.value.length;
        });
    }
}

// =================== 게임 초기화 ===================
async function init() {
    console.log('⚔️ 게임 초기화 시작...');
    
    // DOM 요소 초기화
    initElements();
    
    // 장치 ID 생성
    getDeviceId();
    
    // 닉네임 로드
    loadNickname();
    
    // 단어 데이터 로드
    await loadWords();
    
    // 이벤트 설정
    setupEvents();
    
    // 시작 화면 표시
    showStartScreen();
    
    console.log('✅ 게임 준비 완료');
}

// =================== 게임 로직 ===================
function startGame() {
    console.log('⚔️ 대결 시작!');
    
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
    vibrate([80, 40, 80]);
    createEffect('⚔️', 50, 50, 'primary');
    createRippleEffect(50, 50, '#6366f1');
    
    // Firebase 이벤트
    if (window.logGameEvent) {
        window.logGameEvent('game_start');
    }
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
    state.input = "";
    state.timeLeft = CONFIG.TIME_LIMIT;
    state.questionTime = 0;
    
    state.stats = {
        cleared: 0,
        total: 0,
        correct: 0,
        combos: [],
        damages: []
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
    
    animateAvatar('monster', 'appear');
    if (level > 1) {
        playSound('victory');
        shakeScreen(5, 500);
        createEffect('⭐', 50, 50, 'warning');
        createEffect('✨', 30, 60, 'warning');
        createEffect('✨', 70, 40, 'warning');
        createRippleEffect(50, 50, '#f59e0b');
    }
    
    console.log(`🐉 몬스터 생성: ${monster.name} HP:${monster.hp}`);
}

function newQuestion() {
    if (state.words.length === 0) {
        console.error('❌ 단어 데이터 없음');
        return;
    }
    
    // 스테이지에 따른 난이도 계산
    const difficulty = Math.min(8, Math.ceil(state.stage * 0.8));
    const available = state.words.filter(w => w.difficulty <= difficulty);
    
    let selected;
    let tries = 0;
    do {
        const idx = Math.floor(Math.random() * available.length);
        selected = available[idx];
        tries++;
    } while (selected === state.currentWord && tries < 10);
    
    state.currentWord = selected;
    state.questionTime = Date.now();
    state.input = "";
    
    // UI 업데이트
    if (el.initialDisplay) el.initialDisplay.textContent = state.currentWord.hint;
    if (el.meaningDisplay) el.meaningDisplay.textContent = state.currentWord.meaning;
    if (el.wordLengthBadge) el.wordLengthBadge.textContent = `${state.currentWord.length}글자`;
    
    // 글자 길이 표시기 업데이트
    if (el.lengthIndicator) {
        const dots = el.lengthIndicator.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index < state.currentWord.length);
        });
    }
    
    if (el.input) {
        el.input.value = '';
        el.input.focus();
        el.input.placeholder = `${state.currentWord.length}글자 입력`;
    }
    
    state.timeLeft = CONFIG.TIME_LIMIT;
    updateTime();
    
    if (el.initialDisplay) {
        createGlowEffect(el.initialDisplay, '#6366f1', 1000);
        createTextShake(el.initialDisplay);
    }
    
    console.log(`📝 문제: ${state.currentWord.word} (${state.currentWord.hint}, ${state.currentWord.length}글자)`);
}

function clearInput() {
    if (el.input) {
        el.input.value = '';
        el.input.focus();
    }
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
    if (el.timeStat) el.timeStat.textContent = state.timeLeft;
    if (el.timeText) el.timeText.textContent = `${state.timeLeft}초`;
    
    if (state.timeLeft <= 3) {
        if (el.timeText) el.timeText.style.color = '#ef4444';
        if (el.timeStat) el.timeStat.style.color = '#ef4444';
        createPulseEffect(el.timeText);
        createPulseEffect(el.timeStat);
    } else if (state.timeLeft <= 5) {
        if (el.timeText) el.timeText.style.color = '#f59e0b';
        if (el.timeStat) el.timeStat.style.color = '#f59e0b';
    } else {
        if (el.timeText) el.timeText.style.color = '';
        if (el.timeStat) el.timeStat.style.color = '';
    }
}

function timeOut() {
    console.log('⏰ 시간 초과!');
    
    state.stats.total++;
    resetCombo();
    
    const damage = calculatePlayerDamage();
    state.player.hp = Math.max(0, state.player.hp - damage);
    
    showAttackBeam('monster', 'player');
    shakeScreen(8, 500);
    flashScreen('red', 300);
    enhancePlayerHit();
    
    showDamageNumber(
        damage,
        Math.random() * 30 + 35,
        Math.random() * 30 + 35,
        '#ef4444'
    );
    
    showEffect('player', 'wrong');
    showMessage('시간 초과!');
    showRandomSpeech('player', 'wrong');
    playSound('wrong');
    playSound('damage');
    vibrate(150);
    createEffect('⏰', 50, 50, 'danger');
    createRippleEffect(50, 50, '#ef4444');
    
    updateHpDisplay();
    updateAccuracy();
    
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
    if (!state.currentWord || !el.input) {
        showMessage('문제를 불러오는 중입니다...');
        return;
    }
    
    const inputText = el.input.value;
    const wordLength = state.currentWord.length;
    
    // 입력 길이 검증
    if (inputText.length !== wordLength) {
        showMessage(`${wordLength}글자를 입력해주세요!`);
        createTextShake(el.input);
        return;
    }
    
    state.stats.total++;
    const time = (Date.now() - state.questionTime) / 1000;
    
    // 정답 비교 (천지인 가운데 점 고려)
    const normalizedInput = inputText.replace(/·/g, '');
    const normalizedWord = state.currentWord.word.replace(/·/g, '');
    
    if (normalizedInput === normalizedWord) {
        correct(time, wordLength);
    } else {
        wrong(time);
    }
    
    el.input.value = '';
    state.input = '';
    el.input.focus();
}

function correct(time, wordLength) {
    console.log(`✅ 정답! (${wordLength}글자)`);
    
    state.stats.correct++;
    state.player.fastTime = Math.min(state.player.fastTime, time);
    
    state.player.combo++;
    state.player.maxCombo = Math.max(state.player.maxCombo, state.player.combo);
    
    // 콤보 효과
    if (state.player.combo >= 3) {
        showComboEffect();
        showComboExplosion();
        playSound('combo');
        vibrate([40, 20, 40, 20, 40]);
        createRippleEffect(50, 50, '#f59e0b');
    }
    
    // 글자 길이별 가중치 적용
    const lengthMultiplier = CONFIG.LENGTH_MULTIPLIER[wordLength] || 1.0;
    
    const timeBonus = Math.max(0, CONFIG.TIME_LIMIT - time) * CONFIG.SCORE_TIME;
    const comboBonus = state.player.combo * CONFIG.SCORE_COMBO;
    const baseScore = CONFIG.SCORE_BASE * lengthMultiplier;
    
    state.player.score += Math.round(baseScore + timeBonus + comboBonus);
    
    // 데미지 계산 (글자 길이 가중치 적용)
    const baseDamage = calculateDamage(time) * lengthMultiplier;
    state.stats.damages.push(baseDamage);
    
    let finalDamage = baseDamage;
    let defended = false;
    
    // 몬스터 방어 체크
    if (state.stage >= 2) {
        const defenseChance = CONFIG.DEFENSE_CHANCE[state.stage - 1];
        if (Math.random() < defenseChance) {
            finalDamage = Math.round(baseDamage * 0.4);
            defended = true;
            showEffect('monster', 'defense');
            showRandomSpeech('monster', 'defense');
            createEffect('🛡️', 50, 50, 'primary');
        }
    }
    
    state.monsterHp = Math.max(0, state.monsterHp - finalDamage);
    
    // 몬스터 회복 체크
    if (state.stage >= 2 && state.monsterHp > 0) {
        const healChance = CONFIG.HEAL_CHANCE[state.stage - 1];
        if (Math.random() < healChance) {
            const healRange = CONFIG.HEAL_PERCENT;
            const healPercent = healRange[0] + Math.random() * (healRange[1] - healRange[0]);
            const healAmount = Math.round(state.monsterMaxHp * healPercent);
            state.monsterHp = Math.min(state.monsterMaxHp, state.monsterHp + healAmount);
            showEffect('monster', 'heal', healAmount);
            showRandomSpeech('monster', 'heal');
            createEffect('💚', 50, 50, 'success');
        }
    }
    
    // 공격 효과
    showAttackBeam('player', 'monster');
    shakeScreen(6, 400);
    enhanceMonsterHit();
    
    const isCritical = state.player.combo >= 5;
    showDamageNumber(
        finalDamage, 
        Math.random() * 30 + 35, 
        Math.random() * 30 + 35,
        defended ? '#6366f1' : (isCritical ? '#f59e0b' : '#ef4444'),
        isCritical
    );
    
    showRandomSpeech('player', 'hit');
    
    // 몬스터 낮은 체력 대사
    if (state.monsterHp < state.monsterMaxHp * 0.3) {
        showRandomSpeech('monster', 'lowHp');
        createPulseEffect(document.querySelector('.monster-health .inline-hp-bar-container'));
    } else if (!defended) {
        showRandomSpeech('monster', 'hit');
    }
    
    showEffect('monster', 'hit');
    showMessage(`${wordLength}글자 정답!`);
    playSound('correct');
    playSound('hit');
    vibrate(100);
    
    if (isCritical) {
        createEffect('💥', 50, 50, 'warning');
        createRippleEffect(50, 50, '#f59e0b');
        createSpinEffect(50, 50, 'warning');
    }
    
    updateHpDisplay();
    if (el.currentScore) el.currentScore.textContent = state.player.score.toLocaleString();
    if (el.comboStat) el.comboStat.textContent = state.player.combo;
    updateAccuracy();
    
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
    
    resetCombo();
    
    const damage = calculatePlayerDamage();
    state.player.hp = Math.max(0, state.player.hp - damage);
    
    showAttackBeam('monster', 'player');
    shakeScreen(8, 500);
    flashScreen('red', 300);
    enhancePlayerHit();
    
    showDamageNumber(
        damage,
        Math.random() * 30 + 35,
        Math.random() * 30 + 35,
        '#ef4444'
    );
    
    showEffect('player', 'wrong');
    showMessage('방어 실패!');
    showRandomSpeech('player', 'wrong');
    showRandomSpeech('monster', 'normal');
    playSound('wrong');
    playSound('damage');
    vibrate(150);
    createRippleEffect(50, 50, '#ef4444');
    
    updateHpDisplay();
    updateAccuracy();
    
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

function showComboEffect() {
    if (state.player.combo >= 3) {
        const text = `${state.player.combo} COMBO!`;
        showMessage(text);
        playSound('combo');
        vibrate([40, 20, 40]);
        createEffect('🔥', 50, 50, 'warning');
    }
}

// =================== 콤보 시스템 ===================
function resetCombo() {
    state.player.combo = 0;
    if (el.comboStat) el.comboStat.textContent = '0';
    state.stats.combos.push(0);
}

// =================== 물약 시스템 ===================
function usePotion() {
    if (!state.playing || state.paused || state.gameOver) return;
    if (state.player.potions <= 0) return;
    if (state.player.hp >= state.player.maxHp) {
        showMessage('체력이 이미 가득 찼습니다!');
        createTextShake(el.potionBtn);
        return;
    }
    
    state.player.potions--;
    const healAmount = CONFIG.POTION_HEAL;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
    
    showEffect('player', 'heal', healAmount);
    showMessage(`체력 +${healAmount} 회복!`);
    showRandomSpeech('player', 'heal');
    playSound('potion');
    vibrate([60, 30, 60]);
    createEffect('🧪', 50, 50, 'potion');
    createRippleEffect(50, 50, '#8b5cf6');
    createSpinEffect(50, 50, 'potion');
    
    updateHpDisplay();
    if (el.potionCount) el.potionCount.textContent = state.player.potions;
    if (el.potionBtn) el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
    
    setTimeout(() => {
        newQuestion();
    }, 800);
}

// =================== 몬스터 처치 ===================
function defeatMonster() {
    console.log(`🎉 몬스터 처치! (${state.monster.name})`);
    
    animateAvatar('monster', 'death');
    showRandomSpeech('monster', 'death');
    
    const stageBonus = state.stage * CONFIG.SCORE_STAGE;
    state.player.score += stageBonus;
    state.stats.cleared++;
    
    createEffect('💥', 50, 50, 'danger');
    createEffect('⭐', 50, 50, 'warning');
    createRippleEffect(50, 50, '#f59e0b');
    createSpinEffect(50, 50, 'warning');
    
    setTimeout(() => {
        state.stage++;
        
        if (state.stage > CONFIG.STAGES) {
            gameEnd(true);
        } else {
            spawnMonster(state.stage);
            newQuestion();
            
            playSound('victory');
            vibrate([80, 40, 80, 40, 80]);
            createEffect('🎊', 50, 30, 'warning');
            
            // 3단계마다 물약 획득
            if (state.stage % 3 === 0 && state.player.potions < CONFIG.POTION_COUNT) {
                state.player.potions++;
                if (el.potionCount) el.potionCount.textContent = state.player.potions;
                if (el.potionBtn) el.potionBtn.classList.remove('disabled');
                showMessage('물약 획득!');
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
    
    // 게임 데이터 준비
    const gameData = {
        nickname: userNickname || '익명',
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
        } else {
            // 로컬 저장
            saveRankingToLocal(gameData);
        }
    } catch (error) {
        console.error('랭킹 저장 실패:', error);
        saveRankingToLocal(gameData);
    }
    
    // 결과 화면 표시
    if (isWin) {
        if (el.finalScore) el.finalScore.textContent = state.player.score.toLocaleString();
        if (el.finalCombo) el.finalCombo.textContent = state.player.maxCombo;
        if (el.finalAccuracy) el.finalAccuracy.textContent = `${accuracy}%`;
        if (el.finalTime) el.finalTime.textContent = `${state.gameTime}초`;
        playSound('victory');
        vibrate([150, 80, 150, 80, 200]);
        createEffect('🎉', 50, 50, 'warning');
        createEffect('🏆', 50, 50, 'warning');
        createRippleEffect(50, 50, '#f59e0b');
        showScreen('win');
    } else {
        if (el.loseScore) el.loseScore.textContent = state.player.score.toLocaleString();
        if (el.loseCombo) el.loseCombo.textContent = state.player.maxCombo;
        if (el.loseStage) el.loseStage.textContent = `${state.stats.cleared}/${CONFIG.STAGES}`;
        if (el.loseMonsters) el.loseMonsters.textContent = `${CONFIG.STAGES - state.stats.cleared}마리`;
        playSound('wrong');
        vibrate([200, 100, 200]);
        createEffect('💀', 50, 50, 'danger');
        showScreen('lose');
    }
    
    console.log(`📊 통계: 점수:${state.player.score}, 정확도:${accuracy}%, 콤보:${state.player.maxCombo}`);
}

// =================== 일시정지 시스템 ===================
function togglePause() {
    if (!state.playing || state.gameOver) return;
    
    if (state.paused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

function pauseGame() {
    state.paused = true;
    
    if (el.pauseStage) el.pauseStage.textContent = `Lv.${state.stage}`;
    if (el.pauseScore) el.pauseScore.textContent = state.player.score.toLocaleString();
    if (el.pauseCombo) el.pauseCombo.textContent = state.player.combo;
    if (el.pausePotion) el.pausePotion.textContent = state.player.potions;
    
    showScreen('pause');
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
    if (el.currentScore) el.currentScore.textContent = state.player.score.toLocaleString();
    if (el.potionCount) el.potionCount.textContent = state.player.potions;
    if (el.potionBtn) el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
    updateAccuracy();
}

function updateHpDisplay() {
    const monsterPercent = (state.monsterHp / state.monsterMaxHp) * 100;
    const playerPercent = (state.player.hp / CONFIG.PLAYER_HP) * 100;
    
    // 컴팩트 체력바 업데이트
    if (el.compactMonsterHp) el.compactMonsterHp.style.width = `${monsterPercent}%`;
    if (el.compactMonsterHpText) el.compactMonsterHpText.textContent = Math.round(state.monsterHp);
    
    if (el.compactPlayerHp) el.compactPlayerHp.style.width = `${playerPercent}%`;
    if (el.compactPlayerHpText) el.compactPlayerHpText.textContent = Math.round(state.player.hp);
    
    // 인라인 체력바 업데이트
    if (el.inlineMonsterHp) el.inlineMonsterHp.style.width = `${monsterPercent}%`;
    if (el.inlineMonsterHpText) el.inlineMonsterHpText.textContent = `${Math.round(state.monsterHp)}/${state.monsterMaxHp}`;
    
    if (el.inlinePlayerHp) el.inlinePlayerHp.style.width = `${playerPercent}%`;
    if (el.inlinePlayerHpText) el.inlinePlayerHpText.textContent = `${Math.round(state.player.hp)}/${CONFIG.PLAYER_HP}`;
    
    // 체력바 색상 효과
    if (monsterPercent < 30) {
        createPulseEffect(document.querySelector('.monster-bar'));
    }
    if (playerPercent < 30) {
        createPulseEffect(document.querySelector('.player-bar'));
    }
    
    if (monsterPercent < 10) {
        if (el.compactMonsterHp) el.compactMonsterHp.style.animation = 'flashRed 1s infinite';
        if (el.inlineMonsterHp) el.inlineMonsterHp.style.animation = 'flashRed 1s infinite';
    } else {
        if (el.compactMonsterHp) el.compactMonsterHp.style.animation = '';
        if (el.inlineMonsterHp) el.inlineMonsterHp.style.animation = '';
    }
    
    if (playerPercent < 10) {
        if (el.compactPlayerHp) el.compactPlayerHp.style.animation = 'flashGreen 1s infinite';
        if (el.inlinePlayerHp) el.inlinePlayerHp.style.animation = 'flashGreen 1s infinite';
    } else {
        if (el.compactPlayerHp) el.compactPlayerHp.style.animation = '';
        if (el.inlinePlayerHp) el.inlinePlayerHp.style.animation = '';
    }
}

function updateAccuracy() {
    const accuracy = state.stats.total > 0 ? 
        Math.round((state.stats.correct / state.stats.total) * 100) : 100;
    if (el.accuracyStat) el.accuracyStat.textContent = `${accuracy}%`;
}

// =================== 랭킹 시스템 ===================
async function loadRankings(type = 'score') {
    try {
        if (typeof window.isFirebaseReady === 'function' && window.isFirebaseReady()) {
            const rankings = await window.loadRankingsFromFirebase(type, 50);
            return rankings;
        }
        
        // 로컬 랭킹
        const localRankings = JSON.parse(localStorage.getItem('kjd_local_rankings') || '[]');
        return localRankings.sort((a, b) => b[type] - a[type]).slice(0, 50);
        
    } catch (error) {
        console.error('❌ 랭킹 로드 실패:', error);
        const localRankings = JSON.parse(localStorage.getItem('kjd_local_rankings') || '[]');
        return localRankings.sort((a, b) => b[type] - a[type]).slice(0, 50);
    }
}

async function showRankingScreen(type = 'score') {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;
    
    rankingList.innerHTML = `
        <div class="loading-rankings">
            <i class="fas fa-spinner fa-spin"></i> 랭킹 로딩 중...
        </div>
    `;
    
    showScreen('ranking');
    
    // 탭 활성화
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
    const myRanking = document.getElementById('myRanking');
    
    if (!rankingList) return;
    
    try {
        const rankings = await loadRankings(type);
        
        if (rankings.length === 0) {
            rankingList.innerHTML = `
                <div class="no-rankings">
                    <i class="fas fa-trophy"></i>
                    <p>랭킹 데이터가 없습니다</p>
                    <p class="sub">게임을 플레이하면 랭킹에 등록됩니다!</p>
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
                            <div class="rank-stat">
                                <i class="fas fa-${type === 'score' ? 'star' : type === 'stage' ? 'gamepad' : 'fire'}"></i>
                                ${typeValue}
                            </div>
                            <div class="rank-stat">
                                <i class="fas fa-check-circle"></i>
                                정확도: ${rank.accuracy || 0}%
                            </div>
                            <div class="rank-stat">
                                <i class="fas fa-clock"></i>
                                ${Math.floor((rank.gameTime || 0) / 60)}분
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        rankingList.innerHTML = rankingItems;
        
        // 내 랭킹 정보 표시
        if (myRanking) {
            const myRankData = uniqueRankings.find(rank => rank.deviceId === myDeviceId);
            const myRankIndex = uniqueRankings.findIndex(rank => rank.deviceId === myDeviceId);
            
            if (myRankData) {
                let typeValue = '';
                switch(type) {
                    case 'score': typeValue = myRankData.score.toLocaleString() + '점'; break;
                    case 'stage': typeValue = myRankData.stage + '단계'; break;
                    case 'combo': typeValue = myRankData.maxCombo + '콤보'; break;
                }
                
                myRanking.innerHTML = `
                    <div class="my-ranking-header">내 랭킹 (${myRankIndex + 1}위)</div>
                    <div class="my-ranking-info">
                        <div class="my-rank-position">${myRankIndex + 1}</div>
                        <div class="my-rank-details">
                            <div class="my-rank-name">${myRankData.nickname}</div>
                            <div class="my-rank-score">${typeValue} • 정확도: ${myRankData.accuracy || 0}% • ${Math.floor((myRankData.gameTime || 0) / 60)}분</div>
                        </div>
                    </div>
                `;
            } else {
                myRanking.innerHTML = `
                    <div class="my-ranking-header">내 랭킹</div>
                    <div class="my-ranking-info">
                        <div class="my-rank-details">
                            <div class="my-rank-name">${userNickname || '익명'}</div>
                            <div class="my-rank-score">아직 랭킹에 등록되지 않았습니다</div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Firebase 이벤트
        if (window.logGameEvent) {
            window.logGameEvent('ranking_viewed', {
                ranking_type: type,
                ranking_count: rankings.length
            });
        }
        
    } catch (error) {
        console.error('랭킹 렌더링 실패:', error);
        rankingList.innerHTML = `
            <div class="no-rankings">
                <i class="fas fa-exclamation-triangle"></i>
                <p>랭킹을 불러오는데 실패했습니다</p>
                <p class="sub">인터넷 연결을 확인해주세요</p>
            </div>
        `;
    }
}

function refreshRankings() {
    const activeTab = document.querySelector('.ranking-tab.active');
    const type = activeTab ? activeTab.dataset.type : 'score';
    renderRankings(type);
}

function saveRankingToLocal(data) {
    const localRankings = JSON.parse(localStorage.getItem('kjd_local_rankings') || '[]');
    localRankings.push(data);
    
    // 최대 50개만 저장
    if (localRankings.length > 50) {
        localRankings.splice(0, localRankings.length - 50);
    }
    
    localStorage.setItem('kjd_local_rankings', JSON.stringify(localRankings));
    console.log('📊 로컬 랭킹 저장 완료');
}

// =================== DOM 로드 시 초기화 ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚔️ 권지단 어휘대전 - 완전한 버전 로딩...');
    
    // 페이지 로드 시 닉네임 확인
    setTimeout(() => {
        const savedNickname = localStorage.getItem(NICKNAME_KEY);
        const savedDeviceId = localStorage.getItem(DEVICE_ID_KEY);
        
        if (!savedNickname || !savedDeviceId) {
            // 닉네임이 없으면 닉네임 화면 표시
            const startScreen = document.querySelector('.start-screen');
            const nicknameScreen = document.querySelector('.nickname-screen');
            
            if (startScreen && nicknameScreen) {
                startScreen.classList.remove('active');
                nicknameScreen.classList.add('active');
            }
        }
    }, 500);
    
    init();
});

// =================== 전역 함수 노출 ===================
// HTML에서 직접 호출되는 함수들
window.checkAnswer = checkAnswer;
window.usePotion = usePotion;
window.startGame = startGame;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.restartGame = restartGame;
window.showRankingScreen = showRankingScreen;
window.gameState = state;
// game.js - 권지단 어휘대전 고밀도 최적화 버전

document.addEventListener('DOMContentLoaded', function() {
    console.log('⚔️ 권지단 어휘대전 로딩...');

    // =================== 게임 설정 ===================
    const CONFIG = {
        STAGES: 10,
        TIME_LIMIT: 10,
        PLAYER_HP: 100,
        MONSTER_BASE_HP: 100,
        
        // 데미지 시스템
        BASE_DAMAGE: 25,
        TIME_BONUS: 5,
        COMBO_MULTIPLIER: [1.0, 1.4, 1.9, 2.5, 3.2, 4.0, 4.9, 5.9, 7.0, 8.2],
        
        // 몬스터 능력
        DEFENSE_CHANCE: [0, 0, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55],
        HEAL_CHANCE: [0, 0, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5],
        HEAL_PERCENT: [0.1, 0.25],
        
        // 점수 시스템
        SCORE_BASE: 200,
        SCORE_TIME: 20,
        SCORE_COMBO: 100,
        SCORE_STAGE: 1500,
        
        // 콤보 시스템
        COMBO_THRESHOLDS: [3, 5, 8, 12],
        COMBO_MULTIPLIERS: [1.8, 2.4, 3.1, 4.0],
        
        // 물약 시스템
        POTION_HEAL: 30,
        POTION_COUNT: 3
    };

    // =================== 게임 상태 ===================
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

    // =================== 몬스터 데이터 ===================
    const MONSTERS = [
        { level: 1, emoji: "😈", name: "초급 몬스터", hp: 80, color: "#6366f1", attack: 10 },
        { level: 2, emoji: "👻", name: "유령 몬스터", hp: 110, color: "#8b5cf6", attack: 15 },
        { level: 3, emoji: "🤖", name: "로봇 몬스터", hp: 150, color: "#06b6d4", attack: 20 },
        { level: 4, emoji: "👹", name: "오니 몬스터", hp: 200, color: "#ef4444", attack: 25 },
        { level: 5, emoji: "🐉", name: "드래곤", hp: 260, color: "#f59e0b", attack: 30 },
        { level: 6, emoji: "🦄", name: "유니콘", hp: 330, color: "#ec4899", attack: 36 },
        { level: 7, emoji: "🧌", name: "트롤", hp: 410, color: "#10b981", attack: 42 },
        { level: 8, emoji: "🧟", name: "좀비", hp: 500, color: "#84cc16", attack: 48 },
        { level: 9, emoji: "👽", name: "에일리언", hp: 600, color: "#06b6d4", attack: 54 },
        { level: 10, emoji: "🔥", name: "파이널 보스", hp: 700, color: "#f97316", attack: 60 }
    ];

    // =================== 몬스터 대사 ===================
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
            "아프다! 하지만 포기하지 않겠어!",
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

    // =================== DOM 요소 ===================
    const el = {
        // 입력
        input: document.getElementById('wordInput'),
        charCount: document.getElementById('charCount'),
        clearBtn: document.getElementById('clearBtn'),
        submitBtn: document.getElementById('submitBtn'),
        potionBtn: document.getElementById('potionBtn'),
        potionCount: document.getElementById('potionCount'),
        
        // 대결 화면
        monsterAvatar: document.getElementById('monsterAvatar'),
        playerAvatar: document.getElementById('playerAvatar'),
        monsterEffect: document.getElementById('monsterEffect'),
        playerEffect: document.getElementById('playerEffect'),
        battleMessage: document.getElementById('battleMessage'),
        monsterSpeech: document.getElementById('monsterSpeech'),
        
        // HP 바
        monsterHpFill: document.querySelector('.monster-side .hp-fill'),
        monsterHpText: document.querySelector('.monster-side .hp-text'),
        playerHpFill: document.querySelector('.player-side .hp-fill'),
        playerHpText: document.querySelector('.player-side .hp-text'),
        
        // 스탯
        stageValue: document.querySelector('.stage-value'),
        scoreValue: document.querySelector('.score-value'),
        comboValue: document.getElementById('comboValue'),
        recordValue: document.getElementById('recordValue'),
        accuracyValue: document.getElementById('accuracyValue'),
        timeLeftValue: document.getElementById('timeLeft'),
        
        // 문제
        initialText: document.getElementById('initialText'),
        meaningText: document.getElementById('meaningText'),
        timeFill: document.querySelector('.time-fill'),
        timeLabel: document.getElementById('timeLabel'),
        
        // 사운드
        soundCorrect: document.getElementById('soundCorrect'),
        soundWrong: document.getElementById('soundWrong'),
        soundDamage: document.getElementById('soundDamage'),
        soundMonsterHit: document.getElementById('soundMonsterHit'),
        soundLevelUp: document.getElementById('soundLevelUp'),
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
        
        // 결과
        finalScore: document.getElementById('finalScore'),
        highestCombo: document.getElementById('highestCombo'),
        finalAccuracy: document.getElementById('finalAccuracy'),
        clearTime: document.getElementById('clearTime'),
        finalScoreLose: document.getElementById('finalScoreLose'),
        highestComboLose: document.getElementById('highestComboLose'),
        clearedStages: document.getElementById('clearedStages'),
        remainingMonsters: document.getElementById('remainingMonsters'),
        currentStageStat: document.getElementById('currentStageStat'),
        currentScoreStat: document.getElementById('currentScoreStat'),
        currentComboStat: document.getElementById('currentComboStat'),
        currentPotionStat: document.getElementById('currentPotionStat')
    };

    // =================== 게임 초기화 ===================
    async function init() {
        console.log('게임 초기화 시작...');
        
        await loadWords();
        setupEvents();
        adjustLayout();
        showScreen('start');
        
        console.log('게임 준비 완료');
    }

    async function loadWords() {
        try {
            const response = await fetch('words.json');
            const data = await response.json();
            state.words = data.words;
            console.log(`📚 ${state.words.length}개 단어 로드됨`);
        } catch (err) {
            console.error('❌ 단어 로드 실패:', err);
            state.words = getDefaultWords();
        }
    }

    function getDefaultWords() {
        return [
            { word: "감염", hint: "ㄱㅇ", meaning: "병원체가 몸속에 들어와 번식하는 것", difficulty: 1 },
            { word: "모순", hint: "ㅁㅅ", meaning: "서로 맞지 않아 서로 어긋나는 상태", difficulty: 1 },
            { word: "통찰", hint: "ㅌㅊ", meaning: "사물의 이치나 내용을 꿰뚫어 봄", difficulty: 2 },
            { word: "절제", hint: "ㅈㅈ", meaning: "감정이나 욕망을 적당히 제한함", difficulty: 2 },
            { word: "개념", hint: "ㄱㄴ", meaning: "사물에 대한 보편적인 생각이나 관념", difficulty: 1 },
            { word: "가설", hint: "ㄱㅅ", meaning: "아직 증명되지 않은 잠정적인 주장", difficulty: 2 },
            { word: "담보", hint: "ㄷㅂ", meaning: "채무이행을 확보하기 위한 보증", difficulty: 3 },
            { word: "법칙", hint: "ㅂㅈ", meaning: "변하지 않고 꼭 지켜야 하는 규범", difficulty: 2 }
        ];
    }

    function setupEvents() {
        // 버튼 이벤트
        el.startBtn.addEventListener('click', startGame);
        el.pauseBtn.addEventListener('click', togglePause);
        el.resumeBtn.addEventListener('click', resumeGame);
        el.restartBtn.addEventListener('click', restartGame);
        el.restartFromLoseBtn.addEventListener('click', restartGame);
        el.playAgainBtn.addEventListener('click', restartGame);
        
        // 입력 이벤트
        el.input.addEventListener('input', handleInput);
        el.input.addEventListener('keydown', handleKeyDown);
        el.clearBtn.addEventListener('click', clearInput);
        el.submitBtn.addEventListener('click', checkAnswer);
        el.potionBtn.addEventListener('click', usePotion);
        
        // 사운드 초기화
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });
        
        // 화면 조정
        window.addEventListener('resize', adjustLayout);
    }

    function adjustLayout() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // 키보드 감지
        if (window.innerHeight < window.outerHeight) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
    }

    // =================== 게임 시작 ===================
    function startGame() {
        console.log('⚔️ 대결 시작!');
        
        resetState();
        spawnMonster(1);
        newQuestion();
        updateUI();
        showScreen('game');
        startTimer();
        
        // 몬스터 대사
        showMonsterSpeech('normal');
        
        // 입력 포커스
        setTimeout(() => {
            el.input.focus();
            el.input.value = '';
            el.charCount.textContent = '0';
        }, 300);
        
        // 시작 이펙트
        vibrate([80, 40, 80]);
        createEffect('⚔️', 50, 50, 'primary');
    }

    function resetState() {
        state.playing = true;
        state.paused = false;
        state.gameOver = false;
        state.victory = false;
        state.stage = 1;
        
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

    // =================== 몬스터 생성 ===================
    function spawnMonster(level) {
        const monster = MONSTERS[level - 1];
        state.monster = monster;
        state.monsterHp = monster.hp;
        state.monsterMaxHp = monster.hp;
        
        // UI 업데이트
        const monsterName = document.querySelector('.monster-side .name-text');
        if (monsterName) {
            monsterName.textContent = monster.name;
        }
        
        const monsterLevel = document.querySelector('.monster-side .level-badge');
        if (monsterLevel) {
            monsterLevel.textContent = `Lv.${level}`;
        }
        
        el.monsterAvatar.textContent = monster.emoji;
        el.stageValue.textContent = level;
        
        // HP 바
        updateHpBar(el.monsterHpFill, state.monsterHp, state.monsterMaxHp);
        el.monsterHpText.textContent = state.monsterHp;
        
        // 등장 이펙트
        animateAvatar('monster', 'appear');
        if (level > 1) {
            playSound('levelUp');
            vibrate([80, 40, 80]);
            createEffect('⭐', 30, 50, 'warning');
        }
        
        console.log(`🐉 몬스터 생성: ${monster.name} HP:${monster.hp}`);
    }

    // =================== 몬스터 대사 ===================
    function showMonsterSpeech(type) {
        const dialogues = MONSTER_DIALOGUES[type];
        if (!dialogues) return;
        
        const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        el.monsterSpeech.textContent = randomDialogue;
        el.monsterSpeech.classList.add('active');
        
        setTimeout(() => {
            el.monsterSpeech.classList.remove('active');
        }, 2500);
    }

    // =================== 문제 시스템 ===================
    function newQuestion() {
        if (state.words.length === 0) {
            console.error('❌ 단어 데이터 없음');
            return;
        }
        
        // 난이도 필터
        const difficulty = Math.min(3, Math.ceil(state.stage / 3));
        const available = state.words.filter(w => w.difficulty <= difficulty);
        
        // 중복 방지
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
        el.initialText.textContent = state.currentWord.hint;
        el.meaningText.textContent = state.currentWord.meaning;
        el.input.value = '';
        el.input.focus();
        el.charCount.textContent = '0';
        
        // 시간 초기화
        state.timeLeft = CONFIG.TIME_LIMIT;
        updateTimeBar();
        
        console.log(`📝 문제: ${state.currentWord.word} (${state.currentWord.hint})`);
    }

    // =================== 타이머 ===================
    function startTimer() {
        if (state.timer) clearInterval(state.timer);
        
        state.timer = setInterval(() => {
            if (!state.playing || state.paused || state.gameOver) return;
            
            // 게임 시간
            state.gameTime = Math.floor((Date.now() - state.startTime) / 1000);
            
            // 문제 시간
            state.timeLeft--;
            updateTimeBar();
            
            // 시간 초과
            if (state.timeLeft <= 0) {
                timeOut();
            }
        }, 1000);
    }

    function updateTimeBar() {
        const percent = (state.timeLeft / CONFIG.TIME_LIMIT) * 100;
        el.timeFill.style.width = `${percent}%`;
        el.timeLabel.textContent = `${state.timeLeft}초`;
        el.timeLeftValue.textContent = state.timeLeft;
        
        // 색상 업데이트
        el.timeFill.style.background = 'var(--gradient-success)';
        if (state.timeLeft <= 3) {
            el.timeFill.style.background = 'var(--gradient-danger)';
            el.timeLabel.classList.add('critical');
            el.timeLeftValue.classList.add('critical');
        } else if (state.timeLeft <= 5) {
            el.timeFill.style.background = 'var(--gradient-warning)';
            el.timeLabel.classList.add('warning');
            el.timeLeftValue.classList.add('warning');
        } else {
            el.timeLabel.classList.remove('critical', 'warning');
            el.timeLeftValue.classList.remove('critical', 'warning');
        }
    }

    function timeOut() {
        console.log('⏰ 시간 초과!');
        
        state.stats.total++;
        resetCombo();
        
        const damage = calculatePlayerDamage();
        state.player.hp = Math.max(0, state.player.hp - damage);
        
        // 이펙트
        showEffect('player', 'wrong');
        showMessage('시간 초과!');
        showMonsterSpeech('normal');
        playSound('wrong');
        playSound('damage');
        vibrate(150);
        createEffect('⏰', 50, 50, 'danger');
        
        // UI 업데이트
        updateHpBar(el.playerHpFill, state.player.hp, CONFIG.PLAYER_HP);
        el.playerHpText.textContent = state.player.hp;
        updateAccuracy();
        
        // 게임 오버 체크
        if (state.player.hp <= 0) {
            gameEnd(false);
            return;
        }
        
        // 다음 문제
        setTimeout(() => {
            newQuestion();
        }, 800);
    }

    // =================== 입력 처리 ===================
    function handleInput(e) {
        if (!state.playing || state.paused || state.gameOver) return;
        
        let text = e.target.value;
        
        // 한글만 허용
        text = text.replace(/[^가-힣ㄱ-ㅎ]/g, '');
        
        // 2글자 제한
        if (text.length > 2) {
            text = text.slice(0, 2);
        }
        
        // 업데이트
        state.input = text;
        el.input.value = text;
        el.charCount.textContent = text.length;
    }

    function handleKeyDown(e) {
        if (!state.playing || state.paused || state.gameOver) return;
        
        if (e.key === 'Enter') {
            e.preventDefault();
            if (state.input.length === 2) {
                checkAnswer();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            togglePause();
        }
    }

    function clearInput() {
        el.input.value = '';
        state.input = '';
        el.charCount.textContent = '0';
        el.input.focus();
    }

    // =================== 정답 확인 ===================
    function checkAnswer() {
        if (!state.currentWord || state.input.length !== 2) {
            if (state.input.length < 2) {
                showMessage('2글자를 입력하세요!');
            }
            return;
        }
        
        state.stats.total++;
        const time = (Date.now() - state.questionTime) / 1000;
        
        if (state.input === state.currentWord.word) {
            correct(time);
        } else {
            wrong(time);
        }
        
        // 입력 초기화
        el.input.value = '';
        state.input = '';
        el.charCount.textContent = '0';
        el.input.focus();
    }

    function correct(time) {
        console.log('✅ 정답!');
        
        state.stats.correct++;
        state.player.fastTime = Math.min(state.player.fastTime, time);
        
        // 콤보 증가
        state.player.combo++;
        state.player.maxCombo = Math.max(state.player.maxCombo, state.player.combo);
        
        // 콤보 이펙트
        if (state.player.combo >= 3) {
            showComboEffect();
        }
        
        // 점수 계산
        const timeBonus = Math.max(0, CONFIG.TIME_LIMIT - time) * CONFIG.SCORE_TIME;
        const comboBonus = state.player.combo * CONFIG.SCORE_COMBO;
        const baseScore = CONFIG.SCORE_BASE;
        
        state.player.score += baseScore + timeBonus + comboBonus;
        
        // 데미지 계산
        const damage = calculateDamage(time);
        state.stats.damages.push(damage);
        
        // 방어 체크
        let finalDamage = damage;
        let defended = false;
        
        if (state.stage >= 3) {
            const defenseChance = CONFIG.DEFENSE_CHANCE[state.stage - 1];
            if (Math.random() < defenseChance) {
                finalDamage = Math.round(damage * 0.5);
                defended = true;
                showEffect('monster', 'defense');
                showMonsterSpeech('defense');
            }
        }
        
        // 데미지 적용
        state.monsterHp = Math.max(0, state.monsterHp - finalDamage);
        
        // 회복 체크
        if (state.stage >= 3 && state.monsterHp > 0) {
            const healChance = CONFIG.HEAL_CHANCE[state.stage - 1];
            if (Math.random() < healChance) {
                const healRange = CONFIG.HEAL_PERCENT;
                const healPercent = healRange[0] + Math.random() * (healRange[1] - healRange[0]);
                const healAmount = Math.round(state.monsterMaxHp * healPercent);
                state.monsterHp = Math.min(state.monsterMaxHp, state.monsterHp + healAmount);
                showEffect('monster', 'heal', healAmount);
                showMonsterSpeech('heal');
            }
        }
        
        // 낮은 체력 대사
        if (state.monsterHp < state.monsterMaxHp * 0.3) {
            showMonsterSpeech('lowHp');
        } else {
            showMonsterSpeech('hit');
        }
        
        // 이펙트
        showEffect('monster', 'hit');
        showDamage(finalDamage, defended);
        showMessage('공격 성공!');
        playSound('correct');
        playSound('monsterHit');
        vibrate(80);
        
        // UI 업데이트
        updateHpBar(el.monsterHpFill, state.monsterHp, state.monsterMaxHp);
        el.monsterHpText.textContent = state.monsterHp;
        el.scoreValue.textContent = state.player.score.toLocaleString();
        el.comboValue.textContent = state.player.combo;
        el.recordValue.textContent = state.player.maxCombo;
        updateAccuracy();
        
        // 몬스터 피격
        animateAvatar('monster', 'hit');
        
        // 몬스터 처치 체크
        if (state.monsterHp <= 0) {
            defeatMonster();
            return;
        }
        
        // 다음 문제
        setTimeout(() => {
            newQuestion();
        }, 800);
    }

    function wrong(time) {
        console.log('❌ 오답!');
        
        resetCombo();
        
        const damage = calculatePlayerDamage();
        state.player.hp = Math.max(0, state.player.hp - damage);
        
        // 이펙트
        showEffect('player', 'wrong');
        showMessage('방어 실패!');
        showMonsterSpeech('normal');
        playSound('wrong');
        playSound('damage');
        vibrate(120);
        
        // UI 업데이트
        updateHpBar(el.playerHpFill, state.player.hp, CONFIG.PLAYER_HP);
        el.playerHpText.textContent = state.player.hp;
        updateAccuracy();
        
        // 게임 오버 체크
        if (state.player.hp <= 0) {
            gameEnd(false);
            return;
        }
        
        // 다음 문제
        setTimeout(() => {
            newQuestion();
        }, 800);
    }

    // =================== 물약 시스템 ===================
    function usePotion() {
        if (!state.playing || state.paused || state.gameOver) return;
        if (state.player.potions <= 0) return;
        if (state.player.hp >= state.player.maxHp) {
            showMessage('체력이 이미 가득 찼습니다!');
            return;
        }
        
        state.player.potions--;
        const healAmount = CONFIG.POTION_HEAL;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
        
        // 이펙트
        showEffect('player', 'heal', healAmount);
        showMessage(`체력 +${healAmount} 회복!`);
        playSound('potion');
        vibrate([60, 30, 60]);
        createEffect('🧪', 50, 50, 'potion');
        
        // UI 업데이트
        updateHpBar(el.playerHpFill, state.player.hp, CONFIG.PLAYER_HP);
        el.playerHpText.textContent = state.player.hp;
        el.potionCount.textContent = state.player.potions;
        el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
        
        // 다음 문제
        setTimeout(() => {
            newQuestion();
        }, 800);
    }

    // =================== 데미지 계산 ===================
    function calculateDamage(time) {
        const base = CONFIG.BASE_DAMAGE;
        const timeBonus = Math.max(0, CONFIG.TIME_LIMIT - time) * CONFIG.TIME_BONUS;
        
        // 콤보 배율
        let comboMulti = 1.0;
        for (let i = 0; i < CONFIG.COMBO_THRESHOLDS.length; i++) {
            if (state.player.combo >= CONFIG.COMBO_THRESHOLDS[i]) {
                comboMulti = CONFIG.COMBO_MULTIPLIERS[i];
            }
        }
        
        // 추가 콤보 배율
        const comboIdx = Math.min(state.player.combo - 1, CONFIG.COMBO_MULTIPLIER.length - 1);
        const extraMulti = CONFIG.COMBO_MULTIPLIER[Math.max(0, comboIdx)];
        
        let damage = (base + timeBonus) * comboMulti * extraMulti;
        
        // 스테이지 보정
        const stageMulti = 0.9 + (state.stage * 0.05);
        damage *= stageMulti;
        
        return Math.round(damage);
    }

    function calculatePlayerDamage() {
        const base = 15;
        const stageMulti = 0.9 + (state.stage * 0.05);
        
        let damage = base * stageMulti;
        
        // 콤보 보너스 데미지
        if (state.player.combo >= 5) {
            damage *= (1 + (state.player.combo * 0.1));
        }
        
        return Math.round(damage);
    }

    // =================== 콤보 시스템 ===================
    function resetCombo() {
        state.player.combo = 0;
        el.comboValue.textContent = '0';
        state.stats.combos.push(0);
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

    // =================== 몬스터 처치 ===================
    function defeatMonster() {
        console.log(`🎉 몬스터 처치! (${state.monster.name})`);
        
        // 사망 애니메이션
        animateAvatar('monster', 'death');
        showMonsterSpeech('death');
        
        // 스테이지 보너스
        const stageBonus = state.stage * CONFIG.SCORE_STAGE;
        state.player.score += stageBonus;
        state.stats.cleared++;
        
        // 다음 스테이지
        setTimeout(() => {
            state.stage++;
            
            if (state.stage > CONFIG.STAGES) {
                gameEnd(true);
            } else {
                spawnMonster(state.stage);
                newQuestion();
                
                // 레벨업 이펙트
                playSound('levelUp');
                vibrate([80, 40, 80, 40, 80]);
                createEffect('⭐', 50, 30, 'warning');
                
                // 물약 보상 (스테이지 클리어 시 1개)
                if (state.stage % 2 === 0 && state.player.potions < CONFIG.POTION_COUNT) {
                    state.player.potions++;
                    el.potionCount.textContent = state.player.potions;
                    el.potionBtn.classList.remove('disabled');
                    showMessage('물약 획득!');
                }
            }
        }, 1200);
    }

    // =================== 게임 종료 ===================
    function gameEnd(isWin) {
        console.log(isWin ? '🏆 승리!' : '💀 패배!');
        
        state.playing = false;
        state.gameOver = true;
        state.victory = isWin;
        
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
        
        // 결과 계산
        const accuracy = state.stats.total > 0 ? 
            Math.round((state.stats.correct / state.stats.total) * 100) : 0;
        
        const avgDamage = state.stats.damages.length > 0 ?
            Math.round(state.stats.damages.reduce((a, b) => a + b, 0) / state.stats.damages.length) : 0;
        
        // 결과 화면 업데이트
        if (isWin) {
            el.finalScore.textContent = state.player.score.toLocaleString();
            el.highestCombo.textContent = state.player.maxCombo;
            el.finalAccuracy.textContent = `${accuracy}%`;
            el.clearTime.textContent = `${state.gameTime}초`;
            playSound('victory');
            vibrate([150, 80, 150, 80, 200]);
            createEffect('🎉', 50, 50, 'warning');
            showScreen('win');
        } else {
            el.finalScoreLose.textContent = state.player.score.toLocaleString();
            el.highestComboLose.textContent = state.player.maxCombo;
            el.clearedStages.textContent = `${state.stats.cleared}/${CONFIG.STAGES}`;
            el.remainingMonsters.textContent = `${CONFIG.STAGES - state.stats.cleared}마리`;
            playSound('wrong');
            vibrate([200, 100, 200]);
            showScreen('lose');
        }
        
        console.log(`📊 통계: 점수:${state.player.score}, 정확도:${accuracy}%, 콤보:${state.player.maxCombo}`);
    }

    // =================== 일시정지 ===================
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
        
        // 일시정지 화면 업데이트
        el.currentStageStat.textContent = `Lv.${state.stage}`;
        el.currentScoreStat.textContent = `${state.player.score}점`;
        el.currentComboStat.textContent = `${state.player.combo}콤보`;
        el.currentPotionStat.textContent = `${state.player.potions}개`;
        
        const accuracy = state.stats.total > 0 ? 
            Math.round((state.stats.correct / state.stats.total) * 100) : 100;
            
        showScreen('pause');
    }

    function resumeGame() {
        state.paused = false;
        showScreen('game');
        
        setTimeout(() => {
            el.input.focus();
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
        // HP 바
        updateHpBar(el.playerHpFill, state.player.hp, CONFIG.PLAYER_HP);
        el.playerHpText.textContent = state.player.hp;
        
        // 점수
        el.scoreValue.textContent = state.player.score.toLocaleString();
        el.recordValue.textContent = state.player.maxCombo;
        el.potionCount.textContent = state.player.potions;
        el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
        updateAccuracy();
    }

    function updateHpBar(bar, current, max) {
        const percent = (current / max) * 100;
        bar.style.width = `${percent}%`;
        
        // 색상 업데이트
        if (percent > 50) {
            bar.style.background = "var(--gradient-success)";
        } else if (percent > 20) {
            bar.style.background = "var(--gradient-warning)";
        } else {
            bar.style.background = "var(--gradient-danger)";
            bar.parentElement.classList.add('critical');
        }
    }

    function updateAccuracy() {
        const accuracy = state.stats.total > 0 ? 
            Math.round((state.stats.correct / state.stats.total) * 100) : 100;
        el.accuracyValue.textContent = `${accuracy}%`;
    }

    // =================== 애니메이션 & 이펙트 ===================
    function animateAvatar(type, action) {
        const avatar = type === 'monster' ? el.monsterAvatar : el.playerAvatar;
        
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

    function showEffect(target, type, amount = 0) {
        const effect = target === 'monster' ? el.monsterEffect : el.playerEffect;
        
        effect.style.animation = 'none';
        
        switch(type) {
            case 'hit':
                effect.textContent = '💥';
                effect.style.color = 'var(--danger)';
                break;
            case 'wrong':
                effect.textContent = '❌';
                effect.style.color = 'var(--danger)';
                break;
            case 'defense':
                effect.textContent = '🛡️';
                effect.style.color = 'var(--primary)';
                break;
            case 'heal':
                effect.textContent = `+${amount}💚`;
                effect.style.color = 'var(--success)';
                break;
        }
        
        effect.style.display = 'block';
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        
        setTimeout(() => {
            effect.style.animation = 'hitEffect 0.8s ease-out forwards';
            setTimeout(() => {
                effect.style.display = 'none';
            }, 800);
        }, 10);
    }

    function showDamage(amount, defended = false) {
        const layer = document.querySelector('.damage-layer');
        if (!layer) return;
        
        const popup = document.createElement('div');
        popup.className = 'damage-popup';
        popup.textContent = defended ? `-${amount}🛡️` : `-${amount}`;
        popup.style.color = defended ? 'var(--primary)' : 'var(--danger)';
        popup.style.left = `${Math.random() * 30 + 35}%`;
        popup.style.top = `${Math.random() * 30 + 35}%`;
        popup.style.position = 'absolute';
        popup.style.fontSize = 'var(--font-2xl)';
        popup.style.fontWeight = '700';
        popup.style.textShadow = '0 2px 6px rgba(0,0,0,0.4)';
        popup.style.animation = 'damagePop 1s ease-out forwards';
        popup.style.pointerEvents = 'none';
        popup.style.zIndex = '10';
        
        layer.appendChild(popup);
        
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }

    function showMessage(text) {
        el.battleMessage.textContent = text;
        el.battleMessage.style.animation = 'none';
        
        setTimeout(() => {
            el.battleMessage.style.animation = 'textPop 1.2s ease-out forwards';
            setTimeout(() => {
                el.battleMessage.style.opacity = '0';
            }, 1200);
        }, 10);
    }

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
            case 'primary':
                effect.style.color = 'var(--primary)';
                effect.style.textShadow = '0 0 15px rgba(99,102,241,0.5)';
                break;
            case 'danger':
                effect.style.color = 'var(--danger)';
                effect.style.textShadow = '0 0 15px rgba(239,68,68,0.5)';
                break;
            case 'warning':
                effect.style.color = 'var(--warning)';
                effect.style.textShadow = '0 0 15px rgba(245,158,11,0.5)';
                break;
            case 'success':
                effect.style.color = 'var(--success)';
                effect.style.textShadow = '0 0 15px rgba(16,185,129,0.5)';
                break;
            case 'potion':
                effect.style.color = 'var(--potion)';
                effect.style.textShadow = '0 0 15px rgba(139,92,246,0.5)';
                break;
        }
        
        layer.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 800);
    }

    // =================== 사운드 & 진동 ===================
    function initAudio() {
        try {
            const sounds = [
                el.soundCorrect,
                el.soundWrong,
                el.soundDamage,
                el.soundMonsterHit,
                el.soundLevelUp,
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
        } catch (err) {
            console.log('🔇 사운드 초기화 실패');
        }
    }

    function playSound(type) {
        try {
            const soundMap = {
                'correct': el.soundCorrect,
                'wrong': el.soundWrong,
                'damage': el.soundDamage,
                'monsterHit': el.soundMonsterHit,
                'levelUp': el.soundLevelUp,
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
            // 사운드 에러 무시
        }
    }

    function vibrate(pattern) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (err) {}
        }
    }

    // =================== 화면 관리 ===================
    function showScreen(screen) {
        // 모든 오버레이 숨기기
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
        
        // 게임 화면 요소들
        const gameElements = [
            document.querySelector('.battle-stage'),
            document.querySelector('.quick-stats'),
            document.querySelector('.problem-card'),
            document.querySelector('.input-interface')
        ];
        
        if (screen === 'game') {
            // 게임 화면 표시
            gameElements.forEach(el => {
                if (el) el.style.display = '';
            });
            el.pauseBtn.style.display = 'block';
        } else {
            // 오버레이 표시
            gameElements.forEach(el => {
                if (el) el.style.display = 'none';
            });
            el.pauseBtn.style.display = 'none';
            
            const target = document.querySelector(`.${screen}-screen`);
            if (target) {
                target.classList.add('active');
            }
        }
    }

    // =================== 게임 초기화 실행 ===================
    init();

    // =================== 전역 변수 ===================
    window.gameState = state;
    window.GAME_CONFIG = CONFIG;
    window.checkAnswer = checkAnswer;
    window.usePotion = usePotion;
    window.startGame = startGame;
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.restartGame = restartGame;

    console.log('🎮 게임 로딩 완료!');
});

// =================== CSS 애니메이션 추가 ===================
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .dynamic-effect {
            position: absolute;
            z-index: 999;
            pointer-events: none;
            transform: translate(-50%, -50%);
        }
        
        .damage-popup {
            position: absolute;
            z-index: 10;
            pointer-events: none;
        }
        
        /* 추가 애니메이션 */
        @keyframes scaleIn {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            70% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        @keyframes textPop {
            0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
            50% { transform: translate(-50%, -10px) scale(1.1); opacity: 1; }
            100% { transform: translate(-50%, -20px) scale(1); opacity: 0; }
        }
        
        @keyframes hitEffect {
            0% { transform: translate(-50%, -50%) scale(0.5) rotate(0deg); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.8) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});
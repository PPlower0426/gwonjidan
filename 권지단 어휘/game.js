
// game.js 상단에 추가
let userNickname = '';
const NICKNAME_KEY = 'kjd_nickname';
const DEVICE_ID_KEY = 'kjd_device_id';

// 장치 ID 생성/조회
function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

// 닉네임 로드
function loadNickname() {
    const savedNickname = localStorage.getItem(NICKNAME_KEY);
    if (savedNickname) {
        userNickname = savedNickname;
        return true;
    }
    return false;
}

// 닉네임 저장
function saveNickname(nickname) {
    if (nickname && nickname.trim().length > 0) {
        userNickname = nickname.trim().substring(0, 10);
        localStorage.setItem(NICKNAME_KEY, userNickname);
        return true;
    }
    return false;
}

// 닉네임 입력 화면 표시
function showNicknameScreen() {
    const nicknameInput = document.getElementById('nicknameInput');
    const nicknameCount = document.getElementById('nicknameCount');
    
    if (nicknameInput && nicknameCount) {
        nicknameInput.value = userNickname || '';
        nicknameCount.textContent = nicknameInput.value.length;
        
        nicknameInput.addEventListener('input', function() {
            let text = this.value.replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '');
            if (text.length > 10) text = text.substring(0, 10);
            this.value = text;
            nicknameCount.textContent = text.length;
        });
    }
    
    showScreen('nickname');
}

// 시작 화면 표시 함수 수정
function showStartScreen() {
    // 기존에 닉네임이 저장되어 있으면 바로 시작 화면 표시
    if (loadNickname()) {
        showScreen('start');
    } else {
        showNicknameScreen();
    }
}

// 랭킹 데이터 가져오기
async function loadRankings(type = 'score') {
    try {
        // Firebase에서 데이터 가져오기
        if (typeof firebase !== 'undefined') {
            const rankingRef = firebase.database().ref('rankings');
            const snapshot = await rankingRef.orderByChild(type).limitToLast(50).once('value');
            const data = snapshot.val();
            
            if (data) {
                return Object.values(data).sort((a, b) => b[type] - a[type]);
            }
        }
        
        // 로컬스토리지에서 가져오기 (Fallback)
        const localRankings = JSON.parse(localStorage.getItem('kjd_local_rankings') || '[]');
        return localRankings.sort((a, b) => b[type] - a[type]).slice(0, 50);
        
    } catch (error) {
        console.error('❌ 랭킹 로드 실패:', error);
        const localRankings = JSON.parse(localStorage.getItem('kjd_local_rankings') || '[]');
        return localRankings.sort((a, b) => b[type] - a[type]).slice(0, 50);
    }
}

// 랭킹 화면 표시
async function showRankingScreen(type = 'score') {
    // 로딩 상태 표시
    const rankingList = document.getElementById('rankingList');
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
    
    // 랭킹 데이터 가져오기
    const rankings = await loadRankings(type);
    
    // 랭킹 목록 렌더링
    renderRankings(rankings, type);
    
    // 내 랭킹 정보 표시
    renderMyRanking(rankings, type);
}

// 랭킹 목록 렌더링
function renderRankings(rankings, type) {
    const rankingList = document.getElementById('rankingList');
    
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
    
    const rankingItems = rankings.slice(0, 10).map((rank, index) => {
        const isMe = rank.deviceId === getDeviceId();
        const rankClass = isMe ? 'ranking-item my-rank' : 'ranking-item';
        const nameClass = isMe ? 'rank-name me' : 'rank-name';
        
        let typeLabel = '';
        let typeValue = '';
        
        switch(type) {
            case 'score':
                typeLabel = '점수';
                typeValue = rank.score.toLocaleString();
                break;
            case 'stage':
                typeLabel = '단계';
                typeValue = rank.stage;
                break;
            case 'combo':
                typeLabel = '콤보';
                typeValue = rank.maxCombo;
                break;
        }
        
        return `
            <div class="${rankClass}">
                <div class="rank-position top-${index + 1}">${index + 1}</div>
                <div class="rank-info">
                    <div class="${nameClass}">${rank.nickname}</div>
                    <div class="rank-details">
                        <div class="rank-stat">
                            <i class="fas fa-${type === 'score' ? 'star' : type === 'stage' ? 'gamepad' : 'fire'}"></i>
                            ${typeLabel}: ${typeValue}
                        </div>
                        <div class="rank-stat">
                            <i class="fas fa-check-circle"></i>
                            정확도: ${rank.accuracy}%
                        </div>
                        <div class="rank-stat">
                            <i class="fas fa-clock"></i>
                            ${Math.floor(rank.gameTime / 60)}분
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    rankingList.innerHTML = rankingItems;
}

// 내 랭킹 정보 렌더링
function renderMyRanking(rankings, type) {
    const myRanking = document.getElementById('myRanking');
    const myDeviceId = getDeviceId();
    const myRank = rankings.findIndex(rank => rank.deviceId === myDeviceId);
    
    if (myRank === -1) {
        myRanking.innerHTML = `
            <div class="my-ranking-header">내 랭킹</div>
            <div class="my-ranking-info">
                <div class="my-rank-details">
                    <div class="my-rank-name">${userNickname || '익명'}</div>
                    <div class="my-rank-score">아직 랭킹에 등록되지 않았습니다</div>
                </div>
            </div>
        `;
        return;
    }
    
    const myData = rankings[myRank];
    let typeValue = '';
    
    switch(type) {
        case 'score':
            typeValue = myData.score.toLocaleString() + '점';
            break;
        case 'stage':
            typeValue = myData.stage + '단계';
            break;
        case 'combo':
            typeValue = myData.maxCombo + '콤보';
            break;
    }
    
    myRanking.innerHTML = `
        <div class="my-ranking-header">내 랭킹 (${myRank + 1}위)</div>
        <div class="my-ranking-info">
            <div class="my-rank-position">${myRank + 1}</div>
            <div class="my-rank-details">
                <div class="my-rank-name">${myData.nickname}</div>
                <div class="my-rank-score">${typeValue} • 정확도: ${myData.accuracy}% • ${Math.floor(myData.gameTime / 60)}분</div>
            </div>
        </div>
    `;
}

// 이벤트 리스너 추가
function setupRankingEvents() {
    // 랭킹 탭 클릭
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const type = this.dataset.type;
            showRankingScreen(type);
        });
    });
    
    // 랭킹 새로고침
    const refreshBtn = document.getElementById('refreshRankingBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            const activeTab = document.querySelector('.ranking-tab.active');
            const type = activeTab ? activeTab.dataset.type : 'score';
            await showRankingScreen(type);
        });
    }
    
    // 랭킹 닫기
    const closeBtn = document.getElementById('closeRankingBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            showScreen('start');
        });
    }
}

// game.js - 모든 게임 기능 유지 + UI 압축 버전 + 타격감 강화 + 새로운 이펙트 + 대사 시스템 개선

document.addEventListener('DOMContentLoaded', function() {
    console.log('⚔️ 권지단 어휘대전 - 고밀도 버전 로딩...');

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

    // =================== 대사 데이터 ===================
    const MONSTER_DIALOGUES = {
        normal: ["너를 이기고 말겠다!", "이 정도로 날 이길 수 없다!", "한 번 더 덤벼봐!", "내가 질 것 같냐!", "어휘 실력이 대단하군!"],
        hit: ["윽! 상처가...", "이런 공격이 통하다니!", "아프다!", "효과가 굉장하군!", "이 정도는 간지럽지 않아!"],
        defense: ["방어 성공!", "헛공격이야!", "내 방어막은 완벽해!", "막아냈다!", "너의 공격은 통하지 않아!"],
        heal: ["회복했다!", "체력이 돌아왔어!", "다시 힘이 솟는다!", "이제 다시 시작이다!", "상처가 아물었어!"],
        lowHp: ["위험하다!", "체력이 얼마 안 남았어...", "마지막까지 버틴다!", "이게 마지막이겠지?", "아직 끝나지 않았다!"],
        death: ["으아악! 패배했다...", "너의 승리야...", "다음에 만나자...", "나를 이기다니...", "좋은 승부였어..."]
    };

    const PLAYER_DIALOGUES = {
        normal: ["내가 이길 거야!", "좋은 어휘 실력을 보여주지!", "한 번 덤벼봐!", "이 정도는 쉽지!", "어휘력으로 승부다!"],
        hit: ["효과적인 공격!", "단어 하나로 강력하다!", "정확한 답변이야!", "어휘력이 빛난다!", "이게 바로 실력이지!"],
        wrong: ["이런 실수를!", "또 틀렸어...", "집중해야 하는데...", "어휘력을 더 키워야겠어", "다음엔 꼭 맞출 거야!"],
        heal: ["체력이 회복됐다!", "다시 힘이 난다!", "물약 효과 좋군!", "이제 다시 싸울 수 있어!", "상처가 아물었어!"],
        lowHp: ["체력이 위험해...", "물약이 필요해...", "마지막까지 버텨야지...", "이대로 지면 안되는데...", "집중력이 필요해..."]
    };

    // =================== DOM 요소 ===================
    const el = {
        // 입력
        input: document.getElementById('wordInput'),
        clearBtn: document.getElementById('clearBtn'),
        submitBtn: document.getElementById('submitBtn'),
        potionBtn: document.getElementById('potionBtn'),
        potionCount: document.getElementById('potionCount'),
        
        // 대결
        monsterAvatar: document.getElementById('monsterAvatar'),
        playerAvatar: document.getElementById('playerAvatar'),
        monsterSpeech: document.getElementById('monsterSpeech'),
        
        // HP (새로운 체력바)
        monsterHpBar: document.getElementById('monsterHpBar'),
        monsterHpText: document.getElementById('monsterHpText'),
        playerHpBar: document.getElementById('playerHpBar'),
        playerHpText: document.getElementById('playerHpText'),
        
        // 정보
        currentStage: document.getElementById('currentStage'),
        currentScore: document.getElementById('currentScore'),
        monsterLevel: document.getElementById('monsterLevel'),
        monsterNameDisplay: document.getElementById('monsterNameDisplay'),
        
        // 스탯
        comboStat: document.getElementById('comboStat'),
        timeStat: document.getElementById('timeStat'),
        accuracyStat: document.getElementById('accuracyStat'),
        recordStat: document.getElementById('recordStat'),
        timeText: document.getElementById('timeText'),
        
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
        
        // 결과
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
        pausePotion: document.getElementById('pausePotion')
    };

    // =================== 새로운 대사 시스템 ===================
    function showSpeech(text, speaker = 'monster', type = 'normal') {
        if (!el.monsterSpeech) return;
        
        const speechContent = el.monsterSpeech.querySelector('.speech-content');
        speechContent.textContent = text;
        
        // 말풍선 클래스 초기화 및 설정
        el.monsterSpeech.className = 'speech-bubble';
        el.monsterSpeech.classList.add(speaker); // 'monster' 또는 'player'
        el.monsterSpeech.classList.add(type); // 'hit', 'defense' 등
        
        // 애니메이션 재시작
        el.monsterSpeech.style.animation = 'none';
        setTimeout(() => {
            el.monsterSpeech.style.animation = 'speechAppear 3s ease-in-out forwards';
        }, 10);
        
        console.log(`🗨️ ${speaker === 'monster' ? '몬스터' : '플레이어'} 대사 (${type}): ${text}`);
    }

    function showRandomSpeech(speaker = 'monster', type = 'normal') {
        const dialogues = speaker === 'monster' ? MONSTER_DIALOGUES : PLAYER_DIALOGUES;
        const dialogueList = dialogues[type] || dialogues.normal;
        const randomText = dialogueList[Math.floor(Math.random() * dialogueList.length)];
        showSpeech(randomText, speaker, type);
    }

    // =================== 게임 초기화 ===================
    // game.js의 init 함수 업데이트
async function init() {
    console.log('게임 초기화 시작...');
    
    // 장치 ID 생성
    getDeviceId();
    
    // 닉네임 로드
    loadNickname();
    
    await loadWords();
    setupEvents();
    setupRankingEvents(); // 랭킹 이벤트 설정 추가
    
    // 시작 화면 표시
    showStartScreen(); // 수정된 함수 사용
    
    console.log('게임 준비 완료');
}

// setupEvents 함수에 랭킹 버튼 이벤트 추가
function setupEvents() {
    // 기존 이벤트들...
    
    // 랭킹 버튼 이벤트
    const rankingBtn = document.getElementById('rankingBtn');
    if (rankingBtn) {
        rankingBtn.addEventListener('click', function() {
            showRankingScreen('score');
        });
    }
    
    const headerRankingBtn = document.getElementById('headerRankingBtn');
    if (headerRankingBtn) {
        headerRankingBtn.addEventListener('click', function() {
            showRankingScreen('score');
        });
    }
    
    // 닉네임 저장 버튼
    const saveNicknameBtn = document.getElementById('saveNicknameBtn');
    if (saveNicknameBtn) {
        saveNicknameBtn.addEventListener('click', function() {
            const nicknameInput = document.getElementById('nicknameInput');
            if (saveNickname(nicknameInput.value)) {
                showScreen('start');
            } else {
                showMessage('닉네임을 입력해주세요!');
                createTextShake(nicknameInput);
            }
        });
    }
    
    // 닉네임 건너뛰기 버튼
    const skipNicknameBtn = document.getElementById('skipNicknameBtn');
    if (skipNicknameBtn) {
        skipNicknameBtn.addEventListener('click', function() {
            saveNickname('익명');
            showScreen('start');
        });
    }
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
        el.startBtn.addEventListener('click', startGame);
        el.pauseBtn.addEventListener('click', togglePause);
        el.resumeBtn.addEventListener('click', resumeGame);
        el.restartBtn.addEventListener('click', restartGame);
        el.restartFromLoseBtn.addEventListener('click', restartGame);
        el.playAgainBtn.addEventListener('click', restartGame);
        
        el.clearBtn.addEventListener('click', clearInput);
        el.submitBtn.addEventListener('click', checkAnswer);
        el.potionBtn.addEventListener('click', usePotion);
        
        el.input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAnswer();
            }
        });
        
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });
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
        
        setTimeout(() => {
            el.input.focus();
            el.input.value = '';
        }, 300);
        
        // 시작 이펙트
        showRandomSpeech('monster', 'normal');
        vibrate([80, 40, 80]);
        createEffect('⚔️', 50, 50, 'primary');
        createRippleEffect(50, 50, '#6366f1');
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
        
        el.monsterAvatar.textContent = monster.emoji;
        el.monsterNameDisplay.textContent = monster.name;
        el.monsterLevel.textContent = `Lv.${level}`;
        el.currentStage.textContent = level;
        
        updateHpDisplay();
        
        // 등장 이펙트
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

    // =================== 문제 시스템 ===================
    function newQuestion() {
        if (state.words.length === 0) {
            console.error('❌ 단어 데이터 없음');
            return;
        }
        
        const difficulty = Math.min(3, Math.ceil(state.stage / 3));
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
        
        el.initialDisplay.textContent = state.currentWord.hint;
        el.meaningDisplay.textContent = state.currentWord.meaning;
        el.input.value = '';
        el.input.focus();
        
        state.timeLeft = CONFIG.TIME_LIMIT;
        updateTime();
        
        // 문제 표시 이펙트
        createGlowEffect(el.initialDisplay, '#6366f1', 1000);
        createTextShake(el.initialDisplay);
        
        console.log(`📝 문제: ${state.currentWord.word} (${state.currentWord.hint})`);
    }

    // =================== 타이머 ===================
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
        el.timeStat.textContent = state.timeLeft;
        el.timeText.textContent = `${state.timeLeft}초`;
        
        if (state.timeLeft <= 3) {
            el.timeText.style.color = '#ef4444';
            el.timeStat.style.color = '#ef4444';
            createPulseEffect(el.timeText);
            createPulseEffect(el.timeStat);
        } else if (state.timeLeft <= 5) {
            el.timeText.style.color = '#f59e0b';
            el.timeStat.style.color = '#f59e0b';
        } else {
            el.timeText.style.color = '';
            el.timeStat.style.color = '';
        }
    }

    function timeOut() {
        console.log('⏰ 시간 초과!');
        
        state.stats.total++;
        resetCombo();
        
        const damage = calculatePlayerDamage();
        state.player.hp = Math.max(0, state.player.hp - damage);
        
        // 타격감 효과
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
        if (!state.currentWord || el.input.value.length !== 2) {
            if (el.input.value.length < 2) {
                showMessage('2글자를 입력하세요!');
                createTextShake(el.input);
            }
            return;
        }
        
        state.stats.total++;
        const time = (Date.now() - state.questionTime) / 1000;
        
        if (el.input.value === state.currentWord.word) {
            correct(time);
        } else {
            wrong(time);
        }
        
        el.input.value = '';
        state.input = '';
        el.input.focus();
    }

    function correct(time) {
        console.log('✅ 정답!');
        
        state.stats.correct++;
        state.player.fastTime = Math.min(state.player.fastTime, time);
        
        // 콤보 증가
        state.player.combo++;
        state.player.maxCombo = Math.max(state.player.maxCombo, state.player.combo);
        
        // 콤보 이펙트 강화
        if (state.player.combo >= 3) {
            showComboEffect();
            showComboExplosion();
            playSound('combo');
            vibrate([40, 20, 40, 20, 40]);
            createRippleEffect(50, 50, '#f59e0b');
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
                showRandomSpeech('monster', 'defense');
                createEffect('🛡️', 50, 50, 'primary');
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
                showRandomSpeech('monster', 'heal');
                createEffect('💚', 50, 50, 'success');
            }
        }
        
        // 타격감 효과들
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
        
        // 플레이어 공격 성공 대사
        showRandomSpeech('player', 'hit');
        
        // 낮은 체력 대사
        if (state.monsterHp < state.monsterMaxHp * 0.3) {
            showRandomSpeech('monster', 'lowHp');
            createPulseEffect(document.querySelector('.monster-health .health-bar-container'));
        } else if (!defended) {
            // 방어하지 않았을 때만 몬스터 피격 대사
            showRandomSpeech('monster', 'hit');
        }
        
        // 기존 이펙트
        showEffect('monster', 'hit');
        showMessage('공격 성공!');
        playSound('correct');
        playSound('hit');
        vibrate(100);
        
        // 추가 이펙트
        if (isCritical) {
            createEffect('💥', 50, 50, 'warning');
            createRippleEffect(50, 50, '#f59e0b');
            createSpinEffect(50, 50, 'warning');
        }
        
        // UI 업데이트
        updateHpDisplay();
        el.currentScore.textContent = state.player.score.toLocaleString();
        el.comboStat.textContent = state.player.combo;
        el.recordStat.textContent = state.player.maxCombo;
        updateAccuracy();
        
        // 몬스터 처치 체크
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
        
        // 타격감 효과들
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
        
        let damage = (base + timeBonus) * comboMulti * extraMulti;
        const stageMulti = 0.9 + (state.stage * 0.05);
        damage *= stageMulti;
        
        return Math.round(damage);
    }

    function calculatePlayerDamage() {
        const base = 15;
        const stageMulti = 0.9 + (state.stage * 0.05);
        
        let damage = base * stageMulti;
        
        if (state.player.combo >= 5) {
            damage *= (1 + (state.player.combo * 0.1));
        }
        
        return Math.round(damage);
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
        el.potionCount.textContent = state.player.potions;
        el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
        
        setTimeout(() => {
            newQuestion();
        }, 800);
    }

    // =================== 콤보 시스템 ===================
    function resetCombo() {
        state.player.combo = 0;
        el.comboStat.textContent = '0';
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
        
        animateAvatar('monster', 'death');
        showRandomSpeech('monster', 'death');
        
        const stageBonus = state.stage * CONFIG.SCORE_STAGE;
        state.player.score += stageBonus;
        state.stats.cleared++;
        
        // 처치 이펙트
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
                
                if (state.stage % 2 === 0 && state.player.potions < CONFIG.POTION_COUNT) {
                    state.player.potions++;
                    el.potionCount.textContent = state.player.potions;
                    el.potionBtn.classList.remove('disabled');
                    showMessage('물약 획득!');
                    createEffect('🧪', 50, 50, 'potion');
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
        
        const accuracy = state.stats.total > 0 ? 
            Math.round((state.stats.correct / state.stats.total) * 100) : 0;
        
        if (isWin) {
            el.finalScore.textContent = state.player.score.toLocaleString();
            el.finalCombo.textContent = state.player.maxCombo;
            el.finalAccuracy.textContent = `${accuracy}%`;
            el.finalTime.textContent = `${state.gameTime}초`;
            playSound('victory');
            vibrate([150, 80, 150, 80, 200]);
            createEffect('🎉', 50, 50, 'warning');
            createEffect('🏆', 50, 50, 'warning');
            createRippleEffect(50, 50, '#f59e0b');
            showScreen('win');
        } else {
            el.loseScore.textContent = state.player.score.toLocaleString();
            el.loseCombo.textContent = state.player.maxCombo;
            el.loseStage.textContent = `${state.stats.cleared}/${CONFIG.STAGES}`;
            el.loseMonsters.textContent = `${CONFIG.STAGES - state.stats.cleared}마리`;
            playSound('wrong');
            vibrate([200, 100, 200]);
            createEffect('💀', 50, 50, 'danger');
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
        
        el.pauseStage.textContent = `Lv.${state.stage}`;
        el.pauseScore.textContent = state.player.score;
        el.pauseCombo.textContent = state.player.combo;
        el.pausePotion.textContent = state.player.potions;
        
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
        updateHpDisplay();
        el.currentScore.textContent = state.player.score.toLocaleString();
        el.recordStat.textContent = state.player.maxCombo;
        el.potionCount.textContent = state.player.potions;
        el.potionBtn.classList.toggle('disabled', state.player.potions <= 0);
        updateAccuracy();
    }

    function updateHpDisplay() {
        const monsterPercent = (state.monsterHp / state.monsterMaxHp) * 100;
        const playerPercent = (state.player.hp / CONFIG.PLAYER_HP) * 100;
        
        // 체력바 업데이트
        el.monsterHpBar.style.width = `${monsterPercent}%`;
        el.playerHpBar.style.width = `${playerPercent}%`;
        
        // 체력 텍스트 업데이트
        el.monsterHpText.textContent = `${state.monsterHp}/${state.monsterMaxHp}`;
        el.playerHpText.textContent = `${state.player.hp}/${CONFIG.PLAYER_HP}`;
        
        // 체력바 이펙트
        if (monsterPercent < 30) {
            createPulseEffect(el.monsterHpBar);
        }
        if (playerPercent < 30) {
            createPulseEffect(el.playerHpBar);
        }
        
        // 체력이 0에 가까울 때 빨간색 깜빡임 효과
        if (monsterPercent < 10) {
            el.monsterHpBar.style.animation = 'flashRed 1s infinite';
        } else {
            el.monsterHpBar.style.animation = '';
        }
        
        if (playerPercent < 10) {
            el.playerHpBar.style.animation = 'flashGreen 1s infinite';
        } else {
            el.playerHpBar.style.animation = '';
        }
    }

    function updateAccuracy() {
        const accuracy = state.stats.total > 0 ? 
            Math.round((state.stats.correct / state.stats.total) * 100) : 100;
        el.accuracyStat.textContent = `${accuracy}%`;
    }

    // =================== 새로운 이펙트 함수들 ===================
    
    // 화면 흔들기 효과
    function shakeScreen(intensity = 5, duration = 300) {
        const container = document.querySelector('.game-container');
        container.style.animation = `screenShake ${duration}ms ease`;
        
        setTimeout(() => {
            container.style.animation = '';
        }, duration);
    }
    
    // 화면 플래시 효과
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
        
        document.querySelector('.game-container').appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, duration);
    }
    
    // 공격 빔 효과
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
        
        document.querySelector('.battle-area').appendChild(beam);
        
        setTimeout(() => {
            beam.remove();
        }, 300);
    }
    
    // 대형 데미지 숫자 표시
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
        
        document.querySelector('.effects-layer').appendChild(damage);
        
        setTimeout(() => {
            damage.remove();
        }, 1500);
    }
    
    // 강력한 콤보 이펙트
    function showComboExplosion() {
        const combo = document.createElement('div');
        combo.className = 'combo-display';
        combo.textContent = `${state.player.combo} COMBO!`;
        
        document.querySelector('.effects-layer').appendChild(combo);
        
        setTimeout(() => {
            combo.remove();
        }, 800);
    }
    
    // 몬스터 피격 효과 강화
    function enhanceMonsterHit() {
        const monster = document.querySelector('.monster-circle');
        
        // 크기 변화
        monster.style.transform = 'scale(1.3)';
        monster.style.transition = 'transform 0.1s ease';
        
        // 색상 변화
        monster.style.filter = 'brightness(2) saturate(2)';
        
        setTimeout(() => {
            monster.style.transform = 'scale(1)';
            monster.style.filter = '';
        }, 100);
        
        setTimeout(() => {
            monster.style.transition = '';
        }, 200);
    }
    
    // 플레이어 피격 효과 강화
    function enhancePlayerHit() {
        const player = document.querySelector('.player-circle');
        
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

    // 물결 이펙트
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
        
        document.querySelector('.effects-layer').appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }
    
    // 회전 이펙트
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
    
    // 빛나는 이펙트
    function createGlowEffect(element, color = '#6366f1', duration = 1000) {
        element.classList.add('glow-effect');
        element.style.boxShadow = `0 0 20px ${color}`;
        
        setTimeout(() => {
            element.classList.remove('glow-effect');
            element.style.boxShadow = '';
        }, duration);
    }
    
    // 텍스트 흔들기 이펙트
    function createTextShake(element) {
        element.classList.add('text-shake');
        
        setTimeout(() => {
            element.classList.remove('text-shake');
        }, 300);
    }
    
    // 맥박 이펙트
    function createPulseEffect(element) {
        element.style.animation = 'pulse 0.5s ease 3';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 1500);
    }

    // =================== 기존 애니메이션 & 이펙트 ===================
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
        
        document.querySelector('.effects-layer').appendChild(effect);
        
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
                message.remove();
            }, 300);
        }, 1500);
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
            case 'primary': effect.style.color = '#6366f1'; break;
            case 'danger': effect.style.color = '#ef4444'; break;
            case 'warning': effect.style.color = '#f59e0b'; break;
            case 'success': effect.style.color = '#10b981'; break;
            case 'potion': effect.style.color = '#8b5cf6'; break;
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

    function vibrate(pattern) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (err) {}
        }
    }

    // =================== 화면 관리 ===================
    function showScreen(screen) {
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
        
        if (screen === 'game') {
            document.querySelector('.battle-area').style.display = 'grid';
            document.querySelector('.health-area').style.display = 'flex';
            document.querySelector('.problem-card').style.display = 'flex';
            document.querySelector('.input-area').style.display = 'block';
            document.querySelector('.separator-line').style.display = 'block';
            el.pauseBtn.style.display = 'block';
        } else {
            document.querySelector('.battle-area').style.display = 'none';
            document.querySelector('.health-area').style.display = 'none';
            document.querySelector('.problem-card').style.display = 'none';
            document.querySelector('.input-area').style.display = 'none';
            document.querySelector('.separator-line').style.display = 'none';
            el.pauseBtn.style.display = 'none';
            
            const target = document.querySelector(`.${screen}-screen`);
            if (target) {
                target.classList.add('active');
            }
        }
    }

    // =================== 유틸리티 함수 ===================
    function clearInput() {
        el.input.value = '';
        el.input.focus();
    }

    // =================== 게임 초기화 실행 ===================
    init();

    // =================== 전역 변수 ===================
    window.gameState = state;
    window.checkAnswer = checkAnswer;
    window.usePotion = usePotion;
    window.startGame = startGame;
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.restartGame = restartGame;

    console.log('🎮 게임 로딩 완료!');
});

// game.js의 gameEnd 함수 수정
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
    
    // 랭킹 데이터 구성
    const rankingData = {
        nickname: userNickname || '익명',
        deviceId: getDeviceId(),
        score: state.player.score,
        stage: state.stage,
        cleared: state.stats.cleared,
        maxCombo: state.player.maxCombo,
        accuracy: accuracy,
        gameTime: state.gameTime,
        timestamp: Date.now(),
        isWin: isWin
    };
    
    // 랭킹 저장
    await saveRanking(rankingData);
    
    if (isWin) {
        // 기존 승리 화면 코드...
    } else {
        // 기존 패배 화면 코드...
    }
}

// game.js의 saveRanking 함수 수정
async function saveRanking(data) {
    try {
        // index.html에 정의된 전역 함수 사용
        if (typeof window.saveRankingToFirebase === 'function') {
            const saved = await window.saveRankingToFirebase(data);
            if (saved) {
                console.log('📊 Firebase 랭킹 저장 완료');
            }
        }
        
        // 로컬스토리지에 백업 저장
        saveRankingToLocal(data);
        
    } catch (error) {
        console.error('❌ 랭킹 저장 실패:', error);
        saveRankingToLocal(data);
    }
}

// 로컬스토리지에 랭킹 저장 (백업)
function saveRankingToLocal(data) {
    const localRankings = JSON.parse(localStorage.getItem('kjd_local_rankings') || '[]');
    localRankings.push(data);
    
    // 최근 50개만 저장
    if (localRankings.length > 50) {
        localRankings.splice(0, localRankings.length - 50);
    }
    
    localStorage.setItem('kjd_local_rankings', JSON.stringify(localRankings));
}
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
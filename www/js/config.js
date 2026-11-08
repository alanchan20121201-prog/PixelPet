// ============================================================
// config.js —— 全域常數設定與多語言翻譯表
// ------------------------------------------------------------
// 用途：集中定義遊戲所有常數（數值衰減率、等級公式、
//       性格定義、互動定義、素材路徑、時間機制參數等），
//       以及四種語言的翻譯表（繁體/簡體/英文/日文）。
// 依賴：無（最基礎檔案，其他所有 JS 都依賴此檔）
// 對外提供：window.CONFIG 物件
// ============================================================

const CONFIG = {

  // ----------------------------------------------------------
  // 版本資訊（存檔相容性檢查用）
  // ----------------------------------------------------------
  VERSION: '1.0.0',
  // SAVE_KEY：localStorage 存檔的 key 名
  SAVE_KEY: 'pixelpet_save',

  // ----------------------------------------------------------
  // 七項生理數值定義
  // 每項：key（識別碼）、decay（每小時自然下降量，0 表示不自然下降）
  // 範圍全部 0–100，0 為最差，100 為最佳
  // ----------------------------------------------------------
  STATS: {
    // 飽腹度：每小時 -4，歸零後開始扣健康
    hunger:  { decay: 4, critical: true },
    // 口渴度：每小時 -3，歸零後開始扣健康
    thirst:  { decay: 3, critical: true },
    // 心情：每小時 -3，受互動同性格影響
    mood:    { decay: 3, critical: false },
    // 清潔度：每小時 -2，過低容易生病
    clean:   { decay: 2, critical: false },
    // 體力：活動時消耗，睡覺時恢復，不自然下降
    energy:  { decay: 0, critical: false },
    // 健康：綜合指標，受其他數值影響，歸零即死亡風險
    health:  { decay: 0, critical: true },
    // 睡眠：睡眠質素，長期不足扣健康
    sleep:   { decay: 0, critical: false }
  },

  // 初始數值（新建寵物時全部設為此值）
  STAT_INITIAL: 80,

  // 數值低於此值觸發警告（紅色閃爍）
  STAT_LOW_THRESHOLD: 20,

  // ----------------------------------------------------------
  // 五種性格定義
  // 每種性格影響數值衰減率同互動效果
  // multiplier：該性格對各項互動的效果倍率
  // ----------------------------------------------------------
  PERSONALITIES: {
    active:  { decayMod: { mood: -1, energy: 2 }, interactMod: { play: 1.5, train: 1.3, walk: 1.4 } },
    lazy:    { decayMod: { energy: -2, hunger: 1 }, interactMod: { sleep: 1.5, eat: 1.2 } },
    curious: { decayMod: { mood: -1 }, interactMod: { walk: 1.5, chat: 1.4, train: 1.2 } },
    clingy:  { decayMod: { mood: -2 }, interactMod: { chat: 1.5, play: 1.3, pet: 1.4 } },
    proud:   { decayMod: { clean: -1 }, interactMod: { clean: 1.5, train: 1.3 } }
  },

  // ----------------------------------------------------------
  // 六種心情狀態
  // threshold：心情值低於此值進入該狀態（由高到低排列）
  // ----------------------------------------------------------
  MOODS: [
    { key: 'excited',  min: 90, sprite: 'happy' },
    { key: 'happy',    min: 70, sprite: 'happy' },
    { key: 'normal',   min: 50, sprite: 'normal' },
    { key: 'bored',    min: 30, sprite: 'normal' },
    { key: 'sad',      min: 15, sprite: 'sick' },
    { key: 'angry',    min: 0,  sprite: 'angry' }
  ],

  // ----------------------------------------------------------
  // 互動動作定義
  // 每項：effects（對數值的影響）、energyCost（消耗體力）、
  //       affectionGain（好感度增加）、expGain（經驗值）、
  //       cooldown（冷卻時間，毫秒）
  // ----------------------------------------------------------
  INTERACTIONS: {
    feed:     { effects: { hunger: 30 },                  energyCost: 0,  affection: 2,  exp: 5,  cooldown: 3000 },
    drink:    { effects: { thirst: 30 },                  energyCost: 0,  affection: 2,  exp: 5,  cooldown: 3000 },
    clean:    { effects: { clean: 40 },                   energyCost: 5,  affection: 3,  exp: 8,  cooldown: 5000 },
    sleep:    { effects: { sleep: 50, energy: 40 },       energyCost: 0,  affection: 2,  exp: 10, cooldown: 8000 },
    toilet:   { effects: { clean: 20 },                   energyCost: 0,  affection: 1,  exp: 3,  cooldown: 2000 },
    play:     { effects: { mood: 25, energy: -10 },       energyCost: 10, affection: 5,  exp: 15, cooldown: 5000 },
    walk:     { effects: { mood: 20, energy: -15 },       energyCost: 15, affection: 8,  exp: 20, cooldown: 10000 },
    train:    { effects: { mood: 10, energy: -20 },       energyCost: 20, affection: 3,  exp: 30, cooldown: 10000 },
    chat:     { effects: { mood: 15 },                    energyCost: 0,  affection: 6,  exp: 10, cooldown: 3000 }
  },

  // ----------------------------------------------------------
  // 等級與經驗值設定
  // 升級所需經驗 = LEVEL_BASE * level^LEVEL_EXP
  // LEVEL_BASE=100：1 級升 2 級需 100 經驗
  // ----------------------------------------------------------
  LEVEL_BASE: 100,
  LEVEL_EXP: 1.5,
  MAX_LEVEL: 50,

  // ----------------------------------------------------------
  // 好感度設定（0–100）
  // ----------------------------------------------------------
  AFFECTION_MAX: 100,

  // ----------------------------------------------------------
  // 離線結算設定
  // OFFLINE_MIN：離線期間數值不會跌低於此值（保護機制）
  // OFFLINE_PROTECT_HOURS：超過此時數啟動保護（48 小時）
  // OFFLINE_MAX_HOURS：單次結算上限，超過部分不計算
  // ----------------------------------------------------------
  OFFLINE_MIN: 10,
  OFFLINE_PROTECT_HOURS: 48,
  OFFLINE_MAX_HOURS: 72,

  // ----------------------------------------------------------
  // 時間機制
  // TICK_INTERVAL：遊戲循環間隔（毫秒），60000=每分鐘結算一次
  // MEAL_TIMES：三餐時段（24 小時制），此時段飽腹度衰減加倍
  // NIGHT_START / NIGHT_END：夜晚時段（影響濾鏡同 BGM）
  // ----------------------------------------------------------
  TICK_INTERVAL: 60000,
  MEAL_TIMES: [[6, 9], [11, 14], [17, 20]],
  NIGHT_START: 20,
  NIGHT_END: 6,
  EVENING_START: 17,

  // 每小時衰減換算成每 tick 的比例
  // TICK_INTERVAL=60000ms=1分鐘，每小時=60分鐘，所以每 tick 衰減 decay/60
  TICKS_PER_HOUR: 60,

  // ----------------------------------------------------------
  // 每日隨機事件
  // MIN_EVENTS / MAX_EVENTS：每日事件數量範圍
  // ----------------------------------------------------------
  DAILY_EVENT_MIN: 1,
  DAILY_EVENT_MAX: 3,

  // ----------------------------------------------------------
  // 素材路徑（相對於 www/ 目錄）
  // ----------------------------------------------------------
  ASSETS: {
    sprites: {
      petSheet:    'assets/sprites/pet-sheet.png',
      petPortrait: 'assets/sprites/pet-portrait.png'
    },
    scenes: {
      bedroom:      'assets/scenes/room-bedroom.png',
      livingroom:   'assets/scenes/room-livingroom.png',
      garden:       'assets/scenes/room-garden.png',
      park:         'assets/scenes/walk-park.png',
      beach:        'assets/scenes/walk-beach.png',
      forest:       'assets/scenes/walk-forest.png'
    },
    ui: {
      icon512:   'assets/ui/icon-512.png',
      icon192:   'assets/ui/icon-192.png',
      buttons:   'assets/ui/buttons.png'
    },
    effects: {
      particles: 'assets/effects/particles.png'
    },
    cards: {
      statusBg:  'assets/cards/status-card-bg.png'
    },
    audio: {
      bgmDay:     'assets/audio/bgm-day.ogg',
      bgmNight:   'assets/audio/bgm-night.ogg',
      bgmWalk:    'assets/audio/bgm-walk.ogg',
      sfxLevelup: 'assets/audio/sfx-levelup.ogg',
      sfxEat:     'assets/audio/sfx-eat.ogg',
      sfxClean:   'assets/audio/sfx-clean.ogg',
      sfxSleep:   'assets/audio/sfx-sleep.ogg',
      sfxClick:   'assets/audio/sfx-click.ogg',
      sfxEvent:   'assets/audio/sfx-event.ogg',
      sfxHappy:   'assets/audio/sfx-happy.ogg',
      sfxHungry:  'assets/audio/sfx-hungry.ogg',
      sfxRare:    'assets/audio/sfx-rare.ogg'
    }
  },

  // ----------------------------------------------------------
  // 精靈圖設定
  // 寵物精靈圖每幀 64×64，橫向排列 10 幀
  // 幀順序：idle, eat, drink, bath, sleep, play, sick, happy, angry, normal
  // ----------------------------------------------------------
  SPRITE: {
    FRAME_SIZE: 64,
    FRAMES: ['idle', 'eat', 'drink', 'bath', 'sleep', 'play', 'sick', 'happy', 'angry', 'normal'],
    CANVAS_SIZE: 320
  },

  // ----------------------------------------------------------
  // 粒子特效設定（particles.png 中每個粒子 16×16）
  // ----------------------------------------------------------
  PARTICLES: {
    SIZE: 16,
    TYPES: ['heart', 'star', 'zzz', 'drop', 'sparkle']
  },

  // ----------------------------------------------------------
  // 技能樹定義
  // unlockLevel：解鎖所需等級
  // ----------------------------------------------------------
  SKILLS: [
    { id: 'auto_feed',      unlockLevel: 5,  cost: 0 },
    { id: 'auto_clean',     unlockLevel: 10, cost: 0 },
    { id: 'mood_boost',     unlockLevel: 8,  cost: 0 },
    { id: 'energy_saver',   unlockLevel: 12, cost: 0 },
    { id: 'fast_heal',      unlockLevel: 15, cost: 0 },
    { id: 'rare_finder',    unlockLevel: 20, cost: 0 }
  ],

  // ----------------------------------------------------------
  // 圖鑑條目定義
  // ----------------------------------------------------------
  DEX: [
    { id: 'butterfly', icon: '\u2744' },
    { id: 'rainbow',   icon: '\u2604' },
    { id: 'shooting_star', icon: '\u2605' },
    { id: 'mysterious_visitor', icon: '\u2753' },
    { id: 'firefly',   icon: '\u2728' },
    { id: 'shell',     icon: '\u2666' }
  ],

  // ----------------------------------------------------------
  // 預設語言
  // ----------------------------------------------------------
  DEFAULT_LANG: 'zh-TW',

  // ==========================================================
  // 多語言翻譯表
  // key 對應 HTML 中 data-i18n 屬性，或 JS 中呼叫 I18n.t(key)
  // 四種語言：zh-TW 繁體中文 / zh-CN 簡體中文 / en English / ja 日本語
  // ==========================================================
  I18N: {
    'zh-TW': {
      loading: '載入中…',
      'start.subtitle': '你的像素寵物正在等你',
      'start.new': '開始新遊戲',
      'start.continue': '繼續養育',
      'scene.bedroom': '寢室',
      'scene.livingroom': '客廳',
      'scene.garden': '花園',
      'scene.park': '公園',
      'scene.beach': '海灘',
      'scene.forest': '森林',
      'label.mood': '情緒',
      'label.event': '事件',
      'label.event-desc': '',
      'label.diary': '日誌',
      'label.skills': '技能',
      'label.dex': '圖鑑',
      'label.share': '狀態卡',
      'label.level': '等級',
      'panel.stats': '寵物狀態',
      'panel.affection': '親密度',
      'panel.actions': '互動',
      'action.feed': '餵食',
      'action.drink': '喝水',
      'action.clean': '清潔',
      'action.sleep': '睡覺',
      'action.toilet': '上廁所',
      'action.play': '玩耍',
      'action.train': '訓練',
      'action.walk': '散步',
      'action.chat': '聊天',
      'action.skills': '技能',
      'action.dex': '圖鑑',
      'action.diary': '日誌',
      'action.share': '狀態卡',
      'action.close': '關閉',
      'button.download': '下載圖片',
      'dialogue.welcome': '歡迎來到 PixelPet！你的像素寵物正在等你。',
      // 數值名稱
      'stat.hunger': '飽腹度',
      'stat.thirst': '口渴度',
      'stat.mood': '心情',
      'stat.clean': '清潔度',
      'stat.energy': '體力',
      'stat.health': '健康',
      'stat.sleep': '睡眠',
      // 心情狀態
      'mood.excited': '興奮',
      'mood.happy': '開心',
      'mood.normal': '普通',
      'mood.bored': '無聊',
      'mood.sad': '傷心',
      'mood.angry': '生氣',
      // 性格名稱
      'personality.active': '活潑',
      'personality.lazy': '懶惰',
      'personality.curious': '好奇',
      'personality.clingy': '黏人',
      'personality.proud': '高傲',
      // 對話
      'dialogue.hungry': '肚子好餓…能給我吃點東西嗎？',
      'dialogue.thirsty': '好渴…想喝水…',
      'dialogue.dirty': '我身上好髒，想洗澡…',
      'dialogue.tired': '好累…想睡覺…',
      'dialogue.sick': '嗚…我感覺不太舒服…',
      'dialogue.happy_feed': '好好食！謝謝主人！',
      'dialogue.happy_play': '耶！玩耍真開心！',
      'dialogue.happy_clean': '洗完澡好舒服！',
      'dialogue.happy_sleep': 'zzZ…睡得好飽…',
      'dialogue.walk_park': '公園的空氣真好！',
      'dialogue.walk_beach': '海邊好漂亮！',
      'dialogue.walk_forest': '森林裡有螢火蟲！',
      'dialogue.chat1': '主人，今天過得怎樣？',
      'dialogue.chat2': '我最喜歡主人了！',
      'dialogue.chat3': '嗯？主人想聊什麼？',
      'dialogue.train_ok': '訓練完成！變強了！',
      'dialogue.no_energy': '好累…沒力氣了…',
      'dialogue.levelup': '升級了！感覺變強了！',
      'dialogue.event_new': '發生了什麼事！',
      // 事件
      'event.rainbow.title': '彩虹出現了',
      'event.rainbow.desc': '雨後天邊出現一道彩虹，寵物看得入迷。',
      'event.rainbow.choice1': '一起欣賞',
      'event.shooting_star.title': '流星劃過',
      'event.shooting_star.desc': '夜空中一道流星劃過，傳說許願會成真。',
      'event.shooting_star.choice1': '許個願',
      'event.visitor.title': '神秘訪客',
      'event.visitor.desc': '一隻陌生的像素生物出現在門口。',
      'event.visitor.choice1': '歡迎牠',
      'event.visitor.choice2': '送走牠',
      'event.find_treasure.title': '發現寶物',
      'event.find_treasure.desc': '散步時寵物挖到一個閃亮的東西。',
      'event.find_treasure.choice1': '撿起來',
      // 技能
      'skill.auto_feed': '自動進食',
      'skill.auto_feed.desc': '飽腹度低時自動找食物',
      'skill.auto_clean': '自動清潔',
      'skill.auto_clean.desc': '清潔度低時自動清理',
      'skill.mood_boost': '心情加成',
      'skill.mood_boost.desc': '心情下降速度減半',
      'skill.energy_saver': '體力節約',
      'skill.energy_saver.desc': '活動消耗體力減少',
      'skill.fast_heal': '快速恢復',
      'skill.fast_heal.desc': '健康恢復速度加倍',
      'skill.rare_finder': '稀有探險家',
      'skill.rare_finder.desc': '稀有事件出現率提升',
      // 圖鑑
      'dex.butterfly': '花園蝴蝶',
      'dex.rainbow': '彩虹',
      'dex.shooting_star': '流星',
      'dex.mysterious_visitor': '神秘訪客',
      'dex.firefly': '森林螢火蟲',
      'dex.shell': '海灘貝殼',
      // 日記模板
      'diary.format': '{date}',
      'diary.entry_play': '今天主人陪我玩耍，好開心！',
      'diary.entry_walk_park': '今天去了公園散步，看到好多樹。',
      'diary.entry_walk_beach': '今天去了海邊，撿到貝殼。',
      'diary.entry_walk_forest': '今天去森林，有螢火蟲飛來飛去。',
      'diary.entry_feed': '今天吃了好吃的東西。',
      'diary.entry_clean': '今天洗了澡，香香的。',
      'diary.entry_sleep': '今天睡了好覺，精神飽滿。',
      'diary.entry_levelup': '今天升級了！好厲害！',
      'diary.entry_event': '今天發生了特別的事。',
      'diary.entry_idle': '今天平平淡淡地過去了。',
      'diary.entry_rare': '今天遇到稀有事件！好幸運！',
      // 系統訊息
      'msg.no_save': '沒有存檔，請開始新遊戲。',
      'msg.cooldown': '還不能做這個動作，等一下再試。',
      'msg.no_energy': '體力不足，讓寵物休息一下吧。',
      'msg.skill_locked': '等級不足，尚未解鎖此技能。',
      'msg.skill_unlocked': '解鎖新技能！',
      'msg.dex_new': '圖鑑新增一筆記錄！'
    },

    'zh-CN': {
      loading: '加载中…',
      'start.subtitle': '你的像素宠物正在等你',
      'start.new': '开始新游戏',
      'start.continue': '继续养育',
      'scene.bedroom': '寝室',
      'scene.livingroom': '客厅',
      'scene.garden': '花园',
      'scene.park': '公园',
      'scene.beach': '海滩',
      'scene.forest': '森林',
      'label.mood': '情绪',
      'label.event': '事件',
      'label.event-desc': '',
      'label.diary': '日志',
      'label.skills': '技能',
      'label.dex': '图鉴',
      'label.share': '状态卡',
      'label.level': '等级',
      'panel.stats': '宠物状态',
      'panel.affection': '亲密度',
      'panel.actions': '互动',
      'action.feed': '喂食',
      'action.drink': '喝水',
      'action.clean': '清洁',
      'action.sleep': '睡觉',
      'action.toilet': '上厕所',
      'action.play': '玩耍',
      'action.train': '训练',
      'action.walk': '散步',
      'action.chat': '聊天',
      'action.skills': '技能',
      'action.dex': '图鉴',
      'action.diary': '日志',
      'action.share': '状态卡',
      'action.close': '关闭',
      'button.download': '下载图片',
      'dialogue.welcome': '欢迎来到 PixelPet！你的像素宠物正在等你。',
      'stat.hunger': '饱腹度',
      'stat.thirst': '口渴度',
      'stat.mood': '心情',
      'stat.clean': '清洁度',
      'stat.energy': '体力',
      'stat.health': '健康',
      'stat.sleep': '睡眠',
      'mood.excited': '兴奋',
      'mood.happy': '开心',
      'mood.normal': '普通',
      'mood.bored': '无聊',
      'mood.sad': '伤心',
      'mood.angry': '生气',
      'personality.active': '活泼',
      'personality.lazy': '懒惰',
      'personality.curious': '好奇',
      'personality.clingy': '黏人',
      'personality.proud': '高傲',
      'dialogue.hungry': '肚子好饿…能给我吃点东西吗？',
      'dialogue.thirsty': '好渴…想喝水…',
      'dialogue.dirty': '我身上好脏，想洗澡…',
      'dialogue.tired': '好累…想睡觉…',
      'dialogue.sick': '呜…我感觉不太舒服…',
      'dialogue.happy_feed': '好好吃！谢谢主人！',
      'dialogue.happy_play': '耶！玩耍真开心！',
      'dialogue.happy_clean': '洗完澡好舒服！',
      'dialogue.happy_sleep': 'zzZ…睡得好饱…',
      'dialogue.walk_park': '公园的空气真好！',
      'dialogue.walk_beach': '海边好漂亮！',
      'dialogue.walk_forest': '森林里有萤火虫！',
      'dialogue.chat1': '主人，今天过得怎样？',
      'dialogue.chat2': '最喜欢主人了！',
      'dialogue.chat3': '嗯？主人想聊什么？',
      'dialogue.train_ok': '训练完成！变强了！',
      'dialogue.no_energy': '好累…没力气了…',
      'dialogue.levelup': '升级了！感觉变强了！',
      'dialogue.event_new': '发生了什么事！',
      'event.rainbow.title': '彩虹出现了',
      'event.rainbow.desc': '雨后天边出现一道彩虹，宠物看得入迷。',
      'event.rainbow.choice1': '一起欣赏',
      'event.shooting_star.title': '流星划过',
      'event.shooting_star.desc': '夜空中一道流星划过，传说许愿会成真。',
      'event.shooting_star.choice1': '许个愿',
      'event.visitor.title': '神秘访客',
      'event.visitor.desc': '一只陌生的像素生物出现在门口。',
      'event.visitor.choice1': '欢迎它',
      'event.visitor.choice2': '送走它',
      'event.find_treasure.title': '发现宝物',
      'event.find_treasure.desc': '散步时宠物挖到一个闪亮的东西。',
      'event.find_treasure.choice1': '捡起来',
      'skill.auto_feed': '自动进食',
      'skill.auto_feed.desc': '饱腹度低时自动找食物',
      'skill.auto_clean': '自动清洁',
      'skill.auto_clean.desc': '清洁度低时自动清理',
      'skill.mood_boost': '心情加成',
      'skill.mood_boost.desc': '心情下降速度减半',
      'skill.energy_saver': '体力节约',
      'skill.energy_saver.desc': '活动消耗体力减少',
      'skill.fast_heal': '快速恢复',
      'skill.fast_heal.desc': '健康恢复速度加倍',
      'skill.rare_finder': '稀有探险家',
      'skill.rare_finder.desc': '稀有事件出现率提升',
      'dex.butterfly': '花园蝴蝶',
      'dex.rainbow': '彩虹',
      'dex.shooting_star': '流星',
      'dex.mysterious_visitor': '神秘访客',
      'dex.firefly': '森林萤火虫',
      'dex.shell': '海滩贝壳',
      'diary.format': '{date}',
      'diary.entry_play': '今天主人陪我玩耍，好开心！',
      'diary.entry_walk_park': '今天去了公园散步，看到好多树。',
      'diary.entry_walk_beach': '今天去了海边，捡到贝壳。',
      'diary.entry_walk_forest': '今天去森林，有萤火虫飞来飞去。',
      'diary.entry_feed': '今天吃了好吃的东西。',
      'diary.entry_clean': '今天洗了澡，香香的。',
      'diary.entry_sleep': '今天睡了好觉，精神饱满。',
      'diary.entry_levelup': '今天升级了！好厉害！',
      'diary.entry_event': '今天发生了特别的事。',
      'diary.entry_idle': '今天平平淡淡地过去了。',
      'diary.entry_rare': '今天遇到稀有事件！好幸运！',
      'msg.no_save': '没有存档，请开始新游戏。',
      'msg.cooldown': '还不能做这个动作，等一下再试。',
      'msg.no_energy': '体力不足，让宠物休息一下吧。',
      'msg.skill_locked': '等级不足，尚未解锁此技能。',
      'msg.skill_unlocked': '解锁新技能！',
      'msg.dex_new': '图鉴新增一笔记录！'
    },

    en: {
      loading: 'Loading…',
      'start.subtitle': 'Your pixel pet is waiting for you',
      'start.new': 'New Game',
      'start.continue': 'Continue',
      'scene.bedroom': 'Bedroom',
      'scene.livingroom': 'Living Room',
      'scene.garden': 'Garden',
      'scene.park': 'Park',
      'scene.beach': 'Beach',
      'scene.forest': 'Forest',
      'label.mood': 'Mood',
      'label.event': 'Event',
      'label.event-desc': '',
      'label.diary': 'Diary',
      'label.skills': 'Skills',
      'label.dex': 'Encyclopedia',
      'label.share': 'Status Card',
      'label.level': 'Lv',
      'panel.stats': 'Pet Status',
      'panel.affection': 'Affection',
      'panel.actions': 'Actions',
      'action.feed': 'Feed',
      'action.drink': 'Drink',
      'action.clean': 'Clean',
      'action.sleep': 'Sleep',
      'action.toilet': 'Toilet',
      'action.play': 'Play',
      'action.train': 'Train',
      'action.walk': 'Walk',
      'action.chat': 'Chat',
      'action.skills': 'Skills',
      'action.dex': 'Encyclopedia',
      'action.diary': 'Diary',
      'action.share': 'Status Card',
      'action.close': 'Close',
      'button.download': 'Download',
      'dialogue.welcome': 'Welcome to PixelPet! Your pixel pet is waiting for you.',
      'stat.hunger': 'Hunger',
      'stat.thirst': 'Thirst',
      'stat.mood': 'Mood',
      'stat.clean': 'Clean',
      'stat.energy': 'Energy',
      'stat.health': 'Health',
      'stat.sleep': 'Sleep',
      'mood.excited': 'Excited',
      'mood.happy': 'Happy',
      'mood.normal': 'Normal',
      'mood.bored': 'Bored',
      'mood.sad': 'Sad',
      'mood.angry': 'Angry',
      'personality.active': 'Active',
      'personality.lazy': 'Lazy',
      'personality.curious': 'Curious',
      'personality.clingy': 'Clingy',
      'personality.proud': 'Proud',
      'dialogue.hungry': "I'm so hungry… can I have some food?",
      'dialogue.thirsty': "So thirsty… I want water…",
      'dialogue.dirty': "I'm so dirty, I want a bath…",
      'dialogue.tired': "So tired… I want to sleep…",
      'dialogue.sick': "Ugh… I don't feel well…",
      'dialogue.happy_feed': 'Yummy! Thank you, master!',
      'dialogue.happy_play': 'Yay! Playing is so fun!',
      'dialogue.happy_clean': 'I feel so fresh after bathing!',
      'dialogue.happy_sleep': 'zzZ… I slept so well…',
      'dialogue.walk_park': 'The park air is great!',
      'dialogue.walk_beach': 'The beach is beautiful!',
      'dialogue.walk_forest': 'There are fireflies in the forest!',
      'dialogue.chat1': 'Master, how was your day?',
      'dialogue.chat2': 'I love you the most!',
      'dialogue.chat3': 'Hmm? What do you want to talk about?',
      'dialogue.train_ok': 'Training done! Got stronger!',
      'dialogue.no_energy': "So tired… no energy left…",
      'dialogue.levelup': 'Leveled up! Feel stronger!',
      'dialogue.event_new': 'Something happened!',
      'event.rainbow.title': 'A Rainbow Appears',
      'event.rainbow.desc': 'After the rain, a rainbow appears. Your pet is mesmerized.',
      'event.rainbow.choice1': 'Watch together',
      'event.shooting_star.title': 'Shooting Star',
      'event.shooting_star.desc': 'A shooting star crosses the night sky. They say wishes come true.',
      'event.shooting_star.choice1': 'Make a wish',
      'event.visitor.title': 'Mysterious Visitor',
      'event.visitor.desc': 'A strange pixel creature appears at the door.',
      'event.visitor.choice1': 'Welcome it',
      'event.visitor.choice2': 'Send it away',
      'event.find_treasure.title': 'Found Treasure',
      'event.find_treasure.desc': 'Your pet dug up something shiny during the walk.',
      'event.find_treasure.choice1': 'Pick it up',
      'skill.auto_feed': 'Auto Feed',
      'skill.auto_feed.desc': 'Automatically eats when hungry',
      'skill.auto_clean': 'Auto Clean',
      'skill.auto_clean.desc': 'Automatically cleans when dirty',
      'skill.mood_boost': 'Mood Boost',
      'skill.mood_boost.desc': 'Mood drops half as fast',
      'skill.energy_saver': 'Energy Saver',
      'skill.energy_saver.desc': 'Reduces energy cost',
      'skill.fast_heal': 'Fast Heal',
      'skill.fast_heal.desc': 'Health recovery doubled',
      'skill.rare_finder': 'Rare Finder',
      'skill.rare_finder.desc': 'Rare events more likely',
      'dex.butterfly': 'Garden Butterfly',
      'dex.rainbow': 'Rainbow',
      'dex.shooting_star': 'Shooting Star',
      'dex.mysterious_visitor': 'Mysterious Visitor',
      'dex.firefly': 'Forest Firefly',
      'dex.shell': 'Beach Shell',
      'diary.format': '{date}',
      'diary.entry_play': 'Today master played with me, so happy!',
      'diary.entry_walk_park': 'Today I walked in the park, saw many trees.',
      'diary.entry_walk_beach': 'Today I went to the beach, found a shell.',
      'diary.entry_walk_forest': 'Today I went to the forest, fireflies everywhere.',
      'diary.entry_feed': 'Today I ate something delicious.',
      'diary.entry_clean': 'Today I took a bath, smell nice.',
      'diary.entry_sleep': 'Today I slept well, full of energy.',
      'diary.entry_levelup': 'Today I leveled up! Amazing!',
      'diary.entry_event': 'Today something special happened.',
      'diary.entry_idle': 'Today passed quietly.',
      'diary.entry_rare': 'Today I encountered a rare event! Lucky!',
      'msg.no_save': 'No save found. Please start a new game.',
      'msg.cooldown': "Can't do this yet, please wait.",
      'msg.no_energy': 'Not enough energy. Let your pet rest.',
      'msg.skill_locked': 'Level too low. Skill not unlocked.',
      'msg.skill_unlocked': 'New skill unlocked!',
      'msg.dex_new': 'New encyclopedia entry added!'
    },

    ja: {
      loading: '読み込み中…',
      'start.subtitle': 'あなたのピクセルペットが待っています',
      'start.new': 'ニューゲーム',
      'start.continue': '続ける',
      'scene.bedroom': '寝室',
      'scene.livingroom': 'リビング',
      'scene.garden': '庭',
      'scene.park': '公園',
      'scene.beach': '海辺',
      'scene.forest': '森',
      'label.mood': '気分',
      'label.event': 'イベント',
      'label.event-desc': '',
      'label.diary': '日記',
      'label.skills': 'スキル',
      'label.dex': '図鑑',
      'label.share': 'ステータスカード',
      'label.level': 'レベル',
      'panel.stats': 'ペットステータス',
      'panel.affection': '親密度',
      'panel.actions': 'アクション',
      'action.feed': '餌やり',
      'action.drink': '水やり',
      'action.clean': '清潔',
      'action.sleep': '寝る',
      'action.toilet': 'トイレ',
      'action.play': '遊ぶ',
      'action.train': '訓練',
      'action.walk': '散歩',
      'action.chat': '話す',
      'action.skills': 'スキル',
      'action.dex': '図鑑',
      'action.diary': '日記',
      'action.share': 'ステータスカード',
      'action.close': '閉じる',
      'button.download': 'ダウンロード',
      'dialogue.welcome': 'PixelPetへようこそ！ピクセルペットが待っています。',
      'stat.hunger': '満腹度',
      'stat.thirst': '喉の渇き',
      'stat.mood': '気分',
      'stat.clean': '清潔度',
      'stat.energy': '体力',
      'stat.health': '健康',
      'stat.sleep': '睡眠',
      'mood.excited': '興奮',
      'mood.happy': '幸せ',
      'mood.normal': '普通',
      'mood.bored': '退屈',
      'mood.sad': '悲しい',
      'mood.angry': '怒り',
      'personality.active': '活発',
      'personality.lazy': '怠け者',
      'personality.curious': '好奇心',
      'personality.clingy': '甘えん坊',
      'personality.proud': '高慢',
      'dialogue.hungry': 'お腹すいた…何か食べさせて？',
      'dialogue.thirsty': '喉が渇いた…水が欲しい…',
      'dialogue.dirty': '汚い…お風呂入りたい…',
      'dialogue.tired': '疲れた…寝たい…',
      'dialogue.sick': 'うう…気分が悪い…',
      'dialogue.happy_feed': '美味しい！ご主人ありがとう！',
      'dialogue.happy_play': 'イエイ！遊ぶの楽しい！',
      'dialogue.happy_clean': 'お風呂上がりさっぱり！',
      'dialogue.happy_sleep': 'zzZ…よく寝た…',
      'dialogue.walk_park': '公園の空気がいい！',
      'dialogue.walk_beach': '海辺が綺麗！',
      'dialogue.walk_forest': '森に蛍がいる！',
      'dialogue.chat1': 'ご主人、今日はどうだった？',
      'dialogue.chat2': 'ご主人が大好き！',
      'dialogue.chat3': 'ん？何を話そう？',
      'dialogue.train_ok': '訓練完了！強くなった！',
      'dialogue.no_energy': '疲れた…力が出ない…',
      'dialogue.levelup': 'レベルアップ！強くなった！',
      'dialogue.event_new': '何か起きた！',
      'event.rainbow.title': '虹が出た',
      'event.rainbow.desc': '雨の後に虹が出た。ペットが見とれている。',
      'event.rainbow.choice1': '一緒に見る',
      'event.shooting_star.title': '流れ星',
      'event.shooting_star.desc': '夜空に流れ星が流れた。願いをかけると叶うらしい。',
      'event.shooting_star.choice1': '願いをかける',
      'event.visitor.title': '謎の訪問者',
      'event.visitor.desc': '見知らぬピクセル生物がドアに現れた。',
      'event.visitor.choice1': '迎える',
      'event.visitor.choice2': '帰す',
      'event.find_treasure.title': '宝物発見',
      'event.find_treasure.desc': '散歩中にペットがキラキラしたものを掘り当てた。',
      'event.find_treasure.choice1': '拾う',
      'skill.auto_feed': '自動給餌',
      'skill.auto_feed.desc': '満腹度が低いと自動で食べる',
      'skill.auto_clean': '自動清潔',
      'skill.auto_clean.desc': '清潔度が低いと自動で掃除',
      'skill.mood_boost': '気分ブースト',
      'skill.mood_boost.desc': '気分の低下が半分に',
      'skill.energy_saver': '体力節約',
      'skill.energy_saver.desc': 'アクションの体力消費減',
      'skill.fast_heal': '快速回復',
      'skill.fast_heal.desc': '健康回復速度倍増',
      'skill.rare_finder': 'レア探検家',
      'skill.rare_finder.desc': 'レアイベント発生率アップ',
      'dex.butterfly': '庭の蝶',
      'dex.rainbow': '虹',
      'dex.shooting_star': '流れ星',
      'dex.mysterious_visitor': '謎の訪問者',
      'dex.firefly': '森の蛍',
      'dex.shell': '海辺の貝殻',
      'diary.format': '{date}',
      'diary.entry_play': '今日ご主人と遊んだ、楽しかった！',
      'diary.entry_walk_park': '今日公園を散歩した、木がたくさんあった。',
      'diary.entry_walk_beach': '今日海辺に行った、貝殻を拾った。',
      'diary.entry_walk_forest': '今日森に行った、蛍が飛んでいた。',
      'diary.entry_feed': '今日美味しいものを食べた。',
      'diary.entry_clean': '今日お風呂に入った、いい匂い。',
      'diary.entry_sleep': '今日よく寝た、元気满满。',
      'diary.entry_levelup': '今日レベルアップした！すごい！',
      'diary.entry_event': '今日特別なことがあった。',
      'diary.entry_idle': '今日は静かに過ぎた。',
      'diary.entry_rare': '今日レアイベントに遭遇！ラッキー！',
      'msg.no_save': 'セーブデータがありません。ニューゲームを開始してください。',
      'msg.cooldown': 'まだできない、少し待って。',
      'msg.no_energy': '体力不足。ペットを休ませて。',
      'msg.skill_locked': 'レベル不足。スキル未解放。',
      'msg.skill_unlocked': '新スキル解放！',
      'msg.dex_new': '図鑑に新記録追加！'
    }
  }
};

window.CONFIG = CONFIG;

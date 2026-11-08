// ============================================================
// pet.js —— 寵物核心狀態管理
// ------------------------------------------------------------
// 用途：管理寵物的全部狀態，包括建立新寵物、數值衰減、
//       離線結算、心情計算、好感度、經驗值與等級、
//       習慣記憶、冷卻時間等。
// 依賴：config.js（CONFIG 常數）、storage.js（存檔讀取）
// 對外提供：window.Pet 物件
//   - Pet.create(name)           建立新寵物
//   - Pet.loadFromSave(data)     從存檔載入
//   - Pet.getState()             取得目前狀態
//   - Pet.updateStats(deltaHours) 依時間流逝更新數值
//   - Pet.calcMood()             計算目前心情
//   - Pet.addAffection(n)        增加好感度
//   - Pet.addExp(n)              增加經驗值（含升級判斷）
//   - Pet.checkCooldown(action)  檢查動作冷卻
//   - Pet.setCooldown(action)    設定動作冷卻
//   - Pet.recordHabit(action)    記錄玩家習慣
// ============================================================

var Pet = {

  // state：寵物目前狀態（私有，透過 getState 取得）
  state: null,

  // ----------------------------------------------------------
  // create：建立一隻新寵物
  // 參數：name（字串）—— 寵物名字
  // 回傳：寵物狀態物件
  // ----------------------------------------------------------
  create: function (name) {
    // 性格五選一：從 PERSONALITIES 的 key 中隨機抽
    var personalities = Object.keys(CONFIG.PERSONALITIES);
    var personality = personalities[Math.floor(Math.random() * personalities.length)];

    // 初始化七項數值，全部設為 CONFIG.STAT_INITIAL（預設 80）
    var stats = {};
    for (var key in CONFIG.STATS) {
      stats[key] = CONFIG.STAT_INITIAL;
    }

    var now = Date.now();

    this.state = {
      version: CONFIG.VERSION,
      name: name,
      personality: personality,
      stats: stats,
      mood: 'happy',
      affection: 0,
      level: 1,
      exp: 0,
      skills: [],
      dex: [],
      currentScene: 'livingroom',
      lastTick: now,
      lastVisit: now,
      createdAt: now,
      habits: {
        actions: {},
        visitHours: [],
        lastAction: null
      },
      diary: [],
      cooldowns: {},
      sleepMode: false,
      isWalking: false,
      walkScene: null,
      dailyEventDate: this._todayStr(),
      dailyEventCount: 0,
      lang: CONFIG.DEFAULT_LANG
    };

    // 計算初始心情
    this.state.mood = this.calcMood();
    return this.state;
  },

  // ----------------------------------------------------------
  // loadFromSave：從存檔資料載入寵物狀態
  // 參數：data（物件）—— Storage.load() 回傳的存檔物件
  // 回傳：寵物狀態物件
  // ----------------------------------------------------------
  loadFromSave: function (data) {
    this.state = data;
    // 確保存檔版本相容，缺少的欄位補預設值
    if (!this.state.habits) this.state.habits = { actions: {}, visitHours: [], lastAction: null };
    if (!this.state.skills) this.state.skills = [];
    if (!this.state.dex) this.state.dex = [];
    if (!this.state.diary) this.state.diary = [];
    if (!this.state.cooldowns) this.state.cooldowns = {};
    return this.state;
  },

  // ----------------------------------------------------------
  // getState：取得目前寵物狀態
  // 回傳：狀態物件
  // ----------------------------------------------------------
  getState: function () {
    return this.state;
  },

  // ----------------------------------------------------------
  // updateStats：依經過時間更新數值
  // 參數：deltaHours（數字）—— 經過了多少小時
  // 邏輯：每項數值按 CONFIG.STATS[key].decay 衰減
  //       離線超過保護時數後，數值不會低於 OFFLINE_MIN
  //       飽腹度/口渴度歸零後扣健康
  //       睡覺模式下體力與睡眠恢復
  // ----------------------------------------------------------
  updateStats: function (deltaHours) {
    if (!this.state) return;
    var s = this.state;
    var stats = s.stats;
    var personality = CONFIG.PERSONALITIES[s.personality] || {};

    // 判斷是否在保護期內（離線超過 48 小時啟動保護）
    var isProtected = deltaHours > CONFIG.OFFLINE_PROTECT_HOURS;
    // 單次結算上限，避免太久沒玩一次扣到底
    var effectiveHours = Math.min(deltaHours, CONFIG.OFFLINE_MAX_HOURS);

    // 判斷是否在三餐時段（此時飽腹度衰減加倍）
    var hour = new Date().getHours();
    var isMealTime = this._isInMealTime(hour);

    for (var key in CONFIG.STATS) {
      var def = CONFIG.STATS[key];
      if (def.decay === 0) continue; // 體力、健康、睡眠不自然衰減

      var decay = def.decay * effectiveHours;

      // 性格影響：decayMod 為負表示衰減更慢，正表示更快
      if (personality.decayMod && personality.decayMod[key]) {
        decay += personality.decayMod[key] * effectiveHours;
      }

      // 三餐時段飽腹度衰減加倍
      if (key === 'hunger' && isMealTime) {
        decay *= 1.5;
      }

      // 技能 mood_boost：心情衰減減半
      if (key === 'mood' && s.skills.indexOf('mood_boost') >= 0) {
        decay *= 0.5;
      }

      stats[key] -= decay;

      // 保護機制：離線太久不會跌到 0
      if (isProtected && stats[key] < CONFIG.OFFLINE_MIN) {
        stats[key] = CONFIG.OFFLINE_MIN;
      }
      // 一般下限為 0
      if (stats[key] < 0) stats[key] = 0;
    }

    // 睡覺模式：體力與睡眠恢復（+20/小時）
    if (s.sleepMode) {
      stats.energy += 20 * effectiveHours;
      stats.sleep += 25 * effectiveHours;
      if (stats.energy > 100) stats.energy = 100;
      if (stats.sleep > 100) stats.sleep = 100;
    }

    // 健康結算：飽腹度或口渴度為 0 時扣健康
    var healthDrop = 0;
    if (stats.hunger <= 0) healthDrop += 5 * effectiveHours;
    if (stats.thirst <= 0) healthDrop += 5 * effectiveHours;
    if (stats.sleep <= 10) healthDrop += 3 * effectiveHours;
    if (stats.clean <= 10) healthDrop += 2 * effectiveHours;

    // 技能 fast_heal：健康恢復加倍
    if (healthDrop > 0) {
      if (s.skills.indexOf('fast_heal') >= 0) {
        healthDrop *= 0.5; // 傷害減半等同恢復加倍
      }
      stats.health -= healthDrop;
      if (stats.health < 0) stats.health = 0;
    } else {
      // 數值都正常時，健康慢慢恢復
      var healRate = 2 * effectiveHours;
      if (s.skills.indexOf('fast_heal') >= 0) healRate *= 2;
      stats.health += healRate;
      if (stats.health > 100) stats.health = 100;
    }

    // 更新心情
    s.mood = this.calcMood();

    // 更新時間戳
    s.lastTick = Date.now();
  },

  // ----------------------------------------------------------
  // calcMood：根據心情值計算目前心情狀態
  // 回傳：心情 key（excited/happy/normal/bored/sad/angry）
  // 邏輯：心情值越高心情越好，由 CONFIG.MOODS 閘值決定
  // ----------------------------------------------------------
  calcMood: function () {
    if (!this.state) return 'normal';
    var moodVal = this.state.stats.mood;

    // 健康過低直接進入傷心
    if (this.state.stats.health < 20) return 'sad';

    // 從高到低檢查，符合即回傳
    for (var i = 0; i < CONFIG.MOODS.length; i++) {
      if (moodVal >= CONFIG.MOODS[i].min) {
        return CONFIG.MOODS[i].key;
      }
    }
    return 'angry'; // 最低
  },

  // ----------------------------------------------------------
  // addAffection：增加好感度
  // 參數：n（數字）—— 增加量，可為負數
  // 回傳：目前好感度
  // ----------------------------------------------------------
  addAffection: function (n) {
    if (!this.state) return 0;
    this.state.affection += n;
    if (this.state.affection < 0) this.state.affection = 0;
    if (this.state.affection > CONFIG.AFFECTION_MAX) {
      this.state.affection = CONFIG.AFFECTION_MAX;
    }
    return this.state.affection;
  },

  // ----------------------------------------------------------
  // addExp：增加經驗值，達標自動升級
  // 參數：n（數字）—— 經驗值增加量
  // 回傳：true 如果升級了 / false 否則
  // ----------------------------------------------------------
  addExp: function (n) {
    if (!this.state) return false;
    this.state.exp += n;
    var leveledUp = false;

    // 升級判定：所需經驗 = LEVEL_BASE * level^LEVEL_EXP
    while (this.state.level < CONFIG.MAX_LEVEL) {
      var need = Math.floor(CONFIG.LEVEL_BASE * Math.pow(this.state.level, CONFIG.LEVEL_EXP));
      if (this.state.exp >= need) {
        this.state.exp -= need;
        this.state.level++;
        leveledUp = true;
      } else {
        break;
      }
    }
    return leveledUp;
  },

  // ----------------------------------------------------------
  // checkCooldown：檢查動作是否在冷卻中
  // 參數：action（字串）—— 動作 key（如 'feed'）
  // 回傳：true 可以執行 / false 冷卻中
  // ----------------------------------------------------------
  checkCooldown: function (action) {
    if (!this.state) return false;
    var cd = this.state.cooldowns[action];
    if (!cd) return true;
    // Date.now() 回傳毫秒，cooldown 也是毫秒
    return Date.now() >= cd;
  },

  // ----------------------------------------------------------
  // setCooldown：設定動作冷卻結束時間
  // 參數：action（字串）—— 動作 key
  // ----------------------------------------------------------
  setCooldown: function (action) {
    if (!this.state) return;
    var def = CONFIG.INTERACTIONS[action];
    if (!def) return;
    // 冷卻結束時間 = 現在 + cooldown 毫秒
    this.state.cooldowns[action] = Date.now() + def.cooldown;
  },

  // ----------------------------------------------------------
  // recordHabit：記錄玩家習慣（用於寵物記憶系統）
  // 參數：action（字串）—— 玩家執行的動作
  // ----------------------------------------------------------
  recordHabit: function (action) {
    if (!this.state) return;
    var habits = this.state.habits;
    // 累計各動作次數
    if (!habits.actions[action]) habits.actions[action] = 0;
    habits.actions[action]++;
    habits.lastAction = action;

    // 記錄探訪時段（0–23 小時）
    var hour = new Date().getHours();
    habits.visitHours.push(hour);
    // 只保留最近 30 次記錄，避免無限增長
    if (habits.visitHours.length > 30) {
      habits.visitHours.shift();
    }
  },

  // ----------------------------------------------------------
  // getMostUsedAction：取得玩家最常用的動作
  // 回傳：動作 key / null
  // ----------------------------------------------------------
  getMostUsedAction: function () {
    if (!this.state) return null;
    var actions = this.state.habits.actions;
    var max = 0, result = null;
    for (var k in actions) {
      if (actions[k] > max) {
        max = actions[k];
        result = k;
      }
    }
    return result;
  },

  // ----------------------------------------------------------
  // unlockSkill：解鎖技能
  // 參數：skillId（字串）
  // 回傳：true 成功解鎖 / false 等級不足或已解鎖
  // ----------------------------------------------------------
  unlockSkill: function (skillId) {
    if (!this.state) return false;
    if (this.state.skills.indexOf(skillId) >= 0) return false;
    // 從 SKILLS 定義找出解鎖等級
    for (var i = 0; i < CONFIG.SKILLS.length; i++) {
      if (CONFIG.SKILLS[i].id === skillId) {
        if (this.state.level >= CONFIG.SKILLS[i].unlockLevel) {
          this.state.skills.push(skillId);
          return true;
        }
        return false;
      }
    }
    return false;
  },

  // ----------------------------------------------------------
  // addDexEntry：新增圖鑑記錄
  // 參數：dexId（字串）
  // 回傳：true 新增成功 / false 已存在
  // ----------------------------------------------------------
  addDexEntry: function (dexId) {
    if (!this.state) return false;
    if (this.state.dex.indexOf(dexId) >= 0) return false;
    this.state.dex.push(dexId);
    return true;
  },

  // ----------------------------------------------------------
  // _isInMealTime：判斷目前是否在三餐時段
  // 參數：hour（數字 0–23）
  // 回傳：true/false
  // ----------------------------------------------------------
  _isInMealTime: function (hour) {
    var ranges = CONFIG.MEAL_TIMES;
    for (var i = 0; i < ranges.length; i++) {
      if (hour >= ranges[i][0] && hour < ranges[i][1]) return true;
    }
    return false;
  },

  // ----------------------------------------------------------
  // _todayStr：取得今日日期字串（YYYY-MM-DD）
  // 用於每日事件計數重置
  // ----------------------------------------------------------
  _todayStr: function () {
    var d = new Date();
    var m = (d.getMonth() + 1);
    var day = d.getDate();
    // 補零：月份同日期不足兩位時前面加 0
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }
};

window.Pet = Pet;

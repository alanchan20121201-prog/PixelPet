// ============================================================
// events.js —— 隨機事件系統
// ------------------------------------------------------------
// 用途：管理每日隨機事件的觸發、顯示、選擇與結果結算。
//       每日 1–3 件事件，有選項互動，稀有事件有特殊效果。
// 依賴：config.js、pet.js、stats.js、ui.js、audio.js、diary.js
// 對外提供：window.Events 物件
//   - Events.init()        初始化事件系統
//   - Events.checkDaily()  檢查並觸發每日事件
//   - Events.trigger(eventId) 觸發特定事件
//   - Events.resolve(choice)  處理玩家選擇
// ============================================================

var Events = {

  // 事件定義表
  // 每個事件：id、title_key、desc_key、choices（含 choice_key 同 effects）
  // rare：標記為稀有事件
  definitions: [
    {
      id: 'rainbow', rare: false,
      choices: [
        { key: 'event.rainbow.choice1', effects: { mood: 15, affection: 5 }, dex: 'rainbow' }
      ]
    },
    {
      id: 'shooting_star', rare: true,
      choices: [
        { key: 'event.shooting_star.choice1', effects: { mood: 20, affection: 8 }, dex: 'shooting_star', exp: 20 }
      ]
    },
    {
      id: 'visitor', rare: true,
      choices: [
        { key: 'event.visitor.choice1', effects: { mood: 10, affection: 3 }, dex: 'mysterious_visitor' },
        { key: 'event.visitor.choice2', effects: { mood: -5, affection: -2 } }
      ]
    },
    {
      id: 'find_treasure', rare: false,
      choices: [
        { key: 'event.find_treasure.choice1', effects: { mood: 10 }, exp: 15 }
      ]
    }
  ],

  currentEvent: null,

  // ----------------------------------------------------------
  // init：初始化事件系統
  // ----------------------------------------------------------
  init: function () {
    // 檢查每日事件計數是否需要重置
    this._checkDailyReset();
  },

  // ----------------------------------------------------------
  // checkDailyReset：檢查是否跨日，重置每日事件計數
  // ----------------------------------------------------------
  _checkDailyReset: function () {
    if (!Pet.state) return;
    var today = Pet._todayStr();
    if (Pet.state.dailyEventDate !== today) {
      // 新的一天，重置計數
      Pet.state.dailyEventDate = today;
      Pet.state.dailyEventCount = 0;
    }
  },

  // ----------------------------------------------------------
  // checkDaily：檢查並觸發每日事件
  // 由 main.js 每 tick 呼叫
  // 邏輯：每日最多 DAILY_EVENT_MAX 件，有機率觸發
  // ----------------------------------------------------------
  checkDaily: function () {
    if (!Pet.state) return;
    this._checkDailyReset();

    // 已達每日上限，不再觸發
    if (Pet.state.dailyEventCount >= CONFIG.DAILY_EVENT_MAX) return;

    // 隨機觸發機率：每 tick 約 5% 機率（每分鐘檢查一次）
    if (Math.random() > 0.05) return;

    // 隨機選一個事件
    var pool = this.definitions;

    // 技能 rare_finder：稀有事件機率提升
    var rareBoost = Pet.state.skills.indexOf('rare_finder') >= 0;

    // 20% 機率抽稀有事件（有技能則 40%）
    var rareChance = rareBoost ? 0.4 : 0.2;
    var useRare = Math.random() < rareChance;

    var filtered = [];
    for (var i = 0; i < pool.length; i++) {
      if (useRare && pool[i].rare) filtered.push(pool[i]);
      if (!useRare && !pool[i].rare) filtered.push(pool[i]);
    }
    if (filtered.length === 0) filtered = pool;

    var event = filtered[Math.floor(Math.random() * filtered.length)];
    this.trigger(event.id);
  },

  // ----------------------------------------------------------
  // trigger：觸發一個事件
  // 參數：eventId（字串）
  // ----------------------------------------------------------
  trigger: function (eventId) {
    var def = null;
    for (var i = 0; i < this.definitions.length; i++) {
      if (this.definitions[i].id === eventId) {
        def = this.definitions[i];
        break;
      }
    }
    if (!def) return;

    // 建立事件顯示物件
    var event = {
      id: def.id,
      title: I18n.t('event.' + def.id + '.title'),
      desc: I18n.t('event.' + def.id + '.desc'),
      choices: []
    };

    for (var j = 0; j < def.choices.length; j++) {
      event.choices.push({
        text: I18n.t(def.choices[j].key),
        effects: def.choices[j].effects,
        dex: def.choices[j].dex,
        exp: def.choices[j].exp || 0
      });
    }

    this.currentEvent = def;
    UI.showEvent(event);
    UI.showDialogue(I18n.t('dialogue.event_new'));

    // 播放事件音效
    if (typeof Audio2 !== 'undefined') {
      Audio2.playSFX(def.rare ? 'sfxRare' : 'sfxEvent');
    }

    // 發射粒子
    Renderer.emitParticles(def.rare ? 'sparkle' : 'star', 5);

    // 計入每日計數
    Pet.state.dailyEventCount++;
  },

  // ----------------------------------------------------------
  // resolve：處理玩家的事件選擇
  // 參數：choice（物件）—— { text, effects, dex, exp }
  // ----------------------------------------------------------
  resolve: function (choice) {
    // 套用數值效果
    if (choice.effects) {
      for (var key in choice.effects) {
        Stats.modify(key, choice.effects[key]);
      }
    }

    // 增加經驗值
    if (choice.exp) {
      var leveledUp = Pet.addExp(choice.exp);
      if (leveledUp) {
        if (typeof Audio2 !== 'undefined') Audio2.playSFX('sfxLevelup');
        UI.showDialogue(I18n.t('dialogue.levelup'));
        if (typeof Diary !== 'undefined') Diary.addEntry('diary.entry_levelup');
      }
    }

    // 新增圖鑑記錄
    if (choice.dex) {
      if (Pet.addDexEntry(choice.dex)) {
        if (typeof Growth !== 'undefined') Growth.showDexNotification(choice.dex);
      }
    }

    // 記錄日記
    if (typeof Diary !== 'undefined') {
      if (this.currentEvent && this.currentEvent.rare) {
        Diary.addEntry('diary.entry_rare');
      } else {
        Diary.addEntry('diary.entry_event');
      }
    }

    // 關閉事件面板
    UI.hideEvent();
    this.currentEvent = null;

    // 更新 UI
    UI.update();
  }
};

window.Events = Events;

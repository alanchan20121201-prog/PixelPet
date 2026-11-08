// ============================================================
// dialogue.js —— 對話系統
// ------------------------------------------------------------
// 用途：管理寵物對話內容，根據心情、狀態、性格產生對話。
//       提供隨機聊天、狀態提示、自動對話等功能。
// 依賴：config.js（I18n 翻譯）、pet.js（Pet.state 心情）
// 對外提供：window.Dialogue 物件
//   - Dialogue.say(key)        顯示翻譯表中的對話
//   - Dialogue.randomChat()    隨機聊天對話
//   - Dialogue.checkStatus()   依數值狀態產生提示對話
//   - Dialogue.getMoodDialogue() 依心情產生對話
// ============================================================

var Dialogue = {

  // ----------------------------------------------------------
  // say：顯示翻譯表中的對話
  // 參數：key（字串）—— 如 'dialogue.hungry'
  // ----------------------------------------------------------
  say: function (key) {
    var text = I18n.t(key);
    UI.showDialogue(text);
  },

  // ----------------------------------------------------------
  // randomChat：隨機聊天對話
  // 從 chat1/chat2/chat3 中隨機選一個
  // ----------------------------------------------------------
  randomChat: function () {
    var n = Math.floor(Math.random() * 3) + 1;
    this.say('dialogue.chat' + n);
  },

  // ----------------------------------------------------------
  // checkStatus：依寵物數值狀態產生提示對話
  // 若有緊急需求（飢餓/口渴/骯髒/疲勞/生病）優先提示
  // 回傳：true 有顯示狀態對話 / false 狀態正常
  // ----------------------------------------------------------
  checkStatus: function () {
    if (!Pet.state) return false;
    var s = Pet.state.stats;

    // 優先級：生病 > 飢餓 > 口渴 > 骯髒 > 疲勞
    if (s.health < CONFIG.STAT_LOW_THRESHOLD) {
      this.say('dialogue.sick');
      if (typeof Audio2 !== 'undefined') Audio2.playSFX('sfxHungry');
      return true;
    }
    if (s.hunger < CONFIG.STAT_LOW_THRESHOLD) {
      this.say('dialogue.hungry');
      if (typeof Audio2 !== 'undefined') Audio2.playSFX('sfxHungry');
      return true;
    }
    if (s.thirst < CONFIG.STAT_LOW_THRESHOLD) {
      this.say('dialogue.thirsty');
      return true;
    }
    if (s.clean < CONFIG.STAT_LOW_THRESHOLD) {
      this.say('dialogue.dirty');
      return true;
    }
    if (s.energy < CONFIG.STAT_LOW_THRESHOLD) {
      this.say('dialogue.tired');
      return true;
    }
    return false;
  },

  // ----------------------------------------------------------
  // getMoodDialogue：依心情產生對話
  // 回傳：對話文字
  // ----------------------------------------------------------
  getMoodDialogue: function () {
    if (!Pet.state) return '';
    var mood = Pet.state.mood;

    // 不同心情有不同對話池
    var dialogueMap = {
      excited: ['dialogue.chat2', 'dialogue.happy_play'],
      happy:   ['dialogue.chat2', 'dialogue.happy_feed'],
      normal:  ['dialogue.chat1', 'dialogue.chat3'],
      bored:   ['dialogue.chat3'],
      sad:     ['dialogue.sick'],
      angry:   ['dialogue.no_energy']
    };

    var pool = dialogueMap[mood] || ['dialogue.chat1'];
    var key = pool[Math.floor(Math.random() * pool.length)];
    return I18n.t(key);
  },

  // ----------------------------------------------------------
  // autoTalk：自動對話（每隔一段時間隨機說一句話）
  // 由 main.js 的遊戲循環定時呼叫
  // ----------------------------------------------------------
  autoTalk: function () {
    if (!Pet.state) return;

    // 先檢查緊急狀態
    if (this.checkStatus()) return;

    // 50% 機率說心情對話，50% 機率不說話
    if (Math.random() < 0.5) {
      var text = this.getMoodDialogue();
      if (text) UI.showDialogue(text);
    }
  }
};

window.Dialogue = Dialogue;

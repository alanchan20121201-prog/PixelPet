// ============================================================
// interactions.js —— 互動系統
// ------------------------------------------------------------
// 用途：綁定所有互動按鈕事件，執行照顧、娛樂、成長動作。
//       每個動作會影響數值、好感度、經驗值，並觸發音效、
//       粒子特效、對話、日記記錄。
// 依賴：config.js、pet.js、stats.js、renderer.js、ui.js、
//       dialogue.js、audio.js、diary.js
// 對外提供：window.Interactions 物件
//   - Interactions.init()          綁定按鈕事件
//   - Interactions.doAction(action) 執行動作
// ============================================================

var Interactions = {

  // ----------------------------------------------------------
  // init：綁定所有互動按鈕事件
  // ----------------------------------------------------------
  init: function () {
    var self = this;

    // 照顧/娛樂/成長按鈕（data-action 屬性）
    var btns = document.querySelectorAll('[data-action]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        var action = this.getAttribute('data-action');
        self.doAction(action);
      });
    }

    // 場景切換按鈕（data-scene 屬性）
    var sceneBtns = document.querySelectorAll('[data-scene]');
    for (var j = 0; j < sceneBtns.length; j++) {
      sceneBtns[j].addEventListener('click', function () {
        var scene = this.getAttribute('data-scene');
        self.switchScene(scene);
        // 更新 active 狀態
        for (var k = 0; k < sceneBtns.length; k++) {
          sceneBtns[k].classList.remove('active');
        }
        this.classList.add('active');
      });
    }
  },

  // ----------------------------------------------------------
  // doAction：執行一個互動動作
  // 參數：action（字串）—— 動作 key
  // 邏輯：
  //   1. 成長類動作（skills/dex/diary/share）開啟彈窗，不消耗數值
  //   2. 照顧/娛樂動作檢查冷卻、體力、執行效果、播放音效粒子
  // ----------------------------------------------------------
  doAction: function (action) {
    // --- 成長類：開啟彈窗 ---
    if (action === 'skills') {
      UI.showPanel('skills-panel');
      if (typeof Growth !== 'undefined') Growth.renderSkills();
      return;
    }
    if (action === 'dex') {
      UI.showPanel('dex-panel');
      if (typeof Growth !== 'undefined') Growth.renderDex();
      return;
    }
    if (action === 'diary') {
      UI.showPanel('diary-panel');
      if (typeof Diary !== 'undefined') Diary.render();
      return;
    }
    if (action === 'share') {
      UI.showPanel('share-panel');
      UI.renderShareCard();
      return;
    }

    // --- 照顧/娛樂類 ---
    var def = CONFIG.INTERACTIONS[action];
    if (!def) return;

    // 檢查冷卻
    if (!Pet.checkCooldown(action)) {
      UI.showDialogue(I18n.t('msg.cooldown'));
      return;
    }

    // 檢查體力（消耗體力的動作需足夠）
    if (def.energyCost > 0 && Pet.state.stats.energy < def.energyCost) {
      UI.showDialogue(I18n.t('dialogue.no_energy'));
      if (typeof Audio2 !== 'undefined') Audio2.playSFX('sfxHungry');
      return;
    }

    // 執行動作
    this._executeAction(action, def);

    // 設定冷卻
    Pet.setCooldown(action);

    // 記錄習慣
    Pet.recordHabit(action);
  },

  // ----------------------------------------------------------
  // _executeAction：實際執行動作效果
  // 內部函數，由 doAction 呼叫
  // 參數：action（字串）、def（CONFIG.INTERACTIONS 中的定義）
  // ----------------------------------------------------------
  _executeAction: function (action, def) {
    var personality = CONFIG.PERSONALITIES[Pet.state.personality] || {};
    var mod = (personality.interactMod && personality.interactMod[action]) || 1;

    // 套用數值效果（乘以性格倍率）
    for (var key in def.effects) {
      var amount = def.effects[key] * mod;
      Stats.modify(key, amount);
    }

    // 消耗體力
    if (def.energyCost > 0) {
      Stats.modify('energy', -def.energyCost);
    }

    // 增加好感度
    Pet.addAffection(def.affection);

    // 增加經驗值
    var leveledUp = Pet.addExp(def.exp);
    if (leveledUp) {
      if (typeof Audio2 !== 'undefined') Audio2.playSFX('sfxLevelup');
      UI.showDialogue(I18n.t('dialogue.levelup'));
      Renderer.emitParticles('star', 8);
      if (typeof Diary !== 'undefined') Diary.addEntry('diary.entry_levelup');
    }

    // 特殊處理：散步
    // 注意：提前 return 前必須更新 UI，否則等級/數值/經驗條不會立即變化
    if (action === 'walk') {
      this._doWalk();
      UI.update();
      return;
    }

    // 特殊處理：睡覺
    if (action === 'sleep') {
      Pet.state.sleepMode = true;
      Renderer.setPetAction('sleep');
      Renderer.emitParticles('zzz', 3);
      if (typeof Audio2 !== 'undefined') Audio2.playSFX('sfxSleep');
      this._showActionDialogue(action);
      if (typeof Diary !== 'undefined') Diary.addEntry('diary.entry_sleep');
      UI.update();
      return;
    }

    // 設定寵物動畫狀態
    var actionSpriteMap = {
      feed: 'eat', drink: 'drink', clean: 'bath', toilet: 'bath',
      play: 'play', train: 'play', chat: 'happy'
    };
    var sprite = actionSpriteMap[action] || 'happy';
    Renderer.setPetAction(sprite);

    // 播放音效
    this._playActionSFX(action);

    // 發射粒子
    this._emitActionParticles(action);

    // 顯示對話
    this._showActionDialogue(action);

    // 記錄日記
    if (typeof Diary !== 'undefined') {
      var diaryMap = {
        feed: 'diary.entry_feed', clean: 'diary.entry_clean',
        play: 'diary.entry_play'
      };
      if (diaryMap[action]) Diary.addEntry(diaryMap[action]);
    }

    // 更新 UI
    UI.update();
  },

  // ----------------------------------------------------------
  // _doWalk：散步特殊流程
  // 隨機選擇散步地點（公園/海灘/森林），切換場景
  // ----------------------------------------------------------
  _doWalk: function () {
    var walkScenes = ['park', 'beach', 'forest'];
    var scene = walkScenes[Math.floor(Math.random() * walkScenes.length)];
    Pet.state.isWalking = true;
    Pet.state.walkScene = scene;

    // 切換到散步場景
    Renderer.setScene(scene);
    Renderer.setPetAction('play');
    Renderer.emitParticles('sparkle', 5);

    // 播放散步 BGM
    if (typeof Audio2 !== 'undefined') Audio2.playBGM('bgmWalk');

    // 顯示對話
    var dialogueMap = {
      park: 'dialogue.walk_park',
      beach: 'dialogue.walk_beach',
      forest: 'dialogue.walk_forest'
    };
    UI.showDialogue(I18n.t(dialogueMap[scene]));

    // 記錄日記
    if (typeof Diary !== 'undefined') {
      Diary.addEntry('diary.entry_walk_' + scene);
    }

    // 散步有機會發現圖鑑物品
    var dexMap = { park: 'butterfly', beach: 'shell', forest: 'firefly' };
    if (Math.random() < 0.3) {
      var dexId = dexMap[scene];
      if (Pet.addDexEntry(dexId) && typeof Growth !== 'undefined') {
        Growth.showDexNotification(dexId);
      }
    }

    // 散步結束後自動回到原場景（10 秒後）
    var self = this;
    setTimeout(function () {
      Pet.state.isWalking = false;
      Pet.state.walkScene = null;
      Renderer.setScene(Pet.state.currentScene);
      Renderer.setPetAction('idle');
      // 恢復日夜 BGM
      if (typeof Audio2 !== 'undefined') Audio2.updateBGM();
    }, 10000); // 10000ms = 10 秒
  },

  // ----------------------------------------------------------
  // switchScene：切換房間場景
  // 參數：scene（字串）—— 'bedroom','livingroom','garden'
  // ----------------------------------------------------------
  switchScene: function (scene) {
    if (Pet.state.isWalking) return; // 散步中不能切換
    Pet.state.currentScene = scene;
    Renderer.setScene(scene);

    // 睡房自動觸發睡覺模式
    if (scene === 'bedroom') {
      Renderer.setPetAction('sleep');
    } else {
      // 根據心情決定動畫
      Renderer.setPetAction(Sprites.getMoodSprite(Pet.state.mood));
    }
  },

  // ----------------------------------------------------------
  // _playActionSFX：播放動作對應的音效
  // ----------------------------------------------------------
  _playActionSFX: function (action) {
    if (typeof Audio2 === 'undefined') return;
    var map = {
      feed: 'sfxEat', drink: 'sfxEat', clean: 'sfxClean',
      play: 'sfxHappy', train: 'sfxClick', chat: 'sfxHappy'
    };
    if (map[action]) Audio2.playSFX(map[action]);
  },

  // ----------------------------------------------------------
  // _emitActionParticles：發射動作對應的粒子
  // ----------------------------------------------------------
  _emitActionParticles: function (action) {
    var map = {
      feed: ['heart', 3], drink: ['drop', 3], clean: ['drop', 5],
      play: ['star', 5], train: ['star', 3], chat: ['heart', 4]
    };
    if (map[action]) {
      Renderer.emitParticles(map[action][0], map[action][1]);
    }
  },

  // ----------------------------------------------------------
  // _showActionDialogue：顯示動作對應的對話
  // ----------------------------------------------------------
  _showActionDialogue: function (action) {
    var map = {
      feed: 'dialogue.happy_feed', drink: 'dialogue.happy_feed',
      clean: 'dialogue.happy_clean', play: 'dialogue.happy_play',
      train: 'dialogue.train_ok', chat: 'dialogue.chat' + (Math.floor(Math.random() * 3) + 1)
    };
    if (map[action]) {
      UI.showDialogue(I18n.t(map[action]));
    }
  }
};

window.Interactions = Interactions;

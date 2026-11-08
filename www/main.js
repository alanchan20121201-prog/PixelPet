// ============================================================
// main.js —— 遊戲主入口與主循環
// ------------------------------------------------------------
// 用途：遊戲啟動流程控制、離線結算、主循環（定時更新
//       數值、UI、事件）、存檔管理。
//       這是最後載入的 JS 檔案，協調所有模組運作。
// 依賴：全部其他 JS 檔案
// 對外提供：window.Main（遊戲啟動入口）
// ============================================================

// 桌面外殼（Program.cs）會在頁面載入前注入 window.__PETLANG__
// 每個 exe 各自對應一種語言，且該語言不可由玩家更改。
// 注意：ui.js 載入時已把 I18n.currentLang 初始化成 CONFIG.DEFAULT_LANG，
// 所以這裡必須同時覆寫 I18n.currentLang，否則語言注入不會生效。
(function () {
  var lang = window.__PETLANG__;
  if (lang && CONFIG.I18N[lang]) {
    CONFIG.DEFAULT_LANG = lang;
    if (window.I18n) I18n.currentLang = lang;
  }
})();

var Main = {

  tickTimer: null,      // 主循環計時器 ID
  autoSaveTimer: null,  // 自動存檔計時器 ID
  lastDate: '',         // 追蹤跨日（用於生成日記）

  // ----------------------------------------------------------
  // start：遊戲啟動入口
  // 由頁面底部的啟動邏輯呼叫
  // 流程：載入素材 → 顯示開始畫面 → 等玩家選擇
  // ----------------------------------------------------------
  start: function () {
    var self = this;

    // 載入全部素材
    Assets.load(function () {
      // 素材載入完成，初始化音效系統
      Audio2.init();

      // 檢查是否有存檔
      if (Storage.hasSave()) {
        // 有存檔，顯示開始畫面（可繼續）
        UI.showScreen('start');
        var continueBtn = document.getElementById('btn-continue');
        if (continueBtn) continueBtn.classList.remove('hidden');
      } else {
        // 無存檔，直接顯示開始畫面（只有新遊戲）
        UI.showScreen('start');
        var cb = document.getElementById('btn-continue');
        if (cb) cb.classList.add('hidden');
      }

      // 初始化 UI 事件綁定
      UI.init();
      self._bindStartButtons();
    }, function (progress) {
      // 載入進度回呼：更新載入畫面顯示百分比
      var el = document.querySelector('#loading-screen h2');
      if (el) {
        el.textContent = I18n.t('loading') + ' ' + Math.round(progress * 100) + '%';
      }
    });
  },

  // ----------------------------------------------------------
  // _bindStartButtons：綁定開始畫面的按鈕事件
  // 內部函數
  // ----------------------------------------------------------
  _bindStartButtons: function () {
    var self = this;

    var newBtn = document.getElementById('btn-new-game');
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        Audio2.resume(); // 使用者互動後恢復音訊
        self.newGame();
      });
    }

    var continueBtn = document.getElementById('btn-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        Audio2.resume();
        self.continueGame();
      });
    }
  },

  // ----------------------------------------------------------
  // newGame：開始新遊戲
  // 建立新寵物，進入遊戲
  // ----------------------------------------------------------
  newGame: function () {
    // 預設名字（日後可加命名介面）
    var name = 'Pixel';
    Pet.create(name);

    // 初始化各模組
    this._initGame();

    // 顯示歡迎對話
    UI.showDialogue(I18n.t('dialogue.welcome'));
  },

  // ----------------------------------------------------------
  // continueGame：繼續遊戲（讀取存檔）
  // ----------------------------------------------------------
  continueGame: function () {
    var data = Storage.load();
    if (!data) {
      UI.showDialogue(I18n.t('msg.no_save'));
      return;
    }

    // 載入寵物狀態
    Pet.loadFromSave(data);

    // 離線結算
    this._processOffline();

    // 初始化各模組
    this._initGame();
  },

  // ----------------------------------------------------------
  // _initGame：進入遊戲的共用初始化
  // 內部函數
  // ----------------------------------------------------------
  _initGame: function () {
    // 套用語言翻譯（UI.init 已在 start() 中綁定事件，這裡不重複）
    I18n.applyAll();

    // 渲染數值條
    Stats.render();

    // 初始化渲染器
    var canvas = document.getElementById('game-canvas');
    Renderer.init(canvas);
    Renderer.setScene(Pet.state.currentScene);

    // 根據心情設定寵物動畫
    var moodSprite = Sprites.getMoodSprite(Pet.state.mood);
    if (Pet.state.sleepMode) {
      Renderer.setPetAction('sleep');
    } else {
      Renderer.setPetAction(moodSprite);
    }

    // 更新日夜濾鏡
    Renderer.updateDayNight();

    // 啟動動畫循環
    Renderer.start();

    // 初始化事件系統
    Events.init();

    // 播放 BGM
    Audio2.updateBGM();

    // 初始化互動按鈕
    Interactions.init();

    // 更新 UI
    UI.update();

    // 標記場景按鈕 active
    this._markActiveScene();

    // 顯示遊戲畫面
    UI.showScreen('game');

    // 記錄今日日期（用於跨日檢測）
    this.lastDate = Pet._todayStr();

    // 啟動主循環
    this._startTick();

    // 設定互動時恢復音訊
    document.body.addEventListener('click', function () {
      Audio2.resume();
    }, { once: false });
  },

  // ----------------------------------------------------------
  // _markActiveScene：標記目前場景按鈕為 active
  // 內部函數
  // ----------------------------------------------------------
  _markActiveScene: function () {
    var btns = document.querySelectorAll('#scene-switcher button');
    for (var i = 0; i < btns.length; i++) {
      var scene = btns[i].getAttribute('data-scene');
      if (scene === Pet.state.currentScene) {
        btns[i].classList.add('active');
      } else {
        btns[i].classList.remove('active');
      }
    }
  },

  // ----------------------------------------------------------
  // _processOffline：離線結算
  // 計算離線時長，更新數值，生成離線報告
  // 內部函數
  // ----------------------------------------------------------
  _processOffline: function () {
    var now = Date.now();
    // lastTick 是上次存檔時的時間戳
    var lastTick = Pet.state.lastTick || now;
    // 計算離線時長（毫秒轉小時）
    var deltaMs = now - lastTick;
    var deltaHours = deltaMs / 3600000; // 3600000ms = 1 小時

    if (deltaHours < 0.1) return; // 不到 6 分鐘，不結算

    // 更新數值
    Pet.updateStats(deltaHours);

    // 離線期間模擬事件（簡單版：記錄一條日記）
    if (typeof Diary !== 'undefined' && deltaHours > 1) {
      Diary.addEntry('diary.entry_idle');
    }
  },

  // ----------------------------------------------------------
  // _startTick：啟動主循環
  // 每 TICK_INTERVAL（60000ms=1 分鐘）執行一次
  // 內部函數
  // ----------------------------------------------------------
  _startTick: function () {
    var self = this;
    if (this.tickTimer) clearInterval(this.tickTimer);

    this.tickTimer = setInterval(function () {
      self._tick();
    }, CONFIG.TICK_INTERVAL);

    // 自動存檔：每 30 秒存一次
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.autoSaveTimer = setInterval(function () {
      self._save();
    }, 30000); // 30000ms = 30 秒
  },

  // ----------------------------------------------------------
  // _tick：主循環單次執行
  // 每分鐘呼叫一次，處理：
  //   1. 數值衰減（每小時的衰減量按比例分配到每分鐘）
  //   2. 跨日檢查
  //   3. 日夜濾鏡更新
  //   4. 事件觸發
  //   5. UI 更新
  //   6. 存檔
  // 內部函數
  // ----------------------------------------------------------
  _tick: function () {
    if (!Pet.state) return;

    // --- 1. 數值衰減 ---
    // 每 tick = 1 分鐘 = 1/60 小時
    var deltaHours = 1 / CONFIG.TICKS_PER_HOUR;
    Pet.updateStats(deltaHours);

    // --- 2. 跨日檢查 ---
    var today = Pet._todayStr();
    if (this.lastDate !== today) {
      // 跨日了，生成昨日日記
      if (typeof Diary !== 'undefined') Diary.generateDaily();
      this.lastDate = today;
    }

    // --- 3. 日夜濾鏡 ---
    Renderer.updateDayNight();

    // --- 4. BGM 更新 ---
    Audio2.updateBGM();

    // --- 5. 檢查技能解鎖 ---
    var newSkills = Growth.checkUnlocks();
    if (newSkills.length > 0) {
      UI.showDialogue(I18n.t('msg.skill_unlocked'));
      Renderer.emitParticles('star', 6);
    }

    // --- 6. 事件觸發 ---
    Events.checkDaily();

    // --- 7. 睡覺模式自動退出 ---
    // 體力恢復到 90 以上或睡眠到 100 時自動醒來
    if (Pet.state.sleepMode) {
      if (Pet.state.stats.energy >= 90 || Pet.state.stats.sleep >= 100) {
        Pet.state.sleepMode = false;
        Renderer.setPetAction(Sprites.getMoodSprite(Pet.state.mood));
      }
    }

    // --- 8. 更新 UI ---
    UI.update();

    // --- 9. 存檔 ---
    this._save();
  },

  // ----------------------------------------------------------
  // _save：儲存遊戲
  // 內部函數
  // ----------------------------------------------------------
  _save: function () {
    if (!Pet.state) return;
    // 更新時間戳
    Pet.state.lastTick = Date.now();
    Storage.save(Pet.state);
  }
};

// ============================================================
// 遊戲啟動（不依賴 load 事件，因為部分環境 load 事件不可靠）
// 三重保險：
//   1. readyState 已就緒 → 直接啟動
//   2. DOMContentLoaded → 解析完成即啟動（不必等全部資源）
//   3. 1 秒兜底計時器 → 無論如何都啟動一次
// ============================================================
(function () {
  var booted = false;

  function boot() {
    if (booted) return; // 防止重複啟動
    booted = true;
    Main.start();
  }

  // 1. 若 DOM 已就緒（腳本執行到此時通常已完成解析），直接啟動
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // setTimeout 0 確保在下一個事件循環啟動，讓所有模組先完成定義
    setTimeout(boot, 0);
  } else {
    // 2. DOM 解析完成即啟動（不等圖片等資源）
    document.addEventListener('DOMContentLoaded', boot);
  }

  // 3. 兜底：1 秒後無論如何都啟動（處理事件遺漏的極端情況）
  setTimeout(boot, 1000);
})();

// 關閉頁面前存檔
window.addEventListener('beforeunload', function () {
  if (Pet.state) {
    Pet.state.lastTick = Date.now();
    Storage.save(Pet.state);
  }
});

window.Main = Main;

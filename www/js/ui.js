// ============================================================
// ui.js —— 介面管理與多語言系統
// ------------------------------------------------------------
// 用途：統一管理所有 DOM 元素的更新，包括：
//       1. 多語言切換（I18n 翻譯表，四種語言）
//       2. 頂部資訊（名字、等級、時間、心情）
//       3. 好感度條更新
//       4. 彈窗面板開關（日記、技能、圖鑑、分享卡）
//       5. 對話框文字顯示（含打字機效果）
//       6. 分享卡 Canvas 繪製
// 依賴：config.js、pet.js、stats.js、sprites.js、renderer.js
// 對外提供：window.UI、window.I18n
// ============================================================

// ============================================================
// I18n —— 多語言翻譯引擎
// ============================================================
var I18n = {
  currentLang: CONFIG.DEFAULT_LANG,

  // t：翻譯函數
  // 參數：key（字串）—— 翻譯表的 key
  // 回傳：目前語言對應的文字，找不到則回傳 key
  t: function (key) {
    var table = CONFIG.I18N[this.currentLang];
    if (table && table[key] !== undefined) {
      return table[key];
    }
    return key;
  },

  // setLang：切換語言
  // 參數：lang（字串）—— 'zh-TW','zh-CN','en','ja'
  setLang: function (lang) {
    // 桌面 exe 語言已鎖定，任何切換請求都直接忽略
    if (window.__PETLANG__) return;
    if (!CONFIG.I18N[lang]) return;
    this.currentLang = lang;
    if (Pet.state) Pet.state.lang = lang;
    this.applyAll();
  },

  // applyAll：將所有 data-i18n 元素的文字替換為目前語言
  applyAll: function () {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      var text = this.t(key);
      // 空字串則不覆蓋（保留原本內容）
      if (text !== '') {
        els[i].textContent = text;
      }
    }
    // 同時更新數值條標籤（stats.js 動態生成的）
    var statLabels = document.querySelectorAll('.stat-label[data-stat]');
    for (var j = 0; j < statLabels.length; j++) {
      var sk = statLabels[j].getAttribute('data-stat');
      statLabels[j].textContent = this.t('stat.' + sk);
    }
    // 更新心情文字
    UI.updateMood();
  }
};

// ============================================================
// UI —— 介面管理
// ============================================================
var UI = {

  typingTimer: null,

  // ----------------------------------------------------------
  // init：初始化 UI，綁定事件
  // ----------------------------------------------------------
  init: function () {
    var self = this;

    // 語言切換按鈕
    var langBtns = document.querySelectorAll('#lang-switcher button');
    for (var i = 0; i < langBtns.length; i++) {
      langBtns[i].addEventListener('click', function () {
        var lang = this.getAttribute('data-lang');
        self.setLanguage(lang);
      });
    }

    // 彈窗關閉按鈕（所有 data-close 按鈕）
    var closeBtns = document.querySelectorAll('[data-close]');
    for (var j = 0; j < closeBtns.length; j++) {
      closeBtns[j].addEventListener('click', function () {
        var target = this.getAttribute('data-close');
        self.hidePanel(target);
      });
    }

    // 分享卡下載按鈕
    var dlBtn = document.getElementById('share-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        self.downloadShareCard();
      });
    }

    // 桌面 exe 的固定語言優先（覆蓋存檔裡的舊語言，確保不能改）
    // 沒有固定語言時（純瀏覽器）才沿用存檔語言
    if (window.__PETLANG__ && CONFIG.I18N[window.__PETLANG__]) {
      I18n.currentLang = window.__PETLANG__;
    } else if (Pet.state && Pet.state.lang) {
      I18n.currentLang = Pet.state.lang;
    }
    I18n.applyAll();
  },

  // ----------------------------------------------------------
  // setLanguage：切換語言
  // 參數：lang（字串）
  // ----------------------------------------------------------
  setLanguage: function (lang) {
    I18n.setLang(lang);

    // 更新語言按鈕 active 狀態
    var btns = document.querySelectorAll('#lang-switcher button');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('data-lang') === lang) {
        btns[i].classList.add('active');
      } else {
        btns[i].classList.remove('active');
      }
    }
  },

  // ----------------------------------------------------------
  // update：更新全部介面資訊（每 tick 呼叫）
  // ----------------------------------------------------------
  update: function () {
    if (!Pet.state) return;
    var s = Pet.state;

    // 寵物名字
    var nameEl = document.getElementById('pet-name');
    if (nameEl) nameEl.textContent = s.name;

    // 等級
    var lvEl = document.getElementById('level-value');
    if (lvEl) lvEl.textContent = s.level;

    // 遊戲時間（HH:MM 格式）
    var timeEl = document.getElementById('game-time');
    if (timeEl) {
      var now = new Date();
      var h = now.getHours();
      var m = now.getMinutes();
      timeEl.textContent = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
    }

    // 好感度
    var affFill = document.getElementById('affection-fill');
    var affText = document.getElementById('affection-text');
    if (affFill) affFill.style.width = s.affection + '%';
    if (affText) affText.textContent = s.affection + '/' + CONFIG.AFFECTION_MAX;

    // 經驗值進度條
    // need 為升到下一級所需經驗；已達最高等級時 need=0，進度顯示為滿
    var need = Pet.expToNextLevel();
    var expFill = document.getElementById('exp-fill');
    var expText = document.getElementById('exp-text');
    if (expFill) {
      // 百分比上限 100，避免 exp 溢出時條超出範圍
      var pct = need > 0 ? Math.min(100, Math.round((s.exp / need) * 100)) : 100;
      expFill.style.width = pct + '%';
      // 接近升級時改用黃色提示
      if (pct >= 80) {
        expFill.classList.add('exp-near');
      } else {
        expFill.classList.remove('exp-near');
      }
    }
    if (expText) {
      expText.textContent = need > 0
        ? Math.round(s.exp) + ' / ' + need
        : I18n.t('msg.max_level');
    }

    // 數值條
    Stats.update();

    // 心情
    this.updateMood();
  },

  // ----------------------------------------------------------
  // updateMood：更新心情顯示
  // ----------------------------------------------------------
  updateMood: function () {
    if (!Pet.state) return;
    var moodEl = document.getElementById('mood-value');
    if (moodEl) {
      moodEl.textContent = I18n.t('mood.' + Pet.state.mood);
    }
  },

  // ----------------------------------------------------------
  // showDialogue：顯示對話文字（含打字機效果）
  // 參數：text（字串）—— 要顯示的文字
  // ----------------------------------------------------------
  showDialogue: function (text) {
    var el = document.getElementById('dialogue-text');
    if (!el) return;

    // 清除之前的打字計時器
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }

    el.textContent = '';
    el.classList.add('typing');

    var i = 0;
    var self = this;
    // 每 40 毫秒顯示一個字，模擬打字效果
    this.typingTimer = setInterval(function () {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
      } else {
        // 打字完成
        clearInterval(self.typingTimer);
        self.typingTimer = null;
        el.classList.remove('typing');
      }
    }, 40);
  },

  // ----------------------------------------------------------
  // showPanel：顯示彈窗面板
  // 參數：panelId（字串）—— 面板的 DOM id
  // ----------------------------------------------------------
  showPanel: function (panelId) {
    var el = document.getElementById(panelId);
    if (el) el.classList.remove('hidden');
  },

  // ----------------------------------------------------------
  // hidePanel：隱藏彈窗面板
  // 參數：panelId（字串）
  // ----------------------------------------------------------
  hidePanel: function (panelId) {
    var el = document.getElementById(panelId);
    if (el) el.classList.add('hidden');
  },

  // ----------------------------------------------------------
  // showEvent：顯示事件面板
  // 參數：event（物件）—— { title, desc, choices }
  // ----------------------------------------------------------
  showEvent: function (event) {
    var box = document.getElementById('event-box');
    if (!box) return;
    box.classList.remove('hidden');

    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-desc').textContent = event.desc;

    // 生成選項按鈕
    var choicesEl = document.getElementById('event-choices');
    choicesEl.innerHTML = '';
    for (var i = 0; i < event.choices.length; i++) {
      (function (choice) {
        var btn = document.createElement('button');
        btn.textContent = choice.text;
        btn.addEventListener('click', function () {
          if (typeof Events !== 'undefined') {
            Events.resolve(choice);
          }
        });
        choicesEl.appendChild(btn);
      })(event.choices[i]);
    }
  },

  // ----------------------------------------------------------
  // hideEvent：隱藏事件面板
  // ----------------------------------------------------------
  hideEvent: function () {
    var box = document.getElementById('event-box');
    if (box) box.classList.add('hidden');
  },

  // ----------------------------------------------------------
  // showScreen：切換主要畫面
  // 參數：screen（字串）—— 'loading','start','game'
  // ----------------------------------------------------------
  showScreen: function (screen) {
    var loading = document.getElementById('loading-screen');
    var start = document.getElementById('start-screen');
    var game = document.getElementById('game-container');

    loading.classList.add('hidden');
    start.classList.add('hidden');
    game.classList.add('hidden');

    if (screen === 'loading') loading.classList.remove('hidden');
    else if (screen === 'start') start.classList.remove('hidden');
    else if (screen === 'game') game.classList.remove('hidden');
  },

  // ----------------------------------------------------------
  // renderShareCard：在 share-canvas 上繪製狀態卡
  // 用素材 status-card-bg.png 作背景，疊上寵物立繪同資訊
  // ----------------------------------------------------------
  renderShareCard: function () {
    var canvas = document.getElementById('share-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 背景圖（600×800）
    var bg = Sprites.getCardBgImage();
    if (bg) {
      ctx.drawImage(bg, 0, 0, 600, 800);
    } else {
      ctx.fillStyle = '#7dd3c0';
      ctx.fillRect(0, 0, 600, 800);
    }

    // 寵物立繪（置中偏上）
    var portrait = Sprites.getPetPortrait();
    if (portrait) {
      // 立繪 96×96，放大到 200×200 置中
      var pw = 200, ph = 200;
      var px = (600 - pw) / 2;
      var py = 200;
      ctx.drawImage(portrait, 0, 0, 96, 96, px, py, pw, ph);
    }

    if (!Pet.state) return;
    var s = Pet.state;

    // 文字設定
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';

    // 名字
    ctx.fillText(s.name, 300, 120);

    // 等級
    ctx.font = '24px sans-serif';
    ctx.fillText('Lv.' + s.level, 300, 460);

    // 七項數值
    ctx.textAlign = 'left';
    ctx.font = '20px sans-serif';
    var statKeys = Stats.statKeys;
    var sy = 510;
    for (var i = 0; i < statKeys.length; i++) {
      var key = statKeys[i];
      var label = I18n.t('stat.' + key);
      var val = Math.round(s.stats[key]);
      ctx.fillText(label + ': ' + val, 80, sy);
      sy += 30;
    }

    // 好感度
    ctx.fillText(I18n.t('panel.affection') + ': ' + s.affection, 80, sy + 10);
  },

  // ----------------------------------------------------------
  // downloadShareCard：下載分享卡為 PNG
  // ----------------------------------------------------------
  downloadShareCard: function () {
    var canvas = document.getElementById('share-canvas');
    if (!canvas) return;
    // toDataURL 將 Canvas 轉成 data URL，觸發下載
    var link = document.createElement('a');
    link.download = 'pixelpet-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
};

window.I18n = I18n;
window.UI = UI;

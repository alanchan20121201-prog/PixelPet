// ============================================================
// assets-loader.js —— 素材載入器
// ------------------------------------------------------------
// 用途：在遊戲啟動時載入全部圖片素材（精靈圖、場景圖、
//       UI 圖、特效圖、卡片背景），載入完成後回呼通知。
//       載入後可透過 Assets.get(key) 取得 Image 物件。
// 依賴：config.js（CONFIG.ASSETS 路徑定義）
// 對外提供：window.Assets 物件
//   - Assets.load(onDone, onProgress)  開始載入
//   - Assets.get(key)                  取得已載入的圖片
//   - Assets.images                    圖片快取物件
// ============================================================

var Assets = {

  // images：已載入的圖片快取
  images: {},
  loadedCount: 0,
  totalCount: 0,
  done: false, // 防止 onDone 被重複呼叫

  load: function (onDone, onProgress) {
    var self = this;
    self.images = {};
    self.loadedCount = 0;
    self.done = false;

    var list = [];
    var categories = CONFIG.ASSETS;
    for (var cat in categories) {
      for (var key in categories[cat]) {
        list.push({ fullKey: cat + '.' + key, path: categories[cat][key] });
      }
    }
    self.totalCount = list.length;

    if (self.totalCount === 0) {
      self.done = true;
      if (onDone) onDone();
      return;
    }

    // 內部：安全完成，確保只呼叫一次
    function finish() {
      if (self.done) return;
      self.done = true;
      if (onDone) onDone();
    }

    for (var i = 0; i < list.length; i++) {
      (function (item) {
        var img = new Image();
        img.onload = function () {
          self.images[item.fullKey] = img;
          self.images[item.path] = img;
          self.loadedCount++;
          if (onProgress) onProgress(self.loadedCount / self.totalCount);
          if (self.loadedCount === self.totalCount) finish();
        };
        img.onerror = function () {
          console.warn('素材載入失敗:', item.path);
          self.loadedCount++;
          if (onProgress) onProgress(self.loadedCount / self.totalCount);
          if (self.loadedCount === self.totalCount) finish();
        };
        img.src = item.path;
      })(list[i]);
    }

    // 超時保護：15 秒後無論如何都繼續，避免永遠卡在載入畫面
    setTimeout(function () {
      if (!self.done) {
        console.warn('素材載入超時，已載入 ' + self.loadedCount + '/' + self.totalCount + '，繼續啟動遊戲');
        finish();
      }
    }, 15000); // 15000ms = 15 秒
  },

  // ----------------------------------------------------------
  // get：取得已載入的圖片
  // 參數：key（字串）—— 如 'sprites.petSheet' 或路徑
  // 回傳：Image 物件 / null（未載入或不存在）
  // ----------------------------------------------------------
  get: function (key) {
    return this.images[key] || null;
  }
};

window.Assets = Assets;

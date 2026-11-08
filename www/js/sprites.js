// ============================================================
// sprites.js —— 精靈圖幀定義與查詢
// ------------------------------------------------------------
// 用途：定義寵物精靈圖各幀的對應關係（哪一幀對應哪種狀態），
//       場景圖與素材的對應，粒子特效各類型的位置。
//       將素材圖切割成可用的幀供 renderer 使用。
// 依賴：config.js（CONFIG.SPRITE 幀定義）、assets-loader.js
// 對外提供：window.Sprites 物件
//   - Sprites.init()                初始化幀定義
//   - Sprites.getPetFrame(state)    取得寵物某狀態的幀索引
//   - Sprites.getPetImage()         取得精靈圖 Image
//   - Sprites.getSceneImage(scene)  取得場景圖 Image
//   - Sprites.getParticle(index)    取得粒子在特效圖上的 x 位置
// ============================================================

var Sprites = {

  // frameMap：狀態 → 幀索引（在精靈圖中由左到右的序號）
  // 對應 CONFIG.SPRITE.FRAMES 的順序：
  // 0:idle, 1:eat, 2:drink, 3:bath, 4:sleep, 5:play,
  // 6:sick, 7:happy, 8:angry, 9:normal
  frameMap: {},

  // ----------------------------------------------------------
  // init：初始化幀對應表
  // 根據 CONFIG.SPRITE.FRAMES 建立狀態到索引的映射
  // ----------------------------------------------------------
  init: function () {
    this.frameMap = {};
    var frames = CONFIG.SPRITE.FRAMES;
    for (var i = 0; i < frames.length; i++) {
      this.frameMap[frames[i]] = i;
    }
  },

  // ----------------------------------------------------------
  // getPetFrame：取得寵物某狀態在精靈圖中的幀索引
  // 參數：state（字串）—— 如 'idle', 'eat', 'happy'
  // 回傳：幀索引（數字）/ 0（找不到時回傳待機幀）
  // ----------------------------------------------------------
  getPetFrame: function (state) {
    if (this.frameMap[state] !== undefined) {
      return this.frameMap[state];
    }
    return 0; // fallback 用待機幀
  },

  // ----------------------------------------------------------
  // getMoodSprite：根據心情狀態取得對應的精靈圖狀態名
  // 參數：mood（字串）—— 心情 key
  // 回傳：精靈圖狀態名（字串）
  // ----------------------------------------------------------
  getMoodSprite: function (mood) {
    // 從 CONFIG.MOODS 找出該心情對應的 sprite 名
    for (var i = 0; i < CONFIG.MOODS.length; i++) {
      if (CONFIG.MOODS[i].key === mood) {
        return CONFIG.MOODS[i].sprite;
      }
    }
    return 'normal';
  },

  // ----------------------------------------------------------
  // getPetImage：取得寵物精靈圖 Image 物件
  // 回傳：Image / null
  // ----------------------------------------------------------
  getPetImage: function () {
    return Assets.get('sprites.petSheet') || Assets.get(CONFIG.ASSETS.sprites.petSheet);
  },

  // ----------------------------------------------------------
  // getPetPortrait：取得寵物立繪 Image
  // 回傳：Image / null
  // ----------------------------------------------------------
  getPetPortrait: function () {
    return Assets.get('sprites.petPortrait') || Assets.get(CONFIG.ASSETS.sprites.petPortrait);
  },

  // ----------------------------------------------------------
  // getSceneImage：取得場景圖 Image
  // 參數：scene（字串）—— 場景 key（如 'bedroom', 'park'）
  // 回傳：Image / null
  // ----------------------------------------------------------
  getSceneImage: function (scene) {
    return Assets.get('scenes.' + scene) || Assets.get(CONFIG.ASSETS.scenes[scene]);
  },

  // ----------------------------------------------------------
  // getParticleImage：取得粒子特效圖 Image
  // 回傳：Image / null
  // ----------------------------------------------------------
  getParticleImage: function () {
    return Assets.get('effects.particles') || Assets.get(CONFIG.ASSETS.effects.particles);
  },

  // ----------------------------------------------------------
  // getParticleX：取得某粒子類型在特效圖中的 x 位置
  // 參數：type（字串）—— 'heart','star','zzz','drop','sparkle'
  // 回傳：x 像素位置（每個粒子寬 CONFIG.PARTICLES.SIZE=16px）
  // ----------------------------------------------------------
  getParticleX: function (type) {
    var types = CONFIG.PARTICLES.TYPES;
    for (var i = 0; i < types.length; i++) {
      if (types[i] === type) return i * CONFIG.PARTICLES.SIZE;
    }
    return 0;
  },

  // ----------------------------------------------------------
  // getCardBgImage：取得分享卡背景 Image
  // 回傳：Image / null
  // ----------------------------------------------------------
  getCardBgImage: function () {
    return Assets.get('cards.statusBg') || Assets.get(CONFIG.ASSETS.cards.statusBg);
  }
};

window.Sprites = Sprites;

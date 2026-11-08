// ============================================================
// renderer.js —— Canvas 渲染引擎
// ------------------------------------------------------------
// 用途：在 <canvas id="game-canvas"> 上繪製遊戲畫面，
//       包括場景背景、寵物精靈動畫、粒子特效、日夜濾鏡。
//       使用 requestAnimationFrame 做動畫循環。
// 依賴：config.js、assets-loader.js、sprites.js、pet.js
// 對外提供：window.Renderer 物件
//   - Renderer.init(canvas)        初始化渲染器
//   - Renderer.setScene(scene)     切換場景
//   - Renderer.setPetAction(state) 設定寵物動畫狀態
//   - Renderer.emitParticles(type, count) 發射粒子
//   - Renderer.start()             啟動動畫循環
//   - Renderer.stop()              停止動畫循環
//   - Renderer.updateDayNight()    依時間更新日夜濾鏡
// ============================================================

var Renderer = {

  canvas: null,
  ctx: null,
  currentScene: 'livingroom',
  petAction: 'idle',       // 目前寵物動畫狀態
  petFrameIndex: 0,        // 目前幀索引
  animTick: 0,             // 動畫計時器（每幀+1）
  animSpeed: 15,           // 每隔多少 tick 換一幀（越大越慢）
  running: false,
  rafId: null,             // requestAnimationFrame ID
  particles: [],           // 粒子列表

  // 寵物在 Canvas 中的位置（320×320 畫布，寵物置中偏下）
  PET_X: 128,              // (320-64)/2 = 128，水平置中
  PET_Y: 192,              // 偏下，讓寵物踩在場景地面上

  // ----------------------------------------------------------
  // init：初始化渲染器
  // 參數：canvas（DOM 元素）—— <canvas id="game-canvas">
  // ----------------------------------------------------------
  init: function (canvas) {
    this.canvas = canvas;
    // getContext('2d') 取得 2D 繪圖上下文
    // { alpha:false } 表示不透明背景，效能較好
    this.ctx = canvas.getContext('2d', { alpha: false });
    // imageSmoothingEnabled=false 確保像素圖放大時不模糊
    this.ctx.imageSmoothingEnabled = false;
    Sprites.init();
  },

  // ----------------------------------------------------------
  // setScene：切換場景
  // 參數：scene（字串）—— 'bedroom','livingroom','garden',
  //       'park','beach','forest'
  // ----------------------------------------------------------
  setScene: function (scene) {
    this.currentScene = scene;
  },

  // ----------------------------------------------------------
  // setPetAction：設定寵物動畫狀態
  // 參數：state（字串）—— 'idle','eat','sleep','play' 等
  // ----------------------------------------------------------
  setPetAction: function (state) {
    this.petAction = state;
    this.petFrameIndex = Sprites.getPetFrame(state);
  },

  // ----------------------------------------------------------
  // start：啟動動畫循環
  // 使用 requestAnimationFrame，每秒約 60 幀
  // ----------------------------------------------------------
  start: function () {
    if (this.running) return;
    this.running = true;
    var self = this;
    // 綁定 this，避免回呼中 this 指向 window
    this._loop = function () {
      self.render();
      if (self.running) {
        self.rafId = requestAnimationFrame(self._loop);
      }
    };
    this._loop();
  },

  // ----------------------------------------------------------
  // stop：停止動畫循環
  // ----------------------------------------------------------
  stop: function () {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  },

  // ----------------------------------------------------------
  // render：繪製一幀畫面
  // 繪製順序：場景背景 → 寵物 → 粒子
  // ----------------------------------------------------------
  render: function () {
    var ctx = this.ctx;
    if (!ctx) return;
    this.animTick++;

    // --- 1. 場景背景 ---
    var sceneImg = Sprites.getSceneImage(this.currentScene);
    if (sceneImg) {
      // 場景圖 320×320 剛好填滿 Canvas
      ctx.drawImage(sceneImg, 0, 0, 320, 320);
    } else {
      // 素材未載入時填底色
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 320, 320);
    }

    // --- 2. 寵物 ---
    this._drawPet(ctx);

    // --- 3. 粒子特效 ---
    this._drawParticles(ctx);
  },

  // ----------------------------------------------------------
  // _drawPet：繪製寵物精靈
  // 內部函數，由 render() 呼叫
  // 待機狀態有呼吸動畫（上下微浮），其他狀態靜態
  // ----------------------------------------------------------
  _drawPet: function (ctx) {
    var img = Sprites.getPetImage();
    if (!img) return;

    // 判斷目前該用哪個狀態的幀
    var action = this.petAction;

    // 待機時做呼吸動畫：每隔 animSpeed tick 在 idle 同 normal 之間切換
    if (action === 'idle') {
      if (this.animTick % (this.animSpeed * 2) < this.animSpeed) {
        this.petFrameIndex = Sprites.getPetFrame('idle');
      } else {
        this.petFrameIndex = Sprites.getPetFrame('normal');
      }
    }

    var frame = this.petFrameIndex;
    var size = CONFIG.SPRITE.FRAME_SIZE; // 64

    // 計算呼吸動畫的 y 偏移（上下浮動 ±2px）
    var yOffset = 0;
    if (action === 'idle' || action === 'normal') {
      yOffset = Math.sin(this.animTick * 0.1) * 2;
    }

    // 從精靈圖裁切單幀，繪製到 Canvas
    // drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    // sx = 幀索引 * 幀寬，橫向排列
    ctx.drawImage(
      img,
      frame * size, 0, size, size,           // 來源：精靈圖中的位置
      this.PET_X, this.PET_Y + yOffset, size, size  // 目標：Canvas 上的位置
    );
  },

  // ----------------------------------------------------------
  // emitParticles：發射粒子特效
  // 參數：type（字串）—— 'heart','star','zzz','drop','sparkle'
  //       count（數字）—— 粒子數量
  // ----------------------------------------------------------
  emitParticles: function (type, count) {
    count = count || 5;
    for (var i = 0; i < count; i++) {
      this.particles.push({
        type: type,
        x: this.PET_X + 32 + (Math.random() - 0.5) * 40,  // 寵物上方隨機
        y: this.PET_Y + 10,
        vx: (Math.random() - 0.5) * 2,   // 水平速度（-1~1）
        vy: -1 - Math.random() * 2,       // 向上速度（負值=向上）
        life: 60,                         // 存活幀數
        maxLife: 60,
        size: CONFIG.PARTICLES.SIZE       // 16px
      });
    }
  },

  // ----------------------------------------------------------
  // _drawParticles：繪製同更新粒子
  // 內部函數，由 render() 呼叫
  // 每幀移動粒子位置，扣減生命值，生命歸零則移除
  // ----------------------------------------------------------
  _drawParticles: function (ctx) {
    var img = Sprites.getParticleImage();
    var size = CONFIG.PARTICLES.SIZE;

    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];

      // 更新位置（速度影響）
      p.x += p.vx;
      p.y += p.vy;
      // 重力效果（粒子慢慢減速）
      p.vy *= 0.98;
      p.life--;

      // 生命歸零，移除
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // 透明度隨生命值遞減
      var alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;

      // 繪製粒子（從特效圖裁切）
      if (img) {
        var px = Sprites.getParticleX(p.type);
        ctx.drawImage(img, px, 0, size, size,
          Math.round(p.x), Math.round(p.y), size, size);
      }
    }
    ctx.globalAlpha = 1; // 還原透明度
  },

  // ----------------------------------------------------------
  // updateDayNight：依系統時間更新日夜濾鏡
  // 透過為 canvas 加 CSS class 切換濾鏡
  // ----------------------------------------------------------
  updateDayNight: function () {
    if (!this.canvas) return;
    var hour = new Date().getHours();

    // 移除舊的濾鏡 class
    this.canvas.classList.remove('night-mode', 'evening-mode');

    // 夜晚：20:00–06:00
    if (hour >= CONFIG.NIGHT_START || hour < CONFIG.NIGHT_END) {
      this.canvas.classList.add('night-mode');
    }
    // 黃昏：17:00–20:00
    else if (hour >= CONFIG.EVENING_START) {
      this.canvas.classList.add('evening-mode');
    }
    // 白天：不需加 class
  },

  // ----------------------------------------------------------
  // isNight：判斷目前是否為夜晚
  // 回傳：true/false
  // ----------------------------------------------------------
  isNight: function () {
    var hour = new Date().getHours();
    return hour >= CONFIG.NIGHT_START || hour < CONFIG.NIGHT_END;
  }
};

window.Renderer = Renderer;

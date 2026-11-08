// ============================================================
// audio.js —— 音效系統（Web Audio API）
// ------------------------------------------------------------
// 用途：播放背景音樂（BGM）同音效（SFX），
//       支援日夜切換 BGM、散步 BGM、靜音切換。
//       使用 Web Audio API 解碼播放 OGG 檔案。
//       注意：瀏覽器限制，首次播放需由使用者互動觸發。
// 依賴：config.js（CONFIG.ASSETS.audio 路徑）
// 對外提供：window.Audio2 物件（避開瀏覽器內建 Audio 名稱）
//   - Audio2.init()             初始化音效系統
//   - Audio2.playBGM(track)     播放背景音樂
//   - Audio2.stopBGM()          停止 BGM
//   - Audio2.playSFX(name)      播放音效
//   - Audio2.toggleMute()       切換靜音
//   - Audio2.updateBGM()        依時間更新 BGM
// ============================================================

var Audio2 = {

  ctx: null,           // AudioContext
  bgmSource: null,     // 目前播放的 BGM 來源節點
  bgmBuffer: null,     // 已解碼的 BGM AudioBuffer
  bgmGain: null,       // BGM 音量控制節點
  sfxBuffers: {},      // SFX 音效快取（名稱 → AudioBuffer）
  muted: false,
  currentBGM: null,    // 目前 BGM 名稱

  // ----------------------------------------------------------
  // init：初始化音效系統
  // 建立 AudioContext，開始載入全部音效檔案
  // ----------------------------------------------------------
  init: function () {
    try {
      // AudioContext 是 Web Audio API 的入口
      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();

      // BGM 音量節點（用 GainNode 控制音量）
      this.bgmGain = this.ctx.createGain();
      // 0.3 = 30% 音量，BGM 不宜太大聲
      this.bgmGain.gain.value = 0.3;
      this.bgmGain.connect(this.ctx.destination);

      // 載入全部音效
      this._loadAllSFX();
    } catch (e) {
      console.warn('Audio2 初始化失敗:', e);
    }
  },

  // ----------------------------------------------------------
  // _loadAllSFX：載入全部音效檔案並解碼
  // 內部函數
  // ----------------------------------------------------------
  _loadAllSFX: function () {
    var audioPaths = CONFIG.ASSETS.audio;
    var self = this;

    for (var name in audioPaths) {
      // 用閉包保存 name，避免回呼時 name 已變
      (function (key, path) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.responseType = 'arraybuffer'; // 音訊要用 arraybuffer
        xhr.onload = function () {
          if (xhr.status === 200) {
            // decodeAudioData 將原始資料解碼成 AudioBuffer
            self.ctx.decodeAudioData(xhr.response, function (buffer) {
              self.sfxBuffers[key] = buffer;
            }, function (err) {
              console.warn('音效解碼失敗:', key, err);
            });
          }
        };
        xhr.send();
      })(name, audioPaths[name]);
    }
  },

  // ----------------------------------------------------------
  // playBGM：播放背景音樂
  // 參數：track（字串）—— 'bgmDay','bgmNight','bgmWalk'
  // ----------------------------------------------------------
  playBGM: function (track) {
    if (!this.ctx || this.muted) return;
    if (this.currentBGM === track) return; // 已在播放

    // 停止舊的 BGM
    this.stopBGM();

    var buffer = this.sfxBuffers[track];
    if (!buffer) return;

    // AudioBufferSourceNode：播放音訊緩衝區
    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    // loop=true 讓 BGM 循環播放
    source.loop = true;
    source.connect(this.bgmGain);
    source.start(0);

    this.bgmSource = source;
    this.currentBGM = track;
  },

  // ----------------------------------------------------------
  // stopBGM：停止背景音樂
  // ----------------------------------------------------------
  stopBGM: function () {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop(0);
      } catch (e) {
        // 可能已停止
      }
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
    this.currentBGM = null;
  },

  // ----------------------------------------------------------
  // playSFX：播放音效
  // 參數：name（字串）—— 如 'sfxEat','sfxClick'
  // ----------------------------------------------------------
  playSFX: function (name) {
    if (!this.ctx || this.muted) return;
    var buffer = this.sfxBuffers[name];
    if (!buffer) return;

    // 每次播放都建立新的 Source（SFX 不循環）
    var source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // SFX 用獨立的 GainNode（音量不同）
    var gain = this.ctx.createGain();
    // 0.5 = 50% 音量，SFX 比 BGM 大聲
    gain.gain.value = 0.5;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(0);
  },

  // ----------------------------------------------------------
  // toggleMute：切換靜音
  // 回傳：true 靜音中 / false 有聲音
  // ----------------------------------------------------------
  toggleMute: function () {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    } else {
      this.updateBGM();
    }
    return this.muted;
  },

  // ----------------------------------------------------------
  // updateBGM：依時間更新 BGM
  // 白天播放 bgmDay，夜晚播放 bgmNight，散步中播放 bgmWalk
  // ----------------------------------------------------------
  updateBGM: function () {
    if (this.muted) return;

    // 散步中播放散步 BGM
    if (Pet.state && Pet.state.isWalking) {
      this.playBGM('bgmWalk');
      return;
    }

    // 依時間判斷白天/夜晚
    var hour = new Date().getHours();
    if (hour >= CONFIG.NIGHT_START || hour < CONFIG.NIGHT_END) {
      this.playBGM('bgmNight');
    } else {
      this.playBGM('bgmDay');
    }
  },

  // ----------------------------------------------------------
  // resume：恢復 AudioContext（瀏覽器需要使用者互動後才能播放）
  // 在首次點擊時呼叫
  // ----------------------------------------------------------
  resume: function () {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
};

window.Audio2 = Audio2;

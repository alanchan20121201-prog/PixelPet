// ============================================================
// audio.js —— 音效系統（Web Audio API）
// ------------------------------------------------------------
// 用途：播放背景音樂（BGM）同音效（SFX），
//       支援日夜切換 BGM、散步 BGM、音量調整與靜音。
//       音量設定存於 localStorage，重開軟件仍保留。
// 依賴：config.js（CONFIG.ASSETS.audio 路徑、CONFIG.AUDIO_SETTINGS_KEY）
// 對外提供：window.Audio2 物件（避開瀏覽器內建 Audio 名稱）
//   - Audio2.init()             初始化音效系統
//   - Audio2.playBGM(track)     播放背景音樂
//   - Audio2.stopBGM()          停止 BGM
//   - Audio2.playSFX(name)      播放音效
//   - Audio2.setVolume(v)       設定音量（0–1）
//   - Audio2.getVolume()        取得音量（0–1）
//   - Audio2.toggleMute()       切換靜音
//   - Audio2.isMuted()          是否靜音中
//   - Audio2.updateBGM()        依時間更新 BGM
// ============================================================

var Audio2 = {

  ctx: null,           // AudioContext
  bgmSource: null,     // 目前播放的 BGM 來源節點
  sfxBuffers: {},      // SFX 音效快取（名稱 → AudioBuffer）
  masterGain: null,    // 總音量節點，所有聲音都經過它
  volume: 0.6,         // 音量 0–1（預設 60%）
  muted: false,        // 是否靜音
  currentBGM: null,    // 目前 BGM 名稱

  // ----------------------------------------------------------
  // init：初始化音效系統
  // 建立 AudioContext 與總音量節點，讀取已存設定，載入全部音效
  // ----------------------------------------------------------
  init: function () {
    // 先讀取上次儲存的音量設定（在建立 AudioContext 前也能讀）
    this._loadSettings();

    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();

      // 總音量節點：BGM 與 SFX 全部接到這裡，
      // 調整音量只需改 masterGain.gain，兩者同時生效
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);

      this._loadAllSFX();
    } catch (e) {
      console.warn('Audio2 初始化失敗:', e);
    }
  },

  // ----------------------------------------------------------
  // _loadSettings：從 localStorage 讀取音量與靜音設定
  // 內部函數
  // ----------------------------------------------------------
  _loadSettings: function () {
    try {
      var raw = localStorage.getItem(CONFIG.AUDIO_SETTINGS_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (typeof s.volume === 'number') {
        // 限制在 0–1，避免損壞的存檔值造成異常
        this.volume = Math.max(0, Math.min(1, s.volume));
      }
      if (typeof s.muted === 'boolean') {
        this.muted = s.muted;
      }
    } catch (e) {
      // 存檔損壞就用預設值
    }
  },

  // ----------------------------------------------------------
  // _saveSettings：把音量與靜音設定寫入 localStorage
  // 內部函數
  // ----------------------------------------------------------
  _saveSettings: function () {
    try {
      localStorage.setItem(CONFIG.AUDIO_SETTINGS_KEY,
        JSON.stringify({ volume: this.volume, muted: this.muted }));
    } catch (e) {
      // 隱私模式可能無法寫入，不影響遊戲
    }
  },

  // ----------------------------------------------------------
  // _applyVolume：把目前音量套用到總音量節點
  // 內部函數。靜音時音量為 0，但 BGM 不中斷，取消靜音可無縫恢復
  // ----------------------------------------------------------
  _applyVolume: function () {
    if (!this.masterGain) return;
    var target = this.muted ? 0 : this.volume;
    // setTargetAtTime 讓音量變化平滑，避免突然跳動產生爆音
    try {
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    } catch (e) {
      this.masterGain.gain.value = target;
    }
  },

  // ----------------------------------------------------------
  // setVolume：設定音量
  // 參數：v（數字 0–1，或 0–100 的百分比會自動換算）
  // 回傳：設定後的音量（0–1）
  // ----------------------------------------------------------
  setVolume: function (v) {
    // 允許直接傳入 0–100（來自滑桿），大於 1 就當成百分比
    if (v > 1) v = v / 100;
    this.volume = Math.max(0, Math.min(1, v));
    // 拉到 0 視為靜音，但保留 muted 旗標獨立，使用者拉回即有聲
    this._applyVolume();
    this._saveSettings();
    return this.volume;
  },

  // ----------------------------------------------------------
  // getVolume：取得目前音量
  // 回傳：0–1 的數字
  // ----------------------------------------------------------
  getVolume: function () {
    return this.volume;
  },

  // ----------------------------------------------------------
  // isMuted：是否靜音中
  // 回傳：true/false
  // ----------------------------------------------------------
  isMuted: function () {
    return this.muted;
  },

  // ----------------------------------------------------------
  // setMuted：設定靜音狀態
  // 參數：b（布林）
  // ----------------------------------------------------------
  setMuted: function (b) {
    this.muted = !!b;
    this._applyVolume();
    this._saveSettings();
  },

  // ----------------------------------------------------------
  // toggleMute：切換靜音
  // 回傳：true 靜音中 / false 有聲音
  // ----------------------------------------------------------
  toggleMute: function () {
    this.setMuted(!this.muted);
    return this.muted;
  },

  // ----------------------------------------------------------
  // _loadAllSFX：載入全部音效檔案並解碼
  // 內部函數
  // ----------------------------------------------------------
  _loadAllSFX: function () {
    var audioPaths = CONFIG.ASSETS.audio;
    var self = this;

    for (var name in audioPaths) {
      (function (key, path) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
          if (xhr.status === 200) {
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
    if (!this.ctx || !this.masterGain) return;
    if (this.currentBGM === track) return; // 已在播放

    this.stopBGM();

    var buffer = this.sfxBuffers[track];
    if (!buffer) return;

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // BGM 固定為總音量的 30%，比 SFX 小聲，避免蓋過音效
    var bgmGain = this.ctx.createGain();
    bgmGain.gain.value = 0.3;
    source.connect(bgmGain);
    bgmGain.connect(this.masterGain);
    source.start(0);

    this.bgmSource = source;
    this.currentBGM = track;
  },

  // ----------------------------------------------------------
  // stopBGM：停止背景音樂
  // ----------------------------------------------------------
  stopBGM: function () {
    if (this.bgmSource) {
      try { this.bgmSource.stop(0); } catch (e) { }
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
    if (!this.ctx || !this.masterGain || this.muted) return;
    var buffer = this.sfxBuffers[name];
    if (!buffer) return;

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // SFX 固定為總音量的 50%，比 BGM 大聲
    var gain = this.ctx.createGain();
    gain.gain.value = 0.5;
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(0);
  },

  // ----------------------------------------------------------
  // updateBGM：依時間更新 BGM
  // 白天播放 bgmDay，夜晚播放 bgmNight，散步中播放 bgmWalk
  // ----------------------------------------------------------
  updateBGM: function () {
    if (Pet.state && Pet.state.isWalking) {
      this.playBGM('bgmWalk');
      return;
    }
    var hour = new Date().getHours();
    if (hour >= CONFIG.NIGHT_START || hour < CONFIG.NIGHT_END) {
      this.playBGM('bgmNight');
    } else {
      this.playBGM('bgmDay');
    }
  },

  // ----------------------------------------------------------
  // resume：恢復 AudioContext（瀏覽器需要使用者互動後才能播放）
  // ----------------------------------------------------------
  resume: function () {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
};

window.Audio2 = Audio2;

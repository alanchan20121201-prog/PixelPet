// ============================================================
// stats.js —— 數值條 UI 渲染與更新
// ------------------------------------------------------------
// 用途：將七項生理數值渲染成進度條顯示在 #stats-list，
//       並定時更新數值同填充寬度。
//       低於閘值時觸發紅色閃爍警告。
// 依賴：config.js（CONFIG.STATS 定義）、pet.js（Pet.state 數值）
// 對外提供：window.Stats 物件
//   - Stats.render()       首次渲染數值條 HTML 結構
//   - Stats.update()       更新數值同填充寬度
//   - Stats.getStat(key)   取得單項數值
//   - Stats.modify(key, n) 修改單項數值
// ============================================================

var Stats = {

  // statKeys：七項數值的 key，按顯示順序排列
  statKeys: ['hunger', 'thirst', 'mood', 'clean', 'energy', 'health', 'sleep'],

  // ----------------------------------------------------------
  // render：首次渲染數值條 HTML 結構到 #stats-list
  // 只建立 DOM 結構，實際數值由 update() 填入
  // ----------------------------------------------------------
  render: function () {
    var container = document.getElementById('stats-list');
    if (!container) return;
    container.innerHTML = '';

    // 逐項建立：標籤 + 進度條 + 數值
    for (var i = 0; i < this.statKeys.length; i++) {
      var key = this.statKeys[i];

      var row = document.createElement('div');
      row.className = 'stat-row';

      // 標籤（如「飽腹度」），data-stat 方便日後更新文字
      var label = document.createElement('span');
      label.className = 'stat-label';
      label.setAttribute('data-stat', key);
      // 用 I18n 翻譯（I18n 由 ui.js 提供，若尚未載入則 fallback 用 key）
      label.textContent = this._t('stat.' + key);

      // 進度條外框
      var bar = document.createElement('div');
      bar.className = 'stat-bar';

      // 進度條填充，data-stat 屬性讓 CSS 套用對應顏色
      var fill = document.createElement('div');
      fill.className = 'stat-fill';
      fill.setAttribute('data-stat', key);
      fill.style.width = '80%'; // 預設寬度，update() 會覆蓋

      bar.appendChild(fill);

      // 數值文字（如「80」）
      var value = document.createElement('span');
      value.className = 'stat-value';
      value.setAttribute('data-stat-val', key);
      value.textContent = '80';

      row.appendChild(label);
      row.appendChild(bar);
      row.appendChild(value);
      container.appendChild(row);
    }
  },

  // ----------------------------------------------------------
  // update：更新所有數值條的填充寬度同數值文字
  // 根據 Pet.state.stats 的值更新 UI
  // ----------------------------------------------------------
  update: function () {
    if (!Pet.state) return;
    var stats = Pet.state.stats;

    for (var i = 0; i < this.statKeys.length; i++) {
      var key = this.statKeys[i];
      var val = Math.round(stats[key] || 0);

      // 更新填充寬度（0–100 對應 0%–100%）
      var fills = document.querySelectorAll('.stat-fill[data-stat="' + key + '"]');
      for (var j = 0; j < fills.length; j++) {
        fills[j].style.width = val + '%';

        // 低於閘值加 .stat-low 觸發紅色閃爍
        if (val < CONFIG.STAT_LOW_THRESHOLD) {
          fills[j].classList.add('stat-low');
        } else {
          fills[j].classList.remove('stat-low');
        }
      }

      // 更新數值文字
      var valEls = document.querySelectorAll('[data-stat-val="' + key + '"]');
      for (var k = 0; k < valEls.length; k++) {
        valEls[k].textContent = val;
      }
    }
  },

  // ----------------------------------------------------------
  // getStat：取得單項數值
  // 參數：key（字串）—— 如 'hunger'
  // 回傳：數值（0–100）
  // ----------------------------------------------------------
  getStat: function (key) {
    if (!Pet.state) return 0;
    return Pet.state.stats[key] || 0;
  },

  // ----------------------------------------------------------
  // modify：修改單項數值
  // 參數：key（字串）、amount（數字，可正可負）
  // 回傳：修改後的值
  // ----------------------------------------------------------
  modify: function (key, amount) {
    if (!Pet.state) return 0;
    // 技能 energy_saver：體力消耗減少
    if (key === 'energy' && amount < 0 && Pet.state.skills.indexOf('energy_saver') >= 0) {
      amount *= 0.7;
    }
    Pet.state.stats[key] += amount;
    // 限制在 0–100 範圍
    if (Pet.state.stats[key] < 0) Pet.state.stats[key] = 0;
    if (Pet.state.stats[key] > 100) Pet.state.stats[key] = 100;
    return Pet.state.stats[key];
  },

  // ----------------------------------------------------------
  // _t：翻譯輔助函數
  // 若 window.I18n 已載入則使用，否則回傳 key
  // ----------------------------------------------------------
  _t: function (key) {
    if (window.I18n && typeof I18n.t === 'function') {
      return I18n.t(key);
    }
    return key;
  }
};

window.Stats = Stats;

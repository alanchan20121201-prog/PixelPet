// ============================================================
// growth.js —— 成長系統（技能樹、圖鑑）
// ------------------------------------------------------------
// 用途：管理寵物的技能樹解鎖與圖鑑記錄顯示。
//       技能隨等級提升自動解鎖，影響遊戲機制。
//       圖鑑記錄玩家遇到的事物（蝴蝶、彩虹等）。
// 依賴：config.js（CONFIG.SKILLS、CONFIG.DEX）、pet.js、ui.js
// 對外提供：window.Growth 物件
//   - Growth.renderSkills()    渲染技能面板
//   - Growth.renderDex()       渲染圖鑑面板
//   - Growth.checkUnlocks()    檢查是否有新技能可解鎖
//   - Growth.showDexNotification(id) 顯示圖鑑新增提示
// ============================================================

var Growth = {

  // ----------------------------------------------------------
  // checkUnlocks：檢查是否有新技能可自動解鎖
  // 升級後由 main.js 呼叫
  // 回傳：新解鎖的技能 id 列表
  // ----------------------------------------------------------
  checkUnlocks: function () {
    if (!Pet.state) return [];
    var newlyUnlocked = [];
    for (var i = 0; i < CONFIG.SKILLS.length; i++) {
      var skill = CONFIG.SKILLS[i];
      // 尚未解鎖且等級足夠
      if (Pet.state.skills.indexOf(skill.id) < 0 &&
          Pet.state.level >= skill.unlockLevel) {
        Pet.state.skills.push(skill.id);
        newlyUnlocked.push(skill.id);
      }
    }
    return newlyUnlocked;
  },

  // ----------------------------------------------------------
  // renderSkills：渲染技能面板到 #skills-list
  // 顯示所有技能，已解鎖的高亮，未解鎖的顯示所需等級
  // ----------------------------------------------------------
  renderSkills: function () {
    var container = document.getElementById('skills-list');
    if (!container) return;
    container.innerHTML = '';

    for (var i = 0; i < CONFIG.SKILLS.length; i++) {
      var skill = CONFIG.SKILLS[i];
      var unlocked = Pet.state.skills.indexOf(skill.id) >= 0;

      var card = document.createElement('div');
      card.className = 'skill-card ' + (unlocked ? 'skill-unlocked' : 'skill-locked');

      // 技能名稱
      var name = document.createElement('div');
      name.className = 'skill-name';
      name.textContent = I18n.t('skill.' + skill.id);
      if (!unlocked) {
        name.textContent += ' (Lv.' + skill.unlockLevel + ')';
      }

      // 技能描述
      var desc = document.createElement('div');
      desc.className = 'skill-desc';
      desc.textContent = I18n.t('skill.' + skill.id + '.desc');

      card.appendChild(name);
      card.appendChild(desc);
      container.appendChild(card);
    }
  },

  // ----------------------------------------------------------
  // renderDex：渲染圖鑑面板到 #dex-list
  // 已發現的條目正常顯示，未發現的灰色隱藏名稱
  // ----------------------------------------------------------
  renderDex: function () {
    var container = document.getElementById('dex-list');
    if (!container) return;
    container.innerHTML = '';

    for (var i = 0; i < CONFIG.DEX.length; i++) {
      var entry = CONFIG.DEX[i];
      var discovered = Pet.state.dex.indexOf(entry.id) >= 0;

      var row = document.createElement('div');
      row.className = 'dex-entry ' + (discovered ? '' : 'dex-locked');

      // 圖標
      var icon = document.createElement('span');
      icon.className = 'dex-icon';
      // 未發現用問號，已發現用定義的圖標
      icon.textContent = discovered ? entry.icon : '?';

      // 名稱
      var name = document.createElement('span');
      name.className = 'dex-name';
      name.textContent = discovered ? I18n.t('dex.' + entry.id) : '???';

      row.appendChild(icon);
      row.appendChild(name);
      container.appendChild(row);
    }

    // 底部顯示進度
    var progress = document.createElement('div');
    progress.className = 'dex-entry';
    progress.style.borderTop = '1px solid #5a5a7e';
    progress.style.marginTop = '8px';
    progress.style.paddingTop = '8px';
    progress.textContent = Pet.state.dex.length + ' / ' + CONFIG.DEX.length;
    container.appendChild(progress);
  },

  // ----------------------------------------------------------
  // showDexNotification：顯示圖鑑新增提示
  // 參數：dexId（字串）—— 新發現的條目 id
  // ----------------------------------------------------------
  showDexNotification: function (dexId) {
    var name = I18n.t('dex.' + dexId);
    var msg = I18n.t('msg.dex_new') + ' ' + name;
    UI.showDialogue(msg);
    Renderer.emitParticles('sparkle', 5);
    if (typeof Audio2 !== 'undefined') Audio2.playSFX('sfxRare');
  }
};

window.Growth = Growth;

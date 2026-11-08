// ============================================================
// diary.js —— 寵物日記系統
// ------------------------------------------------------------
// 用途：自動記錄寵物每日發生的事，玩家可隨時查看。
//       日記內容跟隨互動、事件、成長自動生成。
// 依賴：config.js（I18n 翻譯）、pet.js（Pet.state.diary）
// 對外提供：window.Diary 物件
//   - Diary.addEntry(templateKey)  新增一條日記
//   - Diary.render()               渲染日記面板
//   - Diary.getEntries()           取得全部日記
//   - Diary.generateDaily()        生成每日總結
// ============================================================

var Diary = {

  // MAX_ENTRIES：最多保留日記條數，超過則刪除最舊的
  MAX_ENTRIES: 100,

  // ----------------------------------------------------------
  // addEntry：新增一條日記
  // 參數：templateKey（字串）—— I18n 中的日記模板 key
  //       如 'diary.entry_play'
  // ----------------------------------------------------------
  addEntry: function (templateKey) {
    if (!Pet.state) return;
    var text = I18n.t(templateKey);

    var entry = {
      date: this._dateStr(),
      text: text,
      timestamp: Date.now()
    };

    Pet.state.diary.push(entry);

    // 超過上限，移除最舊的
    if (Pet.state.diary.length > this.MAX_ENTRIES) {
      Pet.state.diary.shift();
    }
  },

  // ----------------------------------------------------------
  // getEntries：取得全部日記條目
  // 回傳：陣列（新的在後面）
  // ----------------------------------------------------------
  getEntries: function () {
    if (!Pet.state) return [];
    return Pet.state.diary;
  },

  // ----------------------------------------------------------
  // render：渲染日記面板到 #diary-entries
  // 由新到舊排列（最新的在最上面）
  // ----------------------------------------------------------
  render: function () {
    var container = document.getElementById('diary-entries');
    if (!container) return;
    container.innerHTML = '';

    var entries = this.getEntries();
    // 反轉：新的在上方
    for (var i = entries.length - 1; i >= 0; i--) {
      var entry = entries[i];

      var div = document.createElement('div');
      div.className = 'diary-entry';

      var date = document.createElement('div');
      date.className = 'diary-date';
      date.textContent = entry.date;

      var text = document.createElement('div');
      text.className = 'diary-text';
      text.textContent = entry.text;

      div.appendChild(date);
      div.appendChild(text);
      container.appendChild(div);
    }

    // 若沒有日記，顯示提示
    if (entries.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'diary-entry';
      empty.style.color = '#707090';
      empty.textContent = '—';
      container.appendChild(empty);
    }
  },

  // ----------------------------------------------------------
  // generateDaily：生成每日總結
  // 在跨日時由 main.js 呼叫，根據昨日活動生成日記
  // ----------------------------------------------------------
  generateDaily: function () {
    if (!Pet.state) return;
    var habits = Pet.state.habits.actions;
    var mostAction = Pet.getMostUsedAction();

    if (mostAction) {
      var templateMap = {
        feed: 'diary.entry_feed', clean: 'diary.entry_clean',
        play: 'diary.entry_play', sleep: 'diary.entry_sleep',
        walk: 'diary.entry_walk_park', train: 'diary.entry_levelup',
        chat: 'diary.entry_play'
      };
      if (templateMap[mostAction]) {
        this.addEntry(templateMap[mostAction]);
        return;
      }
    }

    // 沒有互動，記錄平淡的一天
    this.addEntry('diary.entry_idle');
  },

  // ----------------------------------------------------------
  // _dateStr：取得日期字串（YYYY-MM-DD）
  // ----------------------------------------------------------
  _dateStr: function () {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' +
           (m < 10 ? '0' + m : m) + '-' +
           (day < 10 ? '0' + day : day);
  }
};

window.Diary = Diary;

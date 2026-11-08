// ============================================================
// storage.js —— 存檔系統（localStorage 讀寫）
// ------------------------------------------------------------
// 用途：負責將寵物全部狀態保存到瀏覽器 localStorage，
//       以及讀取、清除、檢查存檔是否存在。
//       關閉軟件後再開啟，資料不會消失。
// 依賴：config.js（使用 CONFIG.SAVE_KEY 作為存檔 key 名）
// 對外提供：window.Storage 物件
//   - Storage.save(data)     儲存寵物資料
//   - Storage.load()         讀取寵物資料
//   - Storage.clear()        清除存檔
//   - Storage.hasSave()      檢查是否有存檔
// ============================================================

var Storage = {

  // ----------------------------------------------------------
  // save：將寵物資料存入 localStorage
  // 參數：data（物件）—— 包含寵物全部狀態的物件
  // 回傳：true 成功 / false 失敗
  // ----------------------------------------------------------
  save: function (data) {
    try {
      // JSON.stringify 將物件轉成字串，localStorage 只能存字串
      var json = JSON.stringify(data);
      localStorage.setItem(CONFIG.SAVE_KEY, json);
      return true;
    } catch (e) {
      // 可能因儲存空間不足或隱私模式而失敗
      console.error('Storage.save 失敗:', e);
      return false;
    }
  },

  // ----------------------------------------------------------
  // load：從 localStorage 讀取寵物資料
  // 回傳：物件（存檔內容）/ null（無存檔或讀取失敗）
  // ----------------------------------------------------------
  load: function () {
    try {
      var json = localStorage.getItem(CONFIG.SAVE_KEY);
      if (json === null) {
        // 沒有存檔
        return null;
      }
      // JSON.parse 將字串轉回物件
      return JSON.parse(json);
    } catch (e) {
      console.error('Storage.load 失敗:', e);
      return null;
    }
  },

  // ----------------------------------------------------------
  // clear：清除存檔（用於重新開始遊戲）
  // 回傳：true 成功 / false 失敗
  // ----------------------------------------------------------
  clear: function () {
    try {
      localStorage.removeItem(CONFIG.SAVE_KEY);
      return true;
    } catch (e) {
      console.error('Storage.clear 失敗:', e);
      return false;
    }
  },

  // ----------------------------------------------------------
  // hasSave：檢查是否有存檔
  // 回傳：true 有存檔 / false 無存檔
  // ----------------------------------------------------------
  hasSave: function () {
    return localStorage.getItem(CONFIG.SAVE_KEY) !== null;
  }
};

window.Storage = Storage;

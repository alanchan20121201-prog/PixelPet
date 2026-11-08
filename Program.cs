// ============================================================
// Program.cs —— PixelPet 桌面外殼（C# WinForms + WebView2）
// ------------------------------------------------------------
// 用途：建立一個 Windows 視窗，內嵌 WebView2 控制項，
//       載入本地 www/index.html，讓網頁遊戲以桌面軟件形式運行。
//       打包成單檔 exe 後可直接雙擊啟動，無需瀏覽器。
// 依賴：Microsoft.Web.WebView2 NuGet 套件
//       www/ 目錄下的 HTML/CSS/JS/素材檔案
// ------------------------------------------------------------
// 編譯：dotnet build -c Release
// 輸出：build/Release/PixelPet.exe（連同 www/ 目錄）
// ============================================================

using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;

namespace PixelPet
{
    // MainForm：主視窗類別，繼承自 WinForms 的 Form
    public class MainForm : Form
    {
        private WebView2 webView;  // WebView2 控制項，用來顯示網頁

        // ----------------------------------------------------------
        // 建構子：設定視窗屬性並初始化 WebView2
        // ----------------------------------------------------------
        public MainForm()
        {
            // 視窗標題
            this.Text = "PixelPet - 像素寵物";

            // 視窗大小（800×600，適合遊戲介面）
            this.Width = 880;
            this.Height = 680;

            // 固定大小，不允許縮放（避免版面跑掉）
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;

            // 置中顯示
            this.StartPosition = FormStartPosition.CenterScreen;

            // 載入圖標（icon.ico，在同目錄下）
            try
            {
                string iconPath = Path.Combine(Application.StartupPath, "icon.ico");
                if (File.Exists(iconPath))
                {
                    this.Icon = new System.Drawing.Icon(iconPath);
                }
            }
            catch { /* 圖標載入失敗不影響運行 */ }

            // 建立 WebView2 控制項並填滿視窗
            webView = new WebView2();
            webView.Dock = DockStyle.Fill;
            this.Controls.Add(webView);

            // 非同步初始化 WebView2
            _ = InitializeWebView();
        }

        // ----------------------------------------------------------
        // InitializeWebView：非同步初始化 WebView2 並載入遊戲頁面
        // ----------------------------------------------------------
        private async Task InitializeWebView()
        {
            try
            {
                // 確保 WebView2 執行環境已安裝並初始化
                await webView.EnsureCoreWebView2Async(null);

                // 將 www 目錄映射為虛擬主機 pixelpet.app
                // 這樣網頁可以用 https://pixelpet.app/index.html 存取
                // 虛擬主機方式比 file:// 更好，localStorage 同音效都能正常運作
                string wwwPath = Path.Combine(Application.StartupPath, "www");
                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "pixelpet.app",
                    wwwPath,
                    Microsoft.Web.WebView2.Core.CoreWebView2HostResourceAccessKind.Allow
                );

                // 依 exe 檔名偵測語言
                // 四個 exe 各以語言代碼命名：
                //   PixelPet-zh-TW.exe → 繁體中文
                //   PixelPet-zh-CN.exe → 簡體中文
                //   PixelPet-en.exe    → English
                //   PixelPet-ja.exe    → 日本語
                string exeName = Path.GetFileNameWithoutExtension(Application.ExecutablePath);
                string lang = "zh-TW"; // 預設繁體中文
                if (exeName.Contains("zh-CN")) lang = "zh-CN";
                else if (exeName.Contains("-en") || exeName.Contains("English")) lang = "en";
                else if (exeName.Contains("-ja") || exeName.Contains("Japanese")) lang = "ja";

                // 在頁面腳本執行前注入語言設定
                // main.js 會讀取 window.__PETLANG__ 來設定預設語言
                await webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
                    "window.__PETLANG__ = '" + lang + "';"
                );

                // 關閉右鍵選單（桌面應用不需要）
                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;

                // 關閉開發者工具（正式版不需要）
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;

                // 載入遊戲首頁
                webView.CoreWebView2.Navigate("https://pixelpet.app/index.html");
            }
            catch (Exception ex)
            {
                // 初始化失敗時顯示錯誤訊息
                MessageBox.Show(
                    "WebView2 初始化失敗:\n" + ex.Message +
                    "\n\n請確認已安裝 WebView2 Runtime。",
                    "PixelPet 錯誤",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }

    // ============================================================
    // Program：程式進入點
    // ============================================================
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            // WinForms 應用程式標準初始化
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // 建立並顯示主視窗
            Application.Run(new MainForm());
        }
    }
}

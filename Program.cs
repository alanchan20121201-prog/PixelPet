// ============================================================
// Program.cs —— PixelPet 桌面外殼（C# WinForms + WebView2）
// ------------------------------------------------------------
// 用途：建立 Windows 視窗，內嵌 WebView2 載入遊戲網頁。
//       本版為「單檔 exe」：www 全部檔案已內嵌進組件，
//       執行時解壓到本機快取，不需任何外部檔案。
// 依賴：Microsoft.Web.WebView2 NuGet 套件
//       編譯期內嵌的 www/ 資源（見 csproj EmbeddedResource）
// ------------------------------------------------------------
// 語言：由 csproj 的 PetLang 參數烘焙進 AssemblyMetadata，
//       每個 exe 固定一種語言，玩家無法更改。
// 編譯：dotnet publish -c Release -p:PetLang=zh-TW -o publish/zh-TW
// ============================================================

using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace PixelPet
{
    public class MainForm : Form
    {
        private WebView2 webView;  // WebView2 控制項，用來顯示網頁

        // 全螢幕還原用的狀態：記住切換前的邊框樣式與視窗範圍
        private bool isFullScreen = false;
        private FormBorderStyle savedBorder;
        private Rectangle savedBounds;
        private FormWindowState savedState;

        public MainForm()
        {
            this.Text = "PixelPet";

            // 預設大小 940x760；改為可調整大小，玩家可自行拖曳縮小或放大
            this.Width = 940;
            this.Height = 760;

            // Sizable 允許拖曳邊框調整大小，同時保留最小化/最大化按鈕
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.MaximizeBox = true;
            this.MinimizeBox = true;

            // 最小尺寸：低於此尺寸版面會過擠，限制住避免破版
            // 760x560 足夠容納兩欄緊湊排版後的側欄
            this.MinimumSize = new System.Drawing.Size(760, 560);
            this.StartPosition = FormStartPosition.CenterScreen;

            // 讓表單先收到按鍵（WebView2 有焦點時仍需靠加速器事件，見下）
            this.KeyPreview = true;
            this.KeyDown += MainForm_KeyDown;

            // 圖標直接取自 exe 本身的資源（單檔模式不會有獨立 icon.ico）
            try
            {
                this.Icon = System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch { /* 取不到圖標不影響運行 */ }

            webView = new WebView2();
            webView.Dock = DockStyle.Fill;
            this.Controls.Add(webView);

            _ = InitializeWebView();
        }

        // ----------------------------------------------------------
        // MainForm_KeyDown：F11 切換全螢幕，Esc 退出全螢幕
        // 參數：sender、e（KeyEventArgs）
        // 回傳：無
        // ----------------------------------------------------------
        private void MainForm_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.F11)
            {
                e.Handled = true;
                ToggleFullScreen();
            }
            else if (e.KeyCode == Keys.Escape && isFullScreen)
            {
                e.Handled = true;
                ExitFullScreen();
            }
        }

        // ----------------------------------------------------------
        // ToggleFullScreen：在「全螢幕」與「一般視窗」之間切換
        // 參數：無
        // 回傳：無
        // 說明：全螢幕 = 無邊框 + 覆蓋整個螢幕；退出時還原原本
        //       的邊框、大小、位置與最大化狀態，不會改變玩家原本的視窗配置。
        // ----------------------------------------------------------
        public void ToggleFullScreen()
        {
            if (isFullScreen) ExitFullScreen();
            else EnterFullScreen();
        }

        private void EnterFullScreen()
        {
            // 先記住現況
            savedBorder = this.FormBorderStyle;
            savedState = this.WindowState;
            if (this.WindowState == FormWindowState.Normal)
            {
                savedBounds = this.Bounds;
            }
            else
            {
                // 最大化/最小化時 Bounds 不是還原後的位置，改用 RestoreBounds
                savedBounds = this.RestoreBounds;
            }

            this.WindowState = FormWindowState.Normal;
            this.FormBorderStyle = FormBorderStyle.None;
            // 覆蓋游標所在的那個螢幕（支援多螢幕）
            var screen = Screen.FromHandle(this.Handle);
            this.Bounds = screen.Bounds;
            this.TopMost = true;
            isFullScreen = true;
        }

        private void ExitFullScreen()
        {
            this.TopMost = false;
            this.FormBorderStyle = savedBorder;
            this.WindowState = FormWindowState.Normal;
            this.Bounds = savedBounds;
            // 若原本是最大化，還原成最大化
            if (savedState == FormWindowState.Maximized)
            {
                this.WindowState = FormWindowState.Maximized;
            }
            isFullScreen = false;
        }

        // ----------------------------------------------------------
        // BakedLang：讀取編譯時寫入組件中繼資料的語言代碼
        // 參數：無
        // 回傳：語言字串（zh-TW / zh-CN / en / ja）
        // ----------------------------------------------------------
        private static string BakedLang()
        {
            var attrs = typeof(Program).Assembly
                .GetCustomAttributes<AssemblyMetadataAttribute>();
            foreach (var a in attrs)
            {
                if (a.Key == "Lang" && !string.IsNullOrEmpty(a.Value))
                {
                    return a.Value;
                }
            }
            return "zh-TW"; // 讀不到時的保險值
        }

        // ----------------------------------------------------------
        // EnsureWww：把內嵌的 www 資源解壓到本機快取資料夾
        // 參數：無
        // 回傳：解壓後的 www 目錄路徑
        // 說明：用 .ready 標記檔判斷是否已解壓，避免每次啟動重複寫入；
        //       版本號寫在資料夾名稱，日後改素材只要換版本號就會重新解壓。
        // ----------------------------------------------------------
        private static string EnsureWww()
        {
            string baseDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "PixelPet");
            string wwwPath = Path.Combine(baseDir, "www-1.0.0");
            string marker = Path.Combine(wwwPath, ".ready");

            if (File.Exists(marker)) return wwwPath;

            if (Directory.Exists(wwwPath))
            {
                Directory.Delete(wwwPath, true);
            }
            Directory.CreateDirectory(wwwPath);

            var asm = typeof(Program).Assembly;
            foreach (var name in asm.GetManifestResourceNames())
            {
                // 只處理我們內嵌的 www/ 資源
                if (!name.StartsWith("www/", StringComparison.Ordinal)) continue;

                // LogicalName 用 / 分隔；MSBuild 的 RecursiveDir 可能帶 \，一併正規化
                string rel = name.Substring(4).Replace('\\', '/');
                string dest = Path.Combine(wwwPath, rel.Replace('/', Path.DirectorySeparatorChar));
                string dir = Path.GetDirectoryName(dest);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

                using (var src = asm.GetManifestResourceStream(name))
                using (var dst = File.Create(dest))
                {
                    if (src != null) src.CopyTo(dst);
                }
            }

            File.WriteAllText(marker, "ok");
            return wwwPath;
        }

        // ----------------------------------------------------------
        // InitializeWebView：初始化 WebView2 並載入遊戲頁面
        // ----------------------------------------------------------
        private async Task InitializeWebView()
        {
            try
            {
                string lang = BakedLang();
                string wwwPath = EnsureWww();

                // 四個語言 exe 共用同一個使用者資料資料夾，
                // 因此 localStorage 存檔共用：換語言 exe 寵物資料不會消失。
                string baseDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "PixelPet");
                string userData = Path.Combine(baseDir, "userdata");

                // 明確指定環境，避免 WebView2 在 exe 旁邊產生 *.WebView2 資料夾
                var env = await CoreWebView2Environment.CreateAsync(null, userData);
                await webView.EnsureCoreWebView2Async(env);

                // 把解壓出來的 www 映射成虛擬主機，
                // 比 file:// 可靠，localStorage 與音效都能正常運作
                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "pixelpet.app",
                    wwwPath,
                    CoreWebView2HostResourceAccessKind.Allow
                );

                // 在頁面任何腳本執行前注入固定語言。
                // index.html 的 head 腳本會據此隱藏語言切換列，
                // main.js 會據此覆寫 I18n.currentLang。
                await webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
                    "window.__PETLANG__ = '" + lang + "';"
                );

                // 桌面應用不需要這些瀏覽器功能
                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;

                // 允許網頁用 window.chrome.webview.postMessage 通知視窗行為
                // （全螢幕按鈕、F11/Esc 快捷鍵）
                webView.CoreWebView2.Settings.IsWebMessageEnabled = true;
                webView.CoreWebView2.WebMessageReceived += OnWebMessage;

                // 攔截瀏覽器端的 F11/Esc 由網頁 JS 負責（見 ui.js），
                // JS 會 preventDefault 避免 WebView2 自己進全螢幕造成狀態錯亂。
                webView.CoreWebView2.Navigate("https://pixelpet.app/index.html");
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "PixelPet 啟動失敗：\n" + ex.Message +
                    "\n\n請確認已安裝 .NET 8 Desktop Runtime 與 WebView2 Runtime。",
                    "PixelPet",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        // ----------------------------------------------------------
        // OnWebMessage：處理網頁傳來的視窗控制訊息
        // 參數：sender、e（CoreWebView2WebMessageReceivedEventArgs）
        // 回傳：無
        // 支援訊息：'toggleFullscreen'、'enterFullscreen'、'exitFullscreen'
        // ----------------------------------------------------------
        private void OnWebMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string msg;
            try { msg = e.TryGetWebMessageAsString(); }
            catch { return; }

            switch (msg)
            {
                case "toggleFullscreen": ToggleFullScreen(); break;
                case "enterFullscreen":  EnterFullScreen();  break;
                case "exitFullscreen":   if (isFullScreen) ExitFullScreen(); break;
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
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}

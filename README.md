# PixelPet — 像素寵物養成模擬器

> 一款像素風寵物養成桌面軟件，Windows 平台。
> 養一隻專屬像素寵物，餵食、清潔、玩耍、訓練，牠會根據照顧方式展現不同反應。

---

## 簡体中文

PixelPet 是一款像素風寵物養成模擬器。玩家在電腦上養一隻像素風寵物，寵物有七項生理數值、五種隨機性格、會記住玩家的習慣、會隨真實時間變化、會寫日記、會遇到隨機事件。所有資料保存在本機，關閉軟件不會消失，無需帳號、無需聯網。

### 下載與運行

從 `build/Release/` 目錄中選擇對應語言的 exe 雙擊運行：

| 檔案 | 語言 |
|---|---|
| `PixelPet-zh-TW.exe` | 繁體中文 |
| `PixelPet-zh-CN.exe` | 簡體中文 |
| `PixelPet-en.exe` | English |
| `PixelPet-ja.exe` | 日本語 |

**每個 exe 都是單檔**：不需解壓、不需其他檔案，雙擊即可。語言已固定在 exe 內，無法切換。

運行需安裝 .NET 8 Desktop Runtime 和 WebView2 Runtime（Windows 11 通常已內建 WebView2）。

---

## 繁體中文

PixelPet 是一款像素風寵物養成模擬器。玩家在電腦上養一隻像素風寵物，寵物有七項生理數值、五種隨機性格、會記住玩家的習慣、會隨真實時間變化、會寫日記、會遇到隨機事件。所有資料保存在本機，關閉軟件不會消失，無需帳號、無需聯網。

### 下載與運行

從 `build/Release/` 目錄中選擇對應語言的 exe 雙擊運行：

| 檔案 | 語言 |
|---|---|
| `PixelPet-zh-TW.exe` | 繁體中文 |
| `PixelPet-zh-CN.exe` | 簡體中文 |
| `PixelPet-en.exe` | English |
| `PixelPet-ja.exe` | 日本語 |

**每個 exe 都是單檔**：不需解壓、不需其他檔案，雙擊即可。語言已固定在 exe 內，無法切換。

運行需安裝 .NET 8 Desktop Runtime 和 WebView2 Runtime（Windows 11 通常已內建 WebView2）。

---

## English

PixelPet is a pixel-art pet raising simulator. Raise a pixel pet on your desktop — feed, clean, play, and train it. The pet has seven vital stats, five random personalities, remembers your habits, changes with real time, writes a diary, and encounters random events. All data is stored locally — no account, no internet required.

### Download & Run

Choose the exe for your language from `build/Release/` and double-click to run:

| File | Language |
|---|---|
| `PixelPet-zh-TW.exe` | 繁體中文 (Traditional Chinese) |
| `PixelPet-zh-CN.exe` | 简体中文 (Simplified Chinese) |
| `PixelPet-en.exe` | English |
| `PixelPet-ja.exe` | 日本語 (Japanese) |

**Each exe is a single file**: no extraction, no extra files needed — just double-click. The language is baked into the exe and cannot be changed.

Requires .NET 8 Desktop Runtime and WebView2 Runtime (WebView2 is pre-installed on Windows 11).

---

## 日本語

PixelPetはピクセルアート風のペット育成シミュレーターです。デスクトップでピクセルペットを育てましょう。エサやり、清潔、遊び、訓練ができます。ペットには7つのステータス、5つのランダムな性格があり、プレイヤーの習慣を覚え、現実時間に合わせて変化し、日記を書き、ランダムイベントに遭遇します。すべてのデータはローカルに保存され、アカウントもインターネットも不要です。

### ダウンロードと実行

`build/Release/` ディレクトリから対応する言語の exe をダブルクリックして実行してください：

| ファイル | 言語 |
|---|---|
| `PixelPet-zh-TW.exe` | 繁體中文 |
| `PixelPet-zh-CN.exe` | 简体中文 |
| `PixelPet-en.exe` | English |
| `PixelPet-ja.exe` | 日本語 |

**各 exe は単一ファイルです**：解凍や追加ファイルは不要、ダブルクリックで起動します。言語は exe に固定されており、変更できません。

実行には .NET 8 Desktop Runtime と WebView2 Runtime が必要です（WebView2 は Windows 11 にプリインストールされています）。

---

## 功能特色 / Features

- **七項生理數值**：飽腹度、口渴度、心情、清潔度、體力、健康、睡眠（0–100，定時變化）
- **五種隨機性格**：活潑、懶惰、好奇、黏人、高傲（影響數值衰減與互動效果）
- **六種心情狀態**：興奮、開心、普通、無聊、傷心、生氣（自動計算）
- **十五種以上互動**：餵食、飲水、清潔、睡覺、廁所、玩耍、散步、訓練、聊天、技能、圖鑑、日記、狀態卡
- **時間機制**：離線結算、三餐時段、日夜濾鏡、48 小時保護上限
- **隨機事件**：每日 1–3 件，含稀有事件（彩虹、流星、神秘訪客）
- **成長系統**：等級/經驗值、六個技能自動解鎖、六項圖鑑收集
- **自動日記**：根據互動與事件自動記錄
- **四種語言**：繁體中文、簡體中文、英文、日文（四個獨立 exe，各自固定語言）
- **像素風視覺**：8-bit 精靈圖、場景圖、粒子特效、日夜濾鏡
- **8-bit 音效**：三首循環 BGM（日/夜/散步）+ 九個音效
- **本機存檔**：localStorage 自動存檔，關閉不遺失

## 技術架構 / Tech Stack

| 層 | 技術 |
|---|---|
| 遊戲本體 | HTML + CSS + JavaScript（Canvas 2D、Web Audio API、localStorage） |
| 桌面外殼 | C# WinForms + WebView2（.NET 8） |
| 素材 | Python Pillow 生成像素圖、numpy 合成 8-bit 音效 |
| 打包 | `dotnet publish` → **單檔 exe**（www 全部內嵌，不需外部檔案） |

每個 exe 都是獨立單檔：網頁、圖片、音效全部內嵌在 exe 內，首次啟動時解壓到
`%LOCALAPPDATA%\PixelPet\`。語言寫在組件中繼資料中，**無法切換、改檔名也不會變**。
四個 exe 共用同一個 WebView2 使用者資料夾，所以換語言 exe 寵物存檔不會消失。

## 目錄結構 / Project Structure

```
PixelPet/
├── Program.cs              # C# WinForms + WebView2 桌面外殼
├── PixelPet.csproj         # C# 專案檔
├── PixelPet.sln            # Visual Studio 解決方案
├── app.manifest            # Windows 應用資訊清單
├── icon.ico                # 應用圖標
├── www/                    # 遊戲本體（網頁）
│   ├── index.html          # 主畫面 HTML
│   ├── style.css           # 全域樣式
│   ├── main.js             # 遊戲入口與主循環
│   ├── manifest.json       # PWA 資訊清單
│   ├── sw.js               # Service Worker（離線快取）
│   ├── js/                 # 14 個 JavaScript 模組
│   │   ├── config.js       # 常數 + 四語言翻譯表
│   │   ├── storage.js      # localStorage 存檔
│   │   ├── pet.js          # 寵物核心狀態
│   │   ├── stats.js        # 數值條 UI
│   │   ├── assets-loader.js # 素材載入
│   │   ├── sprites.js      # 精靈圖幀定義
│   │   ├── renderer.js     # Canvas 渲染引擎
│   │   ├── ui.js           # 介面管理 + 多語言
│   │   ├── interactions.js # 互動系統
│   │   ├── dialogue.js     # 對話系統
│   │   ├── events.js       # 隨機事件
│   │   ├── growth.js       # 技能樹 + 圖鑑
│   │   ├── diary.js        # 寵物日記
│   │   └── audio.js        # 音效系統
│   └── assets/             # 全部素材
│       ├── sprites/        # 寵物精靈圖、立繪
│       ├── scenes/         # 六個場景圖（320×320）
│       ├── ui/             # 圖標、按鈕
│       ├── effects/        # 粒子特效
│       ├── cards/          # 分享卡背景
│       └── audio/          # 3 首 BGM + 9 個音效（OGG）
├── docs/                   # 文檔
│   ├── README.md
│   ├── CHANGELOG.md
│   └── screenshots/
└── build/Release/          # 四個單檔 exe，不需任何其他檔案
    ├── PixelPet-zh-TW.exe  # 繁體中文
    ├── PixelPet-zh-CN.exe  # 简体中文
    ├── PixelPet-en.exe     # English
    └── PixelPet-ja.exe     # 日本語
```

## 編譯方法 / Build

### 前置需求

- .NET 8 SDK（或 .NET 10 SDK）
- WebView2 Runtime

### 步驟

每個語言各自 publish 一次（`PetLang` 參數會把語言寫進 exe 中繼資料）：

```bash
dotnet publish PixelPet.csproj -c Release -p:PetLang=zh-TW -o publish/zh-TW
dotnet publish PixelPet.csproj -c Release -p:PetLang=zh-CN -o publish/zh-CN
dotnet publish PixelPet.csproj -c Release -p:PetLang=en    -o publish/en
dotnet publish PixelPet.csproj -c Release -p:PetLang=ja    -o publish/ja
```

每個 `publish/<lang>/` 只取 `PixelPet-<lang>.exe` 即可，其餘 `.xml` 說明檔可忽略。
`www/` 已由 csproj 的 `EmbeddedResource` 內嵌進 exe，不需要跟著複製。

## 素材規格 / Assets

| 類型 | 格式 | 規格 |
|---|---|---|
| 寵物精靈圖 | PNG | 640×64（10 幀 × 64×64），透明背景 |
| 寵物立繪 | PNG | 96×96，透明背景 |
| 場景圖 | PNG | 320×320 × 6 張 |
| 圖標 | PNG/ICO | 512×512、192×192、.ico 多尺寸 |
| 按鈕 | PNG | 192×64（三狀態 × 64×64） |
| 粒子 | PNG | 80×16（5 種 × 16×16） |
| 分享卡背景 | PNG | 600×800 |
| 背景音樂 | OGG | 3 首，45–60 秒循環 |
| 音效 | OGG | 9 個，0.2–1.5 秒 |

素材總體積約 1.2 MB。

## License

MIT License — 自由使用、修改、分發。

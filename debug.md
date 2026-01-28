# AI 設定持久化問題除錯紀錄 (Debug Log)

## 1. 問題描述
用戶報告在系統設定頁面中配置 AI 相關選項時遇到以下問題：
1.  **AI 提供商列表無法儲存**：新增提供商後點擊儲存，刷新頁面後資料消失。
2.  **AI 功能提供商選擇無法儲存**：為特定功能（如翻譯、簡報）選擇提供商後，儲存並刷新頁面，設定恢復為預設值。

## 2. 問題分析與解決過程

### 2.1 AI 提供商列表 (ai.providers) 無法儲存

#### 排查過程
*   **追蹤數據流**：在 `saveSettingsAction` 和 `handleSubmit` 加入 Log，發現提交時 `ai.providers` 始終為空陣列 `[]`。
*   **檢查表單狀態**：雖然在 `handleSaveProvider` 中使用了 `form.setValue` 並且設置了 `shouldDirty: true`，但在 `handleSubmit` 觸發時， `react-hook-form` 內部的狀態似乎被重置或未能正確追蹤此陣列欄位。
*   **嘗試修復 (無效)**：嘗試添加隱藏的 `<input>` 欄位以強制註冊，但無效。

#### 根本原因
`react-hook-form` 搭配 Zod Resolver 時，對於未顯式註冊為 `FormField` 的複雜陣列欄位（特別是使用 dot notation 命名如 `ai.providers`），透過 `setValue` 更新的狀態可能不穩定，或者在 Re-render 過程中丟失。

#### 解決方案
*   **解耦狀態管理**：將 `providers` 列表移出 `react-hook-form` 的管控，改用 React 的 `useState` 獨立管理。
*   **手動合併提交**：在 `handleSubmit` 中，將獨立的 `providers` state 手動合併到提交的資料物件中。

### 2.2 AI 功能設定 (Provider ID) 無法儲存

#### 排查過程
*   **檢查提交數據**：在修復列表問題後，發現 `ai.translation.provider_id` 等欄位在提交時為空字串或結構不正確。
*   **數據結構分析**：觀察 Debug Log 發現 `react-hook-form` 將帶有點號的欄位名稱（如 `ai.translation.provider_id`）自動轉換為巢狀物件結構：
    ```json
    {
      "ai": {
        "translation": {
          "provider_id": "..."
        }
      }
    }
    ```
*   **後端需求**：我們的資料庫 Schema 和後端邏輯期望的是扁平的鍵值對（Key-Value Pair），鍵名包含點號：
    ```json
    {
      "ai.translation.provider_id": "..."
    }
    ```

#### 根本原因
`react-hook-form` 預設行為是將 dot notation視為巢狀路徑，這與系統使用「扁平 Key」存儲設定的設計衝突。

#### 解決方案
*   **實作平坦化邏輯**：在 `handleSubmit` 中加入 `flattenSettingsValues` 輔助函數。
*   **完整獲取數據**：使用 `form.getValues()` 獲取完整的（巢狀）表單狀態，然後遞迴遍歷將其轉換回扁平的 dot notation 格式，最後再發送給 Server Action。

## 3. 總結
本次問題的核心在於前端表單庫 (`react-hook-form`) 的資料結構處理方式與後端儲存格式不一致，以及對複雜狀態的追蹤問題。透過「狀態分離」和「提交前資料轉換 (Flattening)」成功解決了持久化失敗的問題。

---

# 新增情報來源無法獲取新聞問題除錯紀錄 (Debug Log)

## 1. 問題描述
用戶報告在「情報來源管理」頁面新增一個來源（例如北海道新聞 RSS）後，點擊「刷新」按鈕，但無法獲取新聞，內容列表為空。

## 2. 問題分析與解決過程

### 2.1 UI 刷新機制誤導
#### 排查過程
*   **代碼審查**：檢查 `src/app/sources/page.tsx`，發現原有的 `fetchSources` 函數和「刷新」按鈕（`RefreshCw` Icon）僅執行 `GET /api/sources`。
*   **功能確認**：此 API 僅用於重新載入「來源列表」本身的資訊（如名稱、權重），**並不會觸發**後端的 RSS 爬蟲去抓取新文章。
*   **結論**：UI 缺少一個明確觸發「抓取新聞內容」的操作入口。

### 2.2 後端抓取時間戳未更新
#### 排查過程
*   **測試 API**：使用 `curl` 手動觸發 `POST /api/manual-update`，確認 RSS 抓取邏輯本身是運作正常的（日誌顯示 Fetch 成功）。
*   **資料庫檢查**：觀察發現即使抓取成功，`sources` 資料表中的 `last_fetched_at` 欄位並未更新。
*   **代碼追蹤**：檢查 `src/lib/scraper/rss.ts`，發現更新 `lastFetchedAt` 的邏輯可能未被正確執行，或者是因為沒有新文章時跳過了更新步驟。這導致前端無法得知剛剛已經執行過抓取。

## 3. 解決方案

### 3.1 前端改進 (Frontend)
*   **新增操作按鈕**：在來源管理頁面新增「立即抓取新聞」（Fetch News）按鈕。
*   **串接 API**：該按鈕直接呼叫 `POST /api/manual-update`，並使用 Toast 顯示「抓取中...」與「抓取完成」的狀態回饋。
*   **視覺優化**：在列表中新增「上次抓取」欄位，讓用戶能直觀確認系統最後一次工作的時間。

### 3.2 後端修復 (Backend)
*   **強制更新時間戳**：修改 `src/lib/scraper/rss.ts`，在 `finally` 區塊中加入更新邏輯。確保無論是否抓到新文章，只要嘗試過抓取，就更新該來源的 `lastFetchedAt` 時間，作為系統活躍的證明。

## 4. 驗證結果
*   新增來源後，點擊「立即抓取新聞」，與顯示成功訊息。
*   刷新列表後，「上次抓取」欄位正確顯示當前時間（例如 `01/28 06:23`）。
*   確認系統已具備手動觸發與狀態回饋的完整閉環。

---

# 手動情報錄入功能除錯紀錄 (Debug Log)

## 1. 問題描述
用戶在使用「手動情報錄入」功能時遇到以下問題：
1.  **內容無效**：自動抓取的內容包含大量無效資訊（如排行榜、頁尾導航），且包含圖片 Markdown 語法 `![](...)`，需要清除。
2.  **發布失敗**：點擊「發布至簡報系統」後無反應或失敗。
3.  **抓取失敗**：特定網站（如 Yahoo News Japan）有反爬蟲機制，標準抓取方式無法獲取正文。

## 2. 問題分析與解決過程

### 2.1 內容清洗 (Content Cleansing)
#### 排查過程
*   **分析提取結果**：發現 Yahoo News 等網站的提取內容包含大量圖片連結和非正文區塊。
*   **正則表達式過濾**：在 `extractor.ts` 中加入後處理步驟，使用正則表達式 `!\[.*?\]\(.*?\)` 移除所有 Markdown 圖片語法。

### 2.2 發布按鈕失效
#### 排查過程
*   **日誌追蹤**：發現後端在處理發布請求時，卡在 `translationService.translateTitle` 調用上，導致前端請求超時無回應。
*   **解決方案**：在 `route.ts` 中為翻譯服務加入 `try-catch` 和超時控制。如果 AI 翻譯在 15 秒內未回應，自動降級使用原標題發布，確保功能可用性。
*   **UI 反饋**：在前端加入 `sonner` Toast 通知，提供「發布中」和「發布成功」的即時反饋。

### 2.3 AI 智慧清洗 (AI-based Cleaning)
#### 排查過程
*   **需求升級**：單純的正則過濾無法移除「排行榜」、「相關文章」等文字噪音。
*   **解決方案**：在 `extract/route.ts` 中引入 AI 二次處理。將提取的粗糙 Markdown 餵給 LLM， prompt 要求「移除廣告、導航、排行榜，只保留標題與正文」。
*   **成效**：成功過濾掉 Yahoo News 頁尾的大量無關連結。

### 2.4 瀏覽器模擬提取 (Browser-based Extraction)
#### 排查過程
*   **反爬蟲阻擋**：標準 `fetch` 請求被 Yahoo News 阻擋（403/404）或返回空內容。
*   **Readability 失敗**：Yahoo News 的 DOM 結構導致 `Readability` 庫無法正確識別正文，AI 因此判定為無內容。
*   **解決方案 (兩階段)**：
    1.  **引入 Puppeteer**：在後端實作 `browser.ts`，當標準抓取失敗時，自動啟動 Headless Chrome 模擬真人訪問。
    2.  **Yahoo 專屬優化**：在 `extractor.ts` 加入針對 `.article_body` 和 `#uamods-article` 的專屬選擇器，強行指定正文區塊，繞過干擾。

## 3. 驗證結果
*   **Yahoo News**：成功抓取，內容不再包含排行榜。
*   **發布功能**：點擊發布後能順利跳轉，並有成功提示。
*   **自動化**：Docker 環境已更新支援 Chromium，部署後可自動運行。

---

# 手動錄入 500 錯誤與翻譯優化除錯紀錄 (Debug Log)

## 1. 手動錄入 500 錯誤 (Internal Server Error)

### 1.1 問題描述
用戶在手動錄入文章時，點擊「發佈至簡報系統」遭遇 500 錯誤，後端日誌顯示 `Failed to save manually entered content`。

### 1.2 問題分析
*   **Schema 不匹配**：前端表單傳送了 `type` 欄位（用於區分 Twitter/Web），但資料庫 `articles` 表中並無此欄位。直接使用 `...body` 擴展並插入資料庫導致 SQLite 報錯。
*   **日期格式錯誤**：前端傳送的 `publishedAt` 可能為字串格式，而 Drizzle ORM / SQLite 在某些配置下預期 Date 物件或特定的 Timestamp 格式。
*   **唯一性約束**：URL 欄位設有 UNIQUE 約束，若重複提交會導致崩潰，且未被優雅捕獲。

### 1.3 解決方案
*   **後端 (`route.ts`)**：
    *   移除 `...body` 的直接使用，改為顯式提取並解構需要的欄位 (`title`, `url`, `content` 等)。
    *   過濾掉不存在於 Schema 的 `type` 欄位。
    *   強制將 `publishedAt` 轉換為 `new Date()` 物件。
    *   新增針對 `SQLITE_CONSTRAINT_UNIQUE` 的錯誤處理，返回 409 Conflict 狀態碼。
*   **前端 (`page.tsx`)**：
    *   優化錯誤處理邏輯，解析後端返回的 JSON 錯誤訊息，並透過 Toast 顯示具體錯誤（如「URL 已存在」），而非通用的「發布失敗」。

---

## 2. 翻譯語言與標題缺失修復

### 2.1 問題描述
*   **語言不符**：AI 翻譯預設輸出為繁體中文（台灣），但用戶期望為簡體中文。
*   **標題未翻譯**：文章正文翻譯後，標題仍維持日文，且在閱讀器介面中未顯示翻譯後的標題。

### 2.2 解決方案
*   **服務層 (`translator.ts`)**：
    *   修改 System Prompt，明確要求輸出「簡體中文 (Simplified Chinese)」。
    *   更新 `translateArticle` 邏輯，在翻譯正文的同時，若發現 `titleCN` 為空，則並行觸發標題翻譯，並將結果一併存入資料庫。
    *   更新 `TranslationResult` 介面以包含 `titleCN`。
*   **API 層 (`api/translate/route.ts`)**：
    *   更新 Response 結構，回傳 `titleCN`。
*   **前端 (`ReaderView.tsx`)**：
    *   更新介面顯示，將標籤改為「簡體中文」。
    *   新增邏輯：若存在翻譯標題 (`titleCN`) 且當前處於翻譯檢視模式，則在頂部 Header 優先顯示翻譯後的標題。

## 3. 驗證結果
*   手動錄入不再報錯，重複 URL 會提示警告。
*   點擊翻譯後，正文與標題皆正確轉換為簡體中文，並即時更新於 UI。

---

# 全局彈窗 UI 化與 Build 型別錯誤修復紀錄 (Debug Log)

## 1. 全局彈窗 UI 化 (Global Modal Replacement)

### 1.1 問題描述
系統原先使用瀏覽器的原生 `alert()` 和 `confirm()`，導致 UI/UX 不一致且風格與現代 Web 應用的 shadcn/ui 設計不搭。用戶要求全面替換為自定義 UI 彈窗。

### 1.2 解決方案
*   **實作 `GlobalModalProvider`**：
    *   利用 `shadcn/ui` 的 `AlertDialog` 元件作為基礎。
    *   透過 React Context 管理彈窗狀態（標題、訊息、類型）。
    *   使用 `Promise` 與 `useRef` 儲存 resolver，模擬 `await modal.confirm()` 的同步阻塞感。
*   **封裝 `useGlobalModal` Hook**：
    *   提供 `alert(msg)` 和 `confirm(msg)` 接口，回傳 Promise 以支援非同步流程。
*   **全局集成**：
    *   在 `src/app/layout.tsx` 中將 `GlobalModalProvider` 包裹在最外層。
*   **程式碼重構**：
    *   掃描全專案，將 `window.confirm()` 和 `window.alert()` 替換為 `modal.confirm()` 與 `modal.alert()`。

---

## 2. Build 過程中的型別錯誤修復 (Type Error Fix)

### 2.1 問題描述
在完成 Modal 替換後執行 `npm run build`，發現 `src/app/updates/page.tsx` 報錯：
`Type 'unknown' is not assignable to type 'ReactNode'`.
這是一個既有的型別遺留問題，出現在渲染文章標籤 (tags) 的邏輯位置。

### 2.2 原因分析
*   資料庫中 `articles.tags` 欄位被定義為 `unknown`（可能是由 Drizzle 的 JSON 欄位推斷而來）。
*   在 JSX 中直接使用 `{article.tags && ...}` 時，React 無法確定 `article.tags`（型別為 `unknown`）是否為合法的渲染對象，導致 TS 報錯。

### 2.3 解決方案
*   使用 **IIFE (立即調用表達式)** 模式封裝渲染邏輯。
*   加入顯式的 **Type Guard** 檢查：`if (!tags || !Array.isArray(tags) || tags.length === 0)`。
*   使用 **顯式型別斷言 (Type Assertion)**：`(tags as string[]).map(...)`，確保 TS 知道正在處理的是字串陣列。

## 3. 驗證結果
*   ✅ 全局掃描確認無 `alert/confirm` 殘留。
*   ✅ `npm run build` 成功通過。
*   ✅ UI 文字確認為繁體中文，按鈕文字與邏輯正確。

---

# 情報來源管理修復與優化紀錄 (Debug Log)

## 1. 新增來源後無法獲取新聞 (RSS 0 Candidates)

### 1.1 問題描述
用戶反映剛新增的資訊來源（如 Newsweek Japan），其 RSS `https://www.newsweekjapan.jp/rss.xml` 在手動抓取時顯示成功但抓取數量為 0。

### 1.2 原因分析
*   **瀏覽器模式限制**：系統預設使用 Puppeteer 瀏覽器訪問所有 URL。對於直接返回 XML 內容的 RSS Feed，瀏覽器可能會將其渲染為預覽頁面或 XML 樹狀圖，導致基於 CSS Selector 的爬蟲無法正確提取連結。
*   **選擇器失效**：針對 HTML 頁面設計的通用提取邏輯（尋找 `a` 標籤）對 XML 結構無效。

### 1.3 解決方案
*   **引入 `rss-parser`**：在 `browser.ts` 中加入預處理邏輯。
*   **智慧判斷**：抓取前檢查 URL 特徵（結尾為 `.xml`, `.rss` 或包含 `/feed`）。
*   **分流處理**：如果是 RSS Feed，直接使用 parser 解析 XML 結構提取連結；否則才啟動 Puppeteer 瀏覽器。
*   **效能優化**：此改動同時大幅提升了 RSS來源的抓取速度，因為無需啟動瀏覽器實例。

## 2. 來源刪除失敗 (Source Deletion Failure)

### 2.1 問題描述
用戶點擊刪除來源按鈕後，UI 無錯誤提示，但刷新頁面後該來源仍然存在。

### 2.2 原因分析
*   **外鍵約束 (Foreign Key Constraint)**：`sources` 表是 `articles` 表的父表。當該來源已有已抓取的新聞文章時，資料庫阻止直接刪除 `source` 記錄以維護資料完整性。
*   **錯誤處理不足**：前端 `deleteSource` 只檢查了 HTTP 200，但未詳細處理 500 錯誤回應，導致失敗時無感。

### 2.3 解決方案：軟刪除 (Soft Delete)
為保留歷史新聞數據（用戶不希望刪除來源就把相關新聞也刪光），採用「軟刪除」策略：
1.  **Schema 變更**：在 `sources` 表新增 `deletedAt` (TimeStamp) 欄位。
2.  **API 調整**：
    *   `DELETE` 請求不再執行 SQL `DELETE`，而是更新 `deletedAt = NOW()` 並設 `isActive = false`。
    *   `GET` 請求自動過濾掉 `deletedAt IS NOT NULL` 的記錄。
3.  **效果**：來源從列表中消失，但其關聯的歷史文章仍可被查詢和保留。

## 3. 來源編輯功能 (Edit Source)

### 3.1 問題描述
用戶輸入錯誤的 URL 後，系統僅提供「刪除」功能，缺乏「編輯」功能，導致必須刪除重建，體驗不佳。

### 3.2 解決方案
*   **新增 PATCH API**：實作 `PATCH /api/sources/[id]` 接口，允許局部更新來源資訊。
*   **實作編輯彈窗**：
    *   新增 `EditSourceDialog` 元件，復用新增來源的表單邏輯。
    *   在列表新增「編輯」按鈕 (筆型圖示)。
    *   支援即時修改名稱、URL、類型、分類與權重。

## 4. 驗證結果
*   ✅ RSS Feed 可正常抓取到新聞。
*   ✅ 刪除來源成功隱藏，且不影響舊有文章。
*   
---

# 最新動態標題未翻譯問題除錯紀錄 (Debug Log)

## 1. 問題描述
用戶報告在「最新動態」頁面中，點擊翻譯後，文章右側的正文已正確翻譯成簡體中文，但標題位置仍顯示「等待翻譯...」。

## 2. 問題分析與解決過程

### 2.1 數據狀態檢查
#### 排查過程
*   **數據庫查詢**：執行 SQL 檢查發現，受影響的文章 `contentCN`（正文翻譯）有值，但 `titleCN`（標題翻譯）是**空字串 `""`** 而非 `NULL`。
*   **前端邏輯分析**：在 `article-detail-client.tsx` 中，標題顯示邏輯為 `{article.titleCN || "等待翻譯..."}`。由於 `""` 是 Falsy 值，導致始終顯示「等待翻譯...」。

### 2.2 翻譯服務邏輯漏洞
#### 排查過程
*   **代碼審查**：檢查 `src/lib/services/translator.ts`，發現 `translateTitle` 函數在遇到超時或錯誤時會返回空字串 `""`。
*   **翻譯策略缺陷**：
    1.  AI 在翻譯全文時，通常會在返回的 Markdown 第一行包含標題（例如 `# 標題內容`），但系統未嘗試提取此內容。
    2.  系統會並行發起另一個獨立的 `translateTitle` 請求，但該請求經常因為 API 負載或網路問題超時（原設定為 15s）。
    3.  當獨立請求失敗返回 `""` 時，該值會覆蓋資料庫中的 `NULL`，導致 UI 狀態錯誤。

### 2.3 UI 交互限制
#### 排查過程
*   **按鈕邏輯**：原先的「翻譯全文」按鈕僅在 `!article.contentCN` 時顯示。如果正文已翻譯但標題缺失，用戶無法手動重新觸發標題翻譯。

## 3. 解決方案

### 3.1 翻譯服務修復 (Backend)
*   **自動提取標題**：在 `translateArticle` 中加入邏輯，若 AI 返回的正文第一行是以 `#` 開頭的標題，則自動將其提取出來作為 `titleCN`。
*   **防呆處理**：只有當翻譯結果非空且有效時才更新 `titleCN`，避免用空字串覆蓋原始狀態。
*   **優化超時**：將標題翻譯的超時時間從 15 秒延長至 30 秒，提高成功率。

### 3.2 前端邏輯優化 (Frontend)
*   **按鈕動態化**：修改顯示條件為 `!article.contentCN || !article.titleCN`。
*   **文字提醒**：若正文已有但標題缺失，按鈕文字自動切換為「翻譯標題」，允許用戶針對性修復。

### 3.3 數據修正 (Data Fix)
*   **清理損壞數據**：執行腳本將資料庫中所有為空字串 `""` 的 `titleCN` 重置為 `NULL`，確保修復後的代碼能正確識別並允許重新翻譯。

## 4. 驗證結果
*   ✅ 文章正文翻譯後，標題能自動從內容中提取並顯示。
*   ✅ 若標題未自動翻譯，用戶可點擊「翻譯標題」單獨重試。
*   ✅ 數據庫中不再存儲無效的空字串作為翻譯標題。


---

# 文章刪除功能導航錯誤與水合問題除錯紀錄 (Debug Log)

## 1. 問題描述
用戶報告在 `/updates` 頁面點擊文章的刪除按鈕時，系統沒有彈出刪除確認對話框，而是直接導航到了文章的詳情頁面。此外，開發者工具的控制台中出現了伺服器端渲染 (SSR) 與客戶端渲染不一致的水合 (Hydration) 錯誤。

## 2. 導航問題分析與修復

### 2.1 事件冒泡 (Event Bubbling)
#### 排查過程 (Investigation)
*   **觀察現象**：點擊位於文章卡片右上角的垃圾桶圖標，頁面跳轉至 `/updates/[id]`。
*   **代碼審查**：發現 `ArticleActions` 組件被嵌套在 Next.js 的 `<Link>` 組件內部。
    ```tsx
    <Link href={`/updates/${article.id}`}>
        <Card>
            ...
            <ArticleActions />
            ...
        </Card>
    </Link>
    ```
*   **無效修復嘗試**：最初在 `ArticleActions` 的 `div` 和 `button` 上添加了 `e.stopPropagation()` 和 `e.preventDefault()`。
*   **失效原因**：Next.js 的 `<Link>` 組件行為特殊，它可能監聽了捕獲階段 (Capture Phase) 事件，或者其 Prefetch 行為難以通過簡單的 `stopPropagation` 完全阻止。且在按鈕上使用 `preventDefault()` 意外阻止了 Radix UI `AlertDialogTrigger` 的正常開啟行為。

### 2.2 架構性修復
#### 解決方案 (Solution)
*   **DOM 重構**：放棄在 Link 內部阻止事件的嘗試。將 `ArticleActions` 移出 `<Link>` 結構，並使用 CSS 絕對定位 (`absolute positioning`) 將其放置在卡片視覺上的右上角。
*   **層級調整**：
    ```tsx
    <div className="relative group">
        <div className="absolute top-4 right-4 z-10">
            <ArticleActions />
        </div>
        <Link ...>
            <Card>...</Card>
        </Link>
    </div>
    ```
*   **移除冗餘代碼**：由於不再嵌套，移除了 `ArticleActions` 中所有 `stopPropagation` 和 `preventDefault` 邏輯，恢復了 Radix UI 的默認交互行為。

## 3. 外鍵約束 (Foreign Key Constraint) 錯誤

### 3.1 問題描述
修復 UI 互動後，點擊「確認刪除」後端報 `SqliteError: FOREIGN KEY constraint failed` (500 Internal Server Error)。

### 3.2 原因分析
*   **資料庫結構**：`article_people` 表包含指向 `articles.id` 的外鍵。
*   **刪除邏輯缺失**：原有的 `delete(id)` 方法僅執行 `DELETE FROM articles WHERE id = ?`，未先清理關聯數據。

### 3.3 解決方案
在刪除文章前，先刪除關聯記錄 (Cascade Delete 手動實作)：
```typescript
async delete(id: string) {
    // 先刪除關聯的人名標記記錄
    await db.delete(articlePeople).where(eq(articlePeople.articleId, id));
    // 再刪除文章本體
    await db.delete(articles).where(eq(articles.id, id));
}
```

## 4. 水合錯誤 (Hydration Mismatch)

### 4.1 日期格式不一致
*   **錯誤訊息**：`Text content does not match server-rendered HTML.` (Server: "1/28/2026", Client: "2026/1/28")
*   **原因**：使用了 `new Date().toLocaleDateString()` 但未指定 locale。伺服器 (Node.js) 和瀏覽器的默認 locale 不同。
*   **修復**：顯式指定 locale，統一使用 `'zh-TW'`：
    ```tsx
    new Date(article.publishedAt).toLocaleDateString('zh-TW')
    ```

### 4.2 Radix UI ID 隨機性
*   **錯誤訊息**：`Prop aria-controls did not match.`
*   **原因**：Radix UI 的 Dialog/Sheet 組件在 SSR 和 Client 端生成了不同的隨機 ID。
*   **處理**：這通常是開發環境警告，不影響生產環境功能，暫時忽略或可使用 `suppressHydrationWarning`。

## 5. 驗證結果
*   ✅ **導航阻斷**：點擊刪除按鈕不再誤觸發文章跳轉。
*   ✅ **對話框功能**：刪除確認視窗正常彈出。
*   ✅ **數據完整性**：文章及其關聯數據能被成功物理刪除，且不會引發資料庫錯誤。

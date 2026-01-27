# AI 設定持久化問題除錯紀錄 (Debug Log)

## 1. 問題描述
用戶報告在系統設定頁面中配置 AI 相關選項時遇到以下問題：
1.  **AI 提供商列表無法儲存**：新增提供商後點擊儲存，刷新頁面後資料消失。
2.  **AI 功能提供商選擇無法儲存**：為特定功能（如翻譯、簡報）選擇提供商後，儲存並刷新頁面，設定恢復為預設值。

## 2. 問題分析與解決過程

### 2.1 AI 提供商列表 (ai.providers) 無法儲存

#### 排查過程
*   **追蹤數據流**：在 `saveSettingsAction` 和 `handleSubmit` 加入 Log，發現提交時 `ai.providers` 始終為空陣列 `[]`。
*   **檢查表單狀態**：雖然在 `handleSaveProvider` 中使用了 `form.setValue` 並且設置了 `shouldDirty: true`，但在 `handleSubmit` 觸發時，`react-hook-form` 內部的狀態似乎被重置或未能正確追蹤此陣列欄位。
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

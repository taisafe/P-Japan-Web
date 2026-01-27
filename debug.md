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

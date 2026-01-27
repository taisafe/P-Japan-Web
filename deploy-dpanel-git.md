# 使用 DPanel 透過 GitHub 部署教學

這份指南將引導您如何在 DPanel 中使用 GitHub 倉庫進行快速部署。

## 準備工作
1. 確保您的代碼已推送到 GitHub 倉庫：`https://github.com/taisafe/P-Japan-Web`
2. 準備好您的 `OPENAI_API_KEY`。

---

## 步驟 1：在 DPanel 建立新堆疊 (Stack)
1. 登入您的 DPanel 管理頁面。
2. 點擊左側選單的 **「堆疊 (Stacks)」** 或 **「專案 (Projects)」**。
3. 點擊 **「新增 (Add)」** 或 **「建立 (Create)」**。
4. 選擇 **「Git」** 作為來源。

## 步驟 2：配置 Git 資訊
1. **倉庫 URL**: 輸入 `https://github.com/taisafe/P-Japan-Web.git`
2. **分支 (Branch)**: 輸入 `main`。
3. 如果是私有倉庫，請配置好您的 Git 憑證（如果是公開倉庫則不需要）。

## 步驟 3：設置環境變數 (Environment Variables)
在 DPanel 的配置頁面中，找到 **「環境變數」** 區域，添加以下內容：
- `OPENAI_API_KEY`: `您的金鑰`
- `DATABASE_URL`: `/data/japan-politics.db` (這已在 docker-compose.yml 中默認設置，通常不需要改動)

## 步驟 4：部署
1. 點擊 **「部署 (Deploy)」** 或 **「啟動 (Up)」**。
2. DPanel 將自動拉取代碼、構建鏡像並啟動服務。
3. 部署完成後，您可以透過服務器 IP 的 `3000` 端口訪問。

---

> [!TIP]
> **數據持久化**: 
> 專案已配置卷掛載 `./data:/data`。在 DPanel 中，請確保該堆疊的工作目錄下有一個 `data` 文件夾，以便持久化保存 SQLite 資料庫。

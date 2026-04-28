# 俠客行不行平台 — 技術審核測評報告書

**審核日期：** 2026-04-25（第二輪）  
**審核版本：** MVP v0.2（Phase 1 進行中）  
**覆蓋範圍：** youxia-platform（Next.js API + 網頁）、youxia-app（Expo React Native）

---

## 一、總體評分

| 面向 | 第一輪 | 第二輪 | 說明 |
|------|--------|--------|------|
| 功能完整度 | 6.5 | 7.5 | QUOTED 狀態修正後核心流程更完整 |
| 程式碼品質 | 7.5 | 8.0 | 重複程式碼清理，常數來源統一 |
| 資安防護 | 6.0 | 7.0 | OTP 改用 crypto.randomBytes；注入防護 |
| 效能設計 | 7.0 | 7.0 | 無變動 |
| 使用者體驗 | 7.5 | 8.5 | 截止提示、已報價標記、豐富儀表板 |
| 平台一致性 | 6.5 | 8.0 | 費率資料、等級稱號兩端統一；全面去除「抽傭」表述 |

**綜合評分：7.7 / 10（本輪顯著改善，核心邏輯 Bug 全數修正）**

---

## 二、已完成功能盤點

### ✅ 後端（youxia-platform）

| 功能 | 路由 | 狀態 |
|------|------|------|
| 手機 OTP 登入 | `POST /api/auth/mobile` | ✅ 含速率限制、Token 30 天效期 |
| 發案 API | `POST /api/jobs` | ✅ Zod 驗證、發案後 SMS 通知 |
| 案件列表 | `GET /api/jobs` | ✅ 城市/jobType 篩選 |
| 案件詳情（含報價） | `GET /api/jobs/[id]` | ✅ 含報價排序（低→高）|
| 師傅報價 | `POST /api/quotes` | ✅ 防重複報價（unique constraint）|
| 接受報價 | `POST /api/quotes/[id]/accept` | ✅ 僅發案人可操作 |
| 我的案件 | `GET /api/my/jobs` | ✅ |
| 我的報價 | `GET /api/my/quotes` | ✅ |
| 師傅資料 CRUD | `GET/POST /api/my/profile` | ✅ 含身份證 Hash、互斥檢查 |
| 成就系統（讀） | `GET /api/achievements` | ✅（本次修正 mobile auth）|
| 盟會 CRUD | `GET/POST /api/halls` | ✅ 含統編驗證、成員互斥 |
| SMS 通知 | `src/lib/sms.ts` | ✅ Twilio / dev console fallback |

### ✅ 前端（youxia-app）

| 功能 | 頁面/元件 | 狀態 |
|------|----------|------|
| 手機 OTP 登入 | `(auth)/login.tsx` | ✅ |
| 首頁（案件列表） | `(tabs)/index.tsx` | ✅ |
| 發案流程（3步驟） | `(tabs)/post-job.tsx` | ✅ 含指數分級預算滑桿 |
| 案件詳情（Didi 風格） | `job/[id].tsx` | ✅ 價格優先排列、最划算標籤 |
| 師傅儀表板 | `(tabs)/dashboard.tsx` | ✅ |
| 遊俠等級升級動畫 | `components/LevelUpModal.tsx` | ✅ |
| 指數預算滑桿 | `components/BudgetRangeSlider.tsx` | ✅ 雙把手、NT$50 起步 |

---

## 三、審核修正項目

### 🔧 第一輪已修正（共 8 項）

| # | 問題 | 檔案 | 修正方式 |
|---|------|------|---------|
| 1 | OTP 無速率限制，可被暴力枚舉 | `auth/mobile/route.ts` | 每支號碼 10 分鐘內最多 3 次，429 回應 |
| 2 | `achievements/route.ts` 使用 `auth()`，Mobile Token 用戶無法取得成就 | `achievements/route.ts` | 改用 `getAuthUser()`，統一行動端與網頁端認證 |
| 3 | SMS 通知未排除發案人（若發案人也是師傅會收到自己的通知） | `jobs/route.ts` | `userId: { not: posterUserId }` 過濾 |
| 4 | 儀表板遊俠介紹顯示錯誤費率與稱號 | `dashboard.tsx` | Lv.3→熟練遊俠 11%，Lv.5→傳說宗師 7% |
| 5 | 案件狀態永遠顯示「等待報價」，後端不更新 QUOTED | `dashboard.tsx` | 前端推衍：`_count.quotes > 0 && status === "OPEN"` 時顯示「有報價了」 |
| 6 | `safeParseJson` 在兩個 route 重複定義 | `lib/json.ts`（新建）、`halls/route.ts`、`profile/route.ts` | 提取為共用工具函數，統一有型別的泛型簽名 |
| 7 | 發案成功後無法直接跳到新案件頁（只能去儀表板） | `post-job.tsx` | 存 `createdJobId`，成功畫面直連 `/job/{id}` |
| 8 | 測試腳本殘留在 production 目錄 | `check-db.mjs`、`test-sms.mjs`、`seed-second-master.mjs` | 全數刪除 |

### 🔧 第二輪已修正（共 18 項）

| # | 問題 | 檔案 | 修正方式 |
|---|------|------|---------|
| 9  | 接受第一份報價後案件變 QUOTED，之後無法再接受其他報價 | `quotes/[id]/accept/route.ts`（兩端）| `!["OPEN","QUOTED"].includes(job.status)` |
| 10 | GET /api/jobs 不返回 QUOTED 狀態案件，師傅看不到有報價的案件 | `jobs/route.ts`、`(master)/jobs/page.tsx` | `status: { in: ["OPEN","QUOTED"] }` |
| 11 | job detail isOpen 只判斷 OPEN，第一份報價後報價按鈕消失 | `job/[id].tsx`（兩端）| `status === "OPEN" \|\| status === "QUOTED"` |
| 12 | 平台 `src/constants/fees.ts` 費率錯誤（12/10/8/0% 而非 13/11/9/7%） | `src/constants/fees.ts` | 更正為正確費率；Lv.5 從 0% 改為 7% |
| 13 | 平台 constants 最低交易額偏高（500/200 vs 正確 300/100） | `src/constants/fees.ts` | `MIN_TRANSACTION_NORMAL=300`，`MIN_TRANSACTION_QUIRKY=100` |
| 14 | App constants 遊俠等級稱號錯誤（白衣少俠/武林泰斗等舊命名） | `constants/fees.ts`（App）| 統一為：初出茅廬/江湖新秀/熟練遊俠/俠客高手/傳說宗師 |
| 15 | `lib/utils.ts` import 語句在函式宣告中間，造成潛在模組解析問題 | `lib/utils.ts` | import 移至檔案頂部 |
| 16 | 師傅相關頁面強調「抽傭 X%」違反產品設計哲學 | `dashboard.tsx`、`LevelUpModal.tsx`、`master/register.tsx`、`src/app/dashboard/page.tsx`、`src/app/(public)/page.tsx` | 全面改為「等級特權」表述（優先曝光/優先通知/廣告位）|
| 17 | `GET /api/jobs` 不返回已登入師傅自己的報價，導致 App 無法顯示「已報價」狀態 | `jobs/route.ts` | `myQuote` 欄位：按 masterId 過濾後只回傳自己報價 |
| 18 | jobs.tsx 未顯示已報價標記 | `(tabs)/jobs.tsx` | 綠色「✓ 已報 NT$X」標籤 + 「查看進度」按鈕 |
| 19 | index.tsx 廣告位顯示舊稱號「武林泰斗」 | `(tabs)/index.tsx` | 改為「傳說宗師」 |
| 20 | 案件截止後 job detail 無任何提示，報價表單繼續顯示 | `job/[id].tsx` | `isExpired` 判斷 + 紅色截止橫幅 + StyleSheet |
| 21 | `GET /api/my/quotes` 只回傳 `job.title`，App 儀表板資訊不足 | `api/my/quotes/route.ts` | 加回 `job.status`、`city`、`district`、`budgetMin`、`budgetMax` |
| 22 | Dashboard 我的報價卡只顯示標題+金額，獲選者無特別標記 | `(tabs)/dashboard.tsx` | 地址顯示、🎉 已選中標示、綠色卡面樣式 |
| 23 | `master/achievements.tsx` DB 沒有成就資料時顯示空白頁面 | `app/master/achievements.tsx` | 兩層空狀態：「圖鑑建置中」和「此稀有度無成就」 |
| 24 | 奇特委託發案缺少預算上限警示（前後端） | `post-job.tsx`、`(client)/post-job/page.tsx` | 黃色提示橫幅 + budgetMax 自動截止 |
| 25 | OTP 使用 `Math.random()` 不夠安全 | `auth/mobile/route.ts` | 改用 `crypto.randomBytes(3).readUIntBE(0,3)` |
| 26 | SMS 標題注入風險（換行符可偽造多段簡訊） | `jobs/route.ts` | `title.replace(/[\r\n]/g, " ")` |

---

## 四、仍待實作功能（Phase 1 剩餘）

### 🔴 高優先（影響核心流程）

1. **金流接入（ECPay / LINE Pay）**
   - 接受報價後應導向付款流程
   - Webhook 簽章驗證（CheckMacValue）
   - 訂單狀態機：`PENDING_PAYMENT → PAID → COMPLETED`

2. **完工確認流程**
   - 師傅上傳完工照 → 客戶點擊確認完成
   - 觸發 T+3 師傅入帳排程

3. **雙向評分系統**
   - 完工後開放評分窗口（時限 7 天）
   - 評分寫入後更新 `MasterProfile.avgRating`

### 🟡 中優先（體驗改善）

4. **遊俠等級定期更新（Cron Job）**
   - 每月 1 日滾動計算 90 天 `completedOrders` + `avgRating`
   - 目前 `youxiaLevel` 欄位存在但無自動更新機制

5. **案件圖片上傳（UploadThing）**
   - `photos` 欄位已在 Schema 預留，但發案流程尚未串接

6. **師傅 KYC 審核（Admin 後台）**
   - `idVerifyStatus` 欄位齊全，缺少 Admin 審核介面
   - 目前持照師傅靠自行聲稱 `isLicensed: true`，無驗證

7. **案件截止機制**
   - `quoteDeadline` 欄位存在，缺對應 Cron Job 將過期案件改為 `EXPIRED`

### 🟢 低優先（錦上添花）

8. **案件搜尋 / 關鍵字篩選**
9. **Expo Push Notification（替代 SMS，節省成本）**
10. **區域宗師廣告位拍賣**（Schema 已備，邏輯未寫）

---

## 五、資安審查

### ✅ 已到位

- **手機 OTP**：速率限制 3 次/10 分 + 5 分鐘過期
- **Token 認證**：`UserToken` 存 DB，30 天效期，登出即刪
- **身份證 Hash**：存 SHA-256，不存明文，只回傳末 4 碼
- **報價唯一約束**：`@@unique([jobId, masterId])` 防重複報價
- **發案人驗證**：接受報價前核對 `quote.job.clientId === user.id`
- **統編格式驗證**：`/^\d{8}$/`，身份證 `/^[A-Z][0-9]{9}$/i`
- **互斥防範**：遊俠不得同時是盟會成員（反之亦然）

### ⚠️ 建議改善

| 風險 | 說明 | 建議 |
|------|------|------|
| OTP 存記憶體 | `otpStore` 為 in-process Map，多實例部署（如 Vercel Serverless）會失效 | 改用 Redis 或 Vercel KV |
| Rate Limit 存記憶體 | 同上 | 同上 |
| CORS 過寬 | `allowedOrigins` 包含所有 `localhost` 及 `http://`，不適合上線 | 上線時限定正式 domain |
| SMS 內容 Injection | 目前 `title` 直接插入簡訊，若惡意使用者在標題塞換行可偽造訊息 | `title = title.replace(/[\r\n]/g, " ")` |
| Admin 路由無認證 | 目前無 `/api/admin` 路由，但 KYC 審核需要 | 上線前必須加 admin role 檢查 |

---

## 六、效能審查

### ✅ 已到位

- 案件列表 `take: 50` 分頁限制
- 用 `_count: { select: { quotes: true } }` 避免全撈報價
- `@@index([city, status])`、`@@index([jobType, status])` 索引正確設置
- SMS 通知非同步（`.catch()` 不阻塞回應）

### ⚠️ 建議改善

| 問題 | 說明 | 建議 |
|------|------|------|
| 缺首頁快取 | 案件列表每次請求都打 DB | 加 `revalidate = 30` 或 SWR staleWhileRevalidate |
| 師傅通知全表掃 | `notifyNearbyMasters` 撈所有可接案師傅再 JS 過濾 `serviceAreas` | 若師傅量大，改在 Prisma 查詢時用 raw JSON contains（SQLite 不支援，Supabase 支援） |
| 盟會成員互斥迴圈 | 每個成員各做一次 DB 查詢 | 改批次查：`WHERE nationalIdHash IN (...)` |

---

## 七、設計亮點

1. **問題樹自動分流**：使用者只描述問題，平台自動分流「遊俠/認證師傅」，體驗比傳統分類更直覺。
2. **指數分級預算滑桿**：低端刻度密（NT$50 起）、高端刻度疏，符合廉價散件平台定位，視覺體驗接近機票選價。
3. **Didi 風格報價頁**：價格作為視覺主角（字號 26px/900weight），「最划算」標籤 + 差距顯示，引導客戶快速決策。
4. **遊俠等級遊戲化**：抽傭逐級遞減作為激勵，Lv.5 傳說宗師 7% 設定合理，不至於讓平台虧損。
5. **盟會互斥機制**：遊俠與盟會成員身份互斥，防止師傅「兩頭吃」刷評分，維護平台公平性。

---

## 八、上線 Checklist

上線前必須完成：

- [ ] 將 `DATABASE_URL` 切換至 Supabase（PostgreSQL）
- [ ] 填入 `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`
- [ ] OTP Store 改為 Redis（Upstash 推薦）
- [ ] 填入 ECPay / LINE Pay 金鑰
- [ ] 收緊 CORS `allowedOrigins`（僅允許正式 domain）
- [ ] 完成金流 Webhook 路由（含 `CheckMacValue` 驗證）
- [ ] 建立 Admin 後台（KYC 審核最低限度）
- [ ] 設定 Vercel Cron Jobs（T+3 撥款、月度等級重算、案件過期）
- [ ] SMS title 內容過濾（防 Injection）
- [ ] 刪除 `.env.local` 中 `AUTH_SECRET` 的測試值，改用隨機生成

---

## 九、結論

俠客行不行平台的 MVP 骨架已相當完整，核心「發案→報價→選擇」流程可順暢運行。指數預算滑桿、問題自動分流、遊俠等級制度是三個真正有差異化的產品設計點。

目前最大的 Gap 是**金流與完工確認**尚未實作——這是貨幣化的最後一哩路，建議以此為 Phase 1 最高優先任務。資安方面，記憶體型 OTP/Rate Limit Store 需在多實例部署前換為 Redis，是必修項目。

若金流於未來兩週完成，即可達到「可真實收款的最小可行產品」門檻，具備正式開放測試的條件。

---

*第一輪報告：2026-04-24 · 第二輪更新：2026-04-25*

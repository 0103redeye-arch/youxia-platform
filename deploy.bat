@echo off
setlocal

echo.
echo ============================================
echo  俠客行不行 - 一鍵部署到 Vercel
echo ============================================
echo.

REM ── 步驟 1：推送到 GitHub ──
echo [1/3] 推送程式碼到 GitHub...
echo.
echo 請先到 https://github.com/new 建立一個新的 repo（名稱建議：youxia-platform）
echo 建立後把下面這兩行改成你的 GitHub username 和 repo 名稱：
echo.
set /p GITHUB_USER="GitHub 使用者名稱（例：ihateenglish）: "
set /p REPO_NAME="Repo 名稱（例：youxia-platform）: "

git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
git branch -M main
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [錯誤] Git push 失敗，請確認 GitHub repo 已建立並登入。
  pause
  exit /b 1
)

echo.
echo [OK] 程式碼已推送到 GitHub！
echo.

REM ── 步驟 2：安裝 Vercel CLI ──
echo [2/3] 安裝 Vercel CLI...
call npm install -g vercel 2>nul
echo.

REM ── 步驟 3：部署 ──
echo [3/3] 部署到 Vercel（會開啟瀏覽器要求登入）...
echo.
echo 部署時的設定：
echo   - Framework: Next.js（自動偵測）
echo   - Root Directory: .（預設）
echo   - 部署完成後請到 Vercel Dashboard 設定 Environment Variables
echo.
call vercel --prod

echo.
echo ============================================
echo  部署完成！
echo ============================================
echo.
echo 接下來請到 Vercel Dashboard 設定 Environment Variables：
echo   https://vercel.com/dashboard
echo.
echo 必填環境變數：
echo   DATABASE_URL          （Supabase Transaction Pooler URL）
echo   DIRECT_URL            （Supabase Direct URL）
echo   AUTH_SECRET           （執行 openssl rand -base64 32 取得）
echo   NEXTAUTH_URL          （你的 Vercel 網址，例：https://youxia.vercel.app）
echo   NEXT_PUBLIC_APP_URL   （同 NEXTAUTH_URL）
echo   CRON_SECRET           （執行 openssl rand -base64 32 取得）
echo.
echo 選填（功能齊全用）：
echo   AUTH_LINE_CLIENT_ID / AUTH_LINE_CLIENT_SECRET
echo   AUTH_GOOGLE_CLIENT_ID / AUTH_GOOGLE_CLIENT_SECRET
echo   UPLOADTHING_SECRET / UPLOADTHING_APP_ID
echo   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
echo   ECPAY_MERCHANT_ID / ECPAY_HASH_KEY / ECPAY_HASH_IV
echo.
pause

/**
 * SMS 發送層
 * - 有設 TWILIO_* 環境變數 → 走 Twilio REST API 真實發送
 * - 未設（dev/test）→ 印 console，方便開發時查看內容
 *
 * .env.local 範例：
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=your_auth_token
 *   TWILIO_FROM_NUMBER=+886xxxxxxxxx   # 或 Twilio 提供的號碼
 */

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER  = process.env.TWILIO_FROM_NUMBER ?? "+886900000000";

export async function sendSms(to: string, message: string): Promise<void> {
  // 號碼標準化：台灣 09xx → +8869xx
  const normalized = to.startsWith("+") ? to : to.replace(/^0/, "+886");

  if (!TWILIO_SID || !TWILIO_TOKEN) {
    // Dev mode：印出完整 SMS 內容
    console.log(
      `\n📱 [SMS DEV]\n` +
      `  To:  ${normalized}\n` +
      `  Msg: ${message}\n`
    );
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const body = new URLSearchParams({
    From: FROM_NUMBER,
    To:   normalized,
    Body: message,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[SMS] Twilio error ${res.status}:`, err);
    // 不 throw：SMS 失敗不應中斷主流程
  }
}

/** 批次發送，逐一呼叫，失敗單筆不影響其他 */
export async function sendSmsBatch(
  recipients: Array<{ phone: string; message: string }>
): Promise<void> {
  await Promise.allSettled(
    recipients.map(({ phone, message }) => sendSms(phone, message))
  );
}

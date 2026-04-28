import crypto from "crypto";

/**
 * 綠界 ECPay 整合
 * 文件：https://developers.ecpay.com.tw/
 *
 * 測試環境 MerchantID: 2000132
 * 正式環境需申請綠界商家帳號
 */

const IS_TEST = process.env.ECPAY_ENV !== "production";

export const ECPAY_CONFIG = {
  merchantId:  IS_TEST ? "2000132"                   : (process.env.ECPAY_MERCHANT_ID ?? ""),
  hashKey:     IS_TEST ? "5294y06JbISpM5x9"          : (process.env.ECPAY_HASH_KEY    ?? ""),
  hashIV:      IS_TEST ? "v77hoKGq4kWxNNIS"          : (process.env.ECPAY_HASH_IV     ?? ""),
  paymentUrl:  IS_TEST
    ? "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
    : "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
};

/** 計算綠界 CheckMacValue */
export function calcCheckMacValue(params: Record<string, string>): string {
  const { HashKey, HashIV, ...rest } = params as any;
  const key   = HashKey  ?? ECPAY_CONFIG.hashKey;
  const iv    = HashIV   ?? ECPAY_CONFIG.hashIV;

  // 按照 key 字母排序後串接
  const sorted = Object.entries(rest)
    .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const raw = `HashKey=${key}&${sorted}&HashIV=${iv}`;
  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%21/g, "!")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2a/g, "*")
    .replace(/%2d/g, "-")
    .replace(/%2e/g, ".")
    .replace(/%5f/g, "_")
    .replace(/%7e/g, "~");

  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

/** 驗證綠界的 CheckMacValue（用於 webhook） */
export function verifyCheckMacValue(params: Record<string, string>): boolean {
  const { CheckMacValue, ...rest } = params;
  const expected = calcCheckMacValue(rest);
  return expected === CheckMacValue;
}

export interface CreatePaymentParams {
  orderId:     string;   // 我們系統的 Order.id
  amount:      number;   // 金額（整數 NT$）
  itemName:    string;   // 商品名稱
  returnUrl:   string;   // 付款後跳轉（前端 return URL）
  notifyUrl:   string;   // 伺服器端 webhook URL (必須公開 HTTPS)
  clientBackUrl: string; // 消費者取消時跳回的頁面
}

/** 產生送往綠界的表單欄位 */
export function buildPaymentForm(p: CreatePaymentParams) {
  const tradeNo = `YX${Date.now()}`.slice(0, 20);  // 綠界限 20 碼
  const tradeDate = new Date().toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).replace(/\//g, "/").replace(",", "");  // "2024/04/28 14:30:00"

  const params: Record<string, string> = {
    MerchantID:        ECPAY_CONFIG.merchantId,
    MerchantTradeNo:   tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType:       "aio",
    TotalAmount:       String(p.amount),
    TradeDesc:         encodeURIComponent("俠客行不行服務平台"),
    ItemName:          p.itemName.slice(0, 200),
    ReturnURL:         p.notifyUrl,
    ClientBackURL:     p.clientBackUrl,
    OrderResultURL:    p.returnUrl,
    ChoosePayment:     "ALL",
    EncryptType:       "1",
    CustomField1:      p.orderId,  // 放我們的 orderId 供 webhook 對帳
  };

  params.CheckMacValue = calcCheckMacValue(params);

  return { params, tradeNo, formUrl: ECPAY_CONFIG.paymentUrl };
}

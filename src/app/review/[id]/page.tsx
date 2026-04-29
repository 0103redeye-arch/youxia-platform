"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Star } from "lucide-react";

// Reusable star-rating row (no hook inside map)
function StarRating({
  label, value, hoverValue, onHover, onChange, big = false,
}: {
  label?: string;
  value: number;
  hoverValue: number;
  onHover: (v: number) => void;
  onChange: (v: number) => void;
  big?: boolean;
}) {
  const sz = big ? "w-10 h-10" : "w-7 h-7";
  const stars = (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(0)}
          className="p-0.5"
        >
          <Star
            className={`${sz} transition-colors ${
              i <= (hoverValue || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-slate-200 fill-slate-200"
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (!label) return stars;
  return (
    <div className="flex items-center justify-between">
      <span className="text-base text-slate-700">{label}</span>
      {stars}
    </div>
  );
}

export default function ReviewPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const orderId  = params.id;

  const [overall,       setOverall]       = useState(0);
  const [overallHover,  setOverallHover]  = useState(0);
  const [quality,       setQuality]       = useState(0);
  const [qualityHover,  setQualityHover]  = useState(0);
  const [punctuality,   setPunctuality]   = useState(0);
  const [punctHover,    setPunctHover]    = useState(0);
  const [attitude,      setAttitude]      = useState(0);
  const [attHover,      setAttHover]      = useState(0);
  const [comment,       setComment]       = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [submitted,     setSubmitted]     = useState(false);

  // Pre-fill sub-ratings when overall is first picked
  useEffect(() => {
    if (overall > 0) {
      if (quality     === 0) setQuality(overall);
      if (punctuality === 0) setPunctuality(overall);
      if (attitude    === 0) setAttitude(overall);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overall]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overall === 0) { setError("請給予整體評分"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          overallRating:     overall,
          qualityRating:     quality     || undefined,
          punctualityRating: punctuality || undefined,
          attitudeRating:    attitude    || undefined,
          comment:           comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "提交失敗，請稍後再試");
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-24 text-center px-6">
          <div className="text-8xl mb-6">⭐</div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">感謝你的評分！</h1>
          <p className="text-base text-slate-700 mb-8">你的回饋幫助平台越來越好。</p>
          <button
            onClick={() => router.push(`/order/${orderId}`)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl text-base transition-colors"
          >
            返回訂單
          </button>
        </div>
      </div>
    );
  }

  const OVERALL_LABELS = ["", "很差", "差", "普通", "好", "非常好！"];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      <div className="flex-1 px-5 py-8">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 mb-1">留下評分</h1>
            <p className="text-base text-slate-600">你的評分幫助其他人做出更好的選擇</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6">

            {/* 整體評分 */}
            <div>
              <p className="text-base font-bold text-slate-900 mb-3">
                整體評分 <span className="text-red-500">*</span>
              </p>
              <div className="flex justify-center">
                <StarRating
                  value={overall}
                  hoverValue={overallHover}
                  onHover={setOverallHover}
                  onChange={setOverall}
                  big
                />
              </div>
              {overall > 0 && (
                <p className="text-center text-sm text-slate-600 mt-2">
                  {OVERALL_LABELS[overall]}
                </p>
              )}
            </div>

            {/* 細項評分 */}
            <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
              <p className="text-base font-bold text-slate-900">細項評分（選填）</p>
              <StarRating
                label="工作品質"
                value={quality}
                hoverValue={qualityHover}
                onHover={setQualityHover}
                onChange={setQuality}
              />
              <StarRating
                label="準時程度"
                value={punctuality}
                hoverValue={punctHover}
                onHover={setPunctHover}
                onChange={setPunctuality}
              />
              <StarRating
                label="服務態度"
                value={attitude}
                hoverValue={attHover}
                onHover={setAttHover}
                onChange={setAttitude}
              />
            </div>

            {/* 文字評論 */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-base font-bold text-slate-900 mb-2 block">
                文字評論（選填）
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="分享你的服務體驗，讓其他人參考…"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base text-slate-800 focus:border-orange-400 focus:outline-none resize-none"
              />
              <p className="text-sm text-slate-500 text-right mt-1">{comment.length}/500</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-700 text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || overall === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
            >
              {loading ? "提交中…" : "提交評分"}
            </button>

          </form>

          <button
            onClick={() => router.push(`/order/${orderId}`)}
            className="w-full mt-4 text-center py-3 text-base font-semibold text-slate-600 hover:text-slate-800"
          >
            ← 返回訂單
          </button>
        </div>
      </div>
    </div>
  );
}

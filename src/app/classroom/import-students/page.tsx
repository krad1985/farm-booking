"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui";

export default function ImportStudentsPage() {
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function parseCSV(text: string) {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 2) continue;
      const obj: any = {};
      headers.forEach((h, idx) => { obj[h] = cols[idx] || ""; });
      students.push({
        studentCode: obj["學員代號"] || obj["studentCode"] || obj["code"] || cols[0],
        name: obj["姓名"] || obj["name"] || cols[1],
        phone: obj["電話"] || obj["phone"] || cols[2] || "",
        email: obj["Email"] || obj["email"] || cols[3] || "",
        group: obj["大組"] || obj["group"] || "",
        subgroup: obj["小組"] || obj["subgroup"] || "",
        role: obj["身份"] || obj["role"] || "",
      });
    }
    return students;
  }

  async function handleImport() {
    setLoading(true);
    setError("");
    setResult(null);
    const students = parseCSV(csvText);
    if (students.length === 0) {
      setError("請輸入有效的 CSV 資料（至少需要標題行和一筆資料）");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/students/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "匯入失敗");
    } else {
      setResult(data);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <BackButton href="/classroom" label="返回教室管理" />
      <h1 className="mb-6 text-3xl font-bold">匯入學員名單</h1>

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold">CSV 格式說明</p>
        <p className="mt-1">第一行請輸入標題（學員代號,姓名,電話,Email），之後每行一筆資料。</p>
        <p className="mt-1">範例：</p>
        <pre className="mt-1 rounded bg-white p-2 text-xs">
{`學員代號,姓名,電話,Email
A001,王志明,0912345678,wang@example.com
A002,李春嬌,0923456789,li@example.com`}
        </pre>
      </div>

      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={10}
        placeholder="貼上 CSV 資料..."
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleImport}
        disabled={loading || !csvText.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "匯入中..." : "匯入"}
      </button>

      {result && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-800">匯入結果</h3>
          <p className="mt-1 text-sm text-green-700">
            新增 {result.created} 筆、更新 {result.updated} 筆、共 {result.total} 筆
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600">
              <p className="font-medium">錯誤：</p>
              {result.errors.map((e: string, i: number) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

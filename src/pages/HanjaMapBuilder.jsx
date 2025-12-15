import React, { useMemo, useState } from "react";

/**
 * 지원 포맷 (정상):
 * 家=집 가, ...
 * 肝=간 간, ...
 * 功=공 공, ...
 *
 * 스킵 포맷 (메타 설명):
 * 峰=峯과 同字, ...
 * 焼=燒와 同字, ...
 * 凖=準의 俗字, ...
 * 厺=갈 ㅓ, 去의 本字, ...
 * 兙=, decagram
 *
 * 결과:
 * { "家": { meaning: "집", reading: "가" }, ... }
 */

function pickMeaningAndReading(rhsRaw) {
  const rhs = (rhsRaw || "").trim();
  if (!rhs) return { meaning: "", reading: "" };

  const firstChunk = rhs.split(",")[0].trim();

  // 1) 메타 설명 줄 제거
  if (/(同字|俗字|略字|本字)/.test(firstChunk)) {
    return { meaning: "", reading: "" };
  }

  // 2) 완성형 한글만 추출 (자모 제외)
  const koTokens = firstChunk.match(/[가-힣]{1,3}/g) || [];

  // 조사/메타 단어 제거
  const STOP_WORDS = new Set([
    "의",
    "과",
    "와",
    "및",
    "또는",
    "그리고",
    "동",
    "본",
    "약",
    "속",
    "자",
  ]);

  const filtered = koTokens.filter((t) => !STOP_WORDS.has(t));

  // 3) 가장 확실한 패턴: "훈 음"
  if (filtered.length >= 2) {
    return {
      meaning: filtered[0],
      reading: filtered[1],
    };
  }

  // 4) 의미만 있는 경우 (reading 없음 → 에러로만 기록)
  if (filtered.length === 1) {
    return {
      meaning: filtered[0],
      reading: "",
    };
  }

  return { meaning: "", reading: "" };
}

function parseHanjaTxtToMap(text) {
  const lines = (text || "").split(/\r?\n/);
  const map = {};
  const errors = [];

  let skipped = 0;
  let duplicated = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    if (raw.startsWith("#")) continue;

    const eq = raw.indexOf("=");
    if (eq <= 0) continue;

    const hanja = raw.slice(0, eq).trim();
    const rhs = raw.slice(eq + 1).trim();

    // 키는 한자 1글자만 허용
    if (hanja.length !== 1) {
      errors.push({ line: i + 1, reason: "키(한자)가 1글자가 아님", raw });
      continue;
    }

    const { meaning, reading } = pickMeaningAndReading(rhs);

    // 완전히 의미 없는 줄은 스킵
    if (!meaning && !reading) {
      skipped++;
      continue;
    }

    // reading이 자모면 스킵
    if (reading && /[ㄱ-ㅎㅏ-ㅣ]/.test(reading)) {
      skipped++;
      continue;
    }

    // meaning 또는 reading 하나라도 없으면 에러 기록 (map에는 넣지 않음)
    if (!meaning || !reading) {
      errors.push({
        line: i + 1,
        reason: "meaning 또는 reading 추출 실패",
        raw,
        parsed: { meaning, reading },
      });
      continue;
    }

    if (map[hanja]) duplicated++;
    map[hanja] = { meaning, reading };
  }

  return {
    map,
    errors,
    stats: { skipped, duplicated },
  };
}

function downloadJson(obj, filename = "hanja-map.json") {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HanjaMapBuilder() {
  const [fileName, setFileName] = useState("");
  const [rawText, setRawText] = useState("");
  const [reparseKey, setReparseKey] = useState(0);

  const parsed = useMemo(() => {
    if (!rawText)
      return { map: {}, errors: [], stats: { skipped: 0, duplicated: 0 } };
    return parseHanjaTxtToMap(rawText);
  }, [rawText, reparseKey]);

  const count = Object.keys(parsed.map).length;

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Hanja Map Builder</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        hanja.txt 업로드 → {"{ 한자: { meaning, reading } }"} JSON 생성
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          type="file"
          accept=".txt,text/plain"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setFileName(f.name);
            const text = await f.text();
            setRawText(text);
            setReparseKey((v) => v + 1);
          }}
        />

        <button
          onClick={() => downloadJson(parsed.map, "hanja-map.json")}
          disabled={!count}
        >
          JSON 다운로드
        </button>

        <button
          onClick={() => setReparseKey((v) => v + 1)}
          disabled={!rawText}
        >
          재파싱
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>파일:</strong> {fileName || "-"} /{" "}
        <strong>매핑 수:</strong> {count.toLocaleString()} /{" "}
        <strong>에러:</strong> {parsed.errors.length.toLocaleString()} /{" "}
        <strong>스킵:</strong> {parsed.stats.skipped.toLocaleString()} /{" "}
        <strong>중복(덮어씀):</strong>{" "}
        {parsed.stats.duplicated.toLocaleString()}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        <div>
          <h3>원본</h3>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={20}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          />
        </div>

        <div>
          <h3>JSON 미리보기 (상위 80개)</h3>
          <pre
            style={{
              width: "100%",
              minHeight: 360,
              maxHeight: 480,
              overflow: "auto",
              background: "#111",
              color: "#eee",
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            {JSON.stringify(
              Object.fromEntries(Object.entries(parsed.map).slice(0, 80)),
              null,
              2
            )}
          </pre>
        </div>
      </div>

      {parsed.errors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>파싱 에러 (상위 30개)</h3>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              maxHeight: 260,
              overflow: "auto",
              fontFamily: "monospace",
              fontSize: 12,
              background: "#fafafa",
            }}
          >
            {parsed.errors.slice(0, 30).map((er, idx) => (
              <div key={idx} style={{ marginBottom: 10 }}>
                <div>
                  <strong>line {er.line}</strong> – {er.reason}
                </div>
                <div style={{ opacity: 0.8 }}>{er.raw}</div>
                {er.parsed && (
                  <div style={{ opacity: 0.8 }}>
                    parsed: {JSON.stringify(er.parsed)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8, opacity: 0.7 }}>
            * 에러는 “사전 메타 설명 / 뜻·음 불명확” 케이스이며 JSON에는
            포함되지 않습니다.
          </div>
        </div>
      )}
    </div>
  );
}

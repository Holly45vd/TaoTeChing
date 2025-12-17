// src/pages/AdminChapterBatchUpdatePage.jsx
import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Alert,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  LinearProgress,
  TextField,
} from "@mui/material";

import { db } from "../firebase/firebase";
import {
  doc,
  writeBatch,
  serverTimestamp,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";

const COL = "daodejing_chapters";
const MAX_OPS_PER_BATCH = 400;

/* =========================
   Utils
========================= */
function safeParseJSON(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e?.message || "JSON parse error" };
  }
}

function downloadJSON(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

/* =========================
   Normalize (업로드용)
   ⚠️ 빈 title/tags를 절대 강제로 넣지 않음
========================= */
function normalizeOne(ch) {
  const chapter = Number(ch?.chapter);
  if (!Number.isFinite(chapter)) return null;

  const out = {
    chapter,
    updatedAt: serverTimestamp(),
  };

  if (typeof ch?.title === "string" && ch.title.trim()) {
    out.title = ch.title.trim();
  }

  if (typeof ch?.subtitle === "string" && ch.subtitle.trim()) {
    out.subtitle = ch.subtitle.trim();
  }

  if (Array.isArray(ch?.tags) && ch.tags.length) {
    out.tags = ch.tags.filter(Boolean).map(String);
  }

  // ✅ 원문/번역 함께보기 (선택)
  if (ch?.text && (ch.text.korean || ch.text.hanmoon)) {
    out.text = {
      korean: String(ch.text.korean || ""),
      hanmoon: String(ch.text.hanmoon || ""),
    };
  }

  return out;
}

/* =========================
   DB 필드 점검
========================= */
function inspectDocs(docs = []) {
  const stat = {
    total: docs.length,
    missingTitle: 0,
    missingTags: 0,
    missingSubtitle: 0,
    missingLines: 0,
    missingAnalysis: 0,
    missingAny: 0,
  };

  const samples = {
    noTitle: [],
    noTags: [],
  };

  for (const d of docs) {
    const missTitle = !String(d?.title || "").trim();
    const missTags = !Array.isArray(d?.tags) || d.tags.length === 0;
    const missSubtitle = !String(d?.subtitle || "").trim();
    const missLines = !Array.isArray(d?.lines) || d.lines.length === 0;
    const missAnalysis =
      !Array.isArray(d?.analysis?.sections) ||
      d.analysis.sections.length === 0;

    if (missTitle) {
      stat.missingTitle++;
      if (samples.noTitle.length < 10) samples.noTitle.push(d.chapter ?? d.id);
    }
    if (missTags) {
      stat.missingTags++;
      if (samples.noTags.length < 10) samples.noTags.push(d.chapter ?? d.id);
    }
    if (missSubtitle) stat.missingSubtitle++;
    if (missLines) stat.missingLines++;
    if (missAnalysis) stat.missingAnalysis++;

    if (
      missTitle ||
      missTags ||
      missSubtitle ||
      missLines ||
      missAnalysis
    ) {
      stat.missingAny++;
    }
  }

  return { stat, samples };
}

/* =========================
   Component
========================= */
export default function AdminChapterBatchUpdatePage() {
  /* ---------- 업로드 ---------- */
  const [parsed, setParsed] = useState(null);
  const [parseErr, setParseErr] = useState("");

  /* ---------- DB ---------- */
  const [dbDocs, setDbDocs] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMsg, setDbMsg] = useState({ type: "", text: "" });
  const [downloadChapter, setDownloadChapter] = useState("1");

  /* ---------- 업데이트 ---------- */
  const [merge, setMerge] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [resultMsg, setResultMsg] = useState({ type: "", text: "" });

  /* ---------- Derived ---------- */
  const normalized = useMemo(() => {
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeOne).filter(Boolean);
  }, [parsed]);

  const inspection = useMemo(() => {
    if (!Array.isArray(dbDocs)) return null;
    return inspectDocs(dbDocs);
  }, [dbDocs]);

  /* =========================
     Handlers
  ========================= */
  const onPickFile = async (file) => {
    if (!file) return;
    const text = await file.text();

    const r = safeParseJSON(text);
    if (!r.ok) {
      setParsed(null);
      setParseErr(r.error);
      return;
    }
    setParsed(r.data);
    setParseErr("");
    setResultMsg({ type: "", text: "" });
  };

  const fetchDbAll = async () => {
    setDbLoading(true);
    setDbMsg({ type: "", text: "" });

    try {
      const snap = await getDocs(collection(db, COL));

      const arr = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ca = Number(a.chapter ?? a.id);
          const cb = Number(b.chapter ?? b.id);
          return ca - cb;
        });

      setDbDocs(arr);
      setDbMsg({ type: "success", text: `DB 로드 완료: ${arr.length}개` });
    } catch (e) {
      setDbDocs(null);
      setDbMsg({ type: "error", text: e?.message || "DB 로드 실패" });
    } finally {
      setDbLoading(false);
    }
  };

  const downloadDbAll = () => {
    if (!dbDocs?.length) {
      setDbMsg({ type: "error", text: "DB 로드부터 해줘." });
      return;
    }
    downloadJSON("daodejing_chapters_ALL.json", dbDocs);
  };

  const downloadDbOne = async () => {
    const n = Number(downloadChapter);
    if (!Number.isFinite(n)) {
      setDbMsg({ type: "error", text: "chapter 번호가 올바르지 않아." });
      return;
    }

    setDbLoading(true);
    try {
      const snap = await getDoc(doc(db, COL, String(n)));
      if (!snap.exists()) {
        setDbMsg({ type: "error", text: `${n}장 문서 없음` });
        return;
      }
      downloadJSON(`daodejing_chapter_${n}.json`, {
        id: snap.id,
        ...snap.data(),
      });
      setDbMsg({ type: "success", text: `${n}장 다운로드 완료` });
    } finally {
      setDbLoading(false);
    }
  };

  const runUpdate = async () => {
    if (!normalized.length) {
      setResultMsg({ type: "error", text: "업데이트할 데이터가 없어." });
      return;
    }

    setLoading(true);
    setProgress({ done: 0, total: normalized.length });

    try {
      for (let i = 0; i < normalized.length; i += MAX_OPS_PER_BATCH) {
        const chunk = normalized.slice(i, i + MAX_OPS_PER_BATCH);
        const batch = writeBatch(db);

        for (const item of chunk) {
          const ref = doc(db, COL, String(item.chapter));
          batch.set(ref, item, { merge });
        }

        await batch.commit();
        setProgress((p) => ({
          ...p,
          done: Math.min(p.done + chunk.length, p.total),
        }));
      }

      setResultMsg({
        type: "success",
        text: `업데이트 완료 (${normalized.length}개, ${merge ? "merge" : "overwrite"})`,
      });
    } catch (e) {
      setResultMsg({
        type: "error",
        text: e?.message || "업데이트 실패",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Render
  ========================= */
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 2 }}>
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>
            챕터 DB 점검 · 백업 · 일괄 업데이트
          </Typography>

          {/* DB 점검 */}
          <Divider />
          <Typography fontWeight={800}>1️⃣ DB 점검 / 백업</Typography>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={fetchDbAll} disabled={dbLoading}>
              DB 로드
            </Button>
            <Button variant="contained" onClick={downloadDbAll}>
              전체 JSON 다운로드
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              label="chapter"
              value={downloadChapter}
              onChange={(e) => setDownloadChapter(e.target.value)}
              sx={{ width: 120 }}
            />
            <Button variant="outlined" onClick={downloadDbOne}>
              해당 chapter 다운로드
            </Button>
          </Stack>

          {dbLoading && <LinearProgress />}
          {dbMsg.text && (
            <Alert severity={dbMsg.type === "error" ? "error" : "success"}>
              {dbMsg.text}
            </Alert>
          )}

          {inspection && (
            <Alert severity={inspection.stat.missingAny ? "warning" : "success"}>
              총 {inspection.stat.total}개 중 문제 {inspection.stat.missingAny}개<br />
              title 없음: {inspection.stat.missingTitle} /
              tags 없음: {inspection.stat.missingTags} /
              subtitle 없음: {inspection.stat.missingSubtitle}
            </Alert>
          )}

          {/* 업데이트 */}
          <Divider />
          <Typography fontWeight={800}>2️⃣ JSON 업로드 → 업데이트</Typography>

          <Button variant="outlined" component="label">
            JSON 파일 선택
            <input
              type="file"
              hidden
              accept="application/json"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
          </Button>

          <FormControlLabel
            control={
              <Switch checked={merge} onChange={(e) => setMerge(e.target.checked)} />
            }
            label={`merge ${merge ? "ON(안전)" : "OFF(덮어쓰기)"}`}
          />

          {parseErr && <Alert severity="error">{parseErr}</Alert>}

          {loading && (
            <>
              <LinearProgress
                variant="determinate"
                value={(progress.done / Math.max(progress.total, 1)) * 100}
              />
              <Typography variant="caption">
                {progress.done}/{progress.total}
              </Typography>
            </>
          )}

          {resultMsg.text && (
            <Alert severity={resultMsg.type === "error" ? "error" : "success"}>
              {resultMsg.text}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={runUpdate}
            disabled={loading || !normalized.length}
          >
            Firestore 업데이트 실행
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

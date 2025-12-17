// src/pages/AdminChapterDownloadPage.jsx
import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Alert,
  Paper,
  LinearProgress,
} from "@mui/material";

import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

const COL = "daodejing_chapters";

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

export default function AdminChapterDownloadPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleDownloadAll = async () => {
    setLoading(true);
    setMsg("");

    try {
      const snap = await getDocs(collection(db, COL));

      const data = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .sort((a, b) => Number(a.chapter ?? a.id) - Number(b.chapter ?? b.id));

      if (!data.length) {
        setMsg("⚠️ 다운로드할 데이터가 없어.");
        return;
      }

      downloadJSON("daodejing_chapters_FULL_BACKUP.json", data);
      setMsg(`✅ 전체 ${data.length}개 챕터 JSON 다운로드 완료`);
    } catch (e) {
      setMsg(`❌ 실패: ${e?.message || "권한/네트워크 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", p: 3 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>
            📦 도덕경 전체 DB 백업
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Firestore 컬렉션 <b>{COL}</b>의  
            <br />
            현재 존재하는 모든 데이터를 그대로 JSON으로 저장한다.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={handleDownloadAll}
            disabled={loading}
          >
            전체 데이터베이스 JSON 다운로드
          </Button>

          {loading && <LinearProgress />}

          {msg && (
            <Alert severity={msg.startsWith("❌") ? "error" : "success"}>
              {msg}
            </Alert>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

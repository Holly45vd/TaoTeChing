// src/components/read/ChapterDetail.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Paper, Divider, Snackbar, Alert } from "@mui/material";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import {
  toggleChapterBookmark,
  getChapterBookmark,
  addClip,
} from "../../firebase/firestore";

import ChapterHeader from "./chapter/ChapterHeader";
import KeySentenceCard from "./chapter/KeySentenceCard";
import LinesSection from "./chapter/LinesSection";
import AnalysisSection from "./chapter/AnalysisSection";
import ClipDialog from "./chapter/ClipDialog";

import HanKoSection from "../read/HanKoSection";
import ReadingModeToggle from "./ReadingModeToggle";

const cardSx = {
  borderRadius: 3,
  border: "1px solid",
  borderColor: "rgba(0,0,0,0.08)",
  bgcolor: "background.paper",
};

/* =========================
   SaveMode util
========================= */
function readSaveModeFromStorage() {
  try {
    const v = localStorage.getItem("tao:saveMode");
    return v == null ? true : v !== "false";
  } catch {
    return true;
  }
}

/* =========================
   ReadMode util
========================= */
function readReadModeFromStorage() {
  try {
    const v = localStorage.getItem("tao:readMode");
    return v === "lines" ? "lines" : "han_ko"; // default: han_ko
  } catch {
    return "han_ko";
  }
}

export default function ChapterDetail({ chapter, onTagClick, uid: uidProp }) {
  /* =========================
     Auth / UID
  ========================= */
  const [uid, setUid] = useState(uidProp || "");

  useEffect(() => {
    if (uidProp) {
      setUid(uidProp);
      return;
    }

    const auth = getAuth();
    if (auth.currentUser?.uid) {
      setUid(auth.currentUser.uid);
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || "");
    });

    return () => unsub();
  }, [uidProp]);

  const canSave = Boolean(uid);

  /* =========================
     SaveMode
  ========================= */
  const [saveMode, setSaveMode] = useState(() => readSaveModeFromStorage());

  useEffect(() => {
    try {
      localStorage.setItem("tao:saveMode", String(saveMode));
    } catch {}
  }, [saveMode]);

  /* =========================
     ReadMode (통 ↔ 라인)
  ========================= */
  const [readMode, setReadMode] = useState(() => readReadModeFromStorage());

  useEffect(() => {
    try {
      localStorage.setItem("tao:readMode", String(readMode));
    } catch {}
  }, [readMode]);

  /* =========================
     Bookmark
  ========================= */
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (!uid || !chapter?.chapter) return;

    let mounted = true;
    (async () => {
      try {
        const data = await getChapterBookmark(uid, chapter.chapter);
        if (mounted) setIsBookmarked(Boolean(data?.isSaved));
      } catch {
        if (mounted) setIsBookmarked(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [uid, chapter?.chapter]);

  const [toast, setToast] = useState({
    open: false,
    severity: "success",
    msg: "",
  });

  const showToast = useCallback((severity, msg) => {
    setToast({ open: true, severity, msg });
  }, []);

  const toggleBookmark = useCallback(async () => {
    if (!canSave || !chapter?.chapter) return;

    const next = !isBookmarked;
    try {
      setBookmarkLoading(true);
      setIsBookmarked(next);
      await toggleChapterBookmark(uid, chapter.chapter, next);
      showToast("success", next ? "장 저장 ON" : "장 저장 OFF");
    } catch {
      setIsBookmarked((p) => !p);
      showToast("error", "북마크 저장 실패");
    } finally {
      setBookmarkLoading(false);
    }
  }, [canSave, chapter?.chapter, isBookmarked, uid, showToast]);

  /* =========================
     Clip Dialog
  ========================= */
  const [clipOpen, setClipOpen] = useState(false);
  const [clipPayload, setClipPayload] = useState(null);
  const [clipNote, setClipNote] = useState("");

  const openClipDialog = useCallback((payload) => {
    setClipPayload(payload);
    setClipNote("");
    setClipOpen(true);
  }, []);

  const closeClipDialog = () => {
    setClipOpen(false);
    setClipPayload(null);
    setClipNote("");
  };

  const handleSaveClip = async () => {
    if (!canSave || !clipPayload || !chapter?.chapter) return;

    try {
      await addClip(uid, {
        ...clipPayload,
        note: clipNote.trim(),
        chapter: chapter.chapter,
        chapterTitle: chapter.title || "",
      });
      showToast("success", "저장됨 (클립)");
      closeClipDialog();
    } catch {
      showToast("error", "저장 실패");
    }
  };

  /* =========================
     Data
  ========================= */
  const lines = useMemo(() => {
    const arr = Array.isArray(chapter?.lines) ? chapter.lines : [];
    return [...arr].sort((a, b) => Number(a.order) - Number(b.order));
  }, [chapter]);

  const sections = useMemo(() => chapter?.analysis?.sections || [], [chapter]);

  if (!chapter) return null;

  /* =========================
     Payload Builders
  ========================= */
  const buildKeySentencePayload = () => ({
    type: "keySentence",
    text: chapter.analysis?.keySentence || "",
  });

  // ✅ 유일한 라인 저장 payload (원문 + 번역)
  const buildHanKoPayload = (line) => ({
    type: "han_ko",
    lineOrder: line?.order,
    han: line?.han || "",
    ko: line?.ko || "",
    text: `【원문】\n${line?.han || ""}\n\n【번역】\n${line?.ko || ""}`.trim(),
  });

  return (
    <Paper elevation={0} sx={{ ...cardSx, p: { xs: 1.5, sm: 2 } }}>
      <ChapterHeader
        chapter={chapter}
        uid={uid}
        saveMode={saveMode}
        setSaveMode={setSaveMode}
        canSave={canSave}
        isBookmarked={isBookmarked}
        bookmarkLoading={bookmarkLoading}
        toggleBookmark={toggleBookmark}
        onTagClick={onTagClick}
      />

      <KeySentenceCard
        keySentence={chapter.analysis?.keySentence}
        saveMode={saveMode}
        canSave={canSave}
        onSave={() => openClipDialog(buildKeySentencePayload())}
      />

      <Divider sx={{ my: 2.5 }} />

      <ReadingModeToggle value={readMode} onChange={setReadMode} />

      <Divider sx={{ my: 2 }} />

      {readMode === "han_ko" ? (
        <HanKoSection chapter={chapter} lines={lines} />
      ) : (
        <LinesSection
          lines={lines}
          saveMode={saveMode}
          canSave={canSave}
          onSaveBoth={(line) => openClipDialog(buildHanKoPayload(line))}
        />
      )}

      <Divider sx={{ my: 3 }} />

      <AnalysisSection sections={sections} saveMode={saveMode} canSave={canSave} />

      <ClipDialog
        open={clipOpen}
        onClose={closeClipDialog}
        payload={clipPayload}
        note={clipNote}
        setNote={setClipNote}
        onSave={handleSaveClip}
        canSave={canSave}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={1800}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

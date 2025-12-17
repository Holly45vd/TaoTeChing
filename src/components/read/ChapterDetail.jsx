// src/components/read/ChapterDetail.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Paper, Divider, Snackbar, Alert } from "@mui/material";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { toggleChapterBookmark, getChapterBookmark, addClip } from "../../firebase/firestore";

import ChapterHeader from "./chapter/ChapterHeader";
import KeySentenceCard from "./chapter/KeySentenceCard";
import LinesSection from "./chapter/LinesSection";
import AnalysisSection from "./chapter/AnalysisSection";
import ClipDialog from "./chapter/ClipDialog";
import StoryDrawer from "./chapter/StoryDrawer";

const cardSx = {
  borderRadius: 3,
  border: "1px solid",
  borderColor: "rgba(0,0,0,0.08)",
  bgcolor: "background.paper",
};

function readSaveModeFromStorage() {
  try {
    const v = localStorage.getItem("tao:saveMode");
    if (v == null) return true; // 기본값 true
    return v !== "false";
  } catch {
    return true;
  }
}

export default function ChapterDetail({ chapter, onTagClick, uid: uidProp }) {
  // -----------------------------
  // Auth / UID
  // -----------------------------
  const [uid, setUid] = useState(uidProp || "");

  useEffect(() => {
    if (uidProp) {
      setUid(uidProp);
      return;
    }

    const auth = getAuth();
    if (auth.currentUser?.uid) setUid(auth.currentUser.uid);

    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid || ""));
    return () => unsub();
  }, [uidProp]);

  const canSave = Boolean(uid);

  // -----------------------------
  // SaveMode (localStorage)
  // -----------------------------
  const [saveMode, setSaveMode] = useState(() => readSaveModeFromStorage());

  useEffect(() => {
    try {
      localStorage.setItem("tao:saveMode", String(saveMode));
    } catch {
      // ignore
    }
  }, [saveMode]);

  // -----------------------------
  // Bookmark state
  // -----------------------------
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (!uid || !chapter?.chapter) return;

    let mounted = true;
    (async () => {
      try {
        const data = await getChapterBookmark(uid, chapter.chapter);
        if (!mounted) return;
        setIsBookmarked(Boolean(data?.isSaved));
      } catch {
        if (mounted) setIsBookmarked(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [uid, chapter?.chapter]);

  const [toast, setToast] = useState({ open: false, severity: "success", msg: "" });
  const showToast = useCallback((severity, msg) => {
    setToast({ open: true, severity, msg });
  }, []);

  const toggleBookmark = useCallback(async () => {
    if (!canSave || !chapter?.chapter) return;

    const prev = isBookmarked;
    const next = !prev;

    try {
      setBookmarkLoading(true);
      setIsBookmarked(next); // optimistic
      await toggleChapterBookmark(uid, chapter.chapter, next);
      showToast("success", next ? "장 저장 ON" : "장 저장 OFF");
    } catch {
      setIsBookmarked(prev);
      showToast("error", "북마크 저장 실패… (권한/네트워크 확인)");
    } finally {
      setBookmarkLoading(false);
    }
  }, [canSave, chapter?.chapter, isBookmarked, uid, showToast]);

  // -----------------------------
  // Clip dialog state
  // -----------------------------
  const [clipOpen, setClipOpen] = useState(false);
  const [clipPayload, setClipPayload] = useState(null);
  const [clipNote, setClipNote] = useState("");

  const openClipDialog = useCallback((payload) => {
    setClipPayload(payload);
    setClipNote(payload?.note || "");
    setClipOpen(true);
  }, []);

  const closeClipDialog = useCallback(() => {
    setClipOpen(false);
    setClipPayload(null);
    setClipNote("");
  }, []);

  const handleSaveClip = useCallback(async () => {
    if (!canSave || !clipPayload || !chapter?.chapter) return;

    try {
      await addClip(uid, {
        ...clipPayload,
        note: clipNote?.trim() || "",
        chapter: chapter.chapter,
        chapterTitle: chapter.title || "",
      });

      showToast("success", "저장됨 (클립)");
      closeClipDialog();
    } catch {
      showToast("error", "저장 실패… (권한/네트워크 확인)");
    }
  }, [canSave, clipPayload, clipNote, uid, chapter?.chapter, chapter?.title, showToast, closeClipDialog]);

  // -----------------------------
  // Story Drawer
  // -----------------------------
  const [storyOpen, setStoryOpen] = useState(false);

  // -----------------------------
  // Derived Data
  // -----------------------------
  const lines = useMemo(() => {
    const arr = Array.isArray(chapter?.lines) ? chapter.lines : [];
    return [...arr].sort((a, b) => Number(a.order) - Number(b.order));
  }, [chapter]);

  const sections = useMemo(() => {
    return Array.isArray(chapter?.analysis?.sections) ? chapter.analysis.sections : [];
  }, [chapter]);

  if (!chapter) return null;

  // -----------------------------
  // Clip payload builders (일관성)
  // -----------------------------
  const buildKeySentencePayload = () => ({
    type: "keySentence",
    text: chapter.analysis?.keySentence || "",
  });

  const buildHanPayload = (line) => ({
    type: "han",
    lineOrder: line?.order,
    text: line?.han || "",
  });

  const buildKoPayload = (line) => ({
    type: "ko",
    lineOrder: line?.order,
    text: line?.ko || "",
  });

  // ✅ 추가: 원문+번역 함께 저장
  const buildHanKoPayload = (line) => {
    const han = line?.han || "";
    const ko = line?.ko || "";
    return {
      type: "han_ko", // SavedPage에서 타입 필터가 하드코딩이면 여기도 추가 필요
      lineOrder: line?.order,
      han,
      ko,
      text: `【원문】\n${han}\n\n【번역】\n${ko}`.trim(),
    };
  };

  const buildAnalysisSectionPayload = (sec, idx) => ({
    type: "analysis",
    sectionIdx: idx,
    sectionType: sec?.type || "",
    sectionTitle: sec?.title || "",
    text: `${sec?.title || ""}\n${Array.isArray(sec?.content) ? sec.content.join("\n") : ""}`.trim(),
  });

  const buildAnalysisLinePayload = (sec, idx, c, i) => ({
    type: "analysisLine",
    sectionIdx: idx,
    sectionType: sec?.type || "",
    sectionTitle: sec?.title || "",
    lineIndex: i,
    text: String(c || ""),
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
        onOpenStory={() => setStoryOpen(true)}
      />

      <KeySentenceCard
        keySentence={chapter.analysis?.keySentence}
        saveMode={saveMode}
        canSave={canSave}
        onSave={() => openClipDialog(buildKeySentencePayload())}
      />

      <Divider sx={{ my: 2.5 }} />

      <LinesSection
        lines={lines}
        saveMode={saveMode}
        canSave={canSave}
        onSaveHan={(line) => openClipDialog(buildHanPayload(line))}
        onSaveKo={(line) => openClipDialog(buildKoPayload(line))}
        onSaveBoth={(line) => openClipDialog(buildHanKoPayload(line))} // ✅ 추가
      />

      <Divider sx={{ my: 3 }} />

      <AnalysisSection
        sections={sections}
        saveMode={saveMode}
        canSave={canSave}
        onSaveSection={(sec, idx) => openClipDialog(buildAnalysisSectionPayload(sec, idx))}
        onSaveLine={(sec, idx, c, i) => openClipDialog(buildAnalysisLinePayload(sec, idx, c, i))}
      />

      <ClipDialog
        open={clipOpen}
        onClose={closeClipDialog}
        payload={clipPayload}
        note={clipNote}
        setNote={setClipNote}
        onSave={handleSaveClip}
        canSave={canSave}
      />

      <StoryDrawer
        open={storyOpen}
        onClose={() => setStoryOpen(false)}
        chapterNumber={chapter.chapter}
        chapterTitle={chapter.title}
        uid={uid}
        saveMode={saveMode}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={1800}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((p) => ({ ...p, open: false }))}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import BookmarkRemoveRoundedIcon from "@mui/icons-material/BookmarkRemoveRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { toggleChapterBookmark, fetchClips } from "../firebase/firestore";

/**
 * props:
 * - uid: string (필수)
 * - onOpenChapter?: (chapterNumber:number) => void
 */
export default function SavedPage({ uid, onOpenChapter }) {
  const [tab, setTab] = useState("bookmarks"); // bookmarks | clips
  const [loading, setLoading] = useState(true);

  const [bookmarks, setBookmarks] = useState([]); // [{chapter,isSaved,updatedAt}]
  const [clips, setClips] = useState([]); // [{id, chapter, type, text, note, isPinned...}]

  // filters
  const [q, setQ] = useState("");
  const [type, setType] = useState("all"); // all | han | ko | analysis | keySentence
  const [chapterFilter, setChapterFilter] = useState("all");
  const [pinOnly, setPinOnly] = useState(false);

  const [toast, setToast] = useState({ open: false, severity: "success", msg: "" });

  const cardSx = {
    borderRadius: 3,
    border: "1px solid rgba(0,0,0,0.08)",
    bgcolor: "background.paper",
    p: { xs: 1.5, sm: 2 },
  };

  const softBoxSx = {
    borderRadius: 2.5,
    border: "1px solid rgba(0,0,0,0.08)",
    bgcolor: "rgba(0,0,0,0.02)",
  };

  async function loadAll() {
    if (!uid) return;

    setLoading(true);
    try {
      // 1) bookmarks: users/{uid}/bookmarks
      const bmRef = collection(db, "users", uid, "bookmarks");
      const bmQ = query(bmRef, orderBy("updatedAt", "desc"));
      const bmSnap = await getDocs(bmQ);
      const bm = bmSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2) clips: users/{uid}/clips
      const cl = await fetchClips(uid);

      setBookmarks(bm);
      setClips(cl);
    } catch (e) {
      setToast({ open: true, severity: "error", msg: "저장함 불러오기 실패(권한/네트워크 확인)" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!uid) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // chapter filter options
  const chapterOptions = useMemo(() => {
    const s = new Set();
    bookmarks.forEach((b) => b?.chapter && s.add(String(b.chapter)));
    clips.forEach((c) => c?.chapter && s.add(String(c.chapter)));
    return ["all", ...Array.from(s).sort((a, b) => Number(a) - Number(b))];
  }, [bookmarks, clips]);

  const filteredBookmarks = useMemo(() => {
    let arr = bookmarks;

    if (chapterFilter !== "all") {
      arr = arr.filter((b) => String(b.chapter) === String(chapterFilter));
    }

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      // bookmark은 텍스트가 없으니 chapter/title 정도만
      arr = arr.filter((b) => String(b.chapter).includes(qq));
    }

    return arr;
  }, [bookmarks, chapterFilter, q]);

  const filteredClips = useMemo(() => {
    let arr = clips;

    if (pinOnly) arr = arr.filter((c) => Boolean(c.isPinned));

    if (type !== "all") {
      arr = arr.filter((c) => String(c.type) === String(type));
    }

    if (chapterFilter !== "all") {
      arr = arr.filter((c) => String(c.chapter) === String(chapterFilter));
    }

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      arr = arr.filter((c) => {
        const blob = [
          c.chapter,
          c.chapterTitle,
          c.type,
          c.text,
          c.note,
          c.sectionTitle,
          c.sectionType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(qq);
      });
    }

    // pinned 우선 정렬
    arr = [...arr].sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
    return arr;
  }, [clips, pinOnly, type, chapterFilter, q]);

  const countBookmarks = filteredBookmarks.length;
  const countClips = filteredClips.length;

  const openChapter = (n) => {
    if (typeof onOpenChapter === "function") {
      onOpenChapter(Number(n));
      return;
    }
    // fallback: 아무 것도 안 돼도 복사/안내보다 "최소 동작"은 제공
    setToast({ open: true, severity: "info", msg: `이동 콜백이 없어. ${n}장으로 이동 로직(onOpenChapter)을 연결해줘.` });
  };

  async function removeBookmark(chapterNumber) {
    if (!uid) return;
    try {
      await toggleChapterBookmark(uid, chapterNumber, false);
      setBookmarks((prev) => prev.filter((b) => String(b.chapter) !== String(chapterNumber)));
      setToast({ open: true, severity: "success", msg: "장 저장 OFF" });
    } catch (e) {
      setToast({ open: true, severity: "error", msg: "북마크 해제 실패" });
    }
  }

  async function deleteClip(clipId) {
    if (!uid || !clipId) return;
    try {
      const ref = doc(db, "users", uid, "clips", clipId);
      await deleteDoc(ref);
      setClips((prev) => prev.filter((c) => c.id !== clipId));
      setToast({ open: true, severity: "success", msg: "클립 삭제됨" });
    } catch (e) {
      setToast({ open: true, severity: "error", msg: "클립 삭제 실패" });
    }
  }

  async function togglePin(clip) {
    if (!uid || !clip?.id) return;
    const next = !Boolean(clip.isPinned);
    try {
      const ref = doc(db, "users", uid, "clips", clip.id);
      await updateDoc(ref, { isPinned: next });
      setClips((prev) => prev.map((c) => (c.id === clip.id ? { ...c, isPinned: next } : c)));
    } catch (e) {
      setToast({ open: true, severity: "error", msg: "핀 변경 실패" });
    }
  }

  const typeLabel = (t) => {
    if (t === "han") return "원문";
    if (t === "ko") return "번역";
    if (t === "analysis") return "해설";
    if (t === "keySentence") return "핵심문장";
    return String(t || "");
  };

  if (!uid) {
    return (
      <Paper elevation={0} sx={{ ...cardSx }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>저장함</Typography>
        <Typography sx={{ opacity: 0.75 }}>
          로그인(uid)이 있어야 저장함을 볼 수 있어.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ ...cardSx }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack spacing={0.25}>
          <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.2 }}>
            저장함
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            저장한 장/클립만 모아보기
          </Typography>
        </Stack>

        <Tooltip title="새로고침" arrow>
          <span>
            <IconButton size="small" onClick={loadAll} disabled={loading}>
              <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          minHeight: 40,
          "& .MuiTab-root": { minHeight: 40, fontWeight: 900, textTransform: "none" },
        }}
      >
        <Tab value="bookmarks" label={`장 저장 (${bookmarks.length})`} />
        <Tab value="clips" label={`클립 (${clips.length})`} />
      </Tabs>

      <Divider sx={{ my: 1.5 }} />

      {/* Filters */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 1.5 }}
      >
        <TextField
          value={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
          placeholder="검색 (메모/텍스트/장/타입)"
          fullWidth
        />

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>장</InputLabel>
          <Select
            label="장"
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
          >
            {chapterOptions.map((c) => (
              <MenuItem key={c} value={c}>
                {c === "all" ? "전체" : `${c}장`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {tab === "clips" && (
          <>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>타입</InputLabel>
              <Select label="타입" value={type} onChange={(e) => setType(e.target.value)}>
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="han">원문</MenuItem>
                <MenuItem value="ko">번역</MenuItem>
                <MenuItem value="analysis">해설</MenuItem>
                <MenuItem value="keySentence">핵심문장</MenuItem>
              </Select>
            </FormControl>

            <Button
              size="small"
              variant={pinOnly ? "contained" : "outlined"}
              onClick={() => setPinOnly((p) => !p)}
              sx={{ borderRadius: 999, fontWeight: 900, whiteSpace: "nowrap" }}
            >
              {pinOnly ? "핀만" : "핀 필터"}
            </Button>
          </>
        )}
      </Stack>

      {/* Content */}
      {loading ? (
        <Typography sx={{ opacity: 0.75 }}>불러오는 중…</Typography>
      ) : tab === "bookmarks" ? (
        <>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            결과 {countBookmarks}개
          </Typography>

          <Stack spacing={1} sx={{ mt: 1 }}>
            {countBookmarks === 0 ? (
              <Box sx={{ ...softBoxSx, p: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>저장한 장이 없어.</Typography>
                <Typography sx={{ opacity: 0.75 }}>
                  읽기 화면에서 ⭐ 버튼으로 장 저장 ON 하면 여기로 들어온다.
                </Typography>
              </Box>
            ) : (
              filteredBookmarks.map((b) => (
                <Box
                  key={b.id || b.chapter}
                  sx={{
                    ...softBoxSx,
                    p: 1.4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Stack spacing={0.2}>
                    <Typography sx={{ fontWeight: 900 }}>{b.chapter}장</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      저장된 장
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="해당 장 열기" arrow>
                      <IconButton size="small" onClick={() => openChapter(b.chapter)}>
                        <OpenInNewRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="장 저장 OFF" arrow>
                      <IconButton
                        size="small"
                        onClick={() => removeBookmark(b.chapter)}
                      >
                        <BookmarkRemoveRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </>
      ) : (
        <>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            결과 {countClips}개
          </Typography>

          <Stack spacing={1} sx={{ mt: 1 }}>
            {countClips === 0 ? (
              <Box sx={{ ...softBoxSx, p: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>저장한 클립이 없어.</Typography>
                <Typography sx={{ opacity: 0.75 }}>
                  읽기 화면에서 ✂️ / 📝 버튼으로 구절이나 해설을 저장해봐.
                </Typography>
              </Box>
            ) : (
              filteredClips.map((c) => (
                <Box
                  key={c.id}
                  sx={{
                    ...softBoxSx,
                    p: 1.4,
                    position: "relative",
                    transition: "120ms ease",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.035)",
                      borderColor: "rgba(0,0,0,0.14)",
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                          label={`${c.chapter}장`}
                          size="small"
                          sx={{ borderRadius: 2, fontWeight: 900, bgcolor: "rgba(0,0,0,0.06)" }}
                        />
                        <Chip
                          label={typeLabel(c.type)}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 2, fontWeight: 900 }}
                        />
                        {c.isPinned && (
                          <Chip
                            label="PIN"
                            size="small"
                            sx={{ borderRadius: 2, fontWeight: 900, bgcolor: "rgba(0,0,0,0.06)" }}
                          />
                        )}
                      </Stack>

                      {c.sectionTitle && (
                        <Typography sx={{ fontWeight: 900, fontSize: 14.5 }} noWrap>
                          {c.sectionTitle}
                        </Typography>
                      )}

                      {c.text && (
                        <Typography
                          sx={{
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.75,
                            fontSize: 14.5,
                            opacity: 0.95,
                            wordBreak: "break-word",
                          }}
                        >
                          {c.text}
                        </Typography>
                      )}

                      {c.note && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            borderRadius: 2,
                            border: "1px solid rgba(0,0,0,0.08)",
                            bgcolor: "rgba(255,255,255,0.7)",
                          }}
                        >
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            메모
                          </Typography>
                          <Typography sx={{ fontSize: 14.2, lineHeight: 1.7 }}>
                            {c.note}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Tooltip title={c.isPinned ? "핀 해제" : "핀 고정"} arrow>
                        <IconButton size="small" onClick={() => togglePin(c)}>
                          {c.isPinned ? (
                            <PushPinRoundedIcon fontSize="small" />
                          ) : (
                            <PushPinOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="해당 장 열기" arrow>
                        <IconButton size="small" onClick={() => openChapter(c.chapter)}>
                          <OpenInNewRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="삭제" arrow>
                        <IconButton size="small" onClick={() => deleteClip(c.id)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </>
      )}

      {/* Snackbar */}
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

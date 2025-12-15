import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";

import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import hanjaDic from "../../assets/hanjaDic";

// ✅ Firestore
import {
  toggleChapterBookmark,
  getChapterBookmark,
  addClip,
} from "../../firebase/firestore";

/* =========================
   유틸
========================= */
const isHan = (ch) => /\p{Script=Han}/u.test(ch);

function uniqueJoin(arr, sep = "/") {
  return Array.from(new Set(arr.filter(Boolean))).join(sep);
}

function getHanjaInfo(ch) {
  const entry = hanjaDic?.[ch];
  if (!Array.isArray(entry) || entry.length === 0) return null;

  const readings = uniqueJoin(entry.map((x) => x?.kor), "/");
  const meaning = entry[0]?.def ? String(entry[0].def) : "";
  const tooltip = [meaning, readings].filter(Boolean).join(" · ");
  return { readings, meaning, tooltip };
}

function HanjaChar({ ch }) {
  const info = getHanjaInfo(ch);
  if (!info) return <>{ch}</>;

  const { readings, tooltip } = info;

  if (!readings) {
    return (
      <Tooltip title={tooltip || ch} arrow>
        <span
          style={{
            borderBottom: "1px dotted rgba(0,0,0,0.35)",
            cursor: "help",
          }}
        >
          {ch}
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip || readings} arrow>
      <ruby
        style={{
          rubyPosition: "over",
          borderBottom: "1px dotted rgba(0,0,0,0.35)",
          cursor: "help",
        }}
      >
        {ch}
        <rt style={{ fontSize: 10, opacity: 0.72, letterSpacing: 0.2 }}>
          {readings}
        </rt>
      </ruby>
    </Tooltip>
  );
}

function renderHanjaWithHint(text) {
  if (!text) return null;
  return (
    <>
      {Array.from(text).map((ch, idx) =>
        isHan(ch) ? (
          <HanjaChar key={`${ch}-${idx}`} ch={ch} />
        ) : (
          <span key={idx}>{ch}</span>
        )
      )}
    </>
  );
}

/* =========================
   스타일
========================= */
const cardSx = {
  borderRadius: 3,
  border: "1px solid",
  borderColor: "rgba(0,0,0,0.08)",
  bgcolor: "background.paper",
};

const softBoxSx = {
  borderRadius: 2.5,
  border: "1px solid rgba(0,0,0,0.08)",
  bgcolor: "rgba(0,0,0,0.02)",
};

const sectionTitleSx = {
  fontWeight: 900,
  letterSpacing: -0.2,
};

const iconBtnSx = {
  border: "1px solid rgba(0,0,0,0.10)",
  bgcolor: "rgba(255,255,255,0.72)",
  "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
};

// 셀(원문/번역/해설라인) 우상단 버튼 위치
const cellBtnSx = {
  position: "absolute",
  top: 6,
  right: 6,
  zIndex: 2,
};

// 버튼 공간 확보용 padding-right (아이콘 한 개 기준)
const BTN_SPACE_PR = 5;

/* =========================
   메인
========================= */
/**
 * props:
 * - chapter
 * - onTagClick?
 * - uid? (선택) // 안 줘도 auth에서 자동 구독
 */
export default function ChapterDetail({ chapter, onTagClick, uid: uidProp }) {
  const [view, setView] = useState("both"); // both | han | ko

  // ✅ auth에서 uid 자동 구독 (prop 우선)
  const [uid, setUid] = useState(uidProp || "");

  useEffect(() => {
    if (uidProp) {
      setUid(uidProp);
      return;
    }
    const auth = getAuth();
    if (auth.currentUser?.uid) setUid(auth.currentUser.uid);

    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || "");
    });

    return () => unsub();
  }, [uidProp]);

  // 저장모드
  const [saveMode, setSaveMode] = useState(
    localStorage.getItem("tao:saveMode") !== "false"
  );

  // 북마크
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // 클립 다이얼로그
  const [clipOpen, setClipOpen] = useState(false);
  const [clipPayload, setClipPayload] = useState(null);
  const [clipNote, setClipNote] = useState("");

  // 토스트
  const [toast, setToast] = useState({
    open: false,
    severity: "success",
    msg: "",
  });

  useEffect(() => {
    localStorage.setItem("tao:saveMode", String(saveMode));
  }, [saveMode]);

  const lines = useMemo(() => {
    const arr = Array.isArray(chapter?.lines) ? chapter.lines : [];
    return [...arr].sort((a, b) => Number(a.order) - Number(b.order));
  }, [chapter]);

  const sections = useMemo(() => {
    return Array.isArray(chapter?.analysis?.sections)
      ? chapter.analysis.sections
      : [];
  }, [chapter]);

  // ✅ 북마크 조회
  useEffect(() => {
    if (!uid || !chapter?.chapter) return;

    let mounted = true;
    (async () => {
      try {
        const data = await getChapterBookmark(uid, chapter.chapter);
        if (!mounted) return;
        setIsBookmarked(Boolean(data?.isSaved));
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [uid, chapter?.chapter]);

  if (!chapter) return null;

  const canSave = Boolean(uid);

  const openClipDialog = (payload) => {
    setClipPayload(payload);
    setClipNote(payload?.note || "");
    setClipOpen(true);
  };

  const handleSaveClip = async () => {
    if (!canSave || !clipPayload) return;

    try {
      await addClip(uid, {
        ...clipPayload,
        note: clipNote?.trim() || "",
        chapter: chapter.chapter,
        chapterTitle: chapter.title || "",
      });

      setToast({ open: true, severity: "success", msg: "저장됨 (클립)" });
      setClipOpen(false);
      setClipPayload(null);
      setClipNote("");
    } catch (e) {
      setToast({
        open: true,
        severity: "error",
        msg: "저장 실패… (권한/네트워크 확인)",
      });
    }
  };

  const toggleBookmark = async () => {
    if (!canSave) return;

    try {
      setBookmarkLoading(true);
      const next = !isBookmarked;
      setIsBookmarked(next);

      await toggleChapterBookmark(uid, chapter.chapter, next);

      setToast({
        open: true,
        severity: "success",
        msg: next ? "장 저장 ON" : "장 저장 OFF",
      });
    } catch (e) {
      setIsBookmarked((prev) => !prev);
      setToast({ open: true, severity: "error", msg: "북마크 저장 실패…" });
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ ...cardSx, p: { xs: 1.5, sm: 2 } }}>
      {/* 헤더 */}
      <Stack spacing={1.2}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              label={`${chapter.chapter}장`}
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: "rgba(0,0,0,0.06)",
                borderRadius: 2,
              }}
            />
            <Typography variant="h5" sx={sectionTitleSx}>
              {chapter.title}
            </Typography>

            {/* uid 상태 표시(디버그용) */}
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              {uid ? `uid: ${uid.slice(0, 6)}…` : "uid 없음"}
            </Typography>
          </Stack>

          {/* 저장 영역 */}
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              sx={{ mr: 0, userSelect: "none" }}
              control={
                <Switch
                  checked={saveMode}
                  onChange={(e) => setSaveMode(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  저장모드
                </Typography>
              }
            />

            {saveMode && (
              <Tooltip
                title={
                  canSave
                    ? isBookmarked
                      ? "이 장 저장 OFF"
                      : "이 장 저장 ON"
                    : "로그인(uid) 필요"
                }
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={toggleBookmark}
                    disabled={!canSave || bookmarkLoading}
                    sx={{
                      border: "1px solid rgba(0,0,0,0.10)",
                      bgcolor: "rgba(0,0,0,0.02)",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                    }}
                  >
                    {isBookmarked ? (
                      <BookmarkRoundedIcon fontSize="small" />
                    ) : (
                      <BookmarkBorderRoundedIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {chapter.subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.78, lineHeight: 1.6 }}>
            {chapter.subtitle}
          </Typography>
        )}

        {/* 태그 */}
        {Array.isArray(chapter.tags) && chapter.tags.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {chapter.tags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                clickable
                size="small"
                variant="outlined"
                onClick={() => onTagClick?.(tag)}
                sx={{
                  borderRadius: 2,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      {/* Key Sentence */}
      {chapter.analysis?.keySentence && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 3,
            bgcolor: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.08)",
            position: "relative",
          }}
        >
          {saveMode && (
            <Tooltip title={canSave ? "핵심 문장 저장" : "로그인(uid) 필요"} arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={!canSave}
                  onClick={() =>
                    openClipDialog({
                      type: "keySentence",
                      text: chapter.analysis.keySentence,
                    })
                  }
                  sx={{ position: "absolute", top: 10, right: 10, ...iconBtnSx }}
                >
                  <NotesRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Typography sx={{ fontWeight: 900, lineHeight: 1.6, pr: saveMode ? BTN_SPACE_PR : 0 }}>
            {chapter.analysis.keySentence}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            핵심 문장
          </Typography>
        </Box>
      )}

      {/* 원문 · 번역 */}
      <Divider sx={{ my: 2.5 }} />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.25 }}
      >
        <Typography variant="h6" sx={sectionTitleSx}>
          원문 · 번역
        </Typography>

        <ToggleButtonGroup
          size="small"
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          sx={{
            "& .MuiToggleButton-root": {
              borderRadius: 999,
              px: 1.25,
              py: 0.5,
              textTransform: "none",
              fontWeight: 800,
              borderColor: "rgba(0,0,0,0.12)",
            },
          }}
        >
          <ToggleButton value="both">둘 다</ToggleButton>
          <ToggleButton value="han">원문</ToggleButton>
          <ToggleButton value="ko">번역</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack spacing={1}>
        {lines.map((line) => (
          <Box
            key={line.order}
            sx={{
              ...softBoxSx,
              p: 1.4,
              transition: "120ms ease",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.035)",
                borderColor: "rgba(0,0,0,0.14)",
              },
              display: "grid",
              gridTemplateColumns: view === "both" ? "1fr 1.25fr" : "1fr",
              gap: 2,
            }}
          >
            {/* ✅ 원문 셀 */}
            {(view === "both" || view === "han") && (
              <Box sx={{ position: "relative" }}>
                {saveMode && (
                  <Box sx={cellBtnSx}>
                    <Tooltip
                      title={canSave ? "원문 저장(메모)" : "로그인(uid) 필요"}
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={!canSave}
                          onClick={() =>
                            openClipDialog({
                              type: "han",
                              lineOrder: line.order,
                              text: line.han || "",
                            })
                          }
                          sx={iconBtnSx}
                        >
                          <ContentCutRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}

                <Typography
                  sx={{
                    fontWeight: 400,
                    letterSpacing: 0.2,
                    lineHeight: 2.05,
                    fontSize: 16,
                    pr: saveMode ? BTN_SPACE_PR : 0,
                  }}
                >
                  {renderHanjaWithHint(line.han)}
                </Typography>
              </Box>
            )}

            {/* ✅ 번역 셀 */}
            {(view === "both" || view === "ko") && (
              <Box sx={{ position: "relative" }}>
                {saveMode && (
                  <Box sx={cellBtnSx}>
                    <Tooltip
                      title={canSave ? "번역 저장(메모)" : "로그인(uid) 필요"}
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={!canSave}
                          onClick={() =>
                            openClipDialog({
                              type: "ko",
                              lineOrder: line.order,
                              text: line.ko || "",
                            })
                          }
                          sx={iconBtnSx}
                        >
                          <NotesRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}

                <Typography
                  sx={{
                    opacity: 0.92,
                    lineHeight: 1.8,
                    fontSize: 14.5,
                    pr: saveMode ? BTN_SPACE_PR : 0,
                  }}
                >
                  {line.ko}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Stack>

      {/* 해설 */}
      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ ...sectionTitleSx, mb: 1.25 }}>
        현대어 해설
      </Typography>

      {sections.length > 0 ? (
        <Stack spacing={1.25}>
          {sections.map((sec, idx) => (
            <Box
              key={idx}
              sx={{
                ...softBoxSx,
                p: 1.6,
                position: "relative",
              }}
            >
              {/* ✅ 섹션 전체 저장 */}
              {saveMode && (
                <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                  <Tooltip
                    title={canSave ? "해설(섹션) 저장" : "로그인(uid) 필요"}
                    arrow
                  >
                    <span>
                      <IconButton
                        size="small"
                        disabled={!canSave}
                        onClick={() =>
                          openClipDialog({
                            type: "analysis",
                            sectionIdx: idx,
                            sectionType: sec.type || "",
                            sectionTitle: sec.title || "",
                            text: `${sec.title || ""}\n${(sec.content || []).join(
                              "\n"
                            )}`.trim(),
                          })
                        }
                        sx={iconBtnSx}
                      >
                        <NotesRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              )}

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
                flexWrap="wrap"
              >
                {sec.type && (
                  <Chip
                    label={sec.type}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      bgcolor: "rgba(0,0,0,0.06)",
                      fontWeight: 800,
                    }}
                  />
                )}
                <Typography sx={{ fontWeight: 900, fontSize: 16, pr: saveMode ? BTN_SPACE_PR : 0 }}>
                  {sec.title}
                </Typography>
              </Stack>

              {/* ✅ 한 줄씩 저장 */}
              <Stack spacing={0.75}>
                {(Array.isArray(sec.content) ? sec.content : []).map((c, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: "relative",
                      pr: saveMode ? BTN_SPACE_PR : 0,
                    }}
                  >
                    {saveMode && (
                      <Box sx={cellBtnSx}>
                        <Tooltip
                          title={canSave ? "해설 한줄 저장" : "로그인(uid) 필요"}
                          arrow
                        >
                          <span>
                            <IconButton
                              size="small"
                              disabled={!canSave}
                              onClick={() =>
                                openClipDialog({
                                  type: "analysisLine",
                                  sectionIdx: idx,
                                  sectionType: sec.type || "",
                                  sectionTitle: sec.title || "",
                                  lineIndex: i,
                                  text: String(c || ""),
                                })
                              }
                              sx={iconBtnSx}
                            >
                              <NotesRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    )}

                    <Typography
                      sx={{
                        lineHeight: 1.85,
                        fontSize: 14.5,
                        opacity: 0.95,
                      }}
                    >
                      <span style={{ opacity: 0.7, marginRight: 6 }}>•</span>
                      {c}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography sx={{ opacity: 0.8 }}>해설이 아직 없어.</Typography>
      )}

      {/* 저장 메모 다이얼로그 */}
      <Dialog
        open={clipOpen}
        onClose={() => setClipOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>저장 (메모)</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {clipPayload?.text && (
            <Box
              sx={{
                ...softBoxSx,
                p: 1.25,
                mb: 1.5,
                bgcolor: "rgba(0,0,0,0.03)",
                whiteSpace: "pre-wrap",
                fontSize: 13.5,
                lineHeight: 1.6,
              }}
            >
              {clipPayload.text}
            </Box>
          )}

          <TextField
            value={clipNote}
            onChange={(e) => setClipNote(e.target.value)}
            placeholder="내 메모(선택)"
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setClipOpen(false)} variant="outlined">
            취소
          </Button>
          <Button
            onClick={handleSaveClip}
            variant="contained"
            disabled={!canSave}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 토스트 */}
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

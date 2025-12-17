// src/components/read/chapter/StoryDrawer.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Stack,
  Typography,
  IconButton,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";

import { fetchChapterStory, addClip } from "../../firebase/firestore";

export default function StoryDrawer({
  open,
  onClose,
  chapterNumber,
  chapterTitle,
  uid,
  saveMode,
}) {
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "" });

  const canSave = Boolean(uid);

  useEffect(() => {
    if (!open || !chapterNumber) return;

    let mounted = true;

    (async () => {
      try {
        setError("");
        setLoading(true);
        setStory(null);

        const data = await fetchChapterStory(chapterNumber);
        if (!mounted) return;

        setStory(data || null);
      } catch (e) {
        if (!mounted) return;
        setError("동화를 불러오지 못했어. (권한/네트워크 확인)");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, chapterNumber]);

  // Firestore 필드명이 content/body 등으로 달라도 안전하게 처리
  const paragraphs = useMemo(() => {
    const raw = story?.content ?? story?.body ?? [];
    return Array.isArray(raw) ? raw.filter(Boolean) : [];
  }, [story]);

  // 클립 저장용 텍스트(제목 + 문단)
  const storyText = useMemo(() => {
    if (!story) return "";
    const title = story?.title ? `《${story.title}》\n` : "";
    const body = paragraphs.length ? paragraphs.join("\n\n") : "";
    return `${title}${body}`.trim();
  }, [story, paragraphs]);

  const handleClipStory = async () => {
    if (!canSave || !storyText) return;

    try {
      await addClip(uid, {
        type: "story",
        chapter: Number(chapterNumber),
        chapterTitle: chapterTitle || "",
        storyTitle: story?.title || "",
        text: storyText,
        note: "",
      });

      setSnack({ open: true, msg: "동화를 클립에 저장했어." });
    } catch (e) {
      setSnack({ open: true, msg: "저장에 실패했어. 잠시 후 다시 시도해줘." });
    }
  };

  const handleCloseSnack = () => setSnack({ open: false, msg: "" });

  const titleLine = `${chapterNumber}장 · 이 장의 이야기`;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: "92vw", sm: 420 },
            height: "100%",
          },
        }}
      >
        {/* 전체 레이아웃: 헤더 고정 + 본문 스크롤 + 푸터(액션) 고정 */}
        <Stack sx={{ height: "100%" }}>
          {/* Header */}
          <Box sx={{ p: 2, pb: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoStoriesRoundedIcon />
                <Typography sx={{ fontWeight: 900 }}>{titleLine}</Typography>
              </Stack>

              <IconButton onClick={onClose} size="small" aria-label="닫기">
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>

            {!!chapterTitle && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {chapterTitle}
              </Typography>
            )}

            <Divider sx={{ mt: 1.5 }} />
          </Box>

          {/* Body (scroll) */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 2,
              pb: 2,
            }}
          >
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                <CircularProgress size={18} />
                <Typography sx={{ opacity: 0.8 }}>불러오는 중…</Typography>
              </Stack>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : !story ? (
              <Alert severity="info">
                아직 이 장의 동화가 없어. <br />
                (Firestore: {String(chapterNumber)} 문서 생성하면 바로 뜬다)
              </Alert>
            ) : (
              <Box>
                {!!story?.title && (
                  <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>
                    {story.title}
                  </Typography>
                )}

                <Stack spacing={1.2}>
                  {paragraphs.map((p, idx) => (
                    <Typography key={idx} sx={{ lineHeight: 1.85, fontSize: 14.5 }}>
                      {p}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          {/* Footer (actions) */}
          {saveMode && (
            <Box
              sx={{
                p: 2,
                pt: 1.5,
                borderTop: "1px solid",
                borderColor: "divider",
                position: "sticky",
                bottom: 0,
                bgcolor: "background.paper",
              }}
            >
              <Tooltip title={canSave ? "동화를 클립으로 저장" : "로그인(uid) 필요"} arrow>
                <span>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<ContentCutRoundedIcon />}
                    onClick={handleClipStory}
                    disabled={!canSave || !storyText || loading || !!error || !story}
                    sx={{ borderRadius: 999, fontWeight: 900, py: 1 }}
                  >
                    동화 저장(클립)
                  </Button>
                </span>
              </Tooltip>

              {!canSave && (
                <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
                  저장은 로그인 후 가능해.
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </Drawer>

      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={handleCloseSnack}
        message={snack.msg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}

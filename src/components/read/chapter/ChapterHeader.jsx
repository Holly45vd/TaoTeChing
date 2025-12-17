// src/components/read/chapter/ChapterHeader.jsx
import {
  Stack,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  Box,
} from "@mui/material";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";

const actionBtnSx = {
  border: "1px solid rgba(0,0,0,0.10)",
  bgcolor: "rgba(0,0,0,0.02)",
  "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
};

export default function ChapterHeader({
  chapter,
  saveMode,
  setSaveMode,
  canSave,
  isBookmarked,
  bookmarkLoading,
  toggleBookmark,
  onTagClick,
  onOpenStory,
  showUid = false, // ✅ 기본은 uid 숨김 (필요하면 true로)
  uid,
}) {
  const chapNum = chapter?.chapter ?? "";
  const title = chapter?.title ?? "";
  const subtitle = chapter?.subtitle ?? "";

  const bookmarkTitle = !canSave
    ? "로그인(uid) 필요"
    : saveMode
      ? isBookmarked
        ? "이 장 저장 OFF"
        : "이 장 저장 ON"
      : "저장모드를 켜면 장 저장이 가능해";

  return (
    <Stack spacing={1.2}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
      >
        {/* Left: Chapter meta */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0 }}>
          <Chip
            label={chapNum ? `${chapNum}장` : "장"}
            size="small"
            sx={{ fontWeight: 800, bgcolor: "rgba(0,0,0,0.06)", borderRadius: 2 }}
          />

          <Typography
            variant="h5"
            sx={{ fontWeight: 900, letterSpacing: -0.2 }}
            noWrap
          >
            {title || "제목 없음"}
          </Typography>

          {showUid && (
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              {uid ? `uid: ${uid.slice(0, 6)}…` : "uid 없음"}
            </Typography>
          )}
        </Stack>

        {/* Right: actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControlLabel
            sx={{ mr: 0, userSelect: "none" }}
            control={
              <Switch
                checked={Boolean(saveMode)}
                onChange={(e) => setSaveMode?.(e.target.checked)}
                size="small"
              />
            }
            label={
              <Stack spacing={0} sx={{ lineHeight: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>
                  저장모드
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  클립/저장 버튼 표시
                </Typography>
              </Stack>
            }
          />

          {/* 동화 버튼 */}
          <Tooltip title="이 장의 이야기(동화)" arrow>
            <span>
              <IconButton
                size="small"
                onClick={onOpenStory}
                sx={actionBtnSx}
                aria-label="이 장의 이야기 열기"
              >
                <AutoStoriesRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* 북마크 버튼: saveMode OFF여도 노출(발견성↑), 대신 안내 */}
          <Tooltip title={bookmarkTitle} arrow>
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  if (!saveMode) {
                    // saveMode가 꺼져있으면 토글을 켜는 편이 UX가 좋음
                    setSaveMode?.(true);
                    return;
                  }
                  toggleBookmark?.();
                }}
                disabled={!canSave || bookmarkLoading}
                sx={actionBtnSx}
                aria-label="장 저장 토글"
              >
                {isBookmarked ? (
                  <BookmarkRoundedIcon fontSize="small" />
                ) : (
                  <BookmarkBorderRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Subtitle */}
      {subtitle ? (
        <Typography variant="body2" sx={{ opacity: 0.78, lineHeight: 1.6 }}>
          {subtitle}
        </Typography>
      ) : null}

      {/* Tags */}
      {Array.isArray(chapter?.tags) && chapter.tags.length > 0 ? (
        <Box>
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
        </Box>
      ) : null}
    </Stack>
  );
}

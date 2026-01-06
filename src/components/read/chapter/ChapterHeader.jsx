// src/components/read/chapter/ChapterHeader.jsx
import {
  Stack,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  Box,
} from "@mui/material";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import NoteAltOutlinedIcon from "@mui/icons-material/NoteAltOutlined";

const actionBtnSx = {
  border: "1px solid rgba(0,0,0,0.10)",
  bgcolor: "rgba(0,0,0,0.02)",
  "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
};

export default function ChapterHeader({
  chapter,
  // saveMode, setSaveMode,  // ❌ 저장모드 UI 제거
  canSave,
  isBookmarked,
  bookmarkLoading,
  toggleBookmark,
  onTagClick,
  // onOpenStory,           // ❌ 동화 제거
  onOpenMemo,              // ✅ 메모 열기 (새로 추가)
  showUid = false,
  uid,
}) {
  const chapNum = chapter?.chapter ?? "";
  const title = chapter?.title ?? "";
  const subtitle = chapter?.subtitle ?? "";

  const bookmarkTitle = !canSave
    ? "로그인(uid) 필요"
    : isBookmarked
      ? "이 장 저장 해제"
      : "이 장 저장";

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
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          sx={{ minWidth: 0 }}
        >
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
          {/* 메모 버튼 */}
          <Tooltip title="내 메모" arrow>
            <span>
              <IconButton
                size="small"
                onClick={() => onOpenMemo?.(chapNum)}
                sx={actionBtnSx}
                aria-label="내 메모 열기"
              >
                <NoteAltOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* 북마크 버튼 */}
          <Tooltip title={bookmarkTitle} arrow>
            <span>
              <IconButton
                size="small"
                onClick={() => toggleBookmark?.()}
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

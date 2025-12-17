// src/components/read/ChapterNavModal.jsx
import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  Divider,
  Button,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";

import RangeAccordion from "./RangeAccordion";
import TagFilterBar from "./TagFilterBar";

export default function ChapterNavModal({
  open,
  onClose,
  viewMode, // "range" | "tag"
  onViewMode,
  chapters = [],
  filteredChapters = [],
  selected,
  onSelect,
  range,
  onRange,
  selectedTags = [],
  onSelectedTags,
  query,
  showTagResults = true, // ✅ 태그모드에서도 결과 리스트 보여줄지
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const trimmedQuery = (query || "").trim();
  const selectedChapterNum = Number(selected?.chapter);

  const handlePick = (c) => {
    onSelect?.(c);
    onClose?.();
  };

  const handleChangeMode = (_, next) => {
    if (!next) return; // ToggleButtonGroup에서 null 방지
    onViewMode?.(next);
  };

  const resultCount = filteredChapters?.length ?? 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      aria-labelledby="chapter-nav-title"
    >
      {/* Header: sticky */}
      <DialogTitle
        id="chapter-nav-title"
        sx={{
          pr: 6,
          position: "sticky",
          top: 0,
          zIndex: 2,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography fontWeight={900} noWrap>
              메뉴
            </Typography>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={viewMode}
              onChange={handleChangeMode}
              aria-label="메뉴 보기 모드"
              sx={{ ml: 1 }}
            >
              <ToggleButton value="range" aria-label="장 범위 보기">
                장 범위
              </ToggleButton>
              <ToggleButton value="tag" aria-label="태그 보기">
                태그
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <IconButton onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* 서브 정보: 검색어/결과/필터 */}
        <Box sx={{ mt: 1 }}>
          {trimmedQuery ? (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              검색어: “{trimmedQuery}” · 결과 {resultCount}개
            </Typography>
          ) : selectedTags?.length ? (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              선택된 태그 {selectedTags.length}개 · 결과 {resultCount}개
            </Typography>
          ) : null}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* TAG MODE */}
        {viewMode === "tag" && (
          <Stack spacing={2}>
            <TagFilterBar
              chapters={chapters}
              selectedTags={selectedTags}
              onChange={onSelectedTags}
            />

            {/* 태그 모드에서도 결과를 보여주면 UX가 명확해짐 */}
            {showTagResults && (
              <Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.9 }}>
                  결과 목록
                </Typography>

                {resultCount === 0 ? (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    조건에 맞는 장이 없어.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {filteredChapters.map((c) => {
                      const active = Number(c.chapter) === selectedChapterNum;
                      return (
                        <Button
                          key={c.chapter}
                          variant={active ? "contained" : "outlined"}
                          onClick={() => handlePick(c)}
                          sx={{
                            justifyContent: "flex-start",
                            borderRadius: 2,
                          }}
                        >
                          {c.chapter}장&nbsp;&nbsp;
                          <span style={{ opacity: 0.8, fontWeight: 400 }}>
                            {c.title || ""}
                          </span>
                        </Button>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
        )}

        {/* RANGE MODE */}
        {viewMode === "range" && (
          <RangeAccordion
            chapters={chapters}
            range={range}
            onRange={onRange}
            selected={selected}
            onSelect={handlePick}
            maxChapter={81}
            step={10}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

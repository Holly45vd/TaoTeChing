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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";

import RangeAccordion from "./RangeAccordion";
import TagFilterBar from "./TagFilterBar";

export default function ChapterNavModal({
  open,
  onClose,
  viewMode,
  onViewMode,
  chapters,
  filteredChapters,
  selected,
  onSelect,
  range,
  onRange,
  selectedTags,
  onSelectedTags,
  query,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={800}>메뉴</Typography>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={viewMode === "range" ? "contained" : "outlined"}
                onClick={() => onViewMode?.("range")}
              >
                장 범위
              </Button>
              <Button
                size="small"
                variant={viewMode === "tag" ? "contained" : "outlined"}
                onClick={() => onViewMode?.("tag")}
              >
                태그
              </Button>
            </Stack>
          </Stack>

          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Stack>

        {query?.trim() ? (
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            검색어: “{query.trim()}” · 결과 {filteredChapters.length}개
          </Typography>
        ) : null}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {viewMode === "tag" ? (
          <TagFilterBar
            chapters={chapters}
            selectedTags={selectedTags}
            onChange={onSelectedTags}
          />
        ) : null}

        {viewMode === "range" ? (
          <RangeAccordion
            chapters={chapters}
            range={range}
            onRange={onRange}
            selected={selected}
            onSelect={(c) => {
              onSelect?.(c);
              onClose?.();
            }}
            maxChapter={81}
            step={10}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredChapters.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                조건에 맞는 장이 없어.
              </Typography>
            ) : (
              filteredChapters.map((c) => {
                const active = Number(selected?.chapter) === Number(c.chapter);
                return (
                  <Button
                    key={c.chapter}
                    variant={active ? "contained" : "outlined"}
                    onClick={() => {
                      onSelect?.(c);
                      onClose?.();
                    }}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    {c.chapter}장&nbsp;&nbsp;
                    <span style={{ opacity: 0.8, fontWeight: 400 }}>
                      {c.title || ""}
                    </span>
                  </Button>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

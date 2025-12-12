import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from "@mui/material";

function clampList(list, max = 3) {
  if (!Array.isArray(list)) return { head: [], tail: [], hasMore: false };
  if (list.length <= max) return { head: list, tail: [], hasMore: false };
  return { head: list.slice(0, max), tail: list.slice(max), hasMore: true };
}

export default function ChapterDetail({ chapter, onTagClick }) {
  const [view, setView] = useState("both"); // both | han | ko
  const [expandedSections, setExpandedSections] = useState(new Set());

  const lines = useMemo(() => {
    const arr = Array.isArray(chapter?.lines) ? chapter.lines : [];
    return [...arr].sort((a, b) => Number(a.order) - Number(b.order));
  }, [chapter]);

  const sections = useMemo(() => {
    return Array.isArray(chapter?.analysis?.sections)
      ? chapter.analysis.sections
      : [];
  }, [chapter]);

  if (!chapter) return null;

  const toggleSection = (idx) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3 }}>
      {/* 헤더 */}
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={900}>
          {chapter.chapter}장. {chapter.title}
        </Typography>

        {chapter.subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
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
            borderRadius: 2,
            bgcolor: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Typography fontWeight={800}>
            {chapter.analysis.keySentence}
          </Typography>
        </Box>
      )}

      {/* =========================
          1️⃣ 원문 · 번역 (먼저)
         ========================= */}
      <Divider sx={{ my: 2 }} />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="h6" fontWeight={900}>
          원문 · 번역
        </Typography>

        <ToggleButtonGroup
          size="small"
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
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
              display: "grid",
              gridTemplateColumns: view === "both" ? "1fr 1.2fr" : "1fr",
              gap: 2,
              p: 1.25,
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.08)",
              bgcolor: "rgba(0,0,0,0.02)",
            }}
          >
            {(view === "both" || view === "han") && (
              <Typography fontWeight={900} letterSpacing={0.2}>
                {line.han}
              </Typography>
            )}
            {(view === "both" || view === "ko") && (
              <Typography sx={{ opacity: 0.9, lineHeight: 1.75 }}>
                {line.ko}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>

      {/* =========================
          2️⃣ 현대어 해설 (기본 펼침)
         ========================= */}
      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
        현대어 해설
      </Typography>

      {sections.length > 0 ? (
        <Stack spacing={1.25}>
          {sections.map((sec, idx) => {
            const expanded = expandedSections.has(idx);
            const { head, tail, hasMore } = clampList(sec.content, 3);

            return (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.08)",
                  bgcolor: "rgba(0,0,0,0.02)",
                }}
              >
                <Typography sx={{ opacity: 0.75, mb: 0.5 }}>
                  {sec.type}
                </Typography>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  {sec.title}
                </Typography>

                <Stack spacing={0.75}>
                  {(expanded ? sec.content : head).map((c, i) => (
                    <Typography key={i} sx={{ lineHeight: 1.8 }}>
                      • {c}
                    </Typography>
                  ))}

                  {hasMore && (
                    <Button
                      size="small"
                      onClick={() => toggleSection(idx)}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {expanded ? "접기" : `더보기 (+${tail.length})`}
                    </Button>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Typography sx={{ opacity: 0.8 }}>
          해설이 아직 없어.
        </Typography>
      )}
    </Paper>
  );
}

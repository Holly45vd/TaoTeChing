// src/components/read/chapter/HanKoSection.jsx
import { useMemo } from "react";
import { Paper, Typography, Stack, Divider } from "@mui/material";

export default function HanKoSection({ chapter, lines = [] }) {
  const { hanAll, koAll } = useMemo(() => {
    // 1) lines 기반으로 "원문만", "번역만" 각각 합치기
    const validLines = Array.isArray(lines) ? lines : [];

    const han = validLines
      .map((l) => String(l?.han || "").trim())
      .filter(Boolean)
      .join("\n");

    const ko = validLines
      .map((l) => String(l?.ko || "").trim())
      .filter(Boolean)
      .join("\n");

    // 2) 만약 lines가 비어있고, chapter.han_ko만 있다면(임시 대응)
    //    (han_ko가 '【원문】 ... 【번역】 ...' 형식일 때만 분리 시도)
    if ((!han || !ko) && String(chapter?.han_ko || "").trim()) {
      const raw = String(chapter.han_ko).trim();
      const parts = raw.split("【번역】");
      if (parts.length === 2) {
        const h = parts[0].replace("【원문】", "").trim();
        const k = parts[1].trim();
        return { hanAll: han || h, koAll: ko || k };
      }
    }

    return { hanAll: han, koAll: ko };
  }, [chapter, lines]);

  if (!hanAll && !koAll) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.08)",
          p: 2,
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          표시할 텍스트가 없습니다. (lines/han_ko 모두 비어있음)
        </Typography>
      </Paper>
    );
  }

  const preSx = {
    m: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.8,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", "Apple SD Gothic Neo", Arial, "Noto Sans", "Liberation Sans", sans-serif',
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "rgba(0,0,0,0.08)",
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
          통으로 보기
        </Typography>

        {/* 원문 전체 */}
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            원문
          </Typography>
          <Typography component="pre" variant="body1" sx={preSx}>
            {hanAll || "원문 데이터 없음"}
          </Typography>
        </Stack>

        <Divider />

        {/* 번역 전체 */}
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            번역
          </Typography>
          <Typography component="pre" variant="body1" sx={preSx}>
            {koAll || "번역 데이터 없음"}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

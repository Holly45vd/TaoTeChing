// src/components/saved/SavedHanKoCard.jsx
import { Box, Typography, Divider } from "@mui/material";

const boxSx = {
  borderRadius: 2.5,
  border: "1px solid rgba(0,0,0,0.1)",
  bgcolor: "rgba(0,0,0,0.02)",
  p: 2,
};

export default function SavedHanKoCard({ clip, viewMode }) {
  const { han, ko, chapter, chapterTitle } = clip;

  if (viewMode === "line") {
    return (
      <Box sx={boxSx}>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {chapter}장 · {chapterTitle}
        </Typography>

        <Typography sx={{ mt: 1.2, lineHeight: 2 }}>
          {han}
        </Typography>

        <Typography sx={{ mt: 1, opacity: 0.9 }}>
          {ko}
        </Typography>
      </Box>
    );
  }

  // 통으로 보기
  return (
    <Box sx={boxSx}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {chapter}장 · {chapterTitle}
      </Typography>

      <Divider sx={{ my: 1.5 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 2,
        }}
      >
        <Typography sx={{ lineHeight: 2 }}>
          {han}
        </Typography>

        <Typography sx={{ lineHeight: 1.8, opacity: 0.92 }}>
          {ko}
        </Typography>
      </Box>
    </Box>
  );
}

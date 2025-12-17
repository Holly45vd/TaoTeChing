import { Box, Stack, Typography, Divider } from "@mui/material";

const boxSx = {
  borderRadius: 2.5,
  border: "1px solid rgba(0,0,0,0.08)",
  bgcolor: "rgba(0,0,0,0.02)",
  p: 2,
};

export default function ParallelTextSection({ hanmoon, korean }) {
  if (!hanmoon && !korean) return null;

  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>
        원문 · 번역 (통으로 보기)
      </Typography>

      <Box
        sx={{
          ...boxSx,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        {/* 한자 */}
        <Box>
          <Typography
            variant="caption"
            sx={{ opacity: 0.7, display: "block", mb: 1 }}
          >
            原文
          </Typography>
          <Typography
            sx={{
              fontSize: 16,
              lineHeight: 2,
              whiteSpace: "pre-wrap",
              fontFamily: "serif",
            }}
          >
            {hanmoon || "—"}
          </Typography>
        </Box>

        {/* 한글 */}
        <Box>
          <Typography
            variant="caption"
            sx={{ opacity: 0.7, display: "block", mb: 1 }}
          >
            번역
          </Typography>
          <Typography
            sx={{
              fontSize: 14.5,
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
              opacity: 0.92,
            }}
          >
            {korean || "—"}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mt: 3 }} />
    </>
  );
}

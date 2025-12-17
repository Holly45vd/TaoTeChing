// src/components/read/ReadingModeToggle.jsx
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

export default function ReadingModeToggle({ value = "han_ko", onChange }) {
  const handleChange = (_, next) => {
    if (!next) return; // 같은 버튼 다시 누르면 null 나오는 것 방지
    onChange?.(next);
  };

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
    >
      <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
        보기 모드
      </Typography>

      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{
          alignSelf: { xs: "flex-start", sm: "auto" },
          "& .MuiToggleButton-root": { px: 1.5, borderRadius: 2 },
        }}
      >
        <ToggleButton value="han_ko">통으로</ToggleButton>
        <ToggleButton value="lines">라인</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}

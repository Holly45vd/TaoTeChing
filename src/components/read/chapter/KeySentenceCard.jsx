// src/components/read/chapter/KeySentenceCard.jsx
import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";

const softSx = {
  borderRadius: 3,
  bgcolor: "rgba(0,0,0,0.04)",
  border: "1px solid rgba(0,0,0,0.08)",
};

const iconBtnSx = {
  border: "1px solid rgba(0,0,0,0.10)",
  bgcolor: "rgba(255,255,255,0.72)",
  "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
};

export default function KeySentenceCard({
  keySentence,
  saveMode,
  canSave,
  onSave,
  label = "",
}) {
  if (!keySentence) return null;

  return (
    <Box sx={{ mt: 2, p: 2, position: "relative", ...softSx }}>
      {/* 저장 버튼 */}
      {saveMode && (
        <Tooltip title={canSave ? "핵심 문장 클립 저장" : "로그인(uid) 필요"} arrow>
          <span>
            <IconButton
              size="small"
              disabled={!canSave}
              onClick={onSave}
              aria-label="핵심 문장 클립 저장"
              sx={{ position: "absolute", top: 10, right: 10, ...iconBtnSx }}
            >
              <NotesRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* 내용 */}
      <Typography
        sx={{
          fontWeight: 900,
          lineHeight: 1.65,
          pr: saveMode ? 5 : 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {keySentence}
      </Typography>

      {/* 라벨 */}
      <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.75 }}>
        {label}
      </Typography>
    </Box>
  );
}

// src/components/read/chapter/AnalysisSection.jsx
import { Box, Stack, Typography, Chip, Tooltip, IconButton, Divider } from "@mui/material";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";

const softBoxSx = {
  borderRadius: 2.5,
  border: "1px solid rgba(0,0,0,0.08)",
  bgcolor: "rgba(0,0,0,0.02)",
};

const sectionTitleSx = {
  fontWeight: 900,
  letterSpacing: -0.2,
};

const iconBtnSx = {
  border: "1px solid rgba(0,0,0,0.10)",
  bgcolor: "rgba(255,255,255,0.72)",
  "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
};

const cellBtnSx = {
  position: "absolute",
  top: 6,
  right: 6,
  zIndex: 2,
};

const BTN_SPACE_PR = 5;

export default function AnalysisSection({
  sections,
  saveMode,
  canSave,
  onSaveSection,
  onSaveLine,
  emptyText = "해설이 아직 없어.",
}) {
  const arr = Array.isArray(sections) ? sections : [];

  return (
    <>
      <Typography variant="h6" sx={{ ...sectionTitleSx, mb: 1.25 }}>
        현대어 해설
      </Typography>

      {arr.length > 0 ? (
        <Stack spacing={1.25}>
          {arr.map((sec, idx) => {
            const type = sec?.type || "";
            const title = sec?.title || "";
            const content = Array.isArray(sec?.content) ? sec.content.filter(Boolean) : [];

            return (
              <Box
                key={idx}
                sx={{
                  ...softBoxSx,
                  p: 1.6,
                  position: "relative",
                  transition: "120ms ease",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.03)",
                    borderColor: "rgba(0,0,0,0.14)",
                  },
                }}
              >
                {/* 섹션 전체 클립 저장 */}
                {saveMode && (
                  <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                    <Tooltip title={canSave ? "해설(섹션) 클립 저장" : "로그인(uid) 필요"} arrow>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!canSave}
                          onClick={() => onSaveSection?.(sec, idx)}
                          sx={iconBtnSx}
                          aria-label="해설 섹션 클립 저장"
                        >
                          <NotesRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}

                {/* Header */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1 }}
                  flexWrap="wrap"
                >
                  {type ? (
                    <Chip
                      label={type}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        bgcolor: "rgba(0,0,0,0.06)",
                        fontWeight: 800,
                      }}
                    />
                  ) : null}

                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: 16,
                      pr: saveMode ? BTN_SPACE_PR : 0,
                    }}
                  >
                    {title || "제목 없음"}
                  </Typography>
                </Stack>

                {/* Body */}
                {content.length ? (
                  <Stack spacing={0.9}>
                    {content.map((c, i) => (
                      <Box key={i} sx={{ position: "relative", pr: saveMode ? BTN_SPACE_PR : 0 }}>
                        {/* 한 줄 클립 저장 */}
                        {saveMode && (
                          <Box sx={cellBtnSx}>
                            <Tooltip title={canSave ? "해설 한 줄 클립 저장" : "로그인(uid) 필요"} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={!canSave}
                                  onClick={() => onSaveLine?.(sec, idx, c, i)}
                                  sx={iconBtnSx}
                                  aria-label="해설 한 줄 클립 저장"
                                >
                                  <NotesRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        )}

                        <Typography
                          sx={{
                            lineHeight: 1.9,
                            fontSize: 14.5,
                            opacity: 0.95,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          <span style={{ opacity: 0.65, marginRight: 8 }}>•</span>
                          {c}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    내용이 없어.
                  </Typography>
                )}

                <Divider sx={{ mt: 1.6, opacity: 0.35 }} />
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Typography sx={{ opacity: 0.8 }}>{emptyText}</Typography>
      )}
    </>
  );
}

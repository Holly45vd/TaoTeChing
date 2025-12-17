import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
} from "@mui/material";

import LibraryAddRoundedIcon from "@mui/icons-material/LibraryAddRounded";

import hanjaDic from "../../../assets/hanjaDic";

/* =========================
   Hanja render utils
========================= */
const isHan = (ch) => /\p{Script=Han}/u.test(ch);

function uniqueJoin(arr, sep = "/") {
  return Array.from(new Set(arr.filter(Boolean))).join(sep);
}

function getHanjaInfo(ch) {
  const entry = hanjaDic?.[ch];
  if (!Array.isArray(entry) || entry.length === 0) return null;

  const readings = uniqueJoin(entry.map((x) => x?.kor), "/");
  const meaning = entry[0]?.def ? String(entry[0].def) : "";
  const tooltip = [meaning, readings].filter(Boolean).join(" · ");
  return { readings, meaning, tooltip };
}

function HanjaChar({ ch }) {
  const info = getHanjaInfo(ch);
  if (!info) return <>{ch}</>;

  const { readings, tooltip } = info;

  return (
    <Tooltip title={tooltip || readings || ch} arrow>
      <ruby
        style={{
          rubyPosition: "over",
          borderBottom: "1px dotted rgba(0,0,0,0.35)",
          cursor: "help",
        }}
      >
        {ch}
        {readings ? (
          <rt style={{ fontSize: 10, opacity: 0.72, letterSpacing: 0.2 }}>
            {readings}
          </rt>
        ) : null}
      </ruby>
    </Tooltip>
  );
}

function renderHanjaWithHint(text) {
  if (!text) return null;
  const chars = Array.from(text);
  return (
    <>
      {chars.map((ch, idx) =>
        isHan(ch) ? (
          <HanjaChar key={`han-${idx}`} ch={ch} />
        ) : (
          <span key={`t-${idx}`}>{ch}</span>
        )
      )}
    </>
  );
}

/* =========================
   Styles
========================= */
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

const rowBothBtnSx = {
  position: "absolute",
  top: 6,
  left: 6,
  zIndex: 3,
};

export default function LinesSection({
  lines,
  saveMode,
  canSave,
  onSaveBoth, // ✅ 원문+번역 함께 저장만 사용
  enableHanjaHint = true,
  emptyText = "원문 데이터가 없어.",
}) {
  const [view, setView] = useState("both"); // both | han | ko

  const sorted = useMemo(() => {
    const arr = Array.isArray(lines) ? lines : [];
    return [...arr].sort((a, b) => Number(a.order) - Number(b.order));
  }, [lines]);

  const renderHan = (text) => (enableHanjaHint ? renderHanjaWithHint(text) : text);

  if (!sorted.length) {
    return (
      <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
          <Typography variant="h6" sx={sectionTitleSx}>
            원문 · 번역
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ opacity: 0.75 }}>
          {emptyText}
        </Typography>
        <Divider sx={{ mt: 2.5 }} />
      </>
    );
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
        <Typography variant="h6" sx={sectionTitleSx}>
          원문 · 번역
        </Typography>

        <ToggleButtonGroup
          size="small"
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          aria-label="원문/번역 보기 모드"
          sx={{
            "& .MuiToggleButton-root": {
              borderRadius: 999,
              px: 1.25,
              py: 0.5,
              textTransform: "none",
              fontWeight: 800,
              borderColor: "rgba(0,0,0,0.12)",
            },
          }}
        >
          <ToggleButton value="both">둘 다</ToggleButton>
          <ToggleButton value="han">원문</ToggleButton>
          <ToggleButton value="ko">번역</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack spacing={1}>
        {sorted.map((line, idx) => {
          const orderKey = line?.order ?? idx;
          const hanText = line?.han ?? "";
          const koText = line?.ko ?? "";

          return (
            <Box
              key={orderKey}
              sx={{
                ...softBoxSx,
                p: 1.4,
                position: "relative",
                transition: "120ms ease",
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.035)",
                  borderColor: "rgba(0,0,0,0.14)",
                },
                display: "grid",
                gridTemplateColumns: view === "both" ? "1fr 1.25fr" : "1fr",
                gap: 2,
              }}
            >
              {/* ✅ 저장 버튼: "둘 다 보기"에서만 */}
              {saveMode && view === "both" && (
                <Box sx={rowBothBtnSx}>
                  <Tooltip title={canSave ? "원문+번역 클립 저장" : "로그인(uid) 필요"} arrow>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!canSave || !onSaveBoth}
                        onClick={() => onSaveBoth?.(line)}
                        sx={iconBtnSx}
                        aria-label="원문과 번역을 함께 클립 저장"
                      >
                        <LibraryAddRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              )}

              {/* 원문 */}
              {(view === "both" || view === "han") && (
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      letterSpacing: 0.2,
                      lineHeight: 2.05,
                      fontSize: 16,
                      pl: saveMode && view === "both" ? 5 : 0, // 버튼 겹침 방지
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {hanText ? renderHan(hanText) : <span style={{ opacity: 0.55 }}>—</span>}
                  </Typography>
                </Box>
              )}

              {/* 번역 */}
              {(view === "both" || view === "ko") && (
                <Box>
                  <Typography
                    sx={{
                      opacity: 0.92,
                      lineHeight: 1.8,
                      fontSize: 14.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {koText ? koText : <span style={{ opacity: 0.55 }}>—</span>}
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>

      <Divider sx={{ mt: 2.5 }} />
    </>
  );
}

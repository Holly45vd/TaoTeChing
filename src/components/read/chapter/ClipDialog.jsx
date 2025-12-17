// src/components/read/chapter/ClipDialog.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
} from "@mui/material";

function buildTitle(payload) {
  const t = payload?.type;
  if (t === "han") return "원문 클립 저장";
  if (t === "ko") return "번역 클립 저장";
  if (t === "analysis") return "해설 클립 저장";
  if (t === "analysisLine") return "해설 한 줄 클립 저장";
  if (t === "keySentence") return "핵심 문장 클립 저장";
  if (t === "story") return "동화 클립 저장";
  return "클립 저장";
}

export default function ClipDialog({
  open,
  onClose,
  payload,
  note,
  setNote,
  onSave,
  canSave,
}) {
  const [saving, setSaving] = useState(false);

  // 다이얼로그 열릴 때 저장 상태 초기화(안전)
  useEffect(() => {
    if (open) setSaving(false);
  }, [open]);

  const title = useMemo(() => buildTitle(payload), [payload]);

  const handleSave = async () => {
    if (!canSave || saving) return;

    try {
      setSaving(true);
      await onSave?.();
    } finally {
      // onSave에서 성공 시 dialog 닫는 구조라면 여기서 false로 복귀가 안 보여도 OK
      // 실패 시에는 onSave 내부에서 toast 처리 후 dialog 유지될 가능성이 있으니 복구
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="clip-dialog-title"
    >
      <DialogTitle id="clip-dialog-title" sx={{ fontWeight: 900 }}>
        {title}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {payload?.text ? (
          <Box
            sx={{
              borderRadius: 2.5,
              border: "1px solid rgba(0,0,0,0.08)",
              bgcolor: "rgba(0,0,0,0.03)",
              p: 1.25,
              mb: 1.5,
              whiteSpace: "pre-wrap",
              fontSize: 13.5,
              lineHeight: 1.6,
            }}
          >
            {payload.text}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.75, mb: 1.5 }}>
            저장할 내용이 없어.
          </Typography>
        )}

        <TextField
          value={note}
          onChange={(e) => setNote?.(e.target.value)}
          placeholder="내 메모(선택)"
          label="메모"
          fullWidth
          multiline
          minRows={3}
          disabled={saving}
        />

        {!canSave && (
          <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.75 }}>
            저장은 로그인 후 가능해.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={saving}>
          취소
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!canSave || saving || !payload?.text}
        >
          {saving ? "저장 중…" : "저장"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

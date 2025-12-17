// src/components/auth/LoginModal.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  Divider,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import { getAuth } from "firebase/auth";

import { signInEmail, signUpEmail, linkAnonymousToEmail } from "../../firebase/auth";

function humanizeAuthError(e) {
  const code = e?.code || "";
  if (code === "auth/invalid-email") return "이메일 형식이 올바르지 않아.";
  if (code === "auth/missing-password") return "비밀번호를 입력해줘.";
  if (code === "auth/weak-password") return "비밀번호가 너무 약해. (보통 6자 이상)";
  if (code === "auth/email-already-in-use") return "이미 가입된 이메일이야.";
  if (code === "auth/user-not-found") return "가입된 계정을 찾을 수 없어.";
  if (code === "auth/wrong-password") return "비밀번호가 틀렸어.";
  if (code === "auth/too-many-requests") return "요청이 너무 많아. 잠깐 후 다시 해줘.";
  if (code === "auth/credential-already-in-use") return "이 이메일은 이미 다른 계정에 연결돼 있어.";
  if (code === "auth/provider-already-linked") return "이미 이 계정에 이메일 로그인이 연결돼 있어.";
  return e?.message || "인증 처리 중 오류가 발생했어.";
}

function normalizeEmail(v) {
  return String(v || "").trim().toLowerCase();
}

export default function LoginModal({ open, onClose }) {
  const auth = useMemo(() => getAuth(), []);
  const [tab, setTab] = useState(0); // 0: 로그인, 1: 가입

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // success|error|info

  const isAnon = Boolean(auth.currentUser?.isAnonymous);
  const currentEmail = auth.currentUser?.email || "";

  useEffect(() => {
    if (!open) return;

    setMsg({ type: "", text: "" });
    setLoading(false);
    setTab(0);

    setEmail(currentEmail || "");
    setPw("");
    setPw2("");
  }, [open, currentEmail]);

  const emailNorm = normalizeEmail(email);
  const canLogin = Boolean(emailNorm && pw.trim() && !loading);
  const canSignUp =
    Boolean(emailNorm && pw.trim() && pw2.trim() && pw === pw2 && !loading);

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

  const handleLogin = async () => {
    if (!canLogin) return;
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      await signInEmail(emailNorm, pw);
      setMsg({ type: "success", text: "로그인 완료." });
      onClose?.();
    } catch (e) {
      setMsg({ type: "error", text: humanizeAuthError(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!canSignUp) return;
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      // ✅ 게스트(익명)면: 가입 = 계정전환(link)로 처리해서 uid/데이터 유지
      if (isAnon) {
        await linkAnonymousToEmail(emailNorm, pw);
        setMsg({
          type: "success",
          text: "계정 생성 완료. (기존 클립/북마크 유지됨)",
        });
      } else {
        await signUpEmail(emailNorm, pw);
        setMsg({ type: "success", text: "회원가입 완료." });
      }
      onClose?.();
    } catch (e) {
      setMsg({ type: "error", text: humanizeAuthError(e) });
    } finally {
      setLoading(false);
    }
  };

  // Enter로 제출
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (tab === 0) handleLogin();
    else handleSignUp();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" aria-labelledby="login-modal-title">
      <DialogTitle id="login-modal-title" sx={{ fontWeight: 900 }}>
        계정
        <Typography variant="caption" sx={{ display: "block", opacity: 0.75, mt: 0.5 }}>
          {auth.currentUser
            ? isAnon
              ? "현재: 게스트(익명) — 가입 시 기존 데이터 유지 가능"
              : `현재: ${currentEmail}`
            : "현재: 로그인 안 됨"}
        </Typography>
      </DialogTitle>

      <Divider />

      <Box sx={{ px: 2, pt: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setMsg({ type: "", text: "" });
          }}
          variant="fullWidth"
        >
          <Tab label="로그인" />
          <Tab label="가입" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={1.25}>
          {/* 중요 안내: 게스트일 때 가입 = 데이터 유지 */}
          {isAnon && tab === 1 ? (
            <Alert severity="info">
              게스트 상태에서 <b>가입</b>하면, <b>기존 클립/북마크를 유지</b>한 채 계정으로 전환돼.
            </Alert>
          ) : null}

          {msg.text ? (
            <Alert severity={msg.type === "error" ? "error" : msg.type === "success" ? "success" : "info"}>
              {msg.text}
            </Alert>
          ) : null}

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmail((v) => normalizeEmail(v))}
            onKeyDown={handleKeyDown}
            autoComplete="email"
            fullWidth
            size="small"
            disabled={loading}
          />

          <TextField
            label="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={handleKeyDown}
            type="password"
            autoComplete={tab === 0 ? "current-password" : "new-password"}
            fullWidth
            size="small"
            disabled={loading}
          />

          {tab === 1 && (
            <>
              <TextField
                label="Password 확인"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                onKeyDown={handleKeyDown}
                type="password"
                autoComplete="new-password"
                fullWidth
                size="small"
                disabled={loading}
                error={Boolean(pw2) && pw !== pw2}
                helperText={Boolean(pw2) && pw !== pw2 ? "비밀번호가 일치하지 않아." : " "}
              />

              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                {isAnon ? "가입 시, 게스트 데이터(클립/북마크)가 그대로 유지된다." : "가입 후 바로 로그인 상태로 전환된다."}
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined" disabled={loading}>
          닫기
        </Button>

        {tab === 0 ? (
          <Button onClick={handleLogin} variant="contained" disabled={!canLogin}>
            {loading ? "로그인 중…" : "로그인"}
          </Button>
        ) : (
          <Button
            onClick={handleSignUp}
            variant="contained"
            disabled={!canSignUp}
            title={isAnon ? "게스트 데이터를 유지한 채 계정을 생성" : "새 계정 생성"}
          >
            {loading ? "가입 중…" : "가입"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

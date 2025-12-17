// src/App.jsx
import { useEffect, useMemo, useState } from "react";

import { ensureAnonymousAuth, subscribeAuth } from "./firebase/auth";

import ReadPage from "./pages/ReadPage";
import WritePage from "./pages/WritePage";
import HanjaMapBuilder from "./pages/HanjaMapBuilder";
import AdminChapterBatchUpdatePage from "./pages/AdminChapterBatchUpdatePage"; // ✅ 추가
import Header from "./components/layout/Header";

export default function App() {
  // read | write | hanja | adminBatch
  const [mode, setMode] = useState("read");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const isAuthed = Boolean(user);
  const isAnon = Boolean(user?.isAnonymous);
  const isEmailUser = Boolean(user && !user.isAnonymous);

  // ✅ Auth 상태 구독 + 익명 보장
  useEffect(() => {
    ensureAnonymousAuth();

    const unsub = subscribeAuth((u) => {
      setUser(u || null);
      setAuthReady(true);

      if (u) {
        console.log("✅ auth:", u.uid, "isAnon:", u.isAnonymous, "email:", u.email);
      } else {
        console.log("⚠️ no auth user");
      }
    });

    return () => unsub();
  }, []);

  // ✅ 게스트/미인증이 write/adminBatch 들어가면 read로 되돌림
  useEffect(() => {
    if (!authReady) return;

    const guardModes = new Set(["write", "adminBatch"]);
    if (!guardModes.has(mode)) return;

    if (!isAuthed || isAnon) {
      setMode("read");
    }
  }, [authReady, mode, isAuthed, isAnon]);

  // ✅ (선택) 화이트리스트가 필요하면 여기서 걸어라
  const isAdmin = useMemo(() => {
    // 1) 이메일 로그인 유저만
    if (!isEmailUser) return false;

    // 2) 화이트리스트까지 하고 싶으면 아래 사용
    // const allowedEmails = new Set(["you@company.com", "me@gmail.com"]);
    // return allowedEmails.has(String(user?.email || "").toLowerCase());

    return true;
  }, [isEmailUser]);

  // ✅ adminBatch 모드인데 admin 아니면 read로
  useEffect(() => {
    if (!authReady) return;
    if (mode !== "adminBatch") return;

    if (!isAdmin) setMode("read");
  }, [authReady, mode, isAdmin]);

  if (!authReady) {
    return (
      <div className="container">
        <div className="card">인증 초기화 중…</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header mode={mode} setMode={setMode} user={user} />

      <main className="card">
        {mode === "read" && <ReadPage uid={user?.uid} />}
        {mode === "write" && <WritePage uid={user?.uid} user={user} />}
        {mode === "hanja" && <HanjaMapBuilder />}
        {mode === "adminBatch" && isAdmin && <AdminChapterBatchUpdatePage />}
      </main>
    </div>
  );
}

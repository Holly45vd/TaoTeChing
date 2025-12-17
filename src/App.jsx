// src/App.jsx
import { useEffect, useState } from "react";

import { ensureAnonymousAuth, subscribeAuth } from "./firebase/auth";

import ReadPage from "./pages/ReadPage";
import WritePage from "./pages/WritePage";
import HanjaMapBuilder from "./pages/HanjaMapBuilder";
import Header from "./components/layout/Header";

export default function App() {
  const [mode, setMode] = useState("read"); // read | write | hanja
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

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

  // ✅ 게스트/미인증이 write로 들어가면 read로 되돌림 (안전장치)
  useEffect(() => {
    if (!authReady) return;
    if (mode !== "write") return;

    if (!user || user.isAnonymous) {
      setMode("read");
    }
  }, [authReady, mode, user]);

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
      </main>
    </div>
  );
}

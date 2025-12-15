import { useEffect, useState } from "react";
import { getAuth, signInAnonymously } from "firebase/auth";

import WritePage from "./pages/WritePage";
import ReadPage from "./pages/ReadPage";
import HanjaMapBuilder from "./pages/HanjaMapBuilder";

export default function App() {
  const [mode, setMode] = useState("read"); // 이제 read만 써도 됨

  // ✅ 앱 시작 시 익명 로그인 (1회)
  useEffect(() => {
    async function ensureAnonLogin() {
      const auth = getAuth();

      // 이미 로그인돼 있으면 재시도 안 함
      if (auth.currentUser) {
        console.log(
          "✅ already logged in:",
          auth.currentUser.uid,
          "isAnon:",
          auth.currentUser.isAnonymous
        );
        return;
      }

      try {
        const cred = await signInAnonymously(auth);
        console.log(
          "✅ anon login OK uid:",
          cred.user.uid,
          "isAnon:",
          cred.user.isAnonymous
        );
      } catch (e) {
        console.error("❌ anon login FAIL:", e?.code, e?.message, e);
      }
    }

    ensureAnonLogin();
  }, []);

  return (
    <div className="container">
      <header className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>도덕경</h1>
            <div className="small">
              읽기 · 저장 · 개인 정리
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tabBtn ${mode === "read" ? "tabBtnActive" : ""}`}
              onClick={() => setMode("read")}
              type="button"
            >
              읽기
            </button>
          </div>
        </div>
      </header>

      <main className="card">
        {mode === "read" ? <ReadPage /> : <HanjaMapBuilder />}
      </main>
    </div>
  );
}

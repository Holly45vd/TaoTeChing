import { useState } from "react";
import WritePage from "./pages/WritePage";
import ReadPage from "./pages/ReadPage";

export default function App() {
  const [mode, setMode] = useState("write"); // "write" | "read"

  return (
    <div className="container">
      <header className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>도덕경 어드민</h1>
            <div className="small">쓰기/읽기 기능을 단계적으로 붙여나갈 예정</div>
          </div>

          <div className="tabs">
            <button
              className={`tabBtn ${mode === "write" ? "tabBtnActive" : ""}`}
              onClick={() => setMode("write")}
              type="button"
            >
              쓰기
            </button>
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
        {mode === "write" ? <WritePage /> : <ReadPage />}
      </main>
    </div>
  );
}

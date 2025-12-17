// src/components/layout/Header.jsx
import { useMemo, useState } from "react";
import { signOutUser } from "../../firebase/auth";
import LoginModal from "../auth/LoginModal";

export default function Header({ mode, setMode, user }) {
  const isAnon = Boolean(user?.isAnonymous);
  const email = user?.email || "";
  const hasUser = Boolean(user);

  const [loginOpen, setLoginOpen] = useState(false);

  const authLabel = useMemo(() => {
    if (!hasUser) return "로그인 필요";
    return isAnon ? "게스트" : email;
  }, [hasUser, isAnon, email]);

  const canWrite = hasUser && !isAnon;
  const isAdmin = hasUser && !isAnon; // 🔧 현재는 이메일 로그인 유저 = 관리자

  const handleWriteClick = () => {
    if (!canWrite) {
      setLoginOpen(true);
      return;
    }
    setMode?.("write");
  };

  const handleAdminClick = () => {
    if (!isAdmin) return;
    setMode?.("adminBatch");
  };

  return (
    <>
      <header className="card" style={{ marginBottom: 12 }}>
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* 좌측 타이틀 */}
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 20, letterSpacing: -0.2 }}>도덕경</h1>
            <span className="small" style={{ opacity: 0.65 }}>
              읽기 · 저장 · 동화
            </span>
          </div>

          {/* 우측: 탭 + 인증 */}
          <div
            className="row"
            style={{
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {/* 모드 탭 */}
            <div className="tabs" aria-label="메뉴">
              <button
                className={`tabBtn ${mode === "read" ? "tabBtnActive" : ""}`}
                onClick={() => setMode?.("read")}
                type="button"
                aria-label="읽기 모드"
              >
                읽기
              </button>

              <button
                className={`tabBtn ${mode === "write" ? "tabBtnActive" : ""}`}
                onClick={handleWriteClick}
                type="button"
                aria-label="쓰기 모드"
                title={canWrite ? "동화 / 해설 작성" : "이메일 로그인 후 작성 가능"}
                style={{ opacity: canWrite ? 1 : 0.7 }}
              >
                쓰기
              </button>

              {/* 🔧 관리자 전용: DB 일괄 업데이트 */}
              {isAdmin && (
                <button
                  className={`tabBtn ${mode === "adminBatch" ? "tabBtnActive" : ""}`}
                  onClick={handleAdminClick}
                  type="button"
                  aria-label="챕터 데이터 일괄 업데이트"
                  title="챕터 스키마/데이터 일괄 반영"
                  style={{
                    fontWeight: 700,
                    opacity: 0.85,
                  }}
                >
                  DB 업데이트
                </button>
              )}
            </div>

            {/* 인증 상태 */}
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <span
                className="small"
                style={{
                  opacity: 0.78,
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {authLabel}
              </span>

              {!hasUser || isAnon ? (
                <button
                  className="tabBtn"
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  aria-label="로그인 열기"
                  title={isAnon ? "이메일 로그인 / 계정 전환" : "로그인"}
                >
                  로그인
                </button>
              ) : (
                <button
                  className="tabBtn"
                  type="button"
                  onClick={signOutUser}
                  aria-label="로그아웃"
                  title="로그아웃"
                >
                  로그아웃
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 보조 안내: 게스트일 때만 노출 */}
        {hasUser && isAnon ? (
          <div
            className="small"
            style={{ marginTop: 10, opacity: 0.75, lineHeight: 1.5 }}
          >
            게스트로 이용 중이야. <b>클립/저장</b>은 가능하지만,{" "}
            <b>쓰기</b>와 <b>DB 업데이트</b>는 이메일 로그인 후 가능해.
          </div>
        ) : null}
      </header>

      {/* 로그인 모달 */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

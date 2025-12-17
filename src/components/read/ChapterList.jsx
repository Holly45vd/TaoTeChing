// src/components/read/ChapterList.jsx

/**
 * ChapterList
 * - 좌측 사이드바: 장 목록
 *
 * UX 원칙
 * - 목록은 스크롤 가능해야 함(본문과 독립)
 * - 현재 선택된 장은 시각 + 접근성(aria-current)로 명확히 표시
 * - 데이터 타입(number/string) 흔들려도 안전
 */
export default function ChapterList({
  chapters = [],
  selected,
  onSelect,
  width = 240,
  title = "장 목록",
  emptyText = "저장된 장이 없습니다.",
  invalidText = "장 목록을 불러올 수 없습니다.",
}) {
  if (!Array.isArray(chapters)) {
    return <p className="small">{invalidText}</p>;
  }

  if (chapters.length === 0) {
    return <p className="small">{emptyText}</p>;
  }

  const selectedNum =
    typeof selected === "number"
      ? Number(selected)
      : selected?.chapter != null
        ? Number(selected.chapter)
        : null;

  return (
    <aside
      aria-label="장 목록"
      style={{
        width,
        minWidth: width,
        borderRight: "1px solid rgba(0,0,0,0.08)",
        paddingRight: 10,
      }}
    >
      <div style={{ position: "sticky", top: 0, paddingTop: 4, paddingBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div className="small" style={{ opacity: 0.75, marginTop: 4 }}>
          총 {chapters.length}개
        </div>
      </div>

      <div
        style={{
          maxHeight: "calc(100vh - 140px)",
          overflowY: "auto",
          paddingRight: 6,
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {chapters
            .filter((ch) => ch && ch.chapter != null)
            .sort((a, b) => Number(a.chapter) - Number(b.chapter))
            .map((ch, idx) => {
              const chapNum = Number(ch.chapter);
              const active = selectedNum != null && chapNum === Number(selectedNum);

              return (
                <li key={ch.chapter ?? idx} style={{ marginBottom: 6 }}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(ch)}
                    className={`tabBtn ${active ? "tabBtnActive" : ""}`}
                    aria-current={active ? "page" : undefined}
                    title={`${chapNum}장 열기`}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      padding: "10px 10px",
                      borderRadius: 10,
                      background: active ? "rgba(0,0,0,0.06)" : "transparent",
                    }}
                  >
                    <span style={{ fontWeight: active ? 900 : 700 }}>{chapNum}장</span>
                    <span className="small" style={{ opacity: 0.85, fontWeight: 400 }}>
                      {ch.title || ""}
                    </span>
                  </button>
                </li>
              );
            })}
        </ul>
      </div>
    </aside>
  );
}

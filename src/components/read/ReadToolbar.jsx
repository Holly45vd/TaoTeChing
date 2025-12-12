import SearchBox from "./SearchBox";

export default function ReadToolbar({
  viewMode,
  onViewMode,
  query,
  onQuery,
  onOpenMenu, // ✅ 추가
}) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="tabs">
          <button
            type="button"
            className="tabBtn"
            onClick={() => onOpenMenu?.()}
            title="장 범위/태그 메뉴 열기"
          >
            ☰ 메뉴 보기
          </button>

          {/* 탭은 모달 안으로 옮겨도 되고, 여기 둬도 됨 */}
          <button
            type="button"
            className={`tabBtn ${viewMode === "range" ? "tabBtnActive" : ""}`}
            onClick={() => onViewMode?.("range")}
          >
            장 범위
          </button>
          <button
            type="button"
            className={`tabBtn ${viewMode === "tag" ? "tabBtnActive" : ""}`}
            onClick={() => onViewMode?.("tag")}
          >
            태그
          </button>
        </div>

        <div className="row" style={{ flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <SearchBox value={query} onChange={onQuery} />
        </div>
      </div>

      <div className="small" style={{ marginTop: 8 }}>
        팁: 검색은 제목/요약/태그/해설/원문/번역을 한 번에 훑어.
      </div>
    </div>
  );
}

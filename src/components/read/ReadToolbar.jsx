// src/components/read/ReadToolbar.jsx
import SearchBox from "./SearchBox";

/**
 * ReadToolbar
 * UX 원칙
 * - "메뉴(범위/태그)" 진입은 항상 1번 동작으로 접근 가능
 * - 탭은 상황에 따라: (1) 툴바에 노출, (2) 모달로만 운영 가능
 * - 검색은 우선순위 높게: 데스크탑 우측, 모바일은 아래로 자연스럽게 줄바꿈
 */
export default function ReadToolbar({
  viewMode, // "range" | "tag"
  onViewMode,
  query,
  onQuery,
  onOpenMenu, // 장 범위/태그 메뉴 열기
  showTabs = true, // ✅ 탭을 툴바에 보여줄지 여부(기본: 보여줌)
}) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Left: 메뉴 + 탭 */}
        <div className="tabs" role="toolbar" aria-label="읽기 도구">
          <button
            type="button"
            className="tabBtn"
            onClick={() => onOpenMenu?.()}
            title="장 범위/태그 메뉴 열기"
            aria-label="장 범위/태그 메뉴 열기"
          >
            ☰ 메뉴
          </button>

        
        </div>

        {/* Right: Search */}
        <div style={{ flex: 1, minWidth: 240, display: "flex", justifyContent: "flex-end" }}>
          <SearchBox value={query} onChange={onQuery} />
        </div>
      </div>
    </div>
  );
}

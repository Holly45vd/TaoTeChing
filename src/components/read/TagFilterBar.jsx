import { useMemo, useState } from "react";

function collectTags(chapters = []) {
  const map = new Map(); // tag -> count
  for (const ch of chapters) {
    const tags = Array.isArray(ch.tags) ? ch.tags : [];
    for (const t of tags) {
      const tag = String(t || "").trim();
      if (!tag) continue;
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  // count desc, tag asc
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * TagFilterBar
 * - chapters: 전체 chapters
 * - selectedTags: string[]
 * - onChange: (nextTags)=>void
 *
 * UX 목표:
 * - 태그 많아도 "한 화면에 다 때려박기" 금지
 * - 선택된 태그는 위로 올려서 가독성 확보
 * - 태그 검색 + 더보기로 밀도 컨트롤
 */
export default function TagFilterBar({
  chapters = [],
  selectedTags = [],
  onChange,
  initialVisible = 18, // 처음 보여줄 개수
}) {
  const allTags = useMemo(() => collectTags(chapters), [chapters]);

  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(false);

  const normalizedQ = String(q || "").trim().toLowerCase();

  const filteredTags = useMemo(() => {
    if (!normalizedQ) return allTags;
    return allTags.filter(({ tag }) => tag.toLowerCase().includes(normalizedQ));
  }, [allTags, normalizedQ]);

  const visibleTags = useMemo(() => {
    if (expanded) return filteredTags;
    return filteredTags.slice(0, initialVisible);
  }, [filteredTags, expanded, initialVisible]);

  const toggle = (tag) => {
    const set = new Set(selectedTags);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    onChange?.([...set]);
  };

  const clear = () => onChange?.([]);

  const removeOne = (tag) => {
    const next = selectedTags.filter((t) => t !== tag);
    onChange?.(next);
  };

  const hasMore = filteredTags.length > visibleTags.length;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {/* Header */}
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 800 }}>태그</div>

        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <div className="small" style={{ opacity: 0.8 }}>
            선택: {selectedTags.length ? `${selectedTags.length}개` : "없음"}
          </div>

          {selectedTags.length > 0 && (
            <button type="button" className="tabBtn" onClick={clear}>
              선택 해제
            </button>
          )}
        </div>
      </div>

      {/* Selected tags (상단 분리) */}
      {selectedTags.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
            선택된 태그
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {selectedTags.map((t) => (
              <button
                key={t}
                type="button"
                className="tabBtn tabBtnActive"
                onClick={() => removeOne(t)}
                title="클릭하면 선택 해제"
                style={{ padding: "6px 10px" }}
              >
                #{t} <span className="small" style={{ opacity: 0.8 }}>×</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, borderTop: "1px solid rgba(0,0,0,0.08)" }} />
        </div>
      )}

      {/* Search */}
      <div style={{ marginTop: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="태그 검색…"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.12)",
            outline: "none",
          }}
        />
        <div className="small" style={{ opacity: 0.65, marginTop: 6 }}>
          총 {allTags.length}개 · 검색 결과 {filteredTags.length}개
        </div>
      </div>

      {/* Tag list */}
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {allTags.length === 0 ? (
          <div className="small">
            아직 태그가 없어. (쓰기 페이지에서 tags를 넣으면 여기 뜸)
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="small">검색 결과가 없어.</div>
        ) : (
          visibleTags.map(({ tag, count }) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`tabBtn ${active ? "tabBtnActive" : ""}`}
                onClick={() => toggle(tag)}
                title={`${count}개 장`}
                style={{ padding: "6px 10px" }}
              >
                #{tag} <span className="small">({count})</span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer controls */}
      {filteredTags.length > 0 && (
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div className="small" style={{ opacity: 0.7 }}>
            {expanded
              ? "전체 태그를 보고 있어."
              : `상위 ${Math.min(initialVisible, filteredTags.length)}개만 표시 중`}
          </div>

          {(hasMore || expanded) && (
            <button
              type="button"
              className="tabBtn"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "접기" : "더보기"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

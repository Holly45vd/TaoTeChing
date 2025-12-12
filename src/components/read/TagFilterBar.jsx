import { useMemo } from "react";

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
 */
export default function TagFilterBar({ chapters = [], selectedTags = [], onChange }) {
  const tags = useMemo(() => collectTags(chapters), [chapters]);

  const toggle = (tag) => {
    const set = new Set(selectedTags);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    onChange?.([...set]);
  };

  const clear = () => onChange?.([]);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700 }}>태그</div>
        <div className="row">
          <div className="small">
            선택: {selectedTags.length ? selectedTags.join(", ") : "없음"}
          </div>
          {selectedTags.length > 0 && (
            <button type="button" className="tabBtn" onClick={clear}>
              선택 해제
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.length === 0 ? (
          <div className="small">아직 태그가 없어. (쓰기 페이지에서 tags를 넣으면 여기 뜸)</div>
        ) : (
          tags.map(({ tag, count }) => {
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
    </div>
  );
}

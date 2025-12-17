// src/components/read/RangeAccordion.jsx
import { useEffect, useMemo, useState } from "react";

function buildRanges(maxChapter = 81, step = 10) {
  const ranges = [];
  for (let start = 1; start <= maxChapter; start += step) {
    const end = Math.min(maxChapter, start + step - 1);
    ranges.push({ start, end, id: `${start}-${end}` });
  }
  return ranges;
}

/**
 * RangeAccordion
 * - chapters: 전체 chapters array
 * - range: {start,end} | null
 * - onRange: ({start,end}) => void
 * - selected: chapter object | number
 * - onSelect: (chapterObj) => void
 */
export default function RangeAccordion({
  chapters = [],
  range,
  onRange,
  selected,
  onSelect,
  maxChapter = 81,
  step = 10,
  emptyText = "아직 이 범위에 저장된 장이 없어.",
}) {
  const ranges = useMemo(() => buildRanges(maxChapter, step), [maxChapter, step]);

  // 선택된 장 번호 추출
  const selectedNum = typeof selected === "number" ? selected : selected?.chapter ? Number(selected.chapter) : null;

  // 현재 range가 있으면 그 range를 기본으로 열기, 없으면 첫 범위
  const computedOpenId = useMemo(() => {
    if (range?.start && range?.end) return `${range.start}-${range.end}`;
    return ranges[0]?.id || "1-10";
  }, [range?.start, range?.end, ranges]);

  const [openId, setOpenId] = useState(computedOpenId);

  // ✅ 외부 range 변경 시 openId 동기화 (초기값만 반영되는 문제 해결)
  useEffect(() => {
    setOpenId(computedOpenId);
  }, [computedOpenId]);

  // 범위별 items를 미리 계산(필터 반복 최소화)
  const itemsByRangeId = useMemo(() => {
    const map = new Map();
    for (const r of ranges) map.set(r.id, []);
    for (const c of chapters) {
      const n = Number(c?.chapter);
      if (!Number.isFinite(n)) continue;
      for (const r of ranges) {
        if (n >= r.start && n <= r.end) {
          map.get(r.id).push(c);
          break;
        }
      }
    }
    for (const r of ranges) {
      map.get(r.id).sort((a, b) => Number(a.chapter) - Number(b.chapter));
    }
    return map;
  }, [chapters, ranges]);

  const handleToggle = (id, r) => {
    setOpenId((prev) => (prev === id ? "" : id));
    onRange?.(r);
  };

  return (
    <div role="navigation" aria-label="장 범위 선택">
      {ranges.map((r) => {
        const id = r.id;
        const isOpen = openId === id;
        const items = itemsByRangeId.get(id) || [];
        const headerId = `range-header-${id}`;
        const panelId = `range-panel-${id}`;

        return (
          <div key={id} className="card" style={{ marginBottom: 10, padding: 12 }}>
            {/* Accordion Header */}
            <button
              id={headerId}
              type="button"
              className={`tabBtn ${isOpen ? "tabBtnActive" : ""}`}
              onClick={() => handleToggle(id, r)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
              title={`${r.start}–${r.end}장 범위 ${isOpen ? "접기" : "펼치기"}`}
            >
              <span>
                <span style={{ marginRight: 8 }}>{isOpen ? "▾" : "▸"}</span>
                {r.start}–{r.end}장
                <span className="small" style={{ marginLeft: 8, opacity: 0.8 }}>
                  ({items.length})
                </span>
              </span>

              {/* 오른쪽에 보조 힌트(선택) */}
              <span className="small" style={{ opacity: 0.65 }}>
                {isOpen ? "닫기" : "열기"}
              </span>
            </button>

            {/* Accordion Panel */}
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}
              >
                {items.length === 0 ? (
                  <div className="small" style={{ opacity: 0.9 }}>
                    {emptyText}
                  </div>
                ) : (
                  items.map((c) => {
                    const chapNum = Number(c.chapter);
                    const active = selectedNum != null && chapNum === Number(selectedNum);

                    return (
                      <button
                        key={c.chapter}
                        type="button"
                        className={`tabBtn ${active ? "tabBtnActive" : ""}`}
                        onClick={() => onSelect?.(c)}
                        style={{
                          textAlign: "left",
                          display: "flex",
                          alignItems: "baseline",
                          gap: 8,
                        }}
                        title={`${c.chapter}장 열기`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span style={{ fontWeight: active ? 900 : 600 }}>{c.chapter}장</span>
                        <span className="small" style={{ opacity: 0.85 }}>
                          {c.title || ""}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useMemo, useState } from "react";

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
 * - range: {start,end} or null
 * - onRange: ({start,end})=>void
 * - selected: chapter object or number
 * - onSelect: (chapterObj)=>void
 */
export default function RangeAccordion({
  chapters = [],
  range,
  onRange,
  selected,
  onSelect,
  maxChapter = 81,
  step = 10,
}) {
  const ranges = useMemo(() => buildRanges(maxChapter, step), [maxChapter, step]);
  const [openId, setOpenId] = useState(() => {
    if (range?.start && range?.end) return `${range.start}-${range.end}`;
    return ranges[0]?.id || "1-10";
  });

  const selectedNum = typeof selected === "number" ? selected : selected?.chapter;

  const handleToggle = (id, r) => {
    setOpenId((prev) => (prev === id ? "" : id));
    onRange?.(r);
  };

  return (
    <div>
      {ranges.map((r) => {
        const id = r.id;
        const isOpen = openId === id;
        const inThisRange = (c) => {
          const n = Number(c.chapter);
          return n >= r.start && n <= r.end;
        };
        const items = chapters.filter(inThisRange).sort((a, b) => a.chapter - b.chapter);

        return (
          <div key={id} className="card" style={{ marginBottom: 10, padding: 12 }}>
            <button
              type="button"
              className="tabBtn"
              onClick={() => handleToggle(id, r)}
              style={{ width: "100%", textAlign: "left" }}
            >
              {isOpen ? "▾" : "▸"} {r.start}–{r.end}장{" "}
              <span className="small" style={{ marginLeft: 8 }}>
                ({items.length})
              </span>
            </button>

            {isOpen && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {items.length === 0 ? (
                  <div className="small" style={{ opacity: 0.9 }}>
                    아직 이 범위에 저장된 장이 없어.
                  </div>
                ) : (
                  items.map((c) => {
                    const active = Number(c.chapter) === Number(selectedNum);
                    return (
                      <button
                        key={c.chapter}
                        type="button"
                        className={`tabBtn ${active ? "tabBtnActive" : ""}`}
                        onClick={() => onSelect?.(c)}
                        style={{ textAlign: "left" }}
                        title={`${c.chapter}장`}
                      >
                        {c.chapter}장{" "}
                        <span className="small" style={{ marginLeft: 6, opacity: 0.85 }}>
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

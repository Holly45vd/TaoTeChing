export default function ChapterList({ chapters = [], selected, onSelect }) {
  if (!Array.isArray(chapters)) {
    return <p className="small">장 목록을 불러올 수 없습니다.</p>;
  }

  if (chapters.length === 0) {
    return <p className="small">저장된 장이 없습니다.</p>;
  }

  return (
    <div style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.12)" }}>
      <h3 style={{ marginTop: 0 }}>장 목록</h3>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {chapters.map((ch, idx) => {
          if (!ch || typeof ch.chapter !== "number") return null;

          return (
            <li key={ch.chapter ?? idx}>
              <button
                type="button"
                onClick={() => onSelect(ch)}
                className="tabBtn"
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 4,
                  background:
                    selected?.chapter === ch.chapter
                      ? "rgba(255,255,255,0.18)"
                      : undefined,
                }}
              >
                {ch.chapter}장 {ch.title ? `– ${ch.title}` : ""}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

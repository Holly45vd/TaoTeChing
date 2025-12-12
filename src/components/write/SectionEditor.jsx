export default function SectionEditor({ index, section, onChange, onRemove }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <strong>해설 섹션 #{index + 1}</strong>
        <button className="tabBtn" type="button" onClick={onRemove}>
          삭제
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label className="small">유형 (예: 철학적 해석 / 심리학적 해석 / 현대적 적용)</label>
        <input
          value={section.type}
          onChange={(e) => onChange("type", e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)" }}
          placeholder="예: 철학적 해석"
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label className="small">제목</label>
        <input
          value={section.title}
          onChange={(e) => onChange("title", e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)" }}
          placeholder="예: 언어는 본질을 규정하지 못한다"
        />
      </div>

      <div>
        <label className="small">내용 (줄바꿈으로 항목 구분)</label>
        <textarea
          value={section.contentText}
          onChange={(e) => onChange("contentText", e.target.value)}
          rows={5}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)" }}
          placeholder={"예:\n- 말로 규정되는 순간 본질에서 멀어진다.\n- 개념은 편리하지만 세계를 잘라낸다."}
        />
      </div>
    </div>
  );
}

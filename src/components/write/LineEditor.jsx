export default function LineEditor({ index, line, onChange, onRemove }) {
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
        <strong>줄 #{index + 1}</strong>
        <button className="tabBtn" type="button" onClick={onRemove}>
          삭제
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label className="small">원문(한자)</label>
        <input
          value={line.han}
          onChange={(e) => onChange("han", e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)" }}
          placeholder="예: 道可道，非常道；"
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label className="small">한국어 번역</label>
        <input
          value={line.ko}
          onChange={(e) => onChange("ko", e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)" }}
          placeholder="예: 도가 말해질 수 있다면 영원한 도가 아니다."
        />
      </div>

      <div>
        <label className="small">주석(선택)</label>
        <input
          value={line.note || ""}
          onChange={(e) => onChange("note", e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)" }}
          placeholder="예: ‘도’는 길/원리/법칙을 모두 포함"
        />
      </div>
    </div>
  );
}

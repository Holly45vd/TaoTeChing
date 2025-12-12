export default function TagInput({ value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
        태그 (쉼표로 구분)
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: 도, 무위, 언어의 한계"
        style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)" }}
      />
      <div className="small" style={{ marginTop: 6 }}>
        저장 시 자동으로 배열로 변환됨.
      </div>
    </div>
  );
}

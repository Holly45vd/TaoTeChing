export default function ReadingModeToggle({ value, onChange }) {
  return (
    <button
      type="button"
      className={`tabBtn ${value ? "tabBtnActive" : ""}`}
      onClick={() => onChange?.(!value)}
      title="집중 모드 (목록 숨김 + 본문 확장)"
    >
      {value ? "🧘 집중 모드 ON" : "🧘 집중 모드"}
    </button>
  );
}

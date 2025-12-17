// src/components/read/ReadingModeToggle.jsx

/**
 * ReadingModeToggle
 *
 * UX 목적
 * - "읽기 집중" 상태를 한 번에 전환
 * - 목록/부가 UI를 숨기고 본문 가독성 극대화
 *
 * UX 원칙
 * - ON/OFF 상태가 텍스트만 봐도 명확해야 함
 * - 토글 버튼은 스위치가 아니라 "모드 전환" 버튼
 * - 실수로 눌러도 바로 인지 가능
 *
 * Props
 * - value: boolean (집중 모드 여부)
 * - onChange: (next: boolean) => void
 */
export default function ReadingModeToggle({ value, onChange }) {
  const handleToggle = () => {
    onChange?.(!value);
  };

  return (
    <button
      type="button"
      className={`tabBtn ${value ? "tabBtnActive" : ""}`}
      onClick={handleToggle}
      aria-pressed={value}
      aria-label={value ? "집중 모드 끄기" : "집중 모드 켜기"}
      title={
        value
          ? "집중 모드 끄기 (목록 다시 표시)"
          : "집중 모드 켜기 (목록 숨김 + 본문 확장)"
      }
      style={{
        whiteSpace: "nowrap",
        fontWeight: value ? 900 : 500,
      }}
    >
      {value ? "🧘 집중 모드 ON" : "🧘 집중 모드"}
    </button>
  );
}

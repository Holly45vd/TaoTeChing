// src/components/read/SearchBox.jsx
import { useEffect, useState } from "react";

/**
 * SearchBox
 *
 * UX 원칙
 * - 입력 즉시 반응하지 않고 debounce 후 반영 (집중 방해 최소화)
 * - 현재 검색 상태가 명확히 보일 것
 * - 키보드/스크린리더 접근 가능
 *
 * Props
 * - value: 외부 query 값 (string)
 * - onChange: debounce 이후 query 전달 (fn)
 * - delay: debounce ms (default 250)
 * - placeholder: 입력 가이드 문구
 */
export default function SearchBox({
  value,
  onChange,
  placeholder = "검색 (제목 / 요약 / 태그 / 해설 / 원문 / 번역)",
  delay = 250,
}) {
  const [localValue, setLocalValue] = useState(value || "");

  // 외부 value 동기화
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  // debounce 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange?.(localValue.trim());
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, delay, onChange]);

  const handleClear = () => {
    setLocalValue("");
  };

  return (
    <div
      className="searchBox"
      style={{
        position: "relative",
        flex: 1,
        minWidth: 220,
      }}
    >
      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        aria-label="검색"
        style={{
          width: "100%",
          padding: "8px 36px 8px 10px",
          borderRadius: 6,
          border: "1px solid #ddd",
          fontSize: 14,
        }}
      />

      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="검색어 지우기"
          title="검색어 지우기"
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            opacity: 0.6,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

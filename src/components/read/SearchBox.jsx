import { useEffect, useState } from "react";

/**
 * SearchBox
 * - value: 외부 query 값
 * - onChange: 디바운스된 query를 부모에게 전달
 * - delay: debounce ms
 */
export default function SearchBox({
  value,
  onChange,
  placeholder = "검색 (제목/요약/태그/해설/원문/번역)",
  delay = 250,
}) {
  const [local, setLocal] = useState(value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      onChange?.(local);
    }, delay);
    return () => clearTimeout(t);
  }, [local, delay, onChange]);

  return (
    <div className="row" style={{ flex: 1, minWidth: 220 }}>
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%" }}
      />
      {local ? (
        <button
          type="button"
          className="tabBtn"
          onClick={() => setLocal("")}
          title="검색어 지우기"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

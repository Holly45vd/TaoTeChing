// src/components/read/LineTable.jsx

/**
 * LineTable
 * - 원문(han) / 번역(ko) 2열 테이블
 * - note는 번역 아래 보조 설명으로 표시
 *
 * UX 원칙
 * - 행 구분(줄눈)으로 스캔 쉽게
 * - 모바일에서 가로 스크롤 허용(깨짐 방지)
 * - 빈 값/누락 데이터에 안전
 * - 테이블 접근성(캡션/스코프)
 */
export default function LineTable({ lines = [], emptyText = "원문 데이터 없음" }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return <p className="small">{emptyText}</p>;
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 520,
          borderCollapse: "collapse",
        }}
        aria-label="도덕경 원문과 번역"
      >
        <caption className="small" style={{ textAlign: "left", paddingBottom: 8, opacity: 0.7 }}>
          원문과 번역을 나란히 읽을 수 있어.
        </caption>

        <thead>
          <tr>
            <th
              scope="col"
              style={{
                textAlign: "left",
                padding: "8px 8px",
                borderBottom: "1px solid #e6e6e6",
                width: "46%",
              }}
            >
              원문
            </th>
            <th
              scope="col"
              style={{
                textAlign: "left",
                padding: "8px 8px",
                borderBottom: "1px solid #e6e6e6",
                width: "54%",
              }}
            >
              번역
            </th>
          </tr>
        </thead>

        <tbody>
          {lines.map((line, idx) => {
            const key = line?.order ?? idx;
            const han = line?.han ?? "";
            const ko = line?.ko ?? "";
            const note = line?.note ?? "";

            return (
              <tr key={key} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td
                  style={{
                    padding: "10px 8px",
                    verticalAlign: "top",
                    fontFamily: "serif",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {han || <span className="small" style={{ opacity: 0.6 }}>—</span>}
                </td>

                <td
                  style={{
                    padding: "10px 8px",
                    verticalAlign: "top",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {ko || <span className="small" style={{ opacity: 0.6 }}>—</span>}

                  {note ? (
                    <div
                      className="small"
                      style={{
                        marginTop: 6,
                        paddingLeft: 8,
                        borderLeft: "3px solid #eee",
                        opacity: 0.9,
                      }}
                    >
                      <span style={{ opacity: 0.75 }}>※ </span>
                      {note}
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

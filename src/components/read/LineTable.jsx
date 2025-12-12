export default function LineTable({ lines = [] }) {
  if (!lines.length) return <p className="small">원문 데이터 없음</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", paddingBottom: 6 }}>원문</th>
          <th style={{ textAlign: "left", paddingBottom: 6 }}>번역</th>
        </tr>
      </thead>
      <tbody>
        {lines.map(line => (
          <tr key={line.order}>
            <td style={{ padding: "6px 8px", verticalAlign: "top", fontFamily: "serif" }}>
              {line.han}
            </td>
            <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
              {line.ko}
              {line.note && (
                <div className="small" style={{ marginTop: 4 }}>
                  ※ {line.note}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

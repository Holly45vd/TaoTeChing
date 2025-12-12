import { useMemo, useState } from "react";
import { emptyChapter, emptyLine, emptySection } from "../data/emptyChapter";
import TagInput from "../components/write/TagInput";
import LineEditor from "../components/write/LineEditor";
import SectionEditor from "../components/write/SectionEditor";
import { normalizeChapterForm } from "../utils/normalize";
import { saveChapter } from "../firebase/firestore";

/**
 * JSON -> form state로 변환 (UI 입력용 필드 포함)
 * - tags[] -> tagsText
 * - analysis.sections[].content[] -> contentText
 * - lines/order 채워주기
 */
function chapterDocToForm(doc) {
  const safe = doc && typeof doc === "object" ? doc : {};
  const chapter = safe.chapter ?? "";
  const title = safe.title ?? "";
  const subtitle = safe.subtitle ?? "";

  const tagsText = Array.isArray(safe.tags) ? safe.tags.join(", ") : "";

  const lines = Array.isArray(safe.lines)
    ? safe.lines.map((l, idx) => ({
        order: typeof l?.order === "number" ? l.order : idx,
        han: l?.han ?? "",
        ko: l?.ko ?? "",
        note: l?.note ?? "",
      }))
    : [emptyLine()];

  const sectionsRaw = safe?.analysis?.sections;
  const sections = Array.isArray(sectionsRaw) && sectionsRaw.length
    ? sectionsRaw.map((s) => ({
        type: s?.type ?? "",
        title: s?.title ?? "",
        contentText: Array.isArray(s?.content) ? s.content.join("\n") : "",
      }))
    : [emptySection()];

  const keySentence = safe?.analysis?.keySentence ?? "";

  return {
    chapter,
    title,
    subtitle,
    tagsText,
    lines: lines.length ? lines : [emptyLine()],
    analysis: {
      sections: sections.length ? sections : [emptySection()],
      keySentence,
    },
  };
}

export default function WritePage() {
  const [form, setForm] = useState(() => emptyChapter());
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ 추가: 입력 모드 (form | json)
  const [inputMode, setInputMode] = useState("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const { chapterNum, docData } = useMemo(() => {
    return normalizeChapterForm(form);
  }, [form]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLine = (idx, field, value) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value, order: idx };
      return { ...prev, lines };
    });
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...emptyLine(), order: prev.lines.length }],
    }));
  };

  const removeLine = (idx) => {
    setForm((prev) => {
      const lines = prev.lines
        .filter((_, i) => i !== idx)
        .map((l, i) => ({ ...l, order: i }));
      return { ...prev, lines: lines.length ? lines : [emptyLine()] };
    });
  };

  const updateSection = (idx, field, value) => {
    setForm((prev) => {
      const sections = [...prev.analysis.sections];
      sections[idx] = { ...sections[idx], [field]: value };
      return { ...prev, analysis: { ...prev.analysis, sections } };
    });
  };

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        sections: [...prev.analysis.sections, emptySection()],
      },
    }));
  };

  const removeSection = (idx) => {
    setForm((prev) => {
      const sections = prev.analysis.sections.filter((_, i) => i !== idx);
      return {
        ...prev,
        analysis: {
          ...prev.analysis,
          sections: sections.length ? sections : [emptySection()],
        },
      };
    });
  };

  const canSave =
    Number.isFinite(chapterNum) &&
    chapterNum > 0 &&
    (form.title || "").trim().length > 0 &&
    (docData.lines?.length || 0) > 0;

  const handleSave = async () => {
    setMessage("");
    if (!canSave) {
      setMessage("❗ 저장 조건 부족: 장 번호/제목/원문-번역 줄 1개 이상 필요");
      return;
    }

    try {
      setSaving(true);
      await saveChapter(chapterNum, docData);
      setMessage(`✅ ${chapterNum}장 저장 완료`);
    } catch (err) {
      console.error(err);
      setMessage("❌ 저장 실패: " + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  // ✅ JSON Import: docData 형태(JSON) 또는 form 형태 둘 다 허용
  const handleJsonImport = () => {
    setJsonError("");
    setMessage("");

    try {
      const parsed = JSON.parse(jsonText);

      // 1) docData 형태면 -> form 변환
      // 2) form 형태(예: tagsText/contentText 포함)면 그대로 사용
      const looksLikeForm =
        parsed &&
        typeof parsed === "object" &&
        ("tagsText" in parsed || (parsed.analysis && parsed.analysis.sections && parsed.analysis.sections[0]?.contentText));

      const nextForm = looksLikeForm ? parsed : chapterDocToForm(parsed);

      // 최소 필드 방어
      if (!nextForm || typeof nextForm !== "object") {
        throw new Error("JSON 구조가 올바르지 않습니다.");
      }

      setForm({
        ...emptyChapter(),
        ...nextForm,
        lines: Array.isArray(nextForm.lines) && nextForm.lines.length ? nextForm.lines : [emptyLine()],
        analysis: {
          sections:
            Array.isArray(nextForm.analysis?.sections) && nextForm.analysis.sections.length
              ? nextForm.analysis.sections
              : [emptySection()],
          keySentence: nextForm.analysis?.keySentence ?? "",
        },
      });

      setMessage("✅ JSON 불러오기 완료 (폼에 반영됨)");
      setInputMode("form");
    } catch (e) {
      setJsonError(e?.message || "JSON 파싱 실패");
    }
  };

  // ✅ JSON Export: 현재 docData를 JSON textarea에 넣고 복사하기 쉽게
  const handleJsonExport = async () => {
    const pretty = JSON.stringify(docData, null, 2);
    setJsonText(pretty);
    setInputMode("json");
    setJsonError("");
    setMessage("✅ 현재 데이터가 JSON 탭에 출력됨");

    try {
      await navigator.clipboard.writeText(pretty);
      setMessage("✅ 현재 데이터 JSON 복사 완료 (클립보드)");
    } catch {
      // 권한/브라우저 제한이면 그냥 textarea에만 출력
    }
  };

  const handleReset = () => {
    setForm(emptyChapter());
    setMessage("폼 초기화 완료");
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>쓰기</h2>
      <p className="small">폼 입력 + JSON Import/Export → Firestore 저장</p>

      {message && (
        <div className="card" style={{ marginBottom: 12 }}>
          {message}
        </div>
      )}

      {/* 입력 모드 토글 */}
      <div className="row" style={{ marginBottom: 12 }}>
        <button
          className={`tabBtn ${inputMode === "form" ? "tabBtnActive" : ""}`}
          type="button"
          onClick={() => setInputMode("form")}
        >
          폼 입력
        </button>
        <button
          className={`tabBtn ${inputMode === "json" ? "tabBtnActive" : ""}`}
          type="button"
          onClick={() => setInputMode("json")}
        >
          JSON 입력
        </button>

        <div style={{ flex: 1 }} />

        <button className="tabBtn" type="button" onClick={handleReset}>
          폼 초기화
        </button>
      </div>

      {/* JSON 입력 영역 */}
      {inputMode === "json" && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>JSON Import / Export</h3>

          <textarea
            rows={18}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="여기에 docData(JSON) 또는 form(JSON)을 붙여넣고 '불러오기'를 누르세요."
            style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
          />

          {jsonError && (
            <div style={{ marginTop: 8, color: "#b00020" }}>
              ❌ {jsonError}
            </div>
          )}

          <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
            <button className="tabBtn" type="button" onClick={handleJsonImport}>
              JSON 불러오기 → 폼 반영
            </button>

            <button className="tabBtn" type="button" onClick={handleJsonExport}>
              현재 데이터 → JSON 출력/복사
            </button>
          </div>

          <div className="small" style={{ marginTop: 8 }}>
            * JSON 불러오기는 폼 데이터를 덮어쓴다. (필요하면 저장 전에 Export로 백업해라)
          </div>
        </div>
      )}

      {/* 폼 입력 영역 */}
      {inputMode === "form" && (
        <>
          {/* 기본 정보 */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ gap: 12 }}>
              <input
                type="number"
                placeholder="장 번호"
                value={form.chapter}
                onChange={(e) => setField("chapter", e.target.value)}
              />
              <input
                placeholder="제목"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

            <input
              style={{ marginTop: 8, width: "100%" }}
              placeholder="부제 (선택)"
              value={form.subtitle}
              onChange={(e) => setField("subtitle", e.target.value)}
            />

            <TagInput value={form.tagsText} onChange={(v) => setField("tagsText", v)} />
          </div>

          {/* 원문 / 번역 */}
          <h3>원문 / 번역</h3>
          {form.lines.map((line, idx) => (
            <LineEditor
              key={idx}
              index={idx}
              line={line}
              onChange={(field, value) => updateLine(idx, field, value)}
              onRemove={() => removeLine(idx)}
            />
          ))}
          <button className="tabBtn" type="button" onClick={addLine}>
            + 줄 추가
          </button>

          {/* 해설 */}
          <h3 style={{ marginTop: 24 }}>해설 섹션</h3>
          {form.analysis.sections.map((sec, idx) => (
            <SectionEditor
              key={idx}
              index={idx}
              section={sec}
              onChange={(field, value) => updateSection(idx, field, value)}
              onRemove={() => removeSection(idx)}
            />
          ))}
          <button className="tabBtn" type="button" onClick={addSection}>
            + 해설 추가
          </button>

          {/* 요약 + 저장 */}
          <div className="card" style={{ marginTop: 16 }}>
            <input
              placeholder="한 줄 요약 (Key Sentence)"
              value={form.analysis.keySentence}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  analysis: { ...prev.analysis, keySentence: e.target.value },
                }))
              }
              style={{ width: "100%" }}
            />

            <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
              <button className="tabBtn" type="button" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? "미리보기 끄기" : "미리보기 켜기"}
              </button>

              <div className="row">
                <button className="tabBtn" type="button" onClick={handleJsonExport}>
                  JSON 내보내기
                </button>

                <button className="tabBtn" type="button" disabled={!canSave || saving} onClick={handleSave}>
                  {saving ? "저장 중..." : "Firestore 저장"}
                </button>
              </div>
            </div>

            <div className="small" style={{ marginTop: 8 }}>
              저장 조건: 장 번호(숫자) + 제목 + 원문/번역 줄 1개 이상
            </div>
          </div>
        </>
      )}

      {/* 미리보기 */}
      {showPreview && (
        <>
          <h3 style={{ marginTop: 24 }}>Firestore 저장 데이터 미리보기</h3>
          <pre className="card" style={{ fontSize: 12, overflowX: "auto" }}>
            {JSON.stringify(docData, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}

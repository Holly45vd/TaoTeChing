// 태그 문자열 -> string[]
export function normalizeTags(tagsText) {
  if (!tagsText) return [];
  return tagsText
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

// textarea 줄바꿈 -> string[]
export function normalizeMultiline(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// 라인 배열 정리: 비어있는 줄 제거 + order 재정렬 + trim
export function normalizeLines(lines) {
  const cleaned = (lines || [])
    .map((l) => ({
      order: typeof l.order === "number" ? l.order : 0,
      han: (l.han || "").trim(),
      ko: (l.ko || "").trim(),
      note: (l.note || "").trim(),
    }))
    .filter((l) => l.han.length > 0 || l.ko.length > 0);

  return cleaned.map((l, idx) => {
    const out = { order: idx, han: l.han, ko: l.ko };
    if (l.note) out.note = l.note;
    return out;
  });
}

// 해설 섹션 정리: contentText -> content[] 변환 + 빈 섹션 제거
export function normalizeSections(sections) {
  const cleaned = (sections || [])
    .map((s) => {
      const type = (s.type || "").trim();
      const title = (s.title || "").trim();
      const content = normalizeMultiline(s.contentText || "");
      return { type, title, content };
    })
    .filter((s) => s.type || s.title || (s.content && s.content.length > 0));

  return cleaned;
}

// 폼 상태 -> Firestore 저장용 docData 형태로 정규화
export function normalizeChapterForm(form) {
  const chapterNumRaw = form.chapter;
  const chapterNum = chapterNumRaw === "" ? NaN : Number(chapterNumRaw);

  const title = (form.title || "").trim();
  const subtitle = (form.subtitle || "").trim();
  const tags = normalizeTags(form.tagsText);

  const lines = normalizeLines(form.lines);
  const sections = normalizeSections(form.analysis?.sections || []);
  const keySentence = (form.analysis?.keySentence || "").trim();

  const docData = {
    chapter: chapterNum,
    title,
    lines,
    analysis: {
      sections,
      keySentence,
    },
  };

  if (subtitle) docData.subtitle = subtitle;
  if (tags.length) docData.tags = tags;

  return {
    chapterNum,
    docData,
  };
}

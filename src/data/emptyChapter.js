export const emptyLine = () => ({
  order: 0,
  han: "",
  ko: "",
  note: "",
});

export const emptySection = () => ({
  type: "",
  title: "",
  contentText: "", // textarea 입력용 (줄바꿈 -> content[]로 변환)
});

export const emptyChapter = () => ({
  chapter: "",
  title: "",
  subtitle: "",
  tagsText: "", // UI 입력용: "도, 무위, 언어" 같은 문자열
  lines: [emptyLine()],
  analysis: {
    sections: [emptySection()],
    keySentence: "",
  },
});

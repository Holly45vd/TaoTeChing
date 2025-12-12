import { useEffect, useMemo, useState } from "react";
import useChapters from "../hooks/useChapters";

import ReadToolbar from "../components/read/ReadToolbar";
import ChapterDetail from "../components/read/ChapterDetail";
import ChapterNavModal from "../components/read/ChapterNavModal";

const LAST_CHAPTER_KEY = "tao:lastChapter";

function normalizeText(v) {
  return String(v || "").toLowerCase().trim();
}

function chapterToSearchBlob(ch) {
  const title = ch?.title || "";
  const subtitle = ch?.subtitle || "";
  const keySentence = ch?.analysis?.keySentence || "";
  const tags = Array.isArray(ch?.tags) ? ch.tags.join(" ") : "";

  const lines = Array.isArray(ch?.lines)
    ? ch.lines.map((l) => `${l?.han || ""} ${l?.ko || ""}`).join(" ")
    : "";

  const sections = Array.isArray(ch?.analysis?.sections)
    ? ch.analysis.sections
        .map((s) => {
          const t = s?.title || "";
          const type = s?.type || "";
          const content = Array.isArray(s?.content) ? s.content.join(" ") : String(s?.content || "");
          return `${type} ${t} ${content}`;
        })
        .join(" ")
    : "";

  return normalizeText(`${title} ${subtitle} ${keySentence} ${tags} ${lines} ${sections}`);
}

export default function ReadPage() {
  const { chapters, loading, error } = useChapters();

  const [menuOpen, setMenuOpen] = useState(false);

  const [viewMode, setViewMode] = useState("range"); // range | tag
  const [query, setQuery] = useState("");

  const [range, setRange] = useState({ start: 1, end: 10 });
  const [selectedTags, setSelectedTags] = useState([]);

  const [selected, setSelected] = useState(null);

  const safeChapters = useMemo(() => {
    const arr = Array.isArray(chapters) ? chapters : [];
    return [...arr].sort((a, b) => Number(a.chapter) - Number(b.chapter));
  }, [chapters]);

  const searchable = useMemo(() => {
    return safeChapters.map((ch) => ({ ch, blob: chapterToSearchBlob(ch) }));
  }, [safeChapters]);

  const filteredChapters = useMemo(() => {
    let list = safeChapters;

    if (viewMode === "range") {
      list = list.filter((ch) => {
        const n = Number(ch.chapter);
        return n >= range.start && n <= range.end;
      });
    } else if (viewMode === "tag") {
      if (selectedTags.length > 0) {
        const set = new Set(selectedTags);
        list = list.filter((ch) => (ch.tags || []).some((t) => set.has(String(t))));
      }
    }

    const q = normalizeText(query);
    if (q) {
      const allowed = new Set(list.map((c) => c.chapter));
      list = searchable
        .filter(({ ch, blob }) => allowed.has(ch.chapter) && blob.includes(q))
        .map(({ ch }) => ch);
    }

    return list;
  }, [safeChapters, viewMode, range, selectedTags, query, searchable]);

  // 마지막 읽던 장 복원 / 필터 변경 시 선택 보정
  useEffect(() => {
    if (filteredChapters.length === 0) {
      setSelected(null);
      return;
    }

    const last = Number(localStorage.getItem(LAST_CHAPTER_KEY));
    if (last) {
      const found = filteredChapters.find((c) => Number(c.chapter) === last);
      if (found) {
        setSelected(found);
        return;
      }
    }

    setSelected(filteredChapters[0]);
  }, [filteredChapters]);

  // 선택 변경 시 저장
  useEffect(() => {
    if (selected?.chapter) {
      localStorage.setItem(LAST_CHAPTER_KEY, String(selected.chapter));
    }
  }, [selected]);

  const currentIndex = useMemo(() => {
    if (!selected) return -1;
    return filteredChapters.findIndex(
      (c) => Number(c.chapter) === Number(selected.chapter)
    );
  }, [filteredChapters, selected]);

  const prevChapter = currentIndex > 0 ? filteredChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < filteredChapters.length - 1
      ? filteredChapters[currentIndex + 1]
      : null;

  if (loading) return <p>불러오는 중...</p>;

  if (error) {
    return (
      <div>
        <h3 style={{ marginTop: 0 }}>읽기 로딩 실패</h3>
        <p className="small">Firestore 권한/네트워크/규칙 문제일 수 있어.</p>
      </div>
    );
  }

  return (
    <div>
      <ReadToolbar
        viewMode={viewMode}
        onViewMode={setViewMode}
        query={query}
        onQuery={setQuery}
        onOpenMenu={() => setMenuOpen(true)}
      />

      {/* ✅ 메뉴 모달 */}
      <ChapterNavModal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        viewMode={viewMode}
        onViewMode={setViewMode}
        chapters={safeChapters}
        filteredChapters={filteredChapters}
        selected={selected}
        onSelect={setSelected}
        range={range}
        onRange={setRange}
        selectedTags={selectedTags}
        onSelectedTags={setSelectedTags}
        query={query}
      />

      {/* ✅ 본문 풀폭 */}
      {safeChapters.length === 0 ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>데이터 없음</h3>
          <p className="small">쓰기 탭에서 장을 저장하면 여기에 표시돼.</p>
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>결과 없음</h3>
          <p className="small">범위/태그/검색 조건을 완화해봐.</p>
        </div>
      ) : selected ? (
        <>
          <ChapterDetail
            chapter={selected}
            onTagClick={(tag) => {
              setViewMode("tag");
              setSelectedTags([tag]);
              setQuery("");
              setMenuOpen(true); // 태그 눌렀을 때 메뉴도 같이 열어주면 UX 좋음
            }}
          />

          <div className="row" style={{ justifyContent: "space-between", marginTop: 16 }}>
            <button
              className="tabBtn"
              disabled={!prevChapter}
              onClick={() => prevChapter && setSelected(prevChapter)}
            >
              ← 이전
            </button>

            <div className="small">
              {currentIndex + 1} / {filteredChapters.length}
            </div>

            <button
              className="tabBtn"
              disabled={!nextChapter}
              onClick={() => nextChapter && setSelected(nextChapter)}
            >
              다음 →
            </button>
          </div>
        </>
      ) : (
        <div className="card">
          <p className="small">메뉴에서 장을 선택해줘.</p>
        </div>
      )}
    </div>
  );
}

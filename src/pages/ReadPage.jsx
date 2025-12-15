import { useEffect, useMemo, useState } from "react";
import useChapters from "../hooks/useChapters";

import ReadToolbar from "../components/read/ReadToolbar";
import ChapterDetail from "../components/read/ChapterDetail";
import ChapterNavModal from "../components/read/ChapterNavModal";

// ✅ 저장함 페이지 추가
import SavedPage from "./SavedPage";

// ✅ 익명 로그인 보장 유틸 (우리가 만든 파일)
import { ensureAnonymousAuth } from "../firebase/auth";

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
          const content = Array.isArray(s?.content)
            ? s.content.join(" ")
            : String(s?.content || "");
          return `${type} ${t} ${content}`;
        })
        .join(" ")
    : "";

  return normalizeText(
    `${title} ${subtitle} ${keySentence} ${tags} ${lines} ${sections}`
  );
}

export default function ReadPage() {
  const { chapters, loading, error } = useChapters();

  const [menuOpen, setMenuOpen] = useState(false);

  const [viewMode, setViewMode] = useState("range"); // range | tag
  const [query, setQuery] = useState("");

  const [range, setRange] = useState({ start: 1, end: 10 });
  const [selectedTags, setSelectedTags] = useState([]);

  const [selected, setSelected] = useState(null);

  // ✅ 저장함 패널 토글
  const [savedOpen, setSavedOpen] = useState(false);

  // ✅ 익명 로그인 uid
  const [uid, setUid] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // ✅ 앱 시작 시 익명 로그인 보장
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setAuthLoading(true);
        setAuthError("");
        const user = await ensureAnonymousAuth();
        if (mounted) setUid(user?.uid || "");
      } catch (e) {
        console.error("Anonymous auth failed:", e);
        if (mounted) setAuthError(String(e?.message || e));
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
        list = list.filter((ch) =>
          (ch.tags || []).some((t) => set.has(String(t)))
        );
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

  const prevChapter =
    currentIndex > 0 ? filteredChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < filteredChapters.length - 1
      ? filteredChapters[currentIndex + 1]
      : null;

  // ✅ 저장함에서 특정 장 열기
  const openChapterByNumber = (chapterNumber) => {
    const target = safeChapters.find(
      (c) => Number(c.chapter) === Number(chapterNumber)
    );
    if (!target) return;

    setViewMode("range");
    setSelectedTags([]);
    setQuery("");

    // range는 target 포함하는 10단위 자동 맞춤
    const n = Number(target.chapter);
    const start = Math.max(1, Math.floor((n - 1) / 10) * 10 + 1);
    const end = Math.min(81, start + 9);
    setRange({ start, end });

    setSelected(target);
    setSavedOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      {/* ✅ 상단: 저장함 토글 버튼 */}
      <div
        className="row"
        style={{ justifyContent: "flex-end", marginBottom: 10 }}
      >
        <button
          className={`tabBtn ${savedOpen ? "tabBtnActive" : ""}`}
          type="button"
          onClick={() => setSavedOpen((v) => !v)}
          disabled={authLoading} // uid 준비되기 전엔 막기
          title={authLoading ? "익명 로그인 중..." : ""}
        >
          {savedOpen ? "저장함 닫기" : "저장함 보기"}
        </button>
      </div>

      {/* ✅ 익명 로그인 상태 표시(최소) */}
      {authError && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>로그인 실패(익명)</h3>
          <p className="small">
            Firebase Console에서 <b>Authentication → Anonymous</b> 활성화했는지
            확인해.
          </p>
          <p className="small" style={{ opacity: 0.8 }}>
            {authError}
          </p>
        </div>
      )}

      {/* ✅ 저장함 패널 */}
      {savedOpen && (
        <div style={{ marginBottom: 16 }}>
          {authLoading ? (
            <div className="card">
              <p className="small">익명 로그인 중…</p>
            </div>
          ) : uid ? (
            <SavedPage uid={uid} onOpenChapter={openChapterByNumber} />
          ) : (
            <div className="card">
              <p className="small">UID가 없어 저장함을 열 수 없어.</p>
            </div>
          )}
        </div>
      )}

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
          <p className="small">Firestore에 장 데이터가 없거나 권한 문제야.</p>
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
              setMenuOpen(true);
            }}
          />

          <div
            className="row"
            style={{ justifyContent: "space-between", marginTop: 16 }}
          >
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

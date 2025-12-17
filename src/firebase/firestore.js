import {
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

/* =========================
   기존: 도덕경 원본 데이터
========================= */

export const CHAPTER_COLLECTION = "daodejing_chapters";

/**
 * 장 원본 저장 (관리용)
 * - createdAt 최초 1회
 * - updatedAt 매번 갱신
 */
export async function saveChapter(chapterNumber, data) {
  if (!chapterNumber) throw new Error("chapterNumber is required");

  const ref = doc(db, CHAPTER_COLLECTION, String(chapterNumber));

  // merge: true라 createdAt은 기존 있으면 유지됨 (Firestore는 setDoc merge 시 필드 유지)
  return setDoc(
    ref,
    {
      chapter: Number(chapterNumber),
      ...data,
      updatedAt: serverTimestamp(),
      // createdAt은 "없을 때만 넣기"가 ideal이지만, 보통은 최초 업로드 시 이미 들어감.
      // 필요하면 writePage에서 최초 생성만 넣도록 해도 됨.
      createdAt: data?.createdAt ?? serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * 전체 장 목록 조회
 * - chapter 오름차순 정렬
 * - id 포함 반환 (유지보수/디버깅 편함)
 */
export async function fetchChapters() {
  const ref = collection(db, CHAPTER_COLLECTION);
  const q = query(ref, orderBy("chapter", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * 단일 장 조회 (선택)
 * - 필요한 화면만 불러올 때 유용
 */
export async function fetchChapter(chapterNumber) {
  if (!chapterNumber) return null;
  const ref = doc(db, CHAPTER_COLLECTION, String(chapterNumber));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* =========================
   🔖 개인 저장 기능 (읽기용)
========================= */

/**
 * 📌 장 저장 토글 (ON/OFF)
 * users/{uid}/bookmarks/{chapter}
 */
export async function toggleChapterBookmark(uid, chapterNumber, isSaved) {
  if (!uid || !chapterNumber) throw new Error("uid and chapterNumber are required");

  const ref = doc(db, "users", uid, "bookmarks", String(chapterNumber));

  if (!isSaved) return deleteDoc(ref);

  return setDoc(
    ref,
    {
      chapter: Number(chapterNumber),
      isSaved: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * 장 저장 여부 조회
 */
export async function getChapterBookmark(uid, chapterNumber) {
  if (!uid || !chapterNumber) return null;

  const ref = doc(db, "users", uid, "bookmarks", String(chapterNumber));
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/* =========================
   ✂️ 클립 저장 (원문/해설/동화)
========================= */

/**
 * 클립 추가
 */
export async function addClip(uid, clipData) {
  if (!uid) throw new Error("uid is required");
  const ref = collection(db, "users", uid, "clips");

  return addDoc(ref, {
    ...clipData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * 클립 목록 조회
 * - 최신순
 */
export async function fetchClips(uid, max = 300) {
  if (!uid) return [];

  const ref = collection(db, "users", uid, "clips");
  const q = query(ref, orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/* =========================
   📖 장별 동화(Story) (읽기용)
   daodejing_stories/{chapter}
========================= */

export const STORY_COLLECTION = "daodejing_stories";

/**
 * 장별 동화 조회
 * doc id: "1" ~ "81"
 */
export async function fetchChapterStory(chapterNumber) {
  if (!chapterNumber) return null;

  const ref = doc(db, STORY_COLLECTION, String(chapterNumber));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * (옵션) 장별 동화 저장/수정 - 나중에 어드민 붙일 때 사용
 */
export async function saveChapterStory(chapterNumber, data) {
  if (!chapterNumber) throw new Error("chapterNumber is required");

  return setDoc(
    doc(db, STORY_COLLECTION, String(chapterNumber)),
    {
      chapter: Number(chapterNumber),
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: data?.createdAt ?? serverTimestamp(),
    },
    { merge: true }
  );
}

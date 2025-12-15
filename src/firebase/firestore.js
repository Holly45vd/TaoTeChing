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
} from "firebase/firestore";
import { db } from "./firebase";

/* =========================
   기존: 도덕경 원본 데이터
========================= */

export const CHAPTER_COLLECTION = "daodejing_chapters";

/**
 * 장 원본 저장 (관리용)
 */
export async function saveChapter(chapterNumber, data) {
  if (!chapterNumber) {
    throw new Error("chapterNumber is required");
  }
  return setDoc(
    doc(db, CHAPTER_COLLECTION, String(chapterNumber)),
    data,
    { merge: true }
  );
}

/**
 * 전체 장 목록 조회
 */
export async function fetchChapters() {
  const snap = await getDocs(collection(db, CHAPTER_COLLECTION));
  return snap.docs.map((d) => d.data());
}

/* =========================
   🔖 개인 저장 기능 (읽기용)
========================= */

/**
 * 📌 장 저장 토글 (ON/OFF)
 * users/{uid}/bookmarks/{chapter}
 */
export async function toggleChapterBookmark(uid, chapterNumber, isSaved) {
  if (!uid || !chapterNumber) {
    throw new Error("uid and chapterNumber are required");
  }

  const ref = doc(
    db,
    "users",
    uid,
    "bookmarks",
    String(chapterNumber)
  );

  if (!isSaved) {
    return deleteDoc(ref);
  }

  return setDoc(
    ref,
    {
      chapter: chapterNumber,
      isSaved: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * 장 저장 여부 조회
 */
export async function getChapterBookmark(uid, chapterNumber) {
  if (!uid || !chapterNumber) return null;

  const ref = doc(
    db,
    "users",
    uid,
    "bookmarks",
    String(chapterNumber)
  );
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/* =========================
   ✂️ 클립 저장 (원문/해설)
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
 */
export async function fetchClips(uid) {
  if (!uid) return [];

  const ref = collection(db, "users", uid, "clips");
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

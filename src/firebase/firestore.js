import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./firebase";

export const COLLECTION_NAME = "daodejing_chapters";

/**
 * 장 저장 (chapter 번호를 document id로 사용)
 */
export async function saveChapter(chapterNumber, data) {
  if (!chapterNumber) {
    throw new Error("chapterNumber is required");
  }
  return setDoc(
    doc(db, COLLECTION_NAME, String(chapterNumber)),
    data,
    { merge: true }
  );
}

/**
 * 전체 장 목록 조회
 */
export async function fetchChapters() {
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  return snap.docs.map(d => d.data());
}

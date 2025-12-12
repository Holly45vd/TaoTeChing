import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function useChapters() {
  const [chapters, setChapters] = useState([]); // 항상 배열
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);     // 에러 표시용

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const snap = await getDocs(collection(db, "daodejing_chapters"));
        const list = snap.docs
          .map((d) => d.data())
          .filter((x) => x && typeof x.chapter === "number"); // chapter 없는 문서 제거

        list.sort((a, b) => a.chapter - b.chapter);
        setChapters(list);
      } catch (e) {
        console.error(e);
        setError(e);
        setChapters([]); // 실패해도 배열 유지
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { chapters, loading, error };
}

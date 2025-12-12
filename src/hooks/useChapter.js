import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function useChapters() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "daodejing_chapters"));
        const list = snap.docs.map(doc => doc.data());
        list.sort((a, b) => (a.chapter ?? 0) - (b.chapter ?? 0));
        setChapters(list);
      } catch (err) {
        console.error("Failed to load chapters", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return { chapters, loading };
}

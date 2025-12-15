import { getAuth, signInAnonymously } from "firebase/auth";

export async function ensureAnonymousAuth() {
  const auth = getAuth();
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

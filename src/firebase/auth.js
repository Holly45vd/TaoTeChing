// src/firebase/auth.js
import { getAuth } from "firebase/auth";
import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
} from "firebase/auth";

/**
 * 1) 앱 기본: 사용자 없으면 익명 로그인으로 uid 확보
 */
export async function ensureAnonymousAuth() {
  const auth = getAuth();
  if (auth.currentUser) return auth.currentUser;

  const cred = await signInAnonymously(auth);
  return cred.user;
}

/**
 * 2) 이메일 회원가입
 * - 익명 상태에서 호출하면 "익명 계정 승격(link)"을 우선 시도 (데이터 유지)
 * - 익명이 아니면 일반 회원가입
 */
export async function signUpEmail(email, password) {
  const auth = getAuth();
  const user = auth.currentUser;

  // 익명 로그인 상태면: 계정을 "승격"시키는 게 최우선 (uid 유지)
  if (user?.isAnonymous) {
    return linkAnonymousToEmail(email, password);
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * 3) 이메일 로그인
 * - 기존 유저로 로그인 (uid는 해당 계정 uid로 바뀜)
 */
export async function signInEmail(email, password) {
  const auth = getAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * 4) 익명 → 이메일 계정으로 연결(link)
 * - 핵심: uid 유지됨 (즉, 기존 users/{uid}/... 데이터 그대로)
 */
export async function linkAnonymousToEmail(email, password) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    // 유저가 아예 없으면 익명부터 만든 다음 link
    await ensureAnonymousAuth();
  }

  const freshUser = getAuth().currentUser;
  if (!freshUser) throw new Error("Auth user not found.");

  if (!freshUser.isAnonymous) {
    // 이미 익명이 아니면 link가 아니라 그냥 로그인/회원가입 흐름으로 가야 함
    throw new Error("Current user is not anonymous. Use signInEmail or signUpEmail.");
  }

  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(freshUser, credential);
  return result.user;
}

/**
 * 5) 로그아웃
 */
export async function signOutUser() {
  const auth = getAuth();
  await signOut(auth);
}

/**
 * 6) Auth 상태 구독 (uid/user를 전역에서 잡고 싶을 때)
 * - App.jsx나 ReadPage에서 이걸로 uid를 세팅하면 깔끔해짐
 */
export function subscribeAuth(callback) {
  const auth = getAuth();
  return onAuthStateChanged(auth, callback);
}

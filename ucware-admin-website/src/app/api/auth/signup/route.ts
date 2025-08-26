/**
 * route.ts (signup)
 * 회원가입 API 엔드포인트 (Next.js App Router).
 *
 * 설계 포인트
 * ===========
 * 1) admin-users.json에 새로운 사용자(email, hash된 password) 저장.
 * 2) bcrypt.hash로 비밀번호를 안전하게 저장.
 * 3) 중복 이메일 방지 및 필수 입력값 검증.
 *
 * HTTP
 * ----
 * - POST /api/auth/signup
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// ───────────────────────────── 사용자 파일 경로 ─────────────────────────────
const USERS_FILE = path.join(process.cwd(), 'src/data/admin-users.json');

// ───────────────────────────── 엔드포인트 ─────────────────────────────
/**
 * POST /api/auth/signup
 *
 * Request Body:
 *   email (string): 사용자 이메일
 *   password (string): 평문 비밀번호
 *
 * Returns:
 *   200 { success: true }               → 회원가입 성공
 *   400 { error: string }               → 필수 정보 누락
 *   409 { error: string }               → 이미 존재하는 이메일
 */
export async function POST(req: Request) {
  const { email, password } = await req.json();

  // 필수 값 확인
  if (!email || !password) {
    return NextResponse.json({ error: '필수 정보가 없습니다.' }, { status: 400 });
  }

  // 기존 사용자 목록 로드 (없으면 빈 배열)
  const users = fs.existsSync(USERS_FILE)
    ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    : [];

  // 중복 이메일 확인
  if (users.find((u: any) => u.email === email)) {
    return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 409 });
  }

  // 비밀번호 해싱 후 저장
  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  users.push({ email, password: hashedPassword });

  // JSON 파일에 저장 (pretty-print 2 space)
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  // 성공 응답
  return NextResponse.json({ success: true });
}

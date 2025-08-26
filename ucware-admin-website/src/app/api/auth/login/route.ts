
/**
 * route.ts (login)
 * 로그인 API 엔드포인트 (Next.js App Router).
 *
 * 설계 포인트
 * ===========
 * 1) admin-users.json 파일에 저장된 사용자 정보를 기반으로 로그인 검증.
 * 2) bcrypt.compare를 사용해 해시된 비밀번호와 입력값 비교.
 * 3) 성공 시 { success: true } 반환 (JWT/세션은 추후 확장 예정).
 *
 * HTTP
 * ----
 * - POST /api/auth/login
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// 디버그용: 라우트 모듈 자체가 import될 때 실행 여부 확인
console.error("🚨 route.ts 자체가 실행됨?");

// ───────────────────────────── 사용자 파일 경로 ─────────────────────────────
const USERS_FILE = path.join(process.cwd(), 'src/data/admin-users.json');

// ───────────────────────────── 엔드포인트 ─────────────────────────────
/**
 * POST /api/auth/login
 *
 * Request Body:
 *   email (string)    : 사용자 이메일
 *   password (string) : 평문 비밀번호
 *
 * Returns:
 *   200 { success: true }                  로그인 성공
 *   401 { error: string }                  이메일/비밀번호 불일치
 */
export async function POST(req: Request) {
  console.log("✅ [POST] /api/auth/login 진입함");

  // 요청 Body 파싱
  const { email, password } = await req.json();
  console.log("📥 로그인 요청:", { email, password });

  // 사용자 목록 로드 (없으면 빈 배열)
  const users = fs.existsSync(USERS_FILE)
    ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    : [];
  console.log("📂 현재 사용자 목록:", users);

  // 이메일 기반 사용자 탐색
  const user = users.find((u: any) => u.email === email);
  if (!user) {
    console.log("❌ 이메일 일치하는 사용자 없음");
    return NextResponse.json(
      { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  }

  console.log("✅ 이메일 일치 사용자:", user);
  console.log("입력된 비밀번호:", password);   // 디버깅용, 운영 시 제거 권장
  console.log("저장된 해시:", user.password); // 디버깅용, 운영 시 제거 권장

  // 비밀번호 비교 (입력값은 trim으로 공백 제거)
  const match = await bcrypt.compare(password.trim(), user.password);
  console.log("🔐 비밀번호 비교 결과:", match);

  if (!match) {
    console.log("❌ 비밀번호 불일치");
    return NextResponse.json(
      { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  }

  // 로그인 성공
  console.log("🎉 로그인 성공");
  return NextResponse.json({ success: true });
}

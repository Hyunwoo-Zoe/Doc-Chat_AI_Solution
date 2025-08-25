
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
console.error("🚨 route.ts 자체가 실행됨?");
const USERS_FILE = path.join(process.cwd(), 'src/data/admin-users.json');


export async function POST(req: Request) {
  console.log("✅ [POST] /api/auth/login 진입함");

  const { email, password } = await req.json();
  console.log("📥 로그인 요청:", { email, password });

  // JSON 파일이 존재하면 로드, 없으면 빈 배열
  const users = fs.existsSync(USERS_FILE)
    ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    : [];

  console.log("📂 현재 사용자 목록:", users);

  const user = users.find((u: any) => u.email === email);
  if (!user) {
    console.log("❌ 이메일 일치하는 사용자 없음");
    return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  console.log("✅ 이메일 일치 사용자:", user);
  console.log("입력된 비밀번호:", password);
  console.log("저장된 해시:", user.password);

  const match = await bcrypt.compare(password.trim(), user.password); 
  console.log("🔐 비밀번호 비교 결과:", match);

  if (!match) {
    console.log("❌ 비밀번호 불일치");
    return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  console.log("🎉 로그인 성공");
  return NextResponse.json({ success: true });
}

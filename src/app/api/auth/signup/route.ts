
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'src/data/admin-users.json');

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: '필수 정보가 없습니다.' }, { status: 400 });
  }

  const users = fs.existsSync(USERS_FILE)
    ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    : [];

  if (users.find((u: any) => u.email === email)) {
    return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  users.push({ email, password: hashedPassword });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  return NextResponse.json({ success: true });
}

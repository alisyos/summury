import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROMPTS_FILE = path.join(process.cwd(), 'prompts.json');

// 프롬프트 파일 읽기
function readPrompts() {
  try {
    const data = fs.readFileSync(PROMPTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('프롬프트 파일 읽기 오류:', error);
    return {};
  }
}

// 프롬프트 파일 쓰기
function writePrompts(prompts: Record<string, any>) {
  try {
    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('프롬프트 파일 쓰기 오류:', error);
    return false;
  }
}

// GET: 모든 프롬프트 조회
export async function GET() {
  try {
    const prompts = readPrompts();
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('프롬프트 조회 오류:', error);
    return NextResponse.json(
      { error: '프롬프트를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 프롬프트 업데이트
export async function POST(request: NextRequest) {
  try {
    const { type, name, description, content } = await request.json();

    if (!type || !name || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const prompts = readPrompts();
    prompts[type] = {
      name,
      description: description || '',
      content
    };

    const success = writePrompts(prompts);
    if (!success) {
      return NextResponse.json(
        { error: '프롬프트 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '프롬프트가 성공적으로 저장되었습니다.' });
  } catch (error) {
    console.error('프롬프트 저장 오류:', error);
    return NextResponse.json(
      { error: '프롬프트 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
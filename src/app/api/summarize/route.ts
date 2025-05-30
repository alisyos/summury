import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

// 프롬프트 파일에서 프롬프트 읽기
function getPrompt(type: string): string {
  try {
    const promptsFile = path.join(process.cwd(), 'prompts.json');
    const data = fs.readFileSync(promptsFile, 'utf8');
    const prompts = JSON.parse(data);
    return prompts[type]?.content || '';
  } catch (error) {
    console.error('프롬프트 읽기 오류:', error);
    // 기본 프롬프트 반환
    return `당신은 고급 문서 요약 전문가입니다. 사용자가 제공한 문서를 바탕으로 다음 기준에 따라 최종 요약을 작성하세요:

1. 아래에 주어진 '사용자 선택 요약안'을 참고하여 요약의 방향성과 주요 키워드를 유지하세요.
2. 문서 전체 내용을 바탕으로 본문의 핵심 정보와 주요 흐름을 정확하고 간결하게 정리하세요.
3. 중요한 수치, 근거, 주장 등은 가능한 한 포함하여 요약의 정보 밀도를 높이세요.
4. 문맥을 고려하여 자연스럽고 읽기 쉬운 형태로 서술하세요.
5. 문서 유형(논문, 보고서, 회의록 등)에 따라 적절한 요약 어조를 유지하세요.

입력 문서와 사용자 요약안은 아래에 포함되어 있습니다:

사용자 요약안:
"""
{{SELECTED_SUMMARY}}
"""

전체 문서:
"""
{{ORIGINAL_TEXT}}
"""

위의 지침에 따라 완성도 높은 최종 요약을 작성해주세요. 요약은 한국어로 작성하며, 명확하고 체계적으로 구성해주세요.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { selectedSummary, originalText } = await request.json();

    if (!selectedSummary || !originalText) {
      return NextResponse.json(
        { error: '요약안과 원본 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    const prompt = getPrompt('summarize')
      .replace('{{SELECTED_SUMMARY}}', selectedSummary)
      .replace('{{ORIGINAL_TEXT}}', originalText);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 3000,
    });

    const summary = completion.choices[0].message.content;

    if (!summary) {
      throw new Error('요약 생성에 실패했습니다.');
    }

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('요약 생성 오류:', error);
    return NextResponse.json(
      { error: '요약 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
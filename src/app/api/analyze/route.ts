import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();
  
  // MIME 타입과 파일 확장자를 모두 고려하여 파일 형식 판단
  const isPDF = file.type === 'application/pdf' || fileExtension === 'pdf';
  const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx';
  const isDOC = file.type === 'application/msword' || fileExtension === 'doc';
  const isTXT = file.type === 'text/plain' || fileExtension === 'txt';
  
  if (isPDF) {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (isDOCX || isDOC) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (isTXT) {
    return buffer.toString('utf-8');
  } else {
    throw new Error(`지원되지 않는 파일 형식입니다. 파일: ${file.name}, 타입: ${file.type}, 확장자: ${fileExtension}`);
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const textInput = formData.get('text') as string;

    let documentText = '';
    
    if (file) {
      documentText = await extractTextFromFile(file);
    } else if (textInput) {
      documentText = textInput;
    } else {
      return NextResponse.json(
        { error: '파일 또는 텍스트를 제공해주세요.' },
        { status: 400 }
      );
    }

    if (!documentText.trim()) {
      return NextResponse.json(
        { error: '문서에서 텍스트를 추출할 수 없습니다.' },
        { status: 400 }
      );
    }

    const prompt = `당신은 전문 문서 분석 및 요약 전문가입니다. 사용자가 제공한 문서를 읽고, 아래의 작업을 수행하세요:

1. 해당 문서가 어떤 종류의 문서인지 판단하세요. 예: 업무 보고서, 논문, 회의록, 설명서, 기획안 등
2. 문서의 주요 목적과 핵심 내용을 파악하세요.
3. 서로 다른 관점이나 스타일로 3가지 요약 방법/방향성을 제안하세요:
   - 요약안 1: 핵심 주제와 목적을 중심으로 한 간결한 요약 방법 (어떤 부분에 집중할지, 어떤 형태로 요약할지 설명)
   - 요약안 2: 전체 흐름과 주요 논점을 포함하는 설명 중심 요약 방법 (구조적 접근법과 포함할 요소들 설명)
   - 요약안 3: 독자의 이해를 돕기 위한 요점 나열식 요약 방법 (bullet point나 구조화된 형식의 접근법 설명)

각 요약안은 "어떻게 요약할 것인가"에 대한 방법론이어야 하며, 실제 요약 내용이 아닌 요약 접근 방식을 제시해야 합니다.

예시:
- "문서의 핵심 결론과 주요 근거 3가지를 중심으로 간결하게 요약"
- "문서의 배경, 현황 분석, 제안사항 순서로 구조화하여 상세히 요약"
- "주요 포인트를 5개 항목으로 나누어 bullet point 형식으로 요약"

응답은 다음 JSON 형식으로 제공해주세요:
{
  "documentType": "문서 유형",
  "summaryOptions": ["요약 방법 1", "요약 방법 2", "요약 방법 3"]
}

문서:
"""
${documentText}
"""`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    // JSON 응답 파싱
    let parsedResponse;
    try {
      // JSON 블록에서 실제 JSON 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON 형식을 찾을 수 없습니다.');
      }
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 응답 생성
      console.error('JSON 파싱 오류:', parseError);
      parsedResponse = {
        documentType: "일반 문서",
        summaryOptions: [
          "문서의 핵심 내용과 주요 결론을 중심으로 간결하게 요약하는 방법",
          "문서의 전체적인 구조와 흐름을 따라 단계별로 상세히 요약하는 방법",
          "문서의 주요 포인트들을 항목별로 나누어 구조화하여 요약하는 방법"
        ]
      };
    }

    return NextResponse.json({
      ...parsedResponse,
      extractedText: documentText
    });

  } catch (error) {
    console.error('분석 오류:', error);
    return NextResponse.json(
      { error: '문서 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
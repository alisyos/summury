import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

// 마크다운을 파싱하여 Word 문서 요소로 변환
function parseMarkdownToDocx(text: string): Paragraph[] {
  const lines = text.split('\n');
  const paragraphs: Paragraph[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      // 빈 줄은 공백 문단으로 처리
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
      continue;
    }
    
    // h2 헤더 (## 으로 시작) - 중앙정렬, 짙은 파란색, 큰 폰트
    if (line.startsWith('## ')) {
      const title = line.substring(3);
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 200 },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32,
            color: '1E40AF', // 짙은 파란색
          }),
        ],
      }));
    }
    // h3 헤더 (### 으로 시작) - 좌측정렬, 파란색, 중간 폰트
    else if (line.startsWith('### ')) {
      const title = line.substring(4);
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        alignment: AlignmentType.LEFT,
        spacing: { before: 600, after: 200 },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 28,
            color: '2563EB', // 파란색
          }),
        ],
      }));
    }
    // 목록 (- 또는 * 으로 시작)
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      paragraphs.push(new Paragraph({
        indent: { left: 720 }, // 들여쓰기
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `• ${content}`,
            size: 24,
            color: '000000', // 검은색
          }),
        ],
      }));
    }
    // 번호 목록 (1. 2. 등으로 시작)
    else if (/^\d+\.\s/.test(line)) {
      paragraphs.push(new Paragraph({
        indent: { left: 720 },
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: line,
            size: 24,
            color: '000000',
          }),
        ],
      }));
    }
    // 일반 문단
    else {
      // **굵은 글씨** 처리
      const parts = line.split(/(\*\*.*?\*\*)/);
      const textRuns: TextRun[] = [];
      
      parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // 굵은 글씨
          textRuns.push(new TextRun({
            text: part.substring(2, part.length - 2),
            bold: true,
            size: 24,
          }));
        } else if (part) {
          // 일반 텍스트
          textRuns.push(new TextRun({
            text: part,
            size: 24,
          }));
        }
      });
      
      if (textRuns.length > 0) {
        paragraphs.push(new Paragraph({
          spacing: { after: 100 },
          children: textRuns,
        }));
      }
    }
  }
  
  return paragraphs;
}

// Word 문서 생성 함수
async function generateDocx(summary: string, documentType: string): Promise<Buffer> {
  const contentParagraphs = parseMarkdownToDocx(summary);
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // 문서 제목
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: '문서 요약 보고서',
                bold: true,
                size: 36,
                color: '1E40AF',
              }),
            ],
          }),
          
          // 문서 정보
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `문서 유형: ${documentType}`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `생성 날짜: ${new Date().toLocaleDateString('ko-KR')}`,
                size: 24,
              }),
            ],
          }),
          
          // 구분선
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: '─────────────────────────────────',
                size: 24,
                color: '6B7280',
              }),
            ],
          }),
          
          // 마크다운으로 파싱된 내용
          ...contentParagraphs,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

export async function POST(request: NextRequest) {
  try {
    const { summary, format, documentType } = await request.json();

    if (!summary || !format) {
      return NextResponse.json(
        { error: '요약 내용과 형식이 필요합니다.' },
        { status: 400 }
      );
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'pdf') {
      return NextResponse.json(
        { error: '지원되지 않는 형식입니다.' },
        { status: 400 }
      );
    } else if (format === 'docx') {
      buffer = await generateDocx(summary, documentType || '일반 문서');
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = 'summary.docx';
    } else {
      return NextResponse.json(
        { error: '지원되지 않는 형식입니다.' },
        { status: 400 }
      );
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('다운로드 생성 오류:', error);
    return NextResponse.json(
      { error: '파일 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
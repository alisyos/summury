import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Word 문서 생성 함수
async function generateDocx(summary: string, documentType: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: '문서 요약 보고서',
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `문서 유형: ${documentType}`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `생성 날짜: ${new Date().toLocaleDateString('ko-KR')}`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '요약 내용',
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: summary,
                size: 24,
              }),
            ],
          }),
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
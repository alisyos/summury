# AI 문서 요약 서비스

OpenAI GPT-4를 활용한 지능형 문서 요약 서비스입니다. 사용자가 업로드한 문서를 분석하여 3가지 요약안을 제시하고, 선택된 요약안을 바탕으로 최종 요약을 생성합니다.

## 주요 기능

- **다양한 파일 형식 지원**: PDF, DOCX, TXT 파일 업로드 및 텍스트 직접 입력
- **AI 기반 문서 분석**: OpenAI GPT-4를 통한 문서 유형 자동 분류
- **3가지 요약안 제공**: 서로 다른 스타일의 요약안 자동 생성
- **맞춤형 최종 요약**: 선택된 요약안 또는 사용자 입력을 바탕으로 한 완성도 높은 요약
- **다운로드 기능**: PDF 및 Word 형식으로 요약 결과 다운로드

## 기술 스택

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4 API
- **파일 처리**: pdf-parse, mammoth, docx
- **문서 생성**: jsPDF, docx
- **UI**: Lucide React Icons
- **배포**: Vercel

## 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd ai-document-summarizer
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**OpenAI API 키 발급 방법:**
1. [OpenAI 플랫폼](https://platform.openai.com/)에 가입/로그인
2. API Keys 섹션에서 새 API 키 생성
3. 생성된 키를 `.env.local` 파일에 추가

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 사용 방법

### 1단계: 문서 업로드/입력
- PDF, DOCX, TXT 파일을 업로드하거나
- 텍스트를 직접 입력합니다

### 2단계: 요약안 선택
- AI가 생성한 3가지 요약안 중 하나를 선택하거나
- 원하는 요약 방향을 직접 입력합니다

### 3단계: 최종 요약 확인 및 다운로드
- 생성된 최종 요약을 확인하고
- PDF 또는 Word 형식으로 다운로드합니다

## API 엔드포인트

### POST /api/analyze
문서를 분석하여 유형을 분류하고 3가지 요약안을 생성합니다.

**요청:**
- `file`: 업로드할 파일 (FormData)
- `text`: 직접 입력한 텍스트 (FormData)

**응답:**
```json
{
  "documentType": "문서 유형",
  "summaryOptions": ["요약안1", "요약안2", "요약안3"],
  "extractedText": "추출된 텍스트"
}
```

### POST /api/summarize
선택된 요약안을 바탕으로 최종 요약을 생성합니다.

**요청:**
```json
{
  "selectedSummary": "선택된 요약안",
  "originalText": "원본 텍스트",
  "fileName": "파일명 (선택사항)"
}
```

**응답:**
```json
{
  "summary": "최종 요약 내용"
}
```

### POST /api/download
요약 결과를 PDF 또는 Word 문서로 생성합니다.

**요청:**
```json
{
  "summary": "요약 내용",
  "format": "pdf | docx",
  "documentType": "문서 유형"
}
```

**응답:** 파일 다운로드

## Vercel 배포

### 1. Vercel 계정 연결
```bash
npm i -g vercel
vercel login
```

### 2. 프로젝트 배포
```bash
vercel
```

### 3. 환경 변수 설정
Vercel 대시보드에서 프로젝트 설정 → Environment Variables에 다음을 추가:
- `OPENAI_API_KEY`: OpenAI API 키

### 4. 도메인 설정 (선택사항)
Vercel 대시보드에서 커스텀 도메인을 설정할 수 있습니다.

## 프로젝트 구조

```
ai-document-summarizer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   │   └── route.ts      # 문서 분석 API
│   │   │   ├── summarize/
│   │   │   │   └── route.ts      # 요약 생성 API
│   │   │   └── download/
│   │   │       └── route.ts      # 파일 다운로드 API
│   │   ├── globals.css           # 전역 스타일
│   │   ├── layout.tsx            # 레이아웃 컴포넌트
│   │   └── page.tsx              # 메인 페이지
├── public/                       # 정적 파일
├── .env.local                    # 환경 변수 (생성 필요)
├── package.json                  # 프로젝트 설정
└── README.md                     # 프로젝트 문서
```

## 주의사항

- OpenAI API 사용량에 따라 비용이 발생할 수 있습니다
- 대용량 파일 처리 시 시간이 오래 걸릴 수 있습니다
- 한글 폰트 지원을 위해 PDF 생성 시 기본 폰트를 사용합니다

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

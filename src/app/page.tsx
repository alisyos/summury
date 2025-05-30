'use client';

import { useState } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle, ArrowRight, Settings } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryOptions, setSummaryOptions] = useState<string[]>([]);
  const [selectedSummary, setSelectedSummary] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [finalSummary, setFinalSummary] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'select' | 'generate' | 'complete'>('upload');
  const [activeTab, setActiveTab] = useState<'select' | 'result'>('select');
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('file');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const fileExtension = fileName.split('.').pop();
      
      // MIME 타입과 파일 확장자를 모두 검사
      const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword', // 구버전 DOC 파일
        'text/plain'
      ];
      
      const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
      
      const isValidType = allowedTypes.includes(selectedFile.type);
      const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
      
      if (isValidType || isValidExtension) {
        setFile(selectedFile);
        setTextInput('');
        setInputMethod('file');
        console.log('파일 정보:', {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size
        });
      } else {
        alert(`지원되지 않는 파일 형식입니다.\n지원 형식: PDF, DOCX, DOC, TXT\n선택된 파일: ${selectedFile.name} (${selectedFile.type})`);
      }
    }
  };

  const handleInitialAnalysis = async () => {
    if (!file && !textInput.trim()) {
      alert('파일을 업로드하거나 텍스트를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('analyze');
    
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', textInput);
        setOriginalText(textInput);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('분석 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setDocumentType(data.documentType);
      setSummaryOptions(data.summaryOptions);
      
      if (file && data.extractedText) {
        setOriginalText(data.extractedText);
      }
      
      setCurrentStep('select');
    } catch (error) {
      console.error('Error:', error);
      alert('문서 분석 중 오류가 발생했습니다.');
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSummary = async () => {
    const summaryToUse = selectedSummary || customSummary;
    if (!summaryToUse.trim()) {
      alert('요약안을 선택하거나 직접 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('generate');
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSummary: summaryToUse,
          originalText: originalText,
        }),
      });

      if (!response.ok) {
        throw new Error('요약 생성 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setFinalSummary(data.summary);
      setCurrentStep('complete');
      setActiveTab('result');
    } catch (error) {
      console.error('Error:', error);
      alert('요약 생성 중 오류가 발생했습니다.');
      setCurrentStep('select');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: finalSummary,
          format,
          documentType,
        }),
      });

      if (!response.ok) {
        throw new Error('다운로드 중 오류가 발생했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const resetProcess = () => {
    setFile(null);
    setTextInput('');
    setOriginalText('');
    setSummaryOptions([]);
    setSelectedSummary('');
    setCustomSummary('');
    setFinalSummary('');
    setDocumentType('');
    setCurrentStep('upload');
    setActiveTab('select');
    setInputMethod('file');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                AI 문서 요약 서비스
              </h1>
              <p className="text-gray-600">
                AI가 당신의 문서를 분석하고 완벽한 요약을 제공합니다
              </p>
            </div>
            <div>
              <a
                href="/admin"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                관리자
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
          
          {/* 좌측: 입력 영역 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 문서 업로드/입력 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">문서 업로드 또는 텍스트 입력</h2>
              
              {/* 입력 방법 선택 */}
              <div className="mb-4">
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="inputMethod"
                      value="file"
                      checked={inputMethod === 'file'}
                      onChange={(e) => {
                        setInputMethod('file');
                        setTextInput('');
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">파일 업로드</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="inputMethod"
                      value="text"
                      checked={inputMethod === 'text'}
                      onChange={(e) => {
                        setInputMethod('text');
                        setFile(null);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">텍스트 직접 입력</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* 파일 업로드 */}
                {inputMethod === 'file' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <h3 className="font-medium mb-1">파일 업로드</h3>
                    <p className="text-sm text-gray-500 mb-3">PDF, DOCX, DOC, TXT 파일을 지원합니다</p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                    >
                      파일 선택
                    </label>
                    {file && (
                      <p className="mt-2 text-sm text-green-600">
                        선택된 파일: {file.name}
                      </p>
                    )}
                  </div>
                )}

                {/* 텍스트 직접 입력 */}
                {inputMethod === 'text' && (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="font-medium">텍스트 직접 입력</h3>
                    </div>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="요약할 텍스트를 직접 입력하세요..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                )}

                <button
                  onClick={handleInitialAnalysis}
                  disabled={isProcessing || (inputMethod === 'file' ? !file : !textInput.trim()) || currentStep !== 'upload'}
                  className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {currentStep === 'analyze' ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      문서 분석 시작
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 요약 방법 선택 */}
            {(currentStep === 'select' || currentStep === 'generate' || currentStep === 'complete') && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">문서 정보</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">문서 유형:</span>
                    <span className="font-medium">{documentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">입력 방식:</span>
                    <span className="font-medium">{file ? '파일 업로드' : '텍스트 입력'}</span>
                  </div>
                  {file && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">파일명:</span>
                      <span className="font-medium truncate ml-2">{file.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">텍스트 길이:</span>
                    <span className="font-medium">{originalText.length.toLocaleString()}자</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 우측: 결과 영역 */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 요약 방법 선택 및 결과 (탭 구조) */}
            {(currentStep === 'select' || currentStep === 'generate' || currentStep === 'complete') && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                {/* 탭 헤더 */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveTab('select')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'select'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    disabled={currentStep === 'upload' || currentStep === 'analyze'}
                  >
                    요약 방법 선택
                  </button>
                  <button
                    onClick={() => setActiveTab('result')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ml-4 ${
                      activeTab === 'result'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    disabled={currentStep !== 'complete'}
                  >
                    요약 결과
                  </button>
                </div>

                {/* 요약 방법 선택 탭 내용 */}
                {activeTab === 'select' && (currentStep === 'select' || currentStep === 'generate' || currentStep === 'complete') && (
                  <div>
                    {documentType && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          <strong>문서 유형:</strong> {documentType}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3 mb-4">
                      {summaryOptions.map((option, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="summary"
                              value={option}
                              checked={selectedSummary === option}
                              onChange={(e) => {
                                setSelectedSummary(e.target.value);
                                setCustomSummary('');
                              }}
                              className="mt-1"
                              disabled={currentStep === 'generate'}
                            />
                            <div>
                              <h4 className="font-medium mb-1 text-sm">요약 방법 {index + 1}</h4>
                              <p className="text-gray-700 text-xs">{option}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="border border-gray-300 rounded-lg p-3 mb-4">
                      <h4 className="font-medium mb-2 text-sm">직접 입력</h4>
                      <textarea
                        value={customSummary}
                        onChange={(e) => {
                          setCustomSummary(e.target.value);
                          setSelectedSummary('');
                        }}
                        placeholder="원하는 요약 방향을 직접 입력하세요..."
                        className="w-full h-20 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={currentStep === 'generate'}
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={resetProcess}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                        disabled={currentStep === 'generate'}
                      >
                        처음으로
                      </button>
                      <button
                        onClick={handleFinalSummary}
                        disabled={isProcessing || (!selectedSummary && !customSummary.trim()) || currentStep === 'generate'}
                        className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
                      >
                        {currentStep === 'generate' ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            요약 생성 중...
                          </>
                        ) : (
                          <>
                            최종 요약 생성
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 요약 결과 탭 내용 */}
                {activeTab === 'result' && currentStep === 'complete' && (
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="font-medium mb-3 text-sm">최종 요약</h3>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{finalSummary}</p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={resetProcess}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                      >
                        새 문서 요약
                      </button>
                      <button
                        onClick={() => handleDownload('docx')}
                        className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Word 다운로드
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 진행 중 상태 표시 */}
            {(currentStep === 'analyze' || currentStep === 'generate') && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {currentStep === 'analyze' ? '문서를 분석하고 있습니다...' : '최종 요약을 생성하고 있습니다...'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {currentStep === 'analyze' 
                      ? 'AI가 문서의 유형을 분석하고 요약 방법을 제안하고 있습니다.' 
                      : '선택하신 방법에 따라 완성도 높은 요약을 생성하고 있습니다.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* 대기 상태 */}
            {currentStep === 'upload' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">문서를 업로드해주세요</h3>
                  <p className="text-sm">
                    PDF, DOCX, DOC, TXT 파일을 업로드하거나<br />
                    텍스트를 직접 입력하여 시작하세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

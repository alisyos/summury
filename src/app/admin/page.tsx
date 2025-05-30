'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, RefreshCw, Settings, FileText, MessageSquare } from 'lucide-react';

interface Prompt {
  name: string;
  description: string;
  content: string;
}

interface Prompts {
  [key: string]: Prompt;
}

export default function AdminPage() {
  const [prompts, setPrompts] = useState<Prompts>({});
  const [selectedPrompt, setSelectedPrompt] = useState<string>('analyze');
  const [editingPrompt, setEditingPrompt] = useState<Prompt>({
    name: '',
    description: '',
    content: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 프롬프트 로드
  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
        if (data[selectedPrompt]) {
          setEditingPrompt(data[selectedPrompt]);
        }
      } else {
        throw new Error('프롬프트를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('프롬프트 로드 오류:', error);
      setMessage({ type: 'error', text: '프롬프트를 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 프롬프트 저장
  const savePrompt = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedPrompt,
          ...editingPrompt
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '프롬프트가 성공적으로 저장되었습니다.' });
        await loadPrompts(); // 저장 후 다시 로드
      } else {
        throw new Error('프롬프트 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('프롬프트 저장 오류:', error);
      setMessage({ type: 'error', text: '프롬프트 저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 프롬프트 선택 변경
  const handlePromptChange = (promptType: string) => {
    setSelectedPrompt(promptType);
    if (prompts[promptType]) {
      setEditingPrompt(prompts[promptType]);
    }
  };

  // 메시지 자동 숨김
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 초기 로드
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">프롬프트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  프롬프트 관리자
                </h1>
                <p className="text-gray-600">
                  AI 요약 서비스의 시스템 프롬프트를 관리합니다
                </p>
              </div>
            </div>
            <div>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className="container mx-auto px-4 py-4">
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* 좌측: 프롬프트 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">프롬프트 목록</h2>
              
              <div className="space-y-2">
                {Object.entries(prompts).map(([key, prompt]) => (
                  <button
                    key={key}
                    onClick={() => handlePromptChange(key)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedPrompt === key
                        ? 'bg-blue-50 border-2 border-blue-200 text-blue-800'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      {key === 'analyze' ? (
                        <FileText className="h-5 w-5 mr-2" />
                      ) : (
                        <MessageSquare className="h-5 w-5 mr-2" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{prompt.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{prompt.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: 프롬프트 편집 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">프롬프트 편집</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={loadPrompts}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 transition-colors flex items-center text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </button>
                  <button
                    onClick={savePrompt}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-400 transition-colors flex items-center text-sm"
                  >
                    <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} />
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* 프롬프트 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    프롬프트 이름
                  </label>
                  <input
                    type="text"
                    value={editingPrompt.name}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="프롬프트 이름을 입력하세요"
                  />
                </div>

                {/* 프롬프트 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <input
                    type="text"
                    value={editingPrompt.description}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="프롬프트에 대한 간단한 설명을 입력하세요"
                  />
                </div>

                {/* 프롬프트 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    프롬프트 내용
                  </label>
                  <textarea
                    value={editingPrompt.content}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                    className="w-full h-96 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="프롬프트 내용을 입력하세요..."
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    <p><strong>변수 사용법:</strong></p>
                    <p>• 문서 분석: <code>{'{{DOCUMENT_TEXT}}'}</code> - 분석할 문서 텍스트</p>
                    <p>• 요약 생성: <code>{'{{SELECTED_SUMMARY}}'}</code> - 선택된 요약 방법, <code>{'{{ORIGINAL_TEXT}}'}</code> - 원본 문서</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
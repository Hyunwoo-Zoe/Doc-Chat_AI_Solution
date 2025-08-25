// src/components/PdfSummaryForm.tsx
'use client'

import { useState, useRef, useCallback } from 'react'

/**
 * 지원 언어 타입 & 옵션
 */
export type Lang = 'KO' | 'EN'

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'KO', label: '한국어' },
  { value: 'EN', label: 'English' },
]

/**
 * 순수 Tailwind 스피너 (SVG)
 */
function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin text-current`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * PDF 요약 + Follow‑up Q&A 폼 (Tailwind only)
 */
export default function PdfSummaryForm() {
  /* ───────── 상태값 ─────────────────────── */
  const [pdfUrl, setPdfUrl]           = useState('')
  const [lang, setLang]               = useState<Lang>('KO')
  const [summary, setSummary]         = useState('')
  const [followup, setFollowup]       = useState('')
  const [followupLog, setFollowupLog] = useState<string[]>([])
  const [status, setStatus]           = useState<'idle' | 'loading-summary' | 'loading-followup'>('idle')
  const [error, setError]             = useState('')

  /* ───────── 내부 레퍼런스 ──────────────── */
  const fileIdRef = useRef<string | null>(null)

  /* ───────── URL → file_id 해시 ─────────── */
  const hash32 = (str: string) => {
    let h = 0
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
    return h.toString(16)
  }
  const generateFileId = (url: string) => {
    const normalized = url.trim().toLowerCase()
    const baseName   = normalized.split('/').pop()?.replace(/\W/g, '_') || 'file'
    return `fid_${hash32(normalized)}_${baseName}`
  }

  /* ───────── 공통 API 호출 래퍼 ─────────── */
  const callApi = useCallback(
    async (query: string, followupMode = false) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      console.log('API_URL', API_URL)
      if (!fileIdRef.current) return

      setStatus(followupMode ? 'loading-followup' : 'loading-summary')
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: fileIdRef.current,
            pdf_url: pdfUrl,
            query,
            lang,
          }),
        })

        if (!res.ok) throw new Error(res.status === 404 ? 'PDF를 찾을 수 없습니다.' : `서버 오류 (${res.status})`)

        const data   = await res.json()
        if (data.error) throw new Error(data.error)

        const answer = data.answer ?? data.summary ?? JSON.stringify(data)

        if (followupMode) {
          setFollowupLog(prev => [`Q: ${query}\nA: ${answer}`, ...prev])
        } else {
          setSummary(answer)
          setFollowupLog([])
        }
      } catch (e) {
        if (e instanceof Error) setError(`❗ ${e.message}`)
      } finally {
        setStatus('idle')
      }
    },
    [pdfUrl, lang],
  )

  /* ───────── 액션 핸들러 ────────────────── */
  const handleInitialSummary = () => {
    fileIdRef.current = generateFileId(pdfUrl)
    callApi('SUMMARY_ALL')
  }
  const handleFollowup = () => {
    if (!followup.trim()) return
    callApi(followup, true)
    setFollowup('')
  }
  const isLoading   = status !== 'idle'
  const summaryBusy = status === 'loading-summary'
  const qnaBusy     = status === 'loading-followup'

  /* ───────── UI 렌더링 ──────────────────── */
  return (
    <section
      className="mx-auto max-w-xl space-y-8 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/70"
    >
      {/* 헤더 */}
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <span role="img" aria-label="pdf">
            📄
          </span>
          <span>PDF 요약</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          URL을 붙여넣고 버튼만 누르세요. AI가 요약과 후속 질문까지 처리해 줍니다.
        </p>
      </header>

      {/* URL 입력 */}
      <div className="space-y-2">
        <label htmlFor="pdfUrl" className="text-sm font-medium">
          PDF URL
        </label>
        <input
          id="pdfUrl"
          type="url"
          required
          placeholder="https://arxiv.org/pdf/xxxx.pdf"
          value={pdfUrl}
          onChange={e => setPdfUrl(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
        />
      </div>

      {/* 언어 선택 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="langSelect" className="text-sm font-medium">
          🔤 응답 언어
        </label>
        <select
          id="langSelect"
          value={lang}
          onChange={e => setLang(e.target.value as Lang)}
          className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
        >
          {LANG_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 요약 버튼 */}
      <button
        onClick={handleInitialSummary}
        disabled={isLoading || !pdfUrl}
        className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {summaryBusy && <Spinner />}
        <span>{summaryBusy ? '요약 생성 중...' : '요약 만들기'}</span>
      </button>

      {/* 오류 메시지 */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 요약 결과 */}
      {summary && (
        <div className="space-y-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span role="img" aria-label="result">
              📝
            </span>
            <span>요약 결과</span>
          </h2>

          <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed shadow-inner dark:bg-neutral-800 dark:text-gray-100">
            {summary}
          </pre>

          {/* Follow‑up */}
          <div className="space-y-2">
            <label htmlFor="followupInput" className="text-sm font-medium">
              ➕ 추가 질문
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="followupInput"
                type="text"
                value={followup}
                onChange={e => setFollowup(e.target.value)}
                placeholder="예: 결론을 한 문장으로 요약해줘"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-green-600 focus:outline-none focus:ring focus:ring-green-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
              />
              <button
                onClick={handleFollowup}
                disabled={isLoading || !followup}
                className="relative flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white shadow-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {qnaBusy && <Spinner />}
                <span>{qnaBusy ? '질문 중...' : '질문하기'}</span>
              </button>
            </div>
          </div>

          {/* Follow‑up 로그 */}
          {followupLog.length > 0 && (
            <details open className="rounded-xl bg-gray-50 px-6 py-4 dark:bg-neutral-800/50">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200">
                🗒️ 추가 질문 기록
              </summary>
              <ul className="mt-4 space-y-4 text-sm">
                {followupLog.map((item, idx) => (
                  <li
                    key={idx}
                    className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  )
}


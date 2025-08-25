'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../common/Spinner'
import FollowUpCard from './FollowUpCard'
import FeedbackModal from './FeedbackModal'

export type Lang = 'KO' | 'EN' | 'CN' | 'JP'
const LANG_OPTIONS = [
  { value: 'KO', label: '한국어' },
  { value: 'EN', label: 'English' },
  { value: 'CN', label: '中文' },
  { value: 'JP', label: '日本語' },
] as const

type Phase = 'input' | 'summary'

export default function PdfSummaryForm() {
  /* ── 상태 ── */
  const [phase, setPhase] = useState<Phase>('input')
  const [status, setStatus] = useState<
    'idle' | 'loading-summary' | 'loading-followup' | 'submitting-feedback'
  >('idle')
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [lang, setLang] = useState<Lang>('KO')
  const [summary, setSummary] = useState('')
  const [followupLog, setFollowupLog] = useState<string[]>([])

  /* ── 평가 모달 ── */
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [thanks, setThanks] = useState(false)

  /* ── 파일 ID 유틸 ── */
  const fileIdRef = useRef<string | null>(null)
  const hash32 = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return h.toString(16)
  }
  const genId = (url: string) => {
    const norm = url.trim().toLowerCase()
    const base = norm.split('/').pop()?.replace(/\W/g, '_') || 'file'
    return `file-id_${hash32(norm)}_${base}`
  }

  /* ── 쿠키 유틸 함수 ── */
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || '';
    }
    return '';
  }

  /* ── API 호출 래퍼 ── */
  const callApi = useCallback(
    async (query: string, follow = false) => {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      if (!fileIdRef.current) return

      setStatus(follow ? 'loading-followup' : 'loading-summary')
      setError('')

      try {
        const approxyPermit = getCookie('approxy_permit') || process.env.NEXT_PUBLIC_APPROXY_PERMIT || '';
        
        const res = await fetch(`${API}/api/summary`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'cookie': approxyPermit ? `approxy_permit=${approxyPermit}` : ''
          },
          body: JSON.stringify({
            file_id: fileIdRef.current,
            pdf_url: pdfUrl,
            query,
            lang,
          })
        })
        if (!res.ok)
          throw new Error(
            res.status === 404 ? 'PDF를 찾을 수 없습니다.' : `서버 오류 (${res.status})`,
          )

        const data = await res.json()
        if (data.error) throw new Error(data.error)

        const answer = data.answer ?? data.summary ?? JSON.stringify(data)
        if (follow) {
          setFollowupLog(prev => [`Q: ${query}\nA: ${answer}`, ...prev])
        } else {
          setSummary(answer)
          setFollowupLog([])
          setPhase('summary')
        }
      } catch (e: unknown) {
      	if (e instanceof Error) {
          setError(`❗ ${e.message}`)
        } else {
          setError('❗ 예기치 못한 오류가 발생했습니다.')
        }
      } finally {
        setStatus('idle')
      }
    },
    [pdfUrl, lang],
  )

  /* ── 핸들러 ── */
  const handleSummary = () => {
    fileIdRef.current = genId(pdfUrl)
    callApi('SUMMARY_ALL')
  }
  const handleAsk = (q: string) => callApi(q, true)

  const submitFeedback = async () => {
    /* ── 기본 검증 ── */
    if (!rating) {
      alert('별점을 선택하세요!')
      return
    }
    if (!fileIdRef.current) {
      alert('먼저 요약을 생성해 주세요!')
      return
    }

    setStatus('submitting-feedback')
    const ctrl = new AbortController()

    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

      const payload = {
        file_id: fileIdRef.current,
        pdf_url: pdfUrl,
        lang,
        rating,
        comment: comment.trim().slice(0, 500),
        usage_log: followupLog.slice(0, 10),
      }

      const approxyPermit = getCookie('approxy_permit') || process.env.NEXT_PUBLIC_APPROXY_PERMIT || '';
      
      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'cookie': approxyPermit ? `approxy_permit=${approxyPermit}` : ''
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      })

      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)

      const { ok } = await res.json()
      if (!ok) throw new Error('저장 실패')

      /* ── 성공 UI: 모달 내부에 “감사합니다!” 메시지 표시 ── */
      setThanks(true)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        alert((err as Error).message)
      }
    } finally {
      setStatus('idle')
    }
  }


  /* ── 렌더 ── */
  return (
    <>
      {/* 컨테이너: summary 단계에만 2-열 그리드, layout prop으로 폭 전환 애니메이션 */}
      <motion.section
        layout
        className={`mx-auto ${
          phase === 'summary'
            ? 'grid max-w-5xl gap-6 md:grid-cols-2'
            : 'max-w-xl'
        }`}
      >
        {/* ── 왼쪽 카드: 입력 + (요약) ── */}
        <motion.section
          layout
          className="flex h-full flex-col space-y-6 rounded-3xl border
                     border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm
                     dark:border-neutral-700 dark:bg-neutral-900/70"
        >
          {/* 제목 */}
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            PDF 요약
          </h1>

          {/* URL 입력 */}
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              PDF URL
            </label>
            <input
              id="url"
              type="url"
              value={pdfUrl}
              onChange={e => setPdfUrl(e.target.value)}
              required
              placeholder="https://arxiv.org/pdf/xxxx.pdf"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm
                         shadow-sm focus:border-blue-500 focus:outline-none
                         focus:ring focus:ring-blue-200 dark:border-neutral-700
                         dark:bg-neutral-800 dark:text-gray-100"
            />
          </div>

          {/* 언어 선택 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label htmlFor="lang" className="text-sm font-medium">
              응답 언어
            </label>
            <select
              id="lang"
              value={lang}
              onChange={e => setLang(e.target.value as Lang)}
              className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:border-blue-500 focus:outline-none
                         focus:ring focus:ring-blue-200 dark:border-neutral-700
                         dark:bg-neutral-800 dark:text-gray-100"
            >
              {LANG_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* 요약 버튼 */}
          <button
            onClick={handleSummary}
            disabled={status === 'loading-summary' || !pdfUrl}
            className="relative flex w-full items-center justify-center gap-2 rounded-lg
                       bg-blue-600 py-2 font-semibold text-white shadow-lg
                       transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {status === 'loading-summary' && <Spinner />}
            <span>{phase === 'input' ? '요약 만들기' : '요약'}</span>
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* 요약 결과 */}
          {phase === 'summary' && (
            <div className="flex flex-col space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                요약 결과
              </h2>
              <pre
                className="flex-grow max-h-[60vh] overflow-y-auto whitespace-pre-wrap
                           rounded-xl bg-gray-50 p-4 text-sm leading-relaxed shadow-inner
                           dark:bg-neutral-800 dark:text-gray-100"
              >
                {summary}
              </pre>
            </div>
          )}
        </motion.section>

        {/* ── 오른쪽: FollowUpCard (AnimatePresence로 부드럽게 등장) ── */}
        <AnimatePresence mode="wait">
          {phase === 'summary' && (
            <FollowUpCard
              key="followup"
              busy={status === 'loading-followup'}
              followupLog={followupLog}
              onAsk={handleAsk}
              onOpenFeedback={() => {
                setShowFeedback(true)
                setThanks(false)
              }}
            />
          )}
        </AnimatePresence>
      </motion.section>

      {/* 평가 모달 */}
      {showFeedback && (
        <FeedbackModal
          rating={rating}
          comment={comment}
          onRating={setRating}
          onComment={setComment}
          busy={status === 'submitting-feedback'}
          thanks={thanks}
          onSubmit={submitFeedback}
          onClose={() => {
            setShowFeedback(false)
            setRating(0)
            setComment('')
            setThanks(false)
          }}
        />
      )}
    </>
  )
}


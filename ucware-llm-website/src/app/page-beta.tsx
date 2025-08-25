// src/app/page.tsx
'use client'

import {
  FileText,
  Sparkles,
  MessageSquare,
  Star,
  Github,
} from 'lucide-react'
import PdfSummaryForm from '@/components/PdfSummaryForm'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-sky-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      {/* ── 헤더 ── */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-green-400">
            PDF Genie
          </span>
        </h1>
        <a
          href="https://github.com/CODEHakR1234/ucware-llm-website"
          target="_blank"
          className="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
      </header>

      {/* ── Hero 섹션 ── */}
      <section className="mx-auto w-full max-w-4xl px-6 py-16 text-center">
        <h2 className="mx-auto max-w-2xl bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          긴 PDF를 <span className="whitespace-nowrap">몇 초 만에 요약</span>
        </h2>
	<p className="mx-auto mt-6 max-w-2xl text-gray-600 dark:text-gray-300">
   	  딥러닝 기반&nbsp;RAG&nbsp;파이프라인으로 논문·보고서 등 대용량&nbsp;PDF를
   	  정확하게&nbsp;요약하고,<br />
   	<span className="font-medium">추가&nbsp;질문</span>도 바로&nbsp;가능해요.
 	</p>

        {/* 특징 아이콘 리스트 */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: FileText, label: 'URL 하나면 끝' },
            { icon: MessageSquare, label: '대화형 질문' },
            { icon: Star, label: '별점 & 피드백' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 shadow-md dark:bg-neutral-800"
            >
              <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 요약 폼 ── */}
      <section className="mx-auto mb-24 w-full max-w-5xl px-6">
        <PdfSummaryForm />
      </section>

      {/* ── 풋터 ── */}
      <footer className="mt-auto border-t border-gray-200 py-6 text-center text-xs text-gray-500 dark:border-neutral-700 dark:text-gray-400">
        © {new Date().getFullYear()} PDF Genie & UCWORKS. 모든 권리 보유.
      </footer>
    </main>
  )
}


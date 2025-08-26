
// 📁 src/services/adminApi.ts
// 관리자 페이지에서 사용하는 API 요청 함수들을 모아놓은 모듈.
//
// 설계 포인트
// ===========
// 1) 관리자 API(`ADMIN_API_BASE`)와 서비스 API(`SERVICE_API_BASE`)의 기본 URL을 환경 변수로부터 설정.
// 2) `getCookie` 유틸 함수를 통해 브라우저 쿠키에서 인증 토큰(approxy_permit)을 안전하게 조회.
// 3) `getHeaders` 함수를 통해 모든 API 요청에 필요한 공통 헤더(Content-Type, cookie)를 생성.
// 4) 각 API 함수는 fetch API를 사용하며, 요청 실패 시(res.ok === false) 에러를 throw하여 호출부에서 처리하도록 함.
// 5) 기능별로 API 함수들을 그룹화하여 가독성 및 유지보수성을 높임 (통계, 벡터 관리, 캐시 관리 등).

// ───────────────────────────── 기본 설정 및 유틸리티 ─────────────────────────────

/** 관리자 API 서버의 기본 URL */
const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://172.16.10.117:8001";

/** 일반 서비스 API 서버의 기본 URL (요약 테스트용) */
const SERVICE_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://172.16.10.117:8000";

/**
 * 지정된 이름의 쿠키 값을 가져오는 헬퍼 함수.
 * @param {string} name - 가져올 쿠키의 이름
 * @returns {string} 쿠키 값 또는 빈 문자열
 */
const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  return '';
}

/**
 * API 요청에 사용될 공통 헤더를 생성하는 함수.
 * 인증을 위해 `approxy_permit` 쿠키를 포함합니다.
 * @returns {HeadersInit} 공통 헤더 객체
 */
const getHeaders = (): HeadersInit => {
  const approxyPermit = getCookie('approxy_permit') || process.env.NEXT_PUBLIC_APPROXY_PERMIT || '';
  return {
    'Content-Type': 'application/json',
    'cookie': approxyPermit ? `approxy_permit=${approxyPermit}` : ''
  };
}

// ───────────────────────────── 통계 (Statistics) ─────────────────────────────

/** 벡터 통계 조회 */
export async function fetchVectorStats() {
  const res = await fetch(`${ADMIN_API_BASE}/vector/statistics`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 통계 불러오기 실패");
  return res.json();
}

/** 캐시 통계 조회 */
export async function fetchCacheStats() {
  const res = await fetch(`${ADMIN_API_BASE}/cache/statistics`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 통계 불러오기 실패');
  return res.json();
}

// ───────────────────────────── 벡터 관리 (Vector Management) ─────────────────────────────

/** 특정 file_id의 벡터가 DB에 존재하는지 확인 */
export async function checkVectorExists(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/check/${file_id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 존재 여부 확인 실패");
  return res.json();
}

/** 지정된 날짜에 생성된 벡터 목록 조회 */
export async function fetchVectorsByDate(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/by-date?date=${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("날짜별 벡터 조회 실패");
  return res.json();
}

/** 캐시에 연결되지 않은 미사용 벡터를 찾아 정리 (삭제) */
export async function cleanupUnusedVectors() {
  const res = await fetch(`${ADMIN_API_BASE}/vector/cleanup-unused`, { 
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("미사용 벡터 정리 실패");
  return res.json();
}

/** file_id를 기준으로 특정 벡터를 삭제 */
export async function deleteVectorById(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/delete/${file_id}`, { 
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 삭제 실패");
  return res.json();
}

// ───────────────────────────── 캐시 관리 (Cache Management) ─────────────────────────────

/** 지정된 날짜의 캐시 요약 목록 조회 */
export async function fetchCacheSummariesByDate(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/summaries/${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 요약 목록 조회 실패');
  return res.json();
}

/** 특정 file_id의 캐시 메타데이터 조회 */
export async function fetchCacheMetadata(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/metadata/${file_id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('메타데이터 조회 실패');
  return res.json();
}

/** 특정 file_id의 캐시가 존재하는지 확인 */
export async function checkCacheExists(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/check/${file_id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("캐시 존재 여부 확인 실패");
  return res.json();
}

/** file_id를 기준으로 특정 캐시를 삭제 */
export async function deleteCacheById(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/summary/${file_id}`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 삭제 실패');
  return res.json();
}

/** 벡터에 연결되지 않은 미사용 캐시를 찾아 정리 (삭제) */
export async function cleanupUnusedCache() {
  const res = await fetch(`${ADMIN_API_BASE}/cache/cleanup`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('미사용 캐시 정리 실패');
  return res.json();
}

// ───────────────────────────── 로그 관리 (Log Management) ─────────────────────────────

/** 지정된 날짜의 캐시 삭제 로그 조회 */
export async function fetchCacheDeletionLog(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/deletion-log?date=${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 삭제 로그 조회 실패');
  return res.json();
}

/** 지정된 날짜의 캐시 삭제 로그를 삭제 */
export async function deleteCacheLogByDate(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/deletion-log?date=${date}`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 삭제 로그 삭제 실패');
  return res.json();
}

/** 지정된 날짜의 요약 요청 로그 조회 */
export async function fetchCacheSummaryLog(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/summary-log?date=${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('요약 요청 로그 조회 실패');
  return res.json();
}

/** 지정된 날짜의 벡터 삭제(정리) 로그 조회 */
export async function fetchVectorDeletionLog(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/cleanup-log?date=${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 삭제 로그 조회 실패");
  return res.json();
}

/** 지정된 날짜의 벡터 삭제(정리) 로그를 삭제 */
export async function deleteVectorLogByDate(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/cleanup-log?date=${date}`, { 
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("삭제 로그 삭제 실패");
  return res.json();
}

// ───────────────────────────── 요약 테스트 (Summary Test) ─────────────────────────────

/** PDF URL과 질문을 보내 AI 요약을 요청 (서비스 API 사용) */
export async function requestSummary(params: {
  file_id: string;
  pdf_url: string;
  query: string;
  lang: "KO" | "EN" | "JP" | "CN";
}) {
  const res = await fetch(`${SERVICE_API_BASE}/api/summary`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("요약 요청 실패");
  return res.json();
}

// ───────────────────────────── 시스템 관리 (System Management) ─────────────────────────────

/** DB에 저장된 모든 벡터를 영구적으로 삭제 */
export async function deleteAllVectors() {
  const res = await fetch(`${ADMIN_API_BASE}/vector/all`, { 
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 전체 삭제 실패");
  return res.json();
}

/** DB에 저장된 모든 캐시를 영구적으로 삭제 */
export async function deleteAllCache() {
  const res = await fetch(`${ADMIN_API_BASE}/cache/all`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 전체 삭제 실패');
  return res.json();
}

/** 시스템의 모든 데이터(벡터, 캐시 등)를 영구적으로 삭제 */
export async function deleteSystemAll() {
  const res = await fetch(`${ADMIN_API_BASE}/system/all`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('시스템 전체 삭제 실패');
  return res.json();
}
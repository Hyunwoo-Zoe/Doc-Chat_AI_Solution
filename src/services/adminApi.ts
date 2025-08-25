
const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://172.16.10.117:8001";
const SERVICE_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://172.16.10.117:8000";

  /* ── 쿠키 유틸 함수 ── */
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || '';
    }
    return '';
  }

  /* ── 공통 헤더 생성 함수 ── */
  const getHeaders = () => {
    const approxyPermit = getCookie('approxy_permit') || process.env.NEXT_PUBLIC_APPROXY_PERMIT || '';
    return {
      'Content-Type': 'application/json',
      'cookie': approxyPermit ? `approxy_permit=${approxyPermit}` : ''
    };
  }

// ----- 통계 (Statistics) -----

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

// ----- 벡터 관리 (Vector Management) -----

/** 벡터 존재 여부 확인 */
export async function checkVectorExists(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/check/${file_id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 존재 여부 확인 실패");
  return res.json();
}

/** 날짜별 벡터 조회 */
export async function fetchVectorsByDate(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/by-date?date=${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("날짜별 벡터 조회 실패");
  return res.json();
}

/** 미사용 벡터 정리 */
export async function cleanupUnusedVectors() {
  const res = await fetch(`${ADMIN_API_BASE}/vector/cleanup-unused`, { 
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("미사용 벡터 정리 실패");
  return res.json();
}

/** 특정 벡터 삭제 */
export async function deleteVectorById(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/delete/${file_id}`, { 
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 삭제 실패");
  return res.json();
}

// ----- 캐시 관리 (Cache Management) -----

/** 날짜별 캐시 요약 목록 불러오기 */
export async function fetchCacheSummariesByDate(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/summaries/${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 요약 목록 조회 실패');
  return res.json();
}

/** 캐시 메타데이터 가져오기 */
export async function fetchCacheMetadata(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/metadata/${file_id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('메타데이터 조회 실패');
  return res.json();
}

/** ✨ [추가] 캐시 존재 여부 확인 */
export async function checkCacheExists(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/check/${file_id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("캐시 존재 여부 확인 실패");
  return res.json();
}

/** 특정 캐시 삭제 */
export async function deleteCacheById(file_id: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/summary/${file_id}`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 삭제 실패');
  return res.json();
}

/** 미사용 캐시 정리 */
export async function cleanupUnusedCache() {
  const res = await fetch(`${ADMIN_API_BASE}/cache/cleanup`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('미사용 캐시 정리 실패');
  return res.json();
}

// ----- 로그 관리 (Log Management) -----

/** 캐시 삭제 로그 조회 */
export async function fetchCacheDeletionLog(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/deletion-log?date=${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 삭제 로그 조회 실패');
  return res.json();
}

/** ✨ 캐시 삭제 로그 삭제 */
export async function deleteCacheLogByDate(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/deletion-log?date=${date}`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 삭제 로그 삭제 실패');
  return res.json();
}

/** 요약 요청 로그 조회 */
export async function fetchCacheSummaryLog(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/cache/summary-log?date=${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('요약 요청 로그 조회 실패');
  return res.json();
}

/** 벡터 삭제 로그 조회 */
export async function fetchVectorDeletionLog(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/cleanup-log?date=${date}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 삭제 로그 조회 실패");
  return res.json();
}

/** 벡터 삭제 로그 삭제 */
export async function deleteVectorLogByDate(date: string) {
  const res = await fetch(`${ADMIN_API_BASE}/vector/cleanup-log?date=${date}`, { 
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("삭제 로그 삭제 실패");
  return res.json();
}

// ----- 요약 테스트 (Summary Test) -----

/** 요약 요청 보내기 */
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

// ----- 시스템 관리 (System Management) -----

/** 모든 벡터 삭제 */
export async function deleteAllVectors() {
  const res = await fetch(`${ADMIN_API_BASE}/vector/all`, { 
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("벡터 전체 삭제 실패");
  return res.json();
}

/** 모든 캐시 삭제 */
export async function deleteAllCache() {
  const res = await fetch(`${ADMIN_API_BASE}/cache/all`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('캐시 전체 삭제 실패');
  return res.json();
}

/** 시스템 전체 데이터 삭제 */
export async function deleteSystemAll() {
  const res = await fetch(`${ADMIN_API_BASE}/system/all`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('시스템 전체 삭제 실패');
  return res.json();
}
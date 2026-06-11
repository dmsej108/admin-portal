/** 배포 시 서브경로 (vite.config base와 동일하게 유지) */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '')

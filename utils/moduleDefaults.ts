import { ModuleType } from "../types";

const STORAGE_KEY_PREFIX = "module_defaults_";

/**
 * 모듈 타입별 사용자 정의 기본값을 localStorage에 저장
 */
export const saveModuleDefault = (moduleType: ModuleType, parameters: Record<string, any>) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${moduleType}`;
    localStorage.setItem(key, JSON.stringify(parameters));
  } catch (error) {
    console.error("Failed to save module default:", error);
  }
};

/**
 * 모듈 타입별 사용자 정의 기본값을 localStorage에서 로드
 */
export const loadModuleDefault = (moduleType: ModuleType): Record<string, any> | null => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${moduleType}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load module default:", error);
  }
  return null;
};

/**
 * 모듈 타입별 사용자 정의 기본값을 localStorage에서 삭제
 */
export const clearModuleDefault = (moduleType: ModuleType) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${moduleType}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear module default:", error);
  }
};

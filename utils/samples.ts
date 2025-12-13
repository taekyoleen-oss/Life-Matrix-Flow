// 공통 샘플 유틸리티에서 re-export 및 앱별 래퍼 함수
import {
  SampleData,
  saveSampleToFile as saveSampleToFileShared,
  loadSampleFromFile as loadSampleFromFileShared,
  loadSharedSamples as loadSharedSamplesShared,
  loadPersonalWork as loadPersonalWorkShared,
  savePersonalWork as savePersonalWorkShared,
} from "../../shared/utils/samples";

// Re-export types
export type { SampleData };

// Re-export functions with app-specific defaults
export const loadSharedSamples = () => loadSharedSamplesShared('/samples/samples.json');
export const saveSampleToFile = (sample: SampleData) => saveSampleToFileShared(sample, '.json');
export const loadSampleFromFile = loadSampleFromFileShared;
export const loadPersonalWork = () => loadPersonalWorkShared('lifeMatrixFlow_personalWork');
export const savePersonalWork = (work: SampleData[]) => savePersonalWorkShared(work, 'lifeMatrixFlow_personalWork');



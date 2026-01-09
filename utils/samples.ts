// Sample data utilities for loading and saving samples
import { CanvasModule, Connection } from "../types";

export interface SampleData {
  name: string;
  modules: CanvasModule[];
  connections: Connection[];
}

/**
 * Load shared samples from the public samples.json file
 */
export async function loadSharedSamples(path: string = '/samples/samples.json'): Promise<SampleData[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`Failed to load shared samples from ${path}`);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading shared samples:', error);
    return [];
  }
}

/**
 * Save sample to file (downloads as JSON)
 */
export function saveSampleToFile(sample: SampleData, extension: string = '.json'): void {
  try {
    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sample.name}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error saving sample to file:', error);
  }
}

/**
 * Load sample from file
 */
export function loadSampleFromFile(): Promise<SampleData | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const sample = JSON.parse(content) as SampleData;
          resolve(sample);
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Failed to parse file');
          reject(err);
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Load personal work from localStorage
 */
export function loadPersonalWork(key: string = 'lifeMatrixFlow_personalWork'): SampleData[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }
    const data = JSON.parse(stored);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading personal work:', error);
    return [];
  }
}

/**
 * Save personal work to localStorage
 */
export function savePersonalWork(work: SampleData[], key: string = 'lifeMatrixFlow_personalWork'): void {
  try {
    localStorage.setItem(key, JSON.stringify(work));
  } catch (error) {
    console.error('Error saving personal work:', error);
  }
}

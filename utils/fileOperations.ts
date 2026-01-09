// File operations for saving and loading pipeline files

export interface SavePipelineOptions {
  extension: string;
  description: string;
  onSuccess?: (fileName: string) => void;
  onError?: (error: Error) => void;
}

export interface LoadPipelineOptions {
  extension: string;
  onError?: (error: Error) => void;
}

export interface PipelineState {
  modules: any[];
  connections: any[];
  productName?: string;
}

/**
 * Save pipeline state to a file using File System Access API
 */
export async function savePipeline(
  state: PipelineState,
  options: SavePipelineOptions
): Promise<void> {
  try {
    if (!("showSaveFilePicker" in window)) {
      // Fallback for browsers that don't support File System Access API
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pipeline${options.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      options.onSuccess?.(`pipeline${options.extension}`);
      return;
    }

    const fileHandle = await (window as any).showSaveFilePicker({
      suggestedName: `pipeline${options.extension}`,
      types: [
        {
          description: options.description,
          accept: {
            "application/json": [options.extension],
          },
        },
      ],
    });

    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(state, null, 2));
    await writable.close();

    options.onSuccess?.(fileHandle.name);
  } catch (error: any) {
    if (error.name !== "AbortError") {
      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);
      throw err;
    }
  }
}

/**
 * Load pipeline state from a file using File System Access API
 */
export async function loadPipeline(
  options: LoadPipelineOptions
): Promise<PipelineState | null> {
  try {
    if (!("showOpenFilePicker" in window)) {
      // Fallback for browsers that don't support File System Access API
      return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = options.extension;
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
              const state = JSON.parse(content);
              resolve(state);
            } catch (error) {
              const err =
                error instanceof Error
                  ? error
                  : new Error("Failed to parse file");
              options.onError?.(err);
              reject(err);
            }
          };
          reader.onerror = () => {
            const err = new Error("Failed to read file");
            options.onError?.(err);
            reject(err);
          };
          reader.readAsText(file);
        };
        input.oncancel = () => resolve(null);
        input.click();
      });
    }

    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: "Pipeline Files",
          accept: {
            "application/json": [options.extension],
          },
        },
      ],
    });

    const file = await fileHandle.getFile();
    const content = await file.text();
    const state = JSON.parse(content) as PipelineState;

    return state;
  } catch (error: any) {
    if (error.name !== "AbortError") {
      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);
      throw err;
    }
    return null;
  }
}

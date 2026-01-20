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
      // Use productName if available in state, otherwise use default name
      const fileName = state.productName 
        ? `${state.productName}${options.extension}`
        : `pipeline${options.extension}`;
      
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      options.onSuccess?.(fileName);
      return;
    }

    // Use productName if available in state, otherwise use default name
    const fileName = state.productName 
      ? `${state.productName}${options.extension}`
      : `pipeline${options.extension}`;
    
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: options.description,
            accept: {
              "application/json": [options.extension],
            },
          },
        ],
      });

      // Try to use File System Access API
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(state, null, 2));
        await writable.close();
        options.onSuccess?.(fileHandle.name);
        return;
      } catch (writeError: any) {
        // If createWritable fails (e.g., permission denied, insecure context),
        // fall back to download method
        console.warn("File System Access API write failed, falling back to download:", writeError);
        // Fall through to download fallback
      }
    } catch (pickerError: any) {
      // If showSaveFilePicker fails, fall back to download method
      if (pickerError.name !== "AbortError") {
        console.warn("File System Access API picker failed, falling back to download:", pickerError);
        // Fall through to download fallback
      } else {
        // User cancelled, don't show error
        return;
      }
    }

    // Fallback to download method if File System Access API fails
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    options.onSuccess?.(fileName);
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

import React, { useState } from "react";
import { CanvasModule, AdditionalVariablesOutput, DataPreview } from "../types";
import { XCircleIcon } from "./icons";

interface AdditionalVariablesPreviewModalProps {
  module: CanvasModule;
  projectName: string;
  onClose: () => void;
  allModules?: CanvasModule[];
  allConnections?: any[];
}

const formatValue = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value);
};

const formatNumberPreservingOriginal = (num: number) => {
  const str = num.toString();
  if (str.includes("e") || str.includes("E")) {
    return num.toExponential();
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10,
    useGrouping: false,
  }).format(num);
};

export const AdditionalVariablesPreviewModal: React.FC<
  AdditionalVariablesPreviewModalProps
> = ({
  module,
  projectName,
  onClose,
  allModules = [],
  allConnections = [],
}) => {
  const output = module.outputData as AdditionalVariablesOutput;
  if (!output || output.type !== "AdditionalVariablesOutput") return null;

  const { variables, data } = output;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">
              Additional Variable Results
            </h2>
            <span className="text-blue-200 text-sm">({module.name})</span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Variables Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Calculated Variables
            </h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              {Object.keys(variables).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(variables).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-white rounded-md border border-gray-300 p-3"
                    >
                      <div className="text-xs text-gray-500 font-semibold mb-1">
                        {key}
                      </div>
                      <div className="text-lg font-mono font-bold text-gray-800">
                        {formatValue(value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No variables calculated.
                </p>
              )}
            </div>
          </div>

          {/* Table Data Section */}
          {data && data.rows && data.rows.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Input Table Data
              </h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-[500px] overflow-auto">
                <div className="mb-2 text-sm text-gray-600">
                  {data.rows.length} rows × {data.columns.length} columns
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {data.columns.map((col) => (
                        <th
                          key={col.name}
                          className="py-2 px-3 font-semibold text-gray-600"
                        >
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.slice(0, 1000).map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        {data.columns.map((col) => (
                          <td
                            key={col.name}
                            className="py-1.5 px-3 text-gray-700"
                          >
                            {row[col.name] !== null &&
                            row[col.name] !== undefined
                              ? typeof row[col.name] === "number"
                                ? formatNumberPreservingOriginal(row[col.name])
                                : String(row[col.name])
                              : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.rows.length > 1000 && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Showing first 1000 rows of {data.rows.length} total rows
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};








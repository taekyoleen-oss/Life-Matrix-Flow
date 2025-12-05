import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  CanvasModule,
  Connection,
  ModuleType,
  DataPreview,
  PolicyInfoOutput,
  PremiumComponentOutput,
  AdditionalVariablesOutput,
  NetPremiumOutput,
} from "../types";
import { XCircleIcon, XMarkIcon } from "./icons";
import { SAMPLE_DATA } from "../sampleData";

interface ParameterInputModalProps {
  module: CanvasModule;
  onClose: () => void;
  updateModuleParameters: (id: string, newParams: Record<string, any>) => void;
  modules: CanvasModule[];
  connections: Connection[];
  projectName: string;
  folderHandle: FileSystemDirectoryHandle | null;
}

export const PropertyInput: React.FC<{
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: string;
  step?: string;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}> = ({
  label,
  value,
  onChange,
  type = "text",
  step,
  disabled = false,
  placeholder,
  compact = false,
}) => (
  <div>
    <label
      className={`block ${compact ? "text-xs" : "text-sm"} text-gray-400 mb-1`}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      step={step}
      onChange={(e) =>
        onChange(
          type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
        )
      }
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full bg-gray-700 border border-gray-600 rounded ${
        compact ? "px-2 py-1 text-xs" : "px-2 py-1.5 text-sm"
      } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-800 disabled:text-gray-500`}
    />
  </div>
);

export const PropertySelect: React.FC<{
  label: string;
  value: any;
  onChange: (value: string) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  compact?: boolean;
}> = ({ label, value, onChange, options, placeholder, compact = false }) => (
  <div>
    <label
      className={`block ${compact ? "text-xs" : "text-sm"} text-gray-400 mb-1`}
    >
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-gray-700 border border-gray-600 rounded ${
        compact ? "px-2 py-1 text-xs" : "px-2 py-1.5 text-sm"
      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => {
        const optionLabel = typeof opt === "string" ? opt : opt.label;
        const optionValue = typeof opt === "string" ? opt : opt.value;
        return (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        );
      })}
    </select>
  </div>
);

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-2">
    {label && <span className="text-xs text-gray-400">{label}</span>}
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        checked ? "bg-green-600" : "bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-1"
        }`}
        style={{
          transform: checked ? "translateX(1.125rem)" : "translateX(0.25rem)",
        }}
      />
    </button>
  </div>
);

export const getConnectedDataSource = (
  moduleId: string,
  portName: string,
  allModules: CanvasModule[],
  allConnections: Connection[]
): DataPreview | undefined => {
  const inputConnection = allConnections.find(
    (c) => c.to.moduleId === moduleId && c.to.portName === portName
  );
  if (!inputConnection) return undefined;
  const sourceModule = allModules.find(
    (m) => m.id === inputConnection.from.moduleId
  );
  if (sourceModule?.outputData?.type === "DataPreview")
    return sourceModule.outputData;
  return undefined;
};

export const getGlobalPolicyInfoFromCanvas = (
  allModules: CanvasModule[]
): PolicyInfoOutput | undefined => {
  const policyModule = allModules.find(
    (m) => m.type === ModuleType.DefinePolicyInfo
  );
  if (policyModule?.outputData?.type === "PolicyInfoOutput") {
    return policyModule.outputData;
  }
  // If not run, return parameters as a fallback
  const policyModuleParams = allModules.find(
    (m) => m.type === ModuleType.DefinePolicyInfo
  )?.parameters;
  if (policyModuleParams) {
    return {
      type: "PolicyInfoOutput",
      entryAge: Number(policyModuleParams.entryAge),
      gender: policyModuleParams.gender,
      policyTerm: Number(policyModuleParams.policyTerm),
      paymentTerm: Number(policyModuleParams.paymentTerm),
      interestRate: Number(policyModuleParams.interestRate) / 100,
    };
  }
  return undefined;
};

export const getConnectedPremiumComponents = (
  moduleId: string,
  portName: string,
  allModules: CanvasModule[],
  allConnections: Connection[]
): PremiumComponentOutput | undefined => {
  const inputConnection = allConnections.find(
    (c) => c.to.moduleId === moduleId && c.to.portName === portName
  );
  if (!inputConnection) return undefined;
  const sourceModule = allModules.find(
    (m) => m.id === inputConnection.from.moduleId
  );
  if (sourceModule?.outputData?.type === "PremiumComponentOutput")
    return sourceModule.outputData;
  return undefined;
};

export const getConnectedAdditionalVariables = (
  moduleId: string,
  portName: string,
  allModules: CanvasModule[],
  allConnections: Connection[]
): AdditionalVariablesOutput | undefined => {
  const inputConnection = allConnections.find(
    (c) => c.to.moduleId === moduleId && c.to.portName === portName
  );
  if (!inputConnection) return undefined;
  const sourceModule = allModules.find(
    (m) => m.id === inputConnection.from.moduleId
  );
  if (sourceModule?.outputData?.type === "AdditionalVariablesOutput")
    return sourceModule.outputData;
  return undefined;
};

export const getConnectedNetPremiumOutput = (
  moduleId: string,
  portName: string,
  allModules: CanvasModule[],
  allConnections: Connection[]
): NetPremiumOutput | undefined => {
  const inputConnection = allConnections.find(
    (c) => c.to.moduleId === moduleId && c.to.portName === portName
  );
  if (!inputConnection) return undefined;
  const sourceModule = allModules.find(
    (m) => m.id === inputConnection.from.moduleId
  );
  if (sourceModule?.outputData?.type === "NetPremiumOutput")
    return sourceModule.outputData;
  return undefined;
};

export const DefinePolicyInfoParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  compact?: boolean;
}> = ({ parameters, onParametersChange, compact = false }) => {
  const {
    entryAge,
    gender,
    policyTerm,
    paymentTerm,
    interestRate,
    maturityAge,
  } = parameters;

  const handleChange = (field: string, value: any) => {
    onParametersChange({ ...parameters, [field]: value });
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <PropertyInput
        label="Entry Age"
        type="number"
        value={entryAge}
        onChange={(v) => handleChange("entryAge", v)}
        compact={compact}
      />
      <PropertySelect
        label="Gender"
        value={gender}
        onChange={(v) => handleChange("gender", v)}
        options={["Male", "Female"]}
        compact={compact}
      />
      <div className={`grid grid-cols-2 ${compact ? "gap-2" : "gap-4"}`}>
        <PropertyInput
          label="Policy Term (years)"
          type="number"
          value={policyTerm}
          onChange={(v) => handleChange("policyTerm", v)}
          disabled={!!maturityAge && maturityAge > 0}
          compact={compact}
        />
        <PropertyInput
          label="Maturity Age (Optional)"
          type="number"
          value={maturityAge || ""}
          onChange={(v) => handleChange("maturityAge", v)}
          placeholder="e.g. 60"
          compact={compact}
        />
      </div>
      <p
        className={`${compact ? "text-[10px]" : "text-xs"} text-gray-500 -mt-2`}
      >
        If Maturity Age is set, Policy Term will be calculated as (Maturity Age
        - Entry Age).
      </p>

      <PropertyInput
        label="Payment Term (years)"
        type="number"
        value={paymentTerm}
        onChange={(v) => handleChange("paymentTerm", v)}
        compact={compact}
      />
      <PropertyInput
        label="Interest Rate (%)"
        type="number"
        step="0.1"
        value={interestRate}
        onChange={(v) => handleChange("interestRate", v)}
        compact={compact}
      />
    </div>
  );
};

const SelectRiskRatesParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
  compact?: boolean;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
  compact = false,
}) => {
  const { ageColumn, genderColumn } = parameters;

  const dataSource = getConnectedDataSource(
    moduleId,
    "risk_data_in",
    allModules,
    allConnections
  );
  const columnOptions = dataSource?.columns.map((c) => c.name) || [];

  const handleChange = (field: string, value: string) => {
    onParametersChange({ ...parameters, [field]: value });
  };

  if (!dataSource) {
    return (
      <p
        className={compact ? "text-xs text-gray-500" : "text-sm text-gray-500"}
      >
        Connect and run a data source to select columns.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <PropertySelect
        label="Age Column"
        value={ageColumn}
        onChange={(v) => handleChange("ageColumn", v)}
        options={columnOptions}
        compact={compact}
      />
      <PropertySelect
        label="Gender Column"
        value={genderColumn}
        onChange={(v) => handleChange("genderColumn", v)}
        options={columnOptions}
        compact={compact}
      />
    </div>
  );
};

const NetPremiumCalculatorParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const { formula, variableName } = parameters;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const premiumComponents = getConnectedPremiumComponents(
    moduleId,
    "premium_components_in",
    allModules,
    allConnections
  );
  const additionalVars = getConnectedAdditionalVariables(
    moduleId,
    "additional_vars_in",
    allModules,
    allConnections
  );
  const policyInfo = getGlobalPolicyInfoFromCanvas(allModules);

  const availableVars = useMemo(() => {
    const vars = [];
    if (premiumComponents) {
      vars.push(
        ...Object.keys(premiumComponents.nnxResults).map((k) => ({
          key: k,
          type: "NNX",
        }))
      );
      vars.push({ key: "SUMX", type: "SUMX" });
    }
    if (additionalVars) {
      vars.push(
        ...Object.keys(additionalVars.variables).map((k) => ({
          key: k,
          type: "ADDITIONAL",
        }))
      );
    }
    if (policyInfo) {
      vars.push({ key: "m", type: "POLICY", label: "m (Payment)" });
      vars.push({ key: "n", type: "POLICY", label: "n (Term)" });
    }
    return vars;
  }, [premiumComponents, additionalVars, policyInfo]);

  const handleFormulaChange = (value: string) => {
    onParametersChange({ ...parameters, formula: value });
  };

  const handleVariableNameChange = (value: string) => {
    onParametersChange({ ...parameters, variableName: value });
  };

  const insertToken = (variableKey: string) => {
    const token = `[${variableKey}]`;
    const textarea = textAreaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formula || "";
      const newText = text.substring(0, start) + token + text.substring(end);

      onParametersChange({ ...parameters, formula: newText });

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + token.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      onParametersChange({ ...parameters, formula: (formula || "") + token });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Backspace") {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start === end && start > 0) {
        const text = formula || "";
        if (text[start - 1] === "]") {
          const openBracketIndex = text.lastIndexOf("[", start - 1);
          if (openBracketIndex !== -1) {
            const token = text.substring(openBracketIndex, start);
            if (token.length > 2) {
              e.preventDefault();
              const newText =
                text.substring(0, openBracketIndex) + text.substring(start);
              onParametersChange({ ...parameters, formula: newText });

              setTimeout(() => {
                if (textAreaRef.current) {
                  textAreaRef.current.focus();
                  textAreaRef.current.setSelectionRange(
                    openBracketIndex,
                    openBracketIndex
                  );
                }
              }, 0);
            }
          }
        }
      }
    }
  };

  const getVarColor = (type: string) => {
    switch (type) {
      case "NNX":
        return "bg-blue-600 hover:bg-blue-500 text-white";
      case "SUMX":
        return "bg-green-600 hover:bg-green-500 text-white";
      case "POLICY":
        return "bg-purple-600 hover:bg-purple-500 text-white";
      case "ADDITIONAL":
        return "bg-amber-600 hover:bg-amber-500 text-white";
      default:
        return "bg-gray-600 hover:bg-gray-500 text-gray-200";
    }
  };

  const renderPreview = () => {
    if (!formula) return null;
    const parts = formula.split(/(\[[^\]]+\])/g);
    return (
      <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700 flex flex-wrap gap-1 items-center font-mono text-sm">
        <span className="text-gray-500 text-xs w-full uppercase font-bold mb-1">
          Live Preview
        </span>
        {parts.map((part, i) => {
          if (part.startsWith("[") && part.endsWith("]")) {
            const key = part.slice(1, -1);
            const variable = availableVars.find((v) => v.key === key);
            const colorClass = variable
              ? getVarColor(variable.type).replace("hover:", "")
              : "bg-gray-600 text-gray-300";
            return (
              <span
                key={i}
                className={`${colorClass} px-1.5 py-0.5 rounded text-xs shadow-sm`}
              >
                {part}
              </span>
            );
          }
          if (!part) return null;
          return (
            <span key={i} className="text-gray-300">
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">
          Available Variables (Click to Insert)
        </h4>
        {availableVars.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableVars.map((v) => (
              <button
                key={v.key}
                onClick={() => insertToken(v.key)}
                className={`${getVarColor(
                  v.type
                )} text-xs font-mono px-3 py-1.5 rounded-md transition-colors shadow-sm border border-white/10`}
                title={`Insert [${v.key}]`}
              >
                {v.label || v.key}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Connect 'Premium Component' or 'Additional Name' to see variables.
          </p>
        )}
      </div>
      <div className="flex gap-4 items-start">
        <div className="flex-grow">
          <label className="block text-sm text-gray-400 mb-1">
            Net Premium Formula
          </label>
          <textarea
            ref={textAreaRef}
            value={formula}
            onChange={(e) => handleFormulaChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder="e.g. [SUMX] / [NNX_Male_Mortality] + [Extra_Loading]"
          />
        </div>
        <div className="w-32 flex-shrink-0">
          <PropertyInput
            label="Variable Name"
            value={variableName || "PP"}
            onChange={handleVariableNameChange}
            placeholder="PP"
          />
        </div>
      </div>
      {renderPreview()}
      <p className="text-xs text-gray-500">
        Variables are treated as objects. Use the buttons above to insert them.
        Standard math operators (+, -, *, /, ()) are supported. 조건문 지원:
        IF(condition, true_value, false_value) 형식을 사용할 수 있습니다. 예:
        IF([Age] &gt; 50, [PP] * 1.1, [PP])
      </p>
    </div>
  );
};

const GrossPremiumCalculatorParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const { formula, variableName } = parameters;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const netPremiumOutput = getConnectedNetPremiumOutput(
    moduleId,
    "net_premium_in",
    allModules,
    allConnections
  );
  const additionalVars = getConnectedAdditionalVariables(
    moduleId,
    "additional_vars_in",
    allModules,
    allConnections
  );

  const availableVars = useMemo(() => {
    const vars = [];
    if (netPremiumOutput) {
      const ppName =
        netPremiumOutput.variables?.["PP"] !== undefined
          ? "PP"
          : Object.keys(netPremiumOutput.variables).pop() || "PP";
      vars.push({ key: "PP", type: "NET_PREMIUM", label: "PP (Net Premium)" });
      // Inherit context variables from NetPremiumOutput
      if (netPremiumOutput.variables) {
        vars.push(
          ...Object.keys(netPremiumOutput.variables)
            .filter((k) => k !== "PP" && k !== ppName)
            .map((k) => ({ key: k, type: "INHERITED" }))
        );
      }
    }
    if (additionalVars) {
      vars.push(
        ...Object.keys(additionalVars.variables).map((k) => ({
          key: k,
          type: "ADDITIONAL",
        }))
      );
    }
    return vars;
  }, [netPremiumOutput, additionalVars]);

  const handleFormulaChange = (value: string) => {
    onParametersChange({ ...parameters, formula: value });
  };

  const handleVariableNameChange = (value: string) => {
    onParametersChange({ ...parameters, variableName: value });
  };

  const insertToken = (variableKey: string) => {
    const token = `[${variableKey}]`;
    const textarea = textAreaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formula || "";
      const newText = text.substring(0, start) + token + text.substring(end);

      onParametersChange({ ...parameters, formula: newText });

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + token.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      onParametersChange({ ...parameters, formula: (formula || "") + token });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Backspace") {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start === end && start > 0) {
        const text = formula || "";
        if (text[start - 1] === "]") {
          const openBracketIndex = text.lastIndexOf("[", start - 1);
          if (openBracketIndex !== -1) {
            const token = text.substring(openBracketIndex, start);
            if (token.length > 2) {
              e.preventDefault();
              const newText =
                text.substring(0, openBracketIndex) + text.substring(start);
              onParametersChange({ ...parameters, formula: newText });

              setTimeout(() => {
                if (textAreaRef.current) {
                  textAreaRef.current.focus();
                  textAreaRef.current.setSelectionRange(
                    openBracketIndex,
                    openBracketIndex
                  );
                }
              }, 0);
            }
          }
        }
      }
    }
  };

  const getVarColor = (type: string) => {
    switch (type) {
      case "NET_PREMIUM":
        return "bg-green-600 hover:bg-green-500 text-white";
      case "INHERITED":
        return "bg-blue-600 hover:bg-blue-500 text-white";
      case "ADDITIONAL":
        return "bg-amber-600 hover:bg-amber-500 text-white";
      default:
        return "bg-gray-600 hover:bg-gray-500 text-gray-200";
    }
  };

  const renderPreview = () => {
    if (!formula) return null;
    const parts = formula.split(/(\[[^\]]+\])/g);
    return (
      <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700 flex flex-wrap gap-1 items-center font-mono text-sm">
        <span className="text-gray-500 text-xs w-full uppercase font-bold mb-1">
          Live Preview
        </span>
        {parts.map((part, i) => {
          if (part.startsWith("[") && part.endsWith("]")) {
            const key = part.slice(1, -1);
            const variable = availableVars.find((v) => v.key === key);
            const colorClass = variable
              ? getVarColor(variable.type).replace("hover:", "")
              : "bg-gray-600 text-gray-300";
            return (
              <span
                key={i}
                className={`${colorClass} px-1.5 py-0.5 rounded text-xs shadow-sm`}
              >
                {part}
              </span>
            );
          }
          if (!part) return null;
          return (
            <span key={i} className="text-gray-300">
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">
          Available Variables (Click to Insert)
        </h4>
        {availableVars.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableVars.map((v) => (
              <button
                key={v.key}
                onClick={() => insertToken(v.key)}
                className={`${getVarColor(
                  v.type
                )} text-xs font-mono px-3 py-1.5 rounded-md transition-colors shadow-sm border border-white/10`}
                title={`Insert [${v.key}]`}
              >
                {v.label || v.key}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Connect 'Net Premium Calculator' to see variables.
          </p>
        )}
      </div>
      <div className="flex gap-4 items-start">
        <div className="flex-grow">
          <label className="block text-sm text-gray-400 mb-1">
            Gross Premium Formula
          </label>
          <textarea
            ref={textAreaRef}
            value={formula}
            onChange={(e) => handleFormulaChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder="e.g. [PP] / (1 - [Expense_Ratio])"
          />
        </div>
        <div className="w-32 flex-shrink-0">
          <PropertyInput
            label="Variable Name"
            value={variableName || "GP"}
            onChange={handleVariableNameChange}
            placeholder="GP"
          />
        </div>
      </div>
      {renderPreview()}
      <p className="text-xs text-gray-500">
        Use [PP] for Net Premium. Inherited variables from Net Premium are also
        available. 조건문 지원: IF(condition, true_value, false_value) 형식을
        사용할 수 있습니다. 예: IF([PP] &gt; 1000, [PP] / (1 - 0.1), [PP] / (1 -
        0.05))
      </p>
    </div>
  );
};

const AdditionalNameParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const { definitions = [], basicValues = [] } = parameters;
  const dataSource = getConnectedDataSource(
    moduleId,
    "data_in",
    allModules,
    allConnections
  );
  const policyInfo = getGlobalPolicyInfoFromCanvas(allModules);
  const columns = dataSource?.columns.map((c) => c.name) || [];

  const updateDefinitions = (newDefinitions: any[]) => {
    onParametersChange({ ...parameters, definitions: newDefinitions });
  };

  const updateBasicValues = (newBasicValues: any[]) => {
    onParametersChange({ ...parameters, basicValues: newBasicValues });
  };

  const handleAddDefinition = () => {
    const newDef = {
      id: `def-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: "",
      type: "lookup", // 'static' or 'lookup'
      staticValue: 0,
      column: columns.length > 0 ? columns[0] : "",
      rowType: "policyTerm", // 'policyTerm', 'paymentTerm', 'entryAgePlus', 'custom'
      customValue: 0,
    };
    updateDefinitions([...definitions, newDef]);
  };

  const handleRemoveDefinition = (id: string) => {
    updateDefinitions(definitions.filter((d: any) => d.id !== id));
  };

  const handleUpdateDefinition = (id: string, field: string, value: any) => {
    const newDefinitions = definitions.map((d: any) =>
      d.id === id ? { ...d, [field]: value } : d
    );
    updateDefinitions(newDefinitions);
  };

  const handleUpdateBasicValue = (index: number, field: string, value: any) => {
    const newBasicValues = [...basicValues];
    newBasicValues[index] = { ...newBasicValues[index], [field]: value };
    updateBasicValues(newBasicValues);
  };

  const getPreviewValue = (def: any) => {
    if (!dataSource || !dataSource.rows) return "No Data";
    if (def.type === "static") return def.staticValue;

    if (def.type === "lookup") {
      if (!def.column) return "Select Col";
      if (!policyInfo) return "No Policy Info";

      let rowIndex = 0;
      if (def.rowType === "policyTerm") rowIndex = policyInfo.policyTerm;
      else if (def.rowType === "paymentTerm") rowIndex = policyInfo.paymentTerm;
      else if (def.rowType === "entryAgePlus")
        rowIndex = Number(def.customValue) || 0;
      // Assuming index maps to duration
      else if (def.rowType === "custom")
        rowIndex = Number(def.customValue) || 0;

      if (rowIndex < 0 || rowIndex >= dataSource.rows.length)
        return "Index Out of Bounds";
      const val = dataSource.rows[rowIndex][def.column];
      return val !== undefined ? Number(val).toFixed(5) : "Empty";
    }
    return "-";
  };

  if (!dataSource)
    return (
      <p className="text-sm text-gray-500">
        Connect and run 'Nx Mx Calculator' (or any data source) to enable
        variable lookup.
      </p>
    );

  return (
    <div className="space-y-6">
      {/* Basic Loadings Section */}
      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">Basic Loadings</h4>
        <div className="grid grid-cols-5 gap-2">
          {basicValues.map((bv: any, index: number) => (
            <div
              key={index}
              className="bg-gray-900/50 p-2 rounded-md border border-gray-600 flex flex-col gap-2"
            >
              <input
                type="text"
                value={bv.name}
                onChange={(e) =>
                  handleUpdateBasicValue(index, "name", e.target.value)
                }
                className="w-full bg-gray-800 text-center text-gray-300 border border-gray-700 rounded px-1 py-1 text-xs focus:outline-none focus:border-blue-500"
                placeholder="Name"
              />
              <input
                type="number"
                value={bv.value}
                onChange={(e) =>
                  handleUpdateBasicValue(
                    index,
                    "value",
                    parseFloat(e.target.value) || 0
                  )
                }
                step="0.001"
                className="w-full bg-gray-700 text-center text-white border border-gray-600 rounded px-1 py-1 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Variables Section */}
      <div className="space-y-4">
        <h4 className="text-sm text-gray-400 font-bold mb-2">
          Additional Variable Definitions
        </h4>
        <div className="space-y-3">
          {definitions.map((def: any) => (
            <div
              key={def.id}
              className="bg-gray-900/50 p-3 rounded-md border border-gray-600 relative flex flex-col gap-2"
            >
              <button
                onClick={() => handleRemoveDefinition(def.id)}
                className="absolute top-1.5 right-1.5 text-gray-500 hover:text-white"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>

              {/* Name Input */}
              <div className="flex items-center bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm h-[38px] w-full">
                <span className="text-gray-400 mr-2 font-bold">Var Name:</span>
                <input
                  type="text"
                  placeholder="e.g. Extra_Loading"
                  value={def.name}
                  onChange={(e) =>
                    handleUpdateDefinition(def.id, "name", e.target.value)
                  }
                  className="flex-grow bg-transparent focus:outline-none text-gray-200 placeholder-gray-500"
                />
              </div>

              {/* Type Selector */}
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`type-${def.id}`}
                    checked={def.type === "static"}
                    onChange={() =>
                      handleUpdateDefinition(def.id, "type", "static")
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Static Value</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`type-${def.id}`}
                    checked={def.type === "lookup"}
                    onChange={() =>
                      handleUpdateDefinition(def.id, "type", "lookup")
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Table Lookup</span>
                </label>
              </div>

              {/* Conditional Inputs */}
              {def.type === "static" ? (
                <PropertyInput
                  label="Value"
                  type="number"
                  value={def.staticValue}
                  onChange={(v) =>
                    handleUpdateDefinition(def.id, "staticValue", v)
                  }
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <PropertySelect
                    label="Column"
                    value={def.column}
                    onChange={(v) =>
                      handleUpdateDefinition(def.id, "column", v)
                    }
                    options={columns}
                  />
                  <PropertySelect
                    label="Row Index Rule"
                    value={def.rowType}
                    onChange={(v) =>
                      handleUpdateDefinition(def.id, "rowType", v)
                    }
                    options={[
                      { label: "Policy Term (End)", value: "policyTerm" },
                      { label: "Payment Term (End)", value: "paymentTerm" },
                      { label: "Entry Age + X years", value: "entryAgePlus" },
                      { label: "Custom Row Index", value: "custom" },
                    ]}
                  />
                  {(def.rowType === "entryAgePlus" ||
                    def.rowType === "custom") && (
                    <div className="col-span-2">
                      <PropertyInput
                        label={
                          def.rowType === "entryAgePlus"
                            ? "Years after Entry Age (Duration)"
                            : "Row Index (0-based)"
                        }
                        type="number"
                        value={def.customValue}
                        onChange={(v) =>
                          handleUpdateDefinition(def.id, "customValue", v)
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Live Preview */}
              <div className="text-xs text-gray-400 mt-1 flex justify-between items-center bg-gray-800 px-2 py-1 rounded">
                <span>Preview Value:</span>
                <span className="font-mono font-bold text-green-400">
                  {getPreviewValue(def)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleAddDefinition}
          className="w-full mt-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-md font-semibold"
        >
          Add Variable
        </button>
      </div>
    </div>
  );
};

const LoadDataParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  folderHandle: FileSystemDirectoryHandle | null;
}> = ({ parameters, onParametersChange, folderHandle }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onParametersChange({ source: file.name, fileContent: content });
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = (sample: { name: string; content: string }) => {
    onParametersChange({ source: sample.name, fileContent: sample.content });
  };

  const handleBrowseClick = async () => {
    if (folderHandle && (window as any).showOpenFilePicker) {
      try {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          startIn: folderHandle,
          types: [
            { description: "CSV Files", accept: { "text/csv": [".csv"] } },
          ],
        });
        const file = await fileHandle.getFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onParametersChange({ source: file.name, fileContent: content });
        };
        reader.readAsText(file);
      } catch (error: any) {
        if (error.name !== "AbortError") fileInputRef.current?.click();
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      <label className="block text-sm text-gray-400 mb-1">Source</label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={parameters.source}
          readOnly
          className="flex-grow bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm"
          placeholder="No file selected"
        />
        <button
          onClick={handleBrowseClick}
          className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 rounded-md font-semibold"
        >
          Browse...
        </button>
      </div>
      <div className="mt-4">
        <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">
          Examples
        </h4>
        <div className="bg-gray-900 p-2 rounded-md space-y-1">
          {SAMPLE_DATA.filter((s) => s.name.includes(".csv")).map((sample) => (
            <div
              key={sample.name}
              onDoubleClick={() => handleLoadSample(sample)}
              className="px-2 py-1.5 text-sm rounded-md hover:bg-gray-700 cursor-pointer"
              title="Double-click to load"
            >
              {sample.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SelectionItem {
  originalName: string;
  selected: boolean;
  newName: string;
}

const SelectDataParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const dataSource = getConnectedDataSource(
    moduleId,
    "data_in",
    allModules,
    allConnections
  );
  const inputColumns = dataSource?.columns.map((c) => c.name) || [];

  const [selections, setSelections] = useState<SelectionItem[]>(() => {
    const existingSelections = parameters.selections || [];
    const existingSelectionMap = new Map(
      existingSelections.map((s: any) => [s.originalName, s])
    );

    return inputColumns.map((colName) => {
      if (existingSelectionMap.has(colName)) {
        return existingSelectionMap.get(colName) as SelectionItem;
      }
      return { originalName: colName, selected: true, newName: colName };
    });
  });

  useEffect(() => {
    const existingSelections = parameters.selections || [];
    const existingSelectionMap = new Map(
      existingSelections.map((s: any) => [s.originalName, s])
    );

    const newSelections: SelectionItem[] = inputColumns.map((colName) => {
      const existing = existingSelectionMap.get(colName);
      if (existing) {
        return existing as SelectionItem;
      }
      return { originalName: colName, selected: true, newName: colName };
    });

    if (JSON.stringify(newSelections) !== JSON.stringify(selections)) {
      setSelections(newSelections);
    }

    if (existingSelections.length === 0 && newSelections.length > 0) {
      onParametersChange({ selections: newSelections });
    }
  }, [inputColumns.join(",")]);

  const handleSelectionChange = (index: number, selected: boolean) => {
    const newSelections = [...selections];
    newSelections[index] = { ...newSelections[index], selected };
    setSelections(newSelections);
    onParametersChange({ selections: newSelections });
  };

  const handleNameChange = (index: number, newName: string) => {
    const newSelections = [...selections];
    newSelections[index] = { ...newSelections[index], newName };
    setSelections(newSelections);
    onParametersChange({ selections: newSelections });
  };

  const handleSelectAll = () => {
    const newSelections = selections.map((s) => ({ ...s, selected: true }));
    setSelections(newSelections);
    onParametersChange({ selections: newSelections });
  };

  const handleDeselectAll = () => {
    const newSelections = selections.map((s) => ({ ...s, selected: false }));
    setSelections(newSelections);
    onParametersChange({ selections: newSelections });
  };

  if (!dataSource) {
    return (
      <p className="text-sm text-gray-500">
        Connect and run a data source to select columns.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm text-gray-400 font-bold mb-2">
        Column Selections
      </h4>
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleSelectAll}
          className="px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-500 rounded-md font-semibold w-full"
        >
          Select All
        </button>
        <button
          onClick={handleDeselectAll}
          className="px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-500 rounded-md font-semibold w-full"
        >
          Deselect All
        </button>
      </div>
      <div className="grid grid-cols-[auto,1fr] gap-x-3 items-center mb-2 px-2">
        <div />
        <div className="grid grid-cols-2 gap-x-3">
          <label className="text-sm text-gray-400 font-bold">
            Original Name
          </label>
          <label className="text-sm text-gray-400 font-bold">New Name</label>
        </div>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 panel-scrollbar">
        {selections.map((selection, index) => (
          <div
            key={selection.originalName}
            className="grid grid-cols-[auto,1fr] gap-x-3 items-center bg-gray-900/50 p-2 rounded-md"
          >
            <input
              type="checkbox"
              checked={selection.selected}
              onChange={(e) => handleSelectionChange(index, e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-x-3">
              <span
                className="text-sm text-gray-300 truncate bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600"
                title={selection.originalName}
              >
                {selection.originalName}
              </span>
              <input
                type="text"
                value={selection.newName}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="New column name"
                disabled={
                  selection.originalName === "Age" ||
                  selection.originalName === "Gender"
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RateModifierParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const { calculations = [] } = parameters;
  const dataSource = getConnectedDataSource(
    moduleId,
    "data_in",
    allModules,
    allConnections
  );
  const availableColumns = dataSource?.columns.map((c) => c.name) || [];

  const formulaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const updateCalculations = (newCalculations: any[]) => {
    onParametersChange({ calculations: newCalculations });
  };

  const handleAddCalculation = () => {
    const newCalc = {
      id: `rate-mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      newColumnName: "",
      formula: "",
    };
    updateCalculations([...calculations, newCalc]);
  };

  const handleRemoveCalculation = (id: string) => {
    updateCalculations(calculations.filter((c: any) => c.id !== id));
    if (formulaRefs.current.has(id)) formulaRefs.current.delete(id);
  };

  const handleUpdateCalculation = (id: string, field: string, value: any) => {
    updateCalculations(
      calculations.map((c: any) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const insertToken = (calcId: string, token: string) => {
    const textarea = formulaRefs.current.get(calcId);
    const calc = calculations.find((c: any) => c.id === calcId);
    if (textarea && calc) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = calc.formula || "";
      const newText = text.substring(0, start) + token + text.substring(end);

      handleUpdateCalculation(calcId, "formula", newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + token.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else if (calc) {
      handleUpdateCalculation(calcId, "formula", (calc.formula || "") + token);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    calcId: string
  ) => {
    if (e.key === "Backspace") {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const calc = calculations.find((c: any) => c.id === calcId);
      const text = calc?.formula || "";

      if (start === end && start > 0) {
        if (text[start - 1] === "]") {
          const openBracketIndex = text.lastIndexOf("[", start - 1);
          if (openBracketIndex !== -1) {
            const token = text.substring(openBracketIndex, start);
            if (token.length > 2) {
              e.preventDefault();
              const newText =
                text.substring(0, openBracketIndex) + text.substring(start);
              handleUpdateCalculation(calcId, "formula", newText);

              setTimeout(() => {
                if (textarea) {
                  textarea.focus();
                  textarea.setSelectionRange(
                    openBracketIndex,
                    openBracketIndex
                  );
                }
              }, 0);
            }
          }
        }
      }
    }
  };

  const renderPreview = (formula: string) => {
    if (!formula) return null;
    const parts = formula.split(/(\[[^\]]+\])/g);
    return (
      <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700 flex flex-wrap gap-1 items-center font-mono text-sm">
        <span className="text-gray-500 text-xs w-full uppercase font-bold mb-1">
          Live Preview
        </span>
        {parts.map((part, i) => {
          if (part.startsWith("[") && part.endsWith("]")) {
            return (
              <span
                key={i}
                className="bg-blue-600 px-1.5 py-0.5 rounded text-xs shadow-sm text-white"
              >
                {part}
              </span>
            );
          }
          if (!part) return null;
          return (
            <span key={i} className="text-gray-300">
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  if (!dataSource)
    return (
      <p className="text-sm text-gray-500">Connect and run a data source.</p>
    );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">
          Rate Modifications
        </h4>
        <div className="space-y-4">
          {calculations.map((calc: any) => (
            <div
              key={calc.id}
              className="bg-gray-900/50 p-3 rounded-md border border-gray-600 relative flex flex-col gap-3"
            >
              <button
                onClick={() => handleRemoveCalculation(calc.id)}
                className="absolute top-1.5 right-1.5 text-gray-500 hover:text-white"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>

              <PropertyInput
                label="New Column Name"
                value={calc.newColumnName}
                onChange={(v) =>
                  handleUpdateCalculation(calc.id, "newColumnName", v)
                }
              />

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Formula
                </label>
                <textarea
                  ref={(el) => {
                    if (el) formulaRefs.current.set(calc.id, el);
                    else formulaRefs.current.delete(calc.id);
                  }}
                  value={calc.formula}
                  onChange={(e) =>
                    handleUpdateCalculation(calc.id, "formula", e.target.value)
                  }
                  onKeyDown={(e) => handleKeyDown(e, calc.id)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 min-h-[80px]"
                  placeholder="e.g. [Male_Cancer] * 0.9"
                />
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto panel-scrollbar bg-gray-800 p-1 rounded mb-2">
                  <span className="text-xs text-gray-500 w-full mb-1">
                    Click to add variable:
                  </span>
                  {availableColumns.map((col) => (
                    <button
                      key={col}
                      onClick={() => insertToken(calc.id, `[${col}]`)}
                      className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-200 whitespace-nowrap"
                    >
                      {col}
                    </button>
                  ))}
                  <button
                    onClick={() => insertToken(calc.id, "[PaymentTerm]")}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs text-gray-200 whitespace-nowrap"
                    title="Payment Term from Policy Info"
                  >
                    PaymentTerm
                  </button>
                  <button
                    onClick={() => insertToken(calc.id, "[PolicyTerm]")}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs text-gray-200 whitespace-nowrap"
                    title="Policy Term from Policy Info"
                  >
                    PolicyTerm
                  </button>
                </div>
                {renderPreview(calc.formula)}
              </div>
            </div>
          ))}
          <button
            onClick={handleAddCalculation}
            className="w-full px-3 py-2 text-sm bg-blue-600/80 hover:bg-blue-600 rounded-md font-semibold"
          >
            Add Modification Rule
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          조건문 지원: IF(condition, true_value, false_value) 형식을 사용할 수
          있습니다. 예: IF([Age] &gt; 50, [Value] * 1.1, [Value])
        </p>
      </div>
    </div>
  );
};

const CalculateSurvivorsParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const { ageColumn, mortalityColumn, calculations } = parameters;
  const [selectedRates, setSelectedRates] = useState<Record<string, string>>(
    {}
  );

  const dataSource = getConnectedDataSource(
    moduleId,
    "data_in",
    allModules,
    allConnections
  );
  const numericColumns =
    dataSource?.columns
      .filter(
        (c) =>
          c.type === "number" && c.name !== "i_prem" && c.name !== "i_claim"
      )
      .map((c) => c.name) || [];
  const columnOptions = ["None", ...numericColumns];

  useEffect(() => {
    setSelectedRates((prevRates) => {
      const newRates: Record<string, string> = {};
      (calculations || []).forEach((calc: any) => {
        newRates[calc.id] = prevRates[calc.id] || "";
      });
      return newRates;
    });
  }, [calculations]);

  const updateCalculations = (newCalculations: any[]) => {
    onParametersChange({ ...parameters, calculations: newCalculations });
  };

  const handleAddCalculation = () => {
    const newCalcId = `calc-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    const newCalc = {
      id: newCalcId,
      name: "",
      decrementRates: [],
    };
    updateCalculations([...(calculations || []), newCalc]);
  };

  const handleRemoveCalculation = (id: string) => {
    updateCalculations((calculations || []).filter((c: any) => c.id !== id));
  };

  const handleAddRateToCalc = (id: string) => {
    const rateToAdd = selectedRates[id];
    if (!rateToAdd) return;

    const newCalculations = (calculations || []).map((calc: any) => {
      if (calc.id === id && !(calc.decrementRates || []).includes(rateToAdd)) {
        const newRates = [...(calc.decrementRates || []), rateToAdd].sort();
        return {
          ...calc,
          name: newRates.join("_"),
          decrementRates: newRates,
        };
      }
      return calc;
    });
    updateCalculations(newCalculations);
  };

  const handleRemoveRateFromCalc = (id: string, rate: string) => {
    const newCalculations = (calculations || []).map((calc: any) => {
      if (calc.id === id) {
        const newRates = (calc.decrementRates || []).filter(
          (r: string) => r !== rate
        );
        return {
          ...calc,
          name: newRates.join("_"),
          decrementRates: newRates,
        };
      }
      return calc;
    });
    updateCalculations(newCalculations);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <PropertySelect
          label="Age Column"
          value={ageColumn || "None"}
          onChange={(v) => onParametersChange({ ...parameters, ageColumn: v })}
          options={columnOptions}
        />
        <PropertySelect
          label="Mortality Rate Column"
          value={mortalityColumn || "None"}
          onChange={(v) =>
            onParametersChange({ ...parameters, mortalityColumn: v })
          }
          options={columnOptions}
        />
      </div>

      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">
          Survivors (lx) Calculations
        </h4>
        {numericColumns.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-col space-y-2">
              {(calculations || []).map((calc: any) => {
                const availableRates = numericColumns.filter(
                  (c) =>
                    c !== ageColumn && !(calc.decrementRates || []).includes(c)
                );
                return (
                  <div
                    key={calc.id}
                    className="bg-gray-900/50 p-3 rounded-md border border-gray-600 relative flex flex-col gap-2"
                  >
                    <button
                      onClick={() => handleRemoveCalculation(calc.id)}
                      className="absolute top-1.5 right-1.5 text-gray-500 hover:text-white z-10"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="flex items-center bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm h-[38px]"
                        title={`Resulting column name: lx_${calc.name}`}
                      >
                        <span className="text-gray-400">lx_</span>
                        <input
                          type="text"
                          placeholder="<auto-generated>"
                          value={calc.name}
                          readOnly
                          className="w-32 bg-transparent focus:outline-none text-gray-400 cursor-default"
                        />
                      </div>

                      <div className="flex-grow bg-gray-700 p-1.5 rounded-md border border-gray-600 min-h-[38px] flex flex-wrap gap-1 content-start items-center">
                        {(calc.decrementRates || []).length === 0 && (
                          <p className="text-xs text-gray-500 px-1">
                            Add decrement rates...
                          </p>
                        )}
                        {(calc.decrementRates || []).map((rate: string) => (
                          <div
                            key={rate}
                            className="flex items-center gap-1 bg-blue-600/50 text-blue-100 px-2 py-0.5 rounded text-xs h-fit"
                          >
                            <span>{rate}</span>
                            <button
                              onClick={() =>
                                handleRemoveRateFromCalc(calc.id, rate)
                              }
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <select
                          value={selectedRates[calc.id] || ""}
                          onChange={(e) =>
                            setSelectedRates((prev) => ({
                              ...prev,
                              [calc.id]: e.target.value,
                            }))
                          }
                          className="w-40 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm h-[38px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={availableRates.length === 0}
                        >
                          <option value="" disabled>
                            -- Select Decrement Rate --
                          </option>
                          {availableRates.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddRateToCalc(calc.id)}
                          disabled={!selectedRates[calc.id]}
                          className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 rounded-md font-semibold whitespace-nowrap h-[38px] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          Add Rate
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Outputs:{" "}
                      <span className="text-blue-300">
                        lx_{calc.name || "?"}
                      </span>
                      ,{" "}
                      <span className="text-blue-300">
                        Dx_{calc.name || "?"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleAddCalculation}
              className="w-full mt-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-md font-semibold"
            >
              Add Calculation
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Connect and run a data source to select risk rate columns.
          </p>
        )}
      </div>
    </>
  );
};

const ClaimsCalculatorParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const { calculations } = parameters;
  const dataSource = getConnectedDataSource(
    moduleId,
    "data_in",
    allModules,
    allConnections
  );

  const numericColumns = React.useMemo(() => {
    if (!dataSource) return [];
    const excludedNames = [
      "age",
      "sex",
      "gender",
      "entryage",
      "i_prem",
      "i_claim",
    ];
    return dataSource.columns
      .filter(
        (c) =>
          c.type === "number" && !excludedNames.includes(c.name.toLowerCase())
      )
      .map((c) => c.name);
  }, [dataSource]);

  const lxOptions = useMemo(
    () => numericColumns.filter((c) => c.startsWith("lx_")),
    [numericColumns]
  );
  const riskOptions = useMemo(
    () => numericColumns.filter((c) => !c.startsWith("lx_")),
    [numericColumns]
  );

  const updateCalculations = (newCalculations: any[]) => {
    onParametersChange({ calculations: newCalculations });
  };

  const handleAddCalculation = useCallback(() => {
    // Automatically select the first 'lx_' column as default if available
    const defaultLx = lxOptions.length > 0 ? lxOptions[0] : "";

    const newCalc = {
      id: `claim-calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lxColumn: defaultLx,
      riskRateColumn: "",
      name: "",
    };
    updateCalculations([...(calculations || []), newCalc]);
  }, [calculations, lxOptions]);

  const handleRemoveCalculation = (id: string) => {
    updateCalculations((calculations || []).filter((c: any) => c.id !== id));
  };

  const handleUpdateCalculation = (
    id: string,
    field: "lxColumn" | "riskRateColumn" | "name",
    value: string
  ) => {
    const newCalculations = (calculations || []).map((c: any) => {
      if (c.id === id) {
        const updatedCalc = { ...c, [field]: value };
        // If updating riskRateColumn, always auto-fill name to match selection
        if (field === "riskRateColumn") {
          updatedCalc.name = value;
        }
        return updatedCalc;
      }
      return c;
    });
    updateCalculations(newCalculations);
  };

  // Ensure at least one calculation exists by default
  useEffect(() => {
    if (!calculations || calculations.length === 0) {
      handleAddCalculation();
    }
  }, [calculations?.length, handleAddCalculation]);

  if (!dataSource) {
    return (
      <p className="text-sm text-gray-500">
        Connect and run a data source to select columns.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm text-gray-400 font-bold mb-2">
        Claim (dx) and Commutation (Cx) Calculations
      </h4>
      <div className="space-y-2">
        {(calculations || []).map((calc: any) => (
          <div
            key={calc.id}
            className="bg-gray-900/50 p-3 rounded-md border border-gray-600 relative flex flex-col gap-2"
          >
            <button
              onClick={() => handleRemoveCalculation(calc.id)}
              className="absolute top-1.5 right-1.5 text-gray-500 hover:text-white"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 w-full mb-2">
              <div
                className="flex items-center bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm h-[38px]"
                title={`Resulting prefix name: dx_${
                  calc.name || calc.riskRateColumn
                }`}
              >
                <span className="text-gray-400 mr-1">Name:</span>
                <input
                  type="text"
                  placeholder={calc.riskRateColumn || "Optional Name"}
                  value={calc.name || ""}
                  onChange={(e) =>
                    handleUpdateCalculation(calc.id, "name", e.target.value)
                  }
                  className="w-32 bg-transparent focus:outline-none text-gray-200 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-4 items-center w-full">
              <PropertySelect
                label="Survivors (lx) Column"
                value={calc.lxColumn}
                onChange={(v) =>
                  handleUpdateCalculation(calc.id, "lxColumn", v)
                }
                options={lxOptions}
                placeholder="Select lx..."
              />
              <PropertySelect
                label="Risk Rate Column (q)"
                value={calc.riskRateColumn}
                onChange={(v) =>
                  handleUpdateCalculation(calc.id, "riskRateColumn", v)
                }
                options={riskOptions}
                placeholder="Select rate..."
              />
            </div>
            <div className="text-xs text-gray-500">
              Outputs:{" "}
              <span className="text-blue-300">
                dx_{calc.name || calc.riskRateColumn || "?"}
              </span>
              ,{" "}
              <span className="text-blue-300">
                Cx_{calc.name || calc.riskRateColumn || "?"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddCalculation}
        className="w-full mt-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-md font-semibold"
      >
        Add Calculation
      </button>
    </div>
  );
};

const NxMxCalculatorParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const dataSource = getConnectedDataSource(
    moduleId,
    "data_in",
    allModules,
    allConnections
  );
  const dxColumns = useMemo(
    () =>
      dataSource?.columns
        .filter((c) => c.name.startsWith("Dx_"))
        .map((c) => c.name) || [],
    [dataSource]
  );
  const cxColumns = useMemo(
    () =>
      dataSource?.columns
        .filter((c) => c.name.startsWith("Cx_"))
        .map((c) => c.name) || [],
    [dataSource]
  );

  const { nxCalculations = [], mxCalculations = [] } = parameters;

  const updateCalculations = (
    field: "nxCalculations" | "mxCalculations",
    newCalculations: any[]
  ) => {
    onParametersChange({ [field]: newCalculations });
  };

  // Auto-populate Nx calculations from Dx columns
  useEffect(() => {
    // Only populate if data exists and NO calculations exist yet
    if (dxColumns.length > 0 && nxCalculations.length === 0) {
      const col = dxColumns[0];
      const newCalc = {
        id: `nx-auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        baseColumn: col,
        name: col.replace(/^Dx_/, ""),
        active: true,
      };
      updateCalculations("nxCalculations", [newCalc]);
    }
  }, [dxColumns.join(","), nxCalculations.length]);

  // Auto-populate Mx calculations from Cx columns
  useEffect(() => {
    if (cxColumns.length > 0) {
      const existingBase = new Set(
        mxCalculations.map((c: any) => c.baseColumn)
      );
      const missing = cxColumns.filter((c) => !existingBase.has(c));
      if (missing.length > 0) {
        const newCalcs = missing.map((col) => ({
          id: `mx-auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          baseColumn: col,
          name: col.replace(/^Cx_/, ""),
          active: true,
          deductibleType: "0",
          customDeductible: 0,
          paymentRatios: [
            { year: 1, type: "100%", customValue: 100 },
            { year: 2, type: "100%", customValue: 100 },
            { year: 3, type: "100%", customValue: 100 },
          ],
        }));
        updateCalculations("mxCalculations", [...mxCalculations, ...newCalcs]);
      }
    }
  }, [cxColumns.join(",")]);

  const handleAdd = (field: "nxCalculations" | "mxCalculations") => {
    const prefix = field === "nxCalculations" ? "nx" : "mx";
    const newCalc = {
      id: `${prefix}-calc-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      baseColumn: "",
      name: "",
      active: true,
      ...(field === "mxCalculations" && {
        deductibleType: "0",
        customDeductible: 0,
        paymentRatios: [
          { year: 1, type: "100%", customValue: 100 },
          { year: 2, type: "100%", customValue: 100 },
          { year: 3, type: "100%", customValue: 100 },
        ],
      }),
    };
    updateCalculations(field, [
      ...(field === "nxCalculations" ? nxCalculations : mxCalculations),
      newCalc,
    ]);
  };

  const handleRemove = (field: string, id: string) => {
    const current =
      field === "nxCalculations" ? nxCalculations : mxCalculations;
    updateCalculations(
      field as "nxCalculations" | "mxCalculations",
      current.filter((c: any) => c.id !== id)
    );
  };

  const handleUpdate = (field: string, id: string, updatedValues: any) => {
    const current =
      field === "nxCalculations" ? nxCalculations : mxCalculations;
    const newCalcs = current.map((c: any) =>
      c.id === id ? { ...c, ...updatedValues } : c
    );
    updateCalculations(field as "nxCalculations" | "mxCalculations", newCalcs);
  };

  const handleUpdatePaymentRatio = (
    calcId: string,
    year: number,
    field: "type" | "customValue",
    value: any
  ) => {
    const calc = mxCalculations.find((c: any) => c.id === calcId);
    if (!calc) return;
    const newRatios = (calc.paymentRatios || []).map((r: any) =>
      r.year === year ? { ...r, [field]: value } : r
    );
    handleUpdate("mxCalculations", calcId, { paymentRatios: newRatios });
  };

  if (!dataSource)
    return (
      <p className="text-sm text-gray-500">Connect and run a data source.</p>
    );

  return (
    <div className="space-y-6">
      {/* Nx Calculations */}
      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">Nx Calculator</h4>
        <div className="space-y-2">
          {nxCalculations.map((calc: any) => (
            <div
              key={calc.id}
              className="bg-gray-900/50 p-2 rounded-md border border-gray-600 flex items-center gap-2"
            >
              <div className="absolute top-1.5 right-1.5 flex items-center gap-2">
                <ToggleSwitch
                  checked={calc.active !== false}
                  onChange={(val) =>
                    handleUpdate("nxCalculations", calc.id, { active: val })
                  }
                />
                <button
                  onClick={() => handleRemove("nxCalculations", calc.id)}
                  className="text-gray-500 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-4 items-center w-full pr-20">
                <PropertySelect
                  label="Base Column (Dx)"
                  value={calc.baseColumn}
                  onChange={(v) =>
                    handleUpdate("nxCalculations", calc.id, {
                      baseColumn: v,
                      name: v.replace(/^Dx_/, ""),
                    })
                  }
                  options={dxColumns}
                />
              </div>
              <div className="text-xs text-gray-500">
                Output:{" "}
                <span
                  className={
                    calc.active !== false
                      ? "text-blue-300"
                      : "text-gray-500 line-through"
                  }
                >
                  Nx_{calc.name || "?"}
                </span>
              </div>
            </div>
          ))}
          <button
            onClick={() => handleAdd("nxCalculations")}
            className="w-full px-3 py-2 text-sm bg-blue-600/80 hover:bg-blue-600 rounded-md font-semibold"
          >
            Add Nx Calculation
          </button>
        </div>
      </div>

      {/* Mx Calculations */}
      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">Mx Calculator</h4>
        <div className="space-y-2">
          {mxCalculations.map((calc: any) => (
            <div
              key={calc.id}
              className="bg-gray-900/50 p-3 rounded-md border border-gray-600 relative space-y-3"
            >
              <div className="absolute top-1.5 right-1.5 flex items-center gap-2">
                <ToggleSwitch
                  checked={calc.active !== false}
                  onChange={(val) =>
                    handleUpdate("mxCalculations", calc.id, { active: val })
                  }
                />
                <button
                  onClick={() => handleRemove("mxCalculations", calc.id)}
                  className="text-gray-500 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <PropertySelect
                label="Base Column (Cx)"
                value={calc.baseColumn}
                onChange={(v) =>
                  handleUpdate("mxCalculations", calc.id, {
                    baseColumn: v,
                    name: v.replace(/^Cx_/, ""),
                  })
                }
                options={cxColumns}
              />

              <div className="grid grid-cols-2 gap-4">
                <PropertySelect
                  label="Deductible / Adjustment"
                  value={calc.deductibleType}
                  onChange={(v) =>
                    handleUpdate("mxCalculations", calc.id, {
                      deductibleType: v,
                    })
                  }
                  options={[
                    { label: "None (100%)", value: "0" },
                    { label: "25% Deductible", value: "0.25" },
                    { label: "50% Deductible", value: "0.5" },
                    { label: "Custom %", value: "custom" },
                  ]}
                />
                {calc.deductibleType === "custom" && (
                  <PropertyInput
                    label="Custom Deductible (0-1)"
                    type="number"
                    step="0.01"
                    value={calc.customDeductible}
                    onChange={(v) =>
                      handleUpdate("mxCalculations", calc.id, {
                        customDeductible: v,
                      })
                    }
                  />
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 font-bold">
                  Payment Schedule (First 3 Years)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(calc.paymentRatios || []).map((ratio: any) => (
                    <div
                      key={ratio.year}
                      className="bg-gray-800 p-1.5 rounded text-xs"
                    >
                      <div className="text-gray-500 mb-1 text-center">
                        Year {ratio.year}
                      </div>
                      <select
                        value={ratio.type}
                        onChange={(e) =>
                          handleUpdatePaymentRatio(
                            calc.id,
                            ratio.year,
                            "type",
                            e.target.value
                          )
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-xs mb-1"
                      >
                        <option value="100%">100%</option>
                        <option value="50%">50%</option>
                        <option value="0%">0%</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {ratio.type === "Custom" && (
                        <input
                          type="number"
                          value={ratio.customValue}
                          onChange={(e) =>
                            handleUpdatePaymentRatio(
                              calc.id,
                              ratio.year,
                              "customValue",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Output:{" "}
                <span
                  className={
                    calc.active !== false
                      ? "text-blue-300"
                      : "text-gray-500 line-through"
                  }
                >
                  Mx_{calc.name || "?"}
                </span>
              </div>
            </div>
          ))}
          <button
            onClick={() => handleAdd("mxCalculations")}
            className="w-full px-3 py-2 text-sm bg-blue-600/80 hover:bg-blue-600 rounded-md font-semibold"
          >
            Add Mx Calculation
          </button>
        </div>
      </div>
    </div>
  );
};

const PremiumComponentParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
  allConnections: Connection[];
  moduleId: string;
}> = ({
  parameters,
  onParametersChange,
  allModules,
  allConnections,
  moduleId,
}) => {
  const dataSource = getConnectedDataSource(
    moduleId,
    "data_in",
    allModules,
    allConnections
  );
  const nxColumns = useMemo(
    () =>
      dataSource?.columns
        .filter((c) => c.name.startsWith("Nx_"))
        .map((c) => c.name) || [],
    [dataSource]
  );
  const mxColumns = useMemo(
    () =>
      dataSource?.columns
        .filter((c) => c.name.startsWith("Mx_"))
        .map((c) => c.name) || [],
    [dataSource]
  );

  const { nnxCalculations = [], sumxCalculations = [] } = parameters;

  const updateCalculations = (
    field: "nnxCalculations" | "sumxCalculations",
    newCalculations: any[]
  ) => {
    onParametersChange({ [field]: newCalculations });
  };

  // Auto populate
  useEffect(() => {
    if (nxColumns.length > 0 && nnxCalculations.length === 0) {
      const newCalcs = nxColumns.map((col) => ({
        id: `nnx-auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nxColumn: col,
      }));
      updateCalculations("nnxCalculations", newCalcs);
    }
  }, [nxColumns.join(",")]);

  useEffect(() => {
    if (mxColumns.length > 0 && sumxCalculations.length === 0) {
      // Default amount to 10000 for convenience
      const newCalcs = mxColumns.map((col) => ({
        id: `sumx-auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        mxColumn: col,
        amount: 10000,
      }));
      updateCalculations("sumxCalculations", newCalcs);
    }
  }, [mxColumns.join(",")]);

  const handleAdd = (field: "nnxCalculations" | "sumxCalculations") => {
    const newCalc = {
      id: `${field === "nnxCalculations" ? "nnx" : "sumx"}-calc-${Date.now()}`,
      ...(field === "nnxCalculations"
        ? { nxColumn: "" }
        : { mxColumn: "", amount: 0 }),
    };
    updateCalculations(field, [
      ...(field === "nnxCalculations" ? nnxCalculations : sumxCalculations),
      newCalc,
    ]);
  };

  const handleRemove = (
    field: "nnxCalculations" | "sumxCalculations",
    id: string
  ) => {
    const current =
      field === "nnxCalculations" ? nnxCalculations : sumxCalculations;
    updateCalculations(
      field,
      current.filter((c: any) => c.id !== id)
    );
  };

  const handleUpdate = (
    field: "nnxCalculations" | "sumxCalculations",
    id: string,
    updatedValues: any
  ) => {
    const current =
      field === "nnxCalculations" ? nnxCalculations : sumxCalculations;
    const newCalcs = current.map((c: any) =>
      c.id === id ? { ...c, ...updatedValues } : c
    );
    updateCalculations(field, newCalcs);
  };

  if (!dataSource)
    return (
      <p className="text-sm text-gray-500">Connect and run a data source.</p>
    );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">
          NNX Components (Annuity Factors)
        </h4>
        <div className="space-y-2">
          {nnxCalculations.map((calc: any) => (
            <div
              key={calc.id}
              className="bg-gray-900/50 p-2 rounded-md border border-gray-600 flex items-center gap-2"
            >
              <PropertySelect
                label=""
                value={calc.nxColumn}
                onChange={(v) =>
                  handleUpdate("nnxCalculations", calc.id, { nxColumn: v })
                }
                options={nxColumns}
                placeholder="Select Nx"
              />
              <button
                onClick={() => handleRemove("nnxCalculations", calc.id)}
                className="mt-5 text-gray-500 hover:text-white"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => handleAdd("nnxCalculations")}
            className="w-full px-3 py-1.5 text-xs bg-blue-600/80 hover:bg-blue-600 rounded-md"
          >
            Add NNX
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-400 font-bold mb-2">
          SUMX Components (Benefit Factors)
        </h4>
        <div className="space-y-2">
          {sumxCalculations.map((calc: any) => (
            <div
              key={calc.id}
              className="bg-gray-900/50 p-3 rounded-md border border-gray-600 relative space-y-2"
            >
              <button
                onClick={() => handleRemove("sumxCalculations", calc.id)}
                className="absolute top-1.5 right-1.5 text-gray-500 hover:text-white"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
              <PropertySelect
                label="Mx Column"
                value={calc.mxColumn}
                onChange={(v) =>
                  handleUpdate("sumxCalculations", calc.id, { mxColumn: v })
                }
                options={mxColumns}
              />
              <PropertyInput
                label="Benefit Amount"
                type="number"
                value={calc.amount}
                onChange={(v) =>
                  handleUpdate("sumxCalculations", calc.id, { amount: v })
                }
              />
            </div>
          ))}
          <button
            onClick={() => handleAdd("sumxCalculations")}
            className="w-full px-3 py-1.5 text-xs bg-blue-600/80 hover:bg-blue-600 rounded-md"
          >
            Add SUMX
          </button>
        </div>
      </div>
    </div>
  );
};

const ScenarioRunnerParams: React.FC<{
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  allModules: CanvasModule[];
}> = ({ parameters, onParametersChange, allModules }) => {
  const { scenarios = [] } = parameters;

  // Filter out relevant modules for targeting
  const targetableModules = allModules.filter((m) =>
    [ModuleType.DefinePolicyInfo, ModuleType.AdditionalName].includes(m.type)
  );

  const updateScenarios = (newScenarios: any[]) => {
    onParametersChange({ scenarios: newScenarios });
  };

  const handleAdd = () => {
    const newScenario = {
      id: `scen-${Date.now()}`,
      variableName: "ScenarioVar",
      targetModuleId: targetableModules[0]?.id || "",
      targetParameterName: "entryAge", // Default
      values: "10, 20, 30",
    };
    updateScenarios([...scenarios, newScenario]);
  };

  const handleRemove = (id: string) => {
    updateScenarios(scenarios.filter((s: any) => s.id !== id));
  };

  const handleUpdate = (id: string, field: string, value: any) => {
    updateScenarios(
      scenarios.map((s: any) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-800 p-3 rounded text-sm text-blue-200">
        Define variables to vary. The pipeline will run for every combination
        (Cartesian product).
      </div>
      {scenarios.map((scen: any) => (
        <div
          key={scen.id}
          className="bg-gray-900/50 p-3 rounded-md border border-gray-600 relative space-y-3"
        >
          <button
            onClick={() => handleRemove(scen.id)}
            className="absolute top-1.5 right-1.5 text-gray-500 hover:text-white"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          <PropertyInput
            label="Scenario Variable Name"
            value={scen.variableName}
            onChange={(v) => handleUpdate(scen.id, "variableName", v)}
            placeholder="e.g. Age"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Target Module
              </label>
              <select
                value={scen.targetModuleId}
                onChange={(e) =>
                  handleUpdate(scen.id, "targetModuleId", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm"
              >
                <option value="" disabled>
                  Select Module
                </option>
                {targetableModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <PropertyInput
              label="Param Name"
              value={scen.targetParameterName}
              onChange={(v) => handleUpdate(scen.id, "targetParameterName", v)}
              placeholder="e.g. entryAge"
            />
          </div>

          <PropertyInput
            label="Values (comma separated or range start-end)"
            value={scen.values}
            onChange={(v) => handleUpdate(scen.id, "values", v)}
            placeholder="e.g. 30, 40, 50 OR 30-60"
          />
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-md font-semibold"
      >
        Add Scenario Variable
      </button>
    </div>
  );
};

export const renderParameterContent = (
  module: CanvasModule,
  onParametersChange: (newParams: Record<string, any>) => void,
  modules: CanvasModule[],
  connections: Connection[],
  folderHandle: FileSystemDirectoryHandle | null,
  compact: boolean = false
) => {
  switch (module.type) {
    case ModuleType.DefinePolicyInfo:
      return (
        <DefinePolicyInfoParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          compact={compact}
        />
      );
    case ModuleType.LoadData:
      return (
        <LoadDataParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          folderHandle={folderHandle}
          compact={compact}
        />
      );
    case ModuleType.SelectData:
      return (
        <SelectDataParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.RateModifier:
      return (
        <RateModifierParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.SelectRiskRates:
      return (
        <SelectRiskRatesParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.CalculateSurvivors:
      return (
        <CalculateSurvivorsParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.ClaimsCalculator:
      return (
        <ClaimsCalculatorParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.NxMxCalculator:
      return (
        <NxMxCalculatorParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.PremiumComponent:
      return (
        <PremiumComponentParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.AdditionalName:
      return (
        <AdditionalNameParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.NetPremiumCalculator:
      return (
        <NetPremiumCalculatorParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.GrossPremiumCalculator:
      return (
        <GrossPremiumCalculatorParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          allConnections={connections}
          moduleId={module.id}
          compact={compact}
        />
      );
    case ModuleType.ScenarioRunner:
      return (
        <ScenarioRunnerParams
          parameters={module.parameters}
          onParametersChange={onParametersChange}
          allModules={modules}
          compact={compact}
        />
      );
    default:
      return (
        <div className="text-gray-500 italic">
          No parameters available for this module type.
        </div>
      );
  }
};

export const ParameterInputModal: React.FC<ParameterInputModalProps> = ({
  module,
  onClose,
  updateModuleParameters,
  modules,
  connections,
  projectName,
  folderHandle,
}) => {
  const handleParametersChange = (newParams: Record<string, any>) => {
    updateModuleParameters(module.id, newParams);
  };

  const renderContent = () => {
    return renderParameterContent(
      module,
      handleParametersChange,
      modules,
      connections,
      folderHandle,
      false
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 text-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold">Edit Parameters: {module.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow p-6 overflow-auto custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

import React from "react";
import { CanvasModule, ModuleType } from "../types";

interface ModuleInputSummaryProps {
  module: CanvasModule;
}

const ParamStat: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="flex items-baseline justify-between w-full gap-1">
    <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider truncate shrink-0">
      {label}
    </span>
    <span className="font-mono text-[10px] font-bold text-gray-300 truncate leading-none">
      {value}
    </span>
  </div>
);

const formatParamValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(2);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "Empty";
    return `${keys.length} keys`;
  }
  const str = String(value);
  return str.length > 15 ? str.substring(0, 15) + "..." : str;
};

export const ModuleInputSummary: React.FC<ModuleInputSummaryProps> = ({
  module,
}) => {
  const { parameters, type } = module;

  const renderContent = () => {
    switch (type) {
      case ModuleType.DefinePolicyInfo:
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat label="Age" value={parameters.entryAge || "-"} />
            <ParamStat label="Gender" value={parameters.gender || "-"} />
            <ParamStat label="Term" value={parameters.policyTerm || "-"} />
          </div>
        );
      case ModuleType.SelectRiskRates:
        // 기존 방식: 파라미터 표시하지 않음
        return null;
      case ModuleType.NetPremiumCalculator:
        const formula = parameters.formula || "";
        const formulaPreview =
          formula.length > 20
            ? formula.substring(0, 20) + "..."
            : formula || "-";
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat label="Formula" value={formulaPreview} />
            <ParamStat
              label="Var"
              value={formatParamValue(parameters.variableName)}
            />
          </div>
        );
      case ModuleType.GrossPremiumCalculator:
        const grossFormula = parameters.formula || "";
        const grossFormulaPreview =
          grossFormula.length > 20
            ? grossFormula.substring(0, 20) + "..."
            : grossFormula || "-";
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat label="Formula" value={grossFormulaPreview} />
            <ParamStat
              label="Var"
              value={formatParamValue(parameters.variableName)}
            />
          </div>
        );
      case ModuleType.ReserveCalculator:
        const reserveColName = parameters.reserveColumnName || "Reserve";
        const hasFormula1 = parameters.formulaForPaymentTermOrLess
          ? "Yes"
          : "No";
        const hasFormula2 = parameters.formulaForGreaterThanPaymentTerm
          ? "Yes"
          : "No";
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat label="Column" value={reserveColName} />
            <ParamStat label="F1" value={hasFormula1} />
            <ParamStat label="F2" value={hasFormula2} />
          </div>
        );
      case ModuleType.AdditionalName:
        const definitions = parameters.definitions || [];
        const basicValues = parameters.basicValues || [];
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat label="Vars" value={definitions.length} />
            <ParamStat label="Basic" value={basicValues.length} />
          </div>
        );
      case ModuleType.PremiumComponent:
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat
              label="Type"
              value={formatParamValue(parameters.componentType)}
            />
            <ParamStat
              label="Name"
              value={formatParamValue(parameters.componentName)}
            />
          </div>
        );
      case ModuleType.NxMxCalculator:
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat
              label="Type"
              value={formatParamValue(parameters.calculationType)}
            />
          </div>
        );
      case ModuleType.CalculateSurvivors:
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat
              label="Method"
              value={formatParamValue(parameters.method)}
            />
          </div>
        );
      case ModuleType.ClaimsCalculator:
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat
              label="Type"
              value={formatParamValue(parameters.claimType)}
            />
          </div>
        );
      case ModuleType.RateModifier:
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat
              label="Factor"
              value={formatParamValue(parameters.modifierFactor)}
            />
          </div>
        );
      case ModuleType.ScenarioRunner:
        const scenarios = parameters.scenarios || [];
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat label="Scenarios" value={scenarios.length} />
          </div>
        );
      case ModuleType.LoadData:
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat
              label="File"
              value={formatParamValue(parameters.fileName)}
            />
          </div>
        );
      case ModuleType.SelectData:
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <ParamStat
              label="Cols"
              value={
                Array.isArray(parameters.selectedColumns)
                  ? parameters.selectedColumns.length
                  : "-"
              }
            />
          </div>
        );
      default:
        // For other module types, show a generic summary
        const paramKeys = Object.keys(parameters || {});
        if (paramKeys.length === 0) {
          return (
            <div className="text-[8px] text-gray-500 text-center italic">
              No Params
            </div>
          );
        }
        // Show first 2 parameters
        return (
          <div className="flex flex-col gap-0.5 w-full">
            {paramKeys.slice(0, 2).map((key) => (
              <ParamStat
                key={key}
                label={key.length > 8 ? key.substring(0, 8) + "..." : key}
                value={formatParamValue(parameters[key])}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center px-0.5 py-0.5">
      {renderContent()}
    </div>
  );
};

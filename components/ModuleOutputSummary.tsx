
import React from 'react';
import { CanvasModule } from '../types';

interface ModuleOutputSummaryProps {
    module: CanvasModule;
    }

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex items-baseline justify-between w-full gap-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate shrink-0">{label}</span>
        <span className="font-mono text-xl font-black text-white truncate leading-none">{value}</span>
    </div>
);

const formatNum = (num: unknown, maxDecimals: number) => {
    if (typeof num !== 'number') return String(num);
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxDecimals }).format(num);
};

export const ModuleOutputSummary: React.FC<ModuleOutputSummaryProps> = ({ module }) => {
    if (!module.outputData) return <div className="flex items-center justify-center h-full text-xs text-gray-600 italic">No Output</div>;

    const renderContent = () => {
        switch (module.outputData.type) {
            case 'DataPreview':
                return <div className="flex flex-col gap-1 w-full">
                    <Stat label="Rows" value={module.outputData.totalRowCount.toLocaleString()} />
                    <Stat label="Cols" value={module.outputData.columns.length} />
                </div>;
            case 'PolicyInfoOutput':
                 return <div className="flex flex-col gap-1 w-full">
                    <Stat label="Age" value={module.outputData.entryAge} />
                    <Stat label="Term" value={module.outputData.policyTerm} />
                </div>;
            case 'PremiumComponentOutput':
                return <div className="flex items-center justify-center h-full w-full">
                    <span className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                        Click (Output)
                    </span>
                </div>;
             case 'NetPremiumOutput':
                 return <div className="flex flex-col justify-center h-full w-full">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center mb-0.5">Net Premium</span>
                    <span className="font-mono text-2xl font-black text-green-400 truncate text-center leading-tight">{formatNum(module.outputData.netPremium, 2)}</span>
                 </div>;
             case 'GrossPremiumOutput':
                 return <div className="flex flex-col justify-center h-full w-full">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center mb-0.5">Gross Premium</span>
                    <span className="font-mono text-2xl font-black text-green-400 truncate text-center leading-tight">{formatNum(module.outputData.grossPremium, 2)}</span>
                 </div>;
            case 'ScenarioRunnerOutput':
                return <div className="flex flex-col gap-1 w-full">
                    <Stat label="Scenarios" value={module.outputData.totalRowCount.toLocaleString()} />
                    <Stat label="Cols" value={module.outputData.columns.length} />
                </div>;
            case 'PipelineExplainerOutput':
                return <div className="flex items-center justify-center h-full w-full">
                     <span className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer">
                        Click (Report)
                    </span>
                </div>;
            default:
                return <div className="text-xs text-gray-400 text-center font-semibold">Done</div>;
        }
    }

    return (
        <div className="w-full h-full flex flex-col justify-center p-1">
            {renderContent()}
        </div>
    );
};

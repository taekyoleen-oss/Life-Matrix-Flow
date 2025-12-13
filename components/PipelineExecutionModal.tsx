
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CanvasModule, Connection, ModuleType, ModuleStatus, ModuleOutput, DataPreview, PolicyInfoOutput, NetPremiumOutput, GrossPremiumOutput } from '../types';
import { XCircleIcon, PlayIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import { TOOLBOX_MODULES } from '../constants';
import { renderParameterContent } from './ParameterInputModal';

interface PipelineExecutionModalProps {
    modules: CanvasModule[];
    connections: Connection[];
    onClose: () => void;
    onUpdateModule: (id: string, updates: Partial<CanvasModule>) => void;
    onRunModule: (id: string) => Promise<void>;
    getTopologicalSort: (nodes: CanvasModule[], edges: Connection[]) => string[];
    executePipeline: (
        pipelineModules: CanvasModule[],
        pipelineConnections: Connection[],
        runQueue: string[],
        logFn: (moduleId: string, message: string) => void,
        overriddenParams: Record<string, Record<string, any>> | undefined,
        throwOnError: boolean
    ) => Promise<CanvasModule[]>;
    folderHandle: FileSystemDirectoryHandle | null;
}

interface ModuleExecutionState {
    moduleId: string;
    customName: string;
    parameters: Record<string, any>;
    status: ModuleStatus;
    outputData?: ModuleOutput;
    isRunning: boolean;
}

type SortConfig = { key: string; direction: 'ascending' | 'descending' } | null;

export const PipelineExecutionModal: React.FC<PipelineExecutionModalProps> = ({
    modules,
    connections,
    onClose,
    onUpdateModule,
    onRunModule,
    getTopologicalSort,
    executePipeline,
    folderHandle
}) => {
    const executionOrder = useMemo(() => {
        // Filter out ScenarioRunner and PipelineExplainer
        const filteredModules = modules.filter(m => 
            m.type !== ModuleType.ScenarioRunner && m.type !== ModuleType.PipelineExplainer
        );
        
        // Get topological sort of filtered modules
        const sorted = getTopologicalSort(filteredModules, connections);
        
        // Find DefinePolicyInfo, LoadData, and SelectRiskRates modules
        const policyModule = filteredModules.find(m => m.type === ModuleType.DefinePolicyInfo);
        const loadDataModule = filteredModules.find(m => m.type === ModuleType.LoadData);
        const riskRatesModule = filteredModules.find(m => m.type === ModuleType.SelectRiskRates);
        
        // Build execution order: DefinePolicyInfo first, then LoadData, then SelectRiskRates and connected modules
        const result: string[] = [];
        const addedModules = new Set<string>();
        
        // Add DefinePolicyInfo first if exists
        if (policyModule && sorted.includes(policyModule.id)) {
            result.push(policyModule.id);
            addedModules.add(policyModule.id);
        }
        
        // Add LoadData second if exists
        if (loadDataModule && sorted.includes(loadDataModule.id) && !addedModules.has(loadDataModule.id)) {
            result.push(loadDataModule.id);
            addedModules.add(loadDataModule.id);
        }
        
        // Find all modules connected from SelectRiskRates (BFS)
        const connectedFromRiskRates = new Set<string>();
        if (riskRatesModule) {
            const queue = [riskRatesModule.id];
            connectedFromRiskRates.add(riskRatesModule.id);
            
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                connections.forEach(conn => {
                    if (conn.from.moduleId === currentId && !connectedFromRiskRates.has(conn.to.moduleId)) {
                        const targetModule = filteredModules.find(m => m.id === conn.to.moduleId);
                        if (targetModule && 
                            targetModule.type !== ModuleType.ScenarioRunner && 
                            targetModule.type !== ModuleType.PipelineExplainer) {
                            connectedFromRiskRates.add(conn.to.moduleId);
                            queue.push(conn.to.moduleId);
                        }
                    }
                });
            }
        }
        
        // Add SelectRiskRates and connected modules in topological order
        sorted.forEach(moduleId => {
            if (addedModules.has(moduleId)) {
                // Already added
                return;
            }
            if (connectedFromRiskRates.has(moduleId)) {
                result.push(moduleId);
                addedModules.add(moduleId);
            }
        });
        
        // Add any remaining modules that weren't added yet
        sorted.forEach(moduleId => {
            if (!addedModules.has(moduleId)) {
                result.push(moduleId);
            }
        });
        
        return result;
    }, [modules, connections, getTopologicalSort]);

    const [moduleStates, setModuleStates] = useState<Map<string, ModuleExecutionState>>(new Map());
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [runningModuleId, setRunningModuleId] = useState<string | null>(null);
    const [executionLog, setExecutionLog] = useState<Map<string, string[]>>(new Map());
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    // Initialize module states
    useEffect(() => {
        const newStates = new Map<string, ModuleExecutionState>();
        executionOrder.forEach(moduleId => {
            const module = modules.find(m => m.id === moduleId);
            if (module) {
                newStates.set(moduleId, {
                    moduleId,
                    customName: module.name,
                    parameters: { ...module.parameters },
                    status: module.status,
                    outputData: module.outputData,
                    isRunning: false
                });
            }
        });
        setModuleStates(newStates);
        
        // Select first module if none is selected
        if (executionOrder.length > 0 && selectedModuleId === null) {
            setSelectedModuleId(executionOrder[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modules, executionOrder]);

    // Sync with external module updates
    useEffect(() => {
        setModuleStates(prev => {
            const updated = new Map(prev);
            modules.forEach(module => {
                const state = updated.get(module.id);
                if (state) {
                    updated.set(module.id, {
                        ...(state as ModuleExecutionState),
                        status: module.status,
                        outputData: module.outputData
                    });
                }
            });
            return updated;
        });
    }, [modules]);

    const updateModuleName = useCallback((moduleId: string, name: string) => {
        setModuleStates(prev => {
            const updated = new Map(prev);
            const state = updated.get(moduleId);
            if (state) {
                updated.set(moduleId, { ...(state as ModuleExecutionState), customName: name });
            }
            return updated;
        });
        onUpdateModule(moduleId, { name });
    }, [onUpdateModule]);

    const updateModuleParameter = useCallback((moduleId: string, key: string, value: any) => {
        setModuleStates(prev => {
            const updated = new Map(prev);
            const state = updated.get(moduleId);
            if (state) {
                const typedState = state as ModuleExecutionState;
                updated.set(moduleId, {
                    ...typedState,
                    parameters: { ...typedState.parameters, [key]: value }
                });
            }
            return updated;
        });
        const currentModule = modules.find(m => m.id === moduleId);
        if (currentModule) {
            onUpdateModule(moduleId, { parameters: { ...currentModule.parameters, [key]: value } });
        }
    }, [onUpdateModule, modules]);

    const logMessage = useCallback((moduleId: string, message: string) => {
        setExecutionLog(prev => {
            const updated = new Map(prev);
            const logs = (updated.get(moduleId) || []) as string[];
            updated.set(moduleId, [...logs, message]);
            return updated;
        });
    }, []);

    const runSingleModule = useCallback(async (moduleId: string) => {
        const state = moduleStates.get(moduleId);
        if (!state) return;

        setRunningModuleId(moduleId);
        setModuleStates(prev => {
            const updated = new Map(prev);
            const current = updated.get(moduleId);
            if (current) {
                updated.set(moduleId, { ...(current as ModuleExecutionState), isRunning: true, status: ModuleStatus.Running });
            }
            return updated;
        });

        logMessage(moduleId, `Starting execution of ${state.customName}...`);

        try {
            onUpdateModule(moduleId, { parameters: state.parameters, name: state.customName });
            await onRunModule(moduleId);

            const updatedModule = modules.find(m => m.id === moduleId);
            if (updatedModule) {
                setModuleStates(prev => {
                    const updated = new Map(prev);
                    updated.set(moduleId, {
                        ...state,
                        status: updatedModule.status,
                        outputData: updatedModule.outputData,
                        isRunning: false
                    });
                    return updated;
                });
                logMessage(moduleId, `✓ ${state.customName} completed successfully`);
            }
        } catch (error: any) {
            setModuleStates(prev => {
                const updated = new Map(prev);
                const current = updated.get(moduleId);
                if (current) {
                    updated.set(moduleId, { ...(current as ModuleExecutionState), status: ModuleStatus.Error, isRunning: false });
                }
                return updated;
            });
            logMessage(moduleId, `✗ Error: ${error?.message || 'Unknown error'}`);
        } finally {
            setRunningModuleId(null);
        }
    }, [moduleStates, onUpdateModule, onRunModule, modules, logMessage]);

    const renderParameterInput = useCallback((moduleId: string, module: CanvasModule, state: ModuleExecutionState) => {
        const handleParametersChange = (newParams: Record<string, any>) => {
            Object.keys(newParams).forEach(key => {
                updateModuleParameter(moduleId, key, newParams[key]);
            });
        };

        // Use ParameterInputModal's renderParameterContent with compact mode
        return renderParameterContent(
            { ...module, parameters: state.parameters },
            handleParametersChange,
            modules,
            connections,
            folderHandle,
            true // compact mode
        );
    }, [connections, modules, updateModuleParameter, folderHandle]);

    const renderOutputTable = useCallback((output: DataPreview) => {
        const columns = output.columns || [];
        const rows = output.rows || [];
        
        if (!rows || rows.length === 0) {
            return <div className="text-sm text-gray-500 italic">No data available</div>;
        }
        
        const requestSort = (key: string) => {
            let direction: 'ascending' | 'descending' = 'ascending';
            if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
                direction = 'descending';
            }
            setSortConfig({ key, direction });
        };

        const sortedRows = (() => {
            if (!sortConfig || !sortConfig.key) return rows;
            try {
                return [...rows].sort((a, b) => {
                    const aVal = a[sortConfig.key];
                    const bVal = b[sortConfig.key];
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;
                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        return sortConfig.direction === 'ascending' ? aVal - bVal : bVal - aVal;
                    }
                    const aStr = String(aVal);
                    const bStr = String(bVal);
                    return sortConfig.direction === 'ascending' 
                        ? aStr.localeCompare(bStr) 
                        : bStr.localeCompare(aStr);
                });
            } catch (error) {
                console.error('Error sorting rows:', error);
                return rows;
            }
        })();

        return (
            <div className="flex flex-col h-full">
                <div className="text-xs text-gray-400 mb-2 flex-shrink-0">
                    Showing {Math.min(sortedRows.length, 1000)} of {output.totalRowCount.toLocaleString()} rows and {columns.length} columns.
                </div>
                <div className="flex-grow overflow-auto border border-gray-600 rounded">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-gray-800 sticky top-0 z-10">
                            <tr>
                                {columns.map(col => (
                                    <th 
                                        key={col.name} 
                                        className="py-1.5 px-2 font-semibold text-gray-300 cursor-pointer hover:bg-gray-700 whitespace-nowrap"
                                        onClick={() => requestSort(col.name)}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span className="truncate" title={col.name}>{col.name}</span>
                                            {sortConfig?.key === col.name && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.slice(0, 1000).map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-800/50">
                                    {columns.map(col => {
                                        const val = row[col.name];
                                        let displayVal: React.ReactNode = val;
                                        if (val === null || val === undefined) {
                                            displayVal = <i className="text-gray-500">null</i>;
                                        } else if (typeof val === 'number') {
                                            displayVal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 }).format(val);
                                        } else {
                                            displayVal = String(val);
                                        }
                                        return (
                                            <td 
                                                key={col.name} 
                                                className="py-1 px-2 font-mono text-gray-300 whitespace-nowrap"
                                                title={String(val)}
                                            >
                                                {displayVal}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }, [sortConfig]);

    const renderOutput = useCallback((state: ModuleExecutionState) => {
        if (!state.outputData) {
            return <div className="text-sm text-gray-500 italic">No output yet</div>;
        }

        const output = state.outputData;
        
        switch (output.type) {
            case 'DataPreview':
                return renderOutputTable(output);
            case 'PolicyInfoOutput':
                return (
                    <div className="text-sm space-y-1">
                        <div className="text-gray-300">Entry Age: {output.entryAge}</div>
                        <div className="text-gray-300">Policy Term: {output.policyTerm}</div>
                        <div className="text-gray-300">Gender: {output.gender}</div>
                        <div className="text-gray-300">Payment Term: {output.paymentTerm}</div>
                        <div className="text-gray-300">Interest Rate: {(output.interestRate * 100).toFixed(2)}%</div>
                    </div>
                );
            case 'NetPremiumOutput':
                return (
                    <div className="text-sm">
                        <div className="text-green-400 font-bold text-lg">Net Premium: {output.netPremium.toFixed(2)}</div>
                    </div>
                );
            case 'GrossPremiumOutput':
                return (
                    <div className="text-sm">
                        <div className="text-green-400 font-bold text-lg">Gross Premium: {output.grossPremium.toFixed(2)}</div>
                    </div>
                );
            default:
                return <div className="text-sm text-gray-400">Output available</div>;
        }
    }, [renderOutputTable]);

    const getStatusColor = (status: ModuleStatus, canRun: boolean, needsExecution: boolean) => {
        if (needsExecution) {
            return 'bg-green-600';
        }
        switch (status) {
            case ModuleStatus.Success:
                return 'bg-blue-600';
            case ModuleStatus.Error:
                return 'bg-red-600';
            case ModuleStatus.Running:
                return 'bg-yellow-600';
            default:
                return 'bg-gray-600';
        }
    };

    const selectedState = selectedModuleId ? moduleStates.get(selectedModuleId) : null;
    const selectedModule = selectedModuleId ? modules.find(m => m.id === selectedModuleId) : null;

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex">
            <div className="bg-gray-900 text-white flex flex-row h-full w-full">
                {/* Left Sidebar - Module List */}
                <div className="w-64 flex-shrink-0 border-r border-gray-700 flex flex-col">
                    <header className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
                        <h2 className="text-sm font-bold">Pipeline Execution</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    </header>
                    <div className="flex-grow overflow-y-auto p-2">
                        <div className="space-y-1">
                            {executionOrder.map((moduleId, index) => {
                                const module = modules.find(m => m.id === moduleId);
                                const state = moduleStates.get(moduleId);
                                if (!module || !state) return null;

                                const moduleInfo = TOOLBOX_MODULES.find(m => m.type === module.type);
                                const Icon = moduleInfo?.icon;
                                const isSelected = selectedModuleId === moduleId;
                                const isRunning = runningModuleId === moduleId;
                                const isDefinePolicyInfo = module.type === ModuleType.DefinePolicyInfo;
                                
                                // Define Policy Info는 항상 실행 불가로 설정 (실행하지 않으므로)
                                // 다음 모듈부터는 Define Policy Info를 제외한 이전 모듈들이 성공했는지 확인
                                const canRun = isDefinePolicyInfo 
                                    ? false // Define Policy Info는 실행 불가
                                    : index === 0 || executionOrder.slice(0, index).every(id => {
                                        const prevModule = modules.find(m => m.id === id);
                                        const prevState = moduleStates.get(id);
                                        // Define Policy Info는 항상 성공한 것으로 간주
                                        if (prevModule?.type === ModuleType.DefinePolicyInfo) {
                                            return true;
                                        }
                                        return prevState?.status === ModuleStatus.Success;
                                    });
                                const needsExecution = !isDefinePolicyInfo && canRun && state.status === ModuleStatus.Pending && !isRunning;

                                return (
                                    <div
                                        key={moduleId}
                                        onClick={() => setSelectedModuleId(moduleId)}
                                        className={`p-2 rounded cursor-pointer transition-colors ${
                                            isSelected 
                                                ? 'bg-blue-600/30 border border-blue-500' 
                                                : needsExecution
                                                ? 'bg-green-900/30 border border-green-600/50 hover:bg-green-900/40'
                                                : state.status === ModuleStatus.Success
                                                ? 'bg-blue-900/30 border border-blue-600/50 hover:bg-blue-900/40'
                                                : 'hover:bg-gray-800 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold truncate">{state.customName}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{moduleInfo?.name || module.type}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(state.status, canRun, needsExecution)}`}>
                                                {state.status}
                                            </span>
                                            {!isDefinePolicyInfo && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        runSingleModule(moduleId);
                                                    }}
                                                    disabled={!canRun || isRunning}
                                                    className={`p-1 rounded text-[10px] transition-colors ${
                                                        isRunning
                                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                            : needsExecution
                                                            ? 'bg-green-600 hover:bg-green-500 text-white'
                                                            : canRun && !isRunning
                                                            ? 'bg-green-600 hover:bg-green-500 text-white'
                                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    }`}
                                                    title={isRunning ? 'Running...' : needsExecution ? 'Ready to run' : 'Run'}
                                                >
                                                    <PlayIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Selected Module Details */}
                {selectedState && selectedModule && selectedModuleId ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 flex flex-row overflow-hidden">
                            {/* Input Section */}
                            <div className="w-80 flex-shrink-0 border-r border-gray-700 flex flex-col p-4">
                                <div className="mb-3 flex-shrink-0">
                                    <h3 className="text-sm font-bold mb-2">Module Name</h3>
                                    <input
                                        type="text"
                                        value={selectedState.customName}
                                        onChange={(e) => updateModuleName(selectedModuleId, e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <h3 className="text-sm font-bold mb-2">Inputs</h3>
                                    {renderParameterInput(selectedModuleId, selectedModule, selectedState)}
                                </div>
                                {/* Log Section */}
                                {executionLog.get(selectedModuleId) && executionLog.get(selectedModuleId)!.length > 0 && (
                                    <div className="mt-4 flex-shrink-0 border-t border-gray-700 pt-3">
                                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Log</h4>
                                        <div className="bg-gray-900 p-2 rounded text-[10px] font-mono text-gray-500 max-h-32 overflow-y-auto">
                                            {executionLog.get(selectedModuleId)!.map((log, i) => (
                                                <div key={i} className="mb-1">{log}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Output Section */}
                            <div className="flex-1 flex flex-col p-4 overflow-hidden">
                                <h3 className="text-sm font-bold mb-2 flex-shrink-0">Output</h3>
                                <div className="flex-1 overflow-hidden bg-gray-800/50 rounded border border-gray-700 p-3">
                                    {renderOutput(selectedState)}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <p className="text-lg mb-2">No module selected</p>
                            <p className="text-sm">Select a module from the left panel</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

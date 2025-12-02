
import React, { useState, useCallback, useRef, useEffect, useMemo, DragEvent } from 'react';
import { Canvas } from './components/Canvas';
import { CanvasModule, ModuleType, Connection, ModuleStatus, ModuleOutput, ColumnInfo, NetPremiumOutput, PremiumComponentOutput, PolicyInfoOutput, PipelineReportStep, AdditionalVariablesOutput, GrossPremiumOutput } from './types';
import { DEFAULT_MODULES, TOOLBOX_MODULES } from './constants';
import { LogoIcon, PlayIcon, CodeBracketIcon, FolderOpenIcon, PlusIcon, MinusIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, ArrowsPointingOutIcon, SparklesIcon, CheckIcon, CommandLineIcon, Bars3Icon, ClipboardDocumentListIcon, BeakerIcon, ChevronUpIcon, ChevronDownIcon } from './components/icons';
import useHistoryState from './hooks/useHistoryState';
import { DataPreviewModal } from './components/DataPreviewModal';
import { StatisticsPreviewModal } from './components/StatisticsPreviewModal';
import { SplitDataPreviewModal } from './components/SplitDataPreviewModal';
import { TrainedModelPreviewModal } from './components/TrainedModelPreviewModal';
import { StatsModelsResultPreviewModal } from './components/StatsModelsResultPreviewModal';
import { EvaluationPreviewModal } from './components/EvaluationPreviewModal';
import { XoLPricePreviewModal } from './components/XoLPricePreviewModal';
import { FinalXolPricePreviewModal } from './components/FinalXolPricePreviewModal';
import { ParameterInputModal } from './components/ParameterInputModal';
import { SAMPLE_DATA } from './sampleData';
import { CodeTerminalPanel } from './components/CodeTerminalPanel';
import { NetPremiumPreviewModal } from './components/NetPremiumPreviewModal';
import { PipelineReportModal } from './components/PipelineReportModal';
import { PipelineExecutionModal } from './components/PipelineExecutionModal';


const getModuleDefault = (type: ModuleType) => {
    const defaultData = DEFAULT_MODULES.find(m => m.type === type)!;
    const moduleInfo = TOOLBOX_MODULES.find(m => m.type === type)!;
    return {
      type,
      name: moduleInfo.name,
      status: ModuleStatus.Pending,
      parameters: { ...defaultData.parameters },
      inputs: [...defaultData.inputs],
      outputs: [...defaultData.outputs],
    };
};

const sampleRiskData = SAMPLE_DATA.find(d => d.name === 'risk_rates.csv');

// Initial Layout Configuration (U-shape flow)
const initialModules: CanvasModule[] = [
    // Row 1: Data & Basic Calc (Left to Right)
    { 
        id: 'load-1', 
        ...getModuleDefault(ModuleType.LoadData), 
        position: { x: 320, y: 50 },
        parameters: {
            source: sampleRiskData?.name || 'risk_rates.csv',
            fileContent: sampleRiskData?.content || '',
        }
    },
    { 
        id: 'select-rates-1',
        ...getModuleDefault(ModuleType.SelectRiskRates),
        position: { x: 590, y: 50 },
        parameters: {
            ageColumn: 'Age',
            genderColumn: 'Sex',
        }
    },
    {
        id: 'select-data-1',
        ...getModuleDefault(ModuleType.SelectData),
        position: { x: 860, y: 50 },
    },
    {
        id: 'rate-modifier-1',
        ...getModuleDefault(ModuleType.RateModifier),
        position: { x: 1130, y: 50 },
    },
    {
        id: 'survivors-1',
        ...getModuleDefault(ModuleType.CalculateSurvivors),
        position: { x: 1400, y: 50 },
        parameters: {
            ageColumn: 'Age',
            mortalityColumn: 'Male_Mortality',
            calculations: [{
                id: `calc-${Date.now()}`,
                name: 'Male_Mortality',
                decrementRates: ['Male_Mortality']
            }]
        }
    },
    
    // Row 2: Advanced Calc & Premium (Right to Left flow conceptually, but positioned below)
    {
        id: 'claims-1',
        ...getModuleDefault(ModuleType.ClaimsCalculator),
        position: { x: 1400, y: 220 },
        parameters: {
            calculations: [{
                id: `claim-calc-${Date.now()}`,
                lxColumn: 'lx_Male_Mortality',
                riskRateColumn: 'Male_Cancer',
                name: 'Male_Cancer'
            }]
        }
    },
    { 
        id: 'nx-mx-calculator-1', 
        ...getModuleDefault(ModuleType.NxMxCalculator), 
        position: { x: 1130, y: 220 },
        parameters: {
            nxCalculations: [{
                id: 'nx-calc-initial',
                baseColumn: 'Dx_Male_Mortality',
                name: 'Male_Mortality'
            }],
            mxCalculations: [{
                id: 'mx-calc-initial',
                baseColumn: 'Cx_Male_Cancer',
                name: 'Male_Cancer',
                deductibleType: '0',
                customDeductible: 0,
                paymentRatios: [
                    { year: 1, type: '100%', customValue: 100 },
                    { year: 2, type: '100%', customValue: 100 },
                    { year: 3, type: '100%', customValue: 100 }
                ]
            }]
        }
    },
    { 
        id: 'premium-component-1', 
        ...getModuleDefault(ModuleType.PremiumComponent), 
        position: { x: 860, y: 220 },
        parameters: {
            nnxCalculations: [{
                id: 'nnx-calc-initial',
                nxColumn: 'Nx_Male_Mortality'
            }],
            sumxCalculations: [{
                id: 'sumx-calc-initial',
                mxColumn: 'Mx_Male_Cancer',
                amount: 10000
            }]
        }
    },
    {
        id: 'additional-name-1',
        ...getModuleDefault(ModuleType.AdditionalName),
        position: { x: 590, y: 320 }, // Initial position adjusted
        parameters: {
            basicValues: [
                { name: 'α1', value: 0 },
                { name: 'α2', value: 0 },
                { name: 'β1', value: 0 },
                { name: 'β2', value: 0 },
                { name: 'γ', value: 0 },
            ],
            definitions: []
        }
    },
    { 
        id: 'net-premium-calculator-1', 
        ...getModuleDefault(ModuleType.NetPremiumCalculator), 
        position: { x: 320, y: 220 },
        parameters: {
            formula: '[SUMX] / [NNX_Male_Mortality]',
            variableName: 'PP'
        }
    },
    {
        id: 'gross-premium-calculator-1',
        ...getModuleDefault(ModuleType.GrossPremiumCalculator),
        position: { x: 50, y: 400 },
        parameters: {
            formula: '[PP] / (1 - 0.0)',
            variableName: 'GP'
        }
    },

    // Sidebar / Config modules (Unconnected)
    { id: 'policy-1', ...getModuleDefault(ModuleType.DefinePolicyInfo), position: { x: 50, y: 50 } },
    { 
        id: 'scenario-runner-1', 
        ...getModuleDefault(ModuleType.ScenarioRunner), 
        position: { x: 50, y: 170 }, // Below policy info
        parameters: {
            scenarios: [
                { id: 'scen-1', variableName: 'entryAge', targetModuleId: 'policy-1', targetParameterName: 'entryAge', values: '30-40' },
                { id: 'scen-2', variableName: 'gender', targetModuleId: 'policy-1', targetParameterName: 'gender', values: 'Male, Female' },
                { id: 'scen-3', variableName: 'policyTerm', targetModuleId: 'policy-1', targetParameterName: 'policyTerm', values: '20, 30' },
                { id: 'scen-mat', variableName: 'maturityAge', targetModuleId: 'policy-1', targetParameterName: 'maturityAge', values: '0' },
                { id: 'scen-4', variableName: 'paymentTerm', targetModuleId: 'policy-1', targetParameterName: 'paymentTerm', values: '20, 30' },
            ]
        }
    },
    {
        id: 'explainer-1',
        ...getModuleDefault(ModuleType.PipelineExplainer),
        position: { x: 50, y: 290 }, // Below scenario runner
    }
];

const initialConnections: Connection[] = [
    { id: 'conn-1', from: { moduleId: 'load-1', portName: 'data_out' }, to: { moduleId: 'select-rates-1', portName: 'risk_data_in' } },
    { id: 'conn-3', from: { moduleId: 'select-rates-1', portName: 'selected_rates_out' }, to: { moduleId: 'select-data-1', portName: 'data_in' } },
    { id: 'conn-3-1', from: { moduleId: 'select-data-1', portName: 'data_out' }, to: { moduleId: 'rate-modifier-1', portName: 'data_in' } },
    { id: 'conn-4', from: { moduleId: 'rate-modifier-1', portName: 'data_out' }, to: { moduleId: 'survivors-1', portName: 'data_in' } },
    { id: 'conn-5', from: { moduleId: 'survivors-1', portName: 'data_out' }, to: { moduleId: 'claims-1', portName: 'data_in' } },
    { id: 'conn-6', from: { moduleId: 'claims-1', portName: 'data_out' }, to: { moduleId: 'nx-mx-calculator-1', portName: 'data_in' } },
    { id: 'conn-8', from: { moduleId: 'nx-mx-calculator-1', portName: 'data_out' }, to: { moduleId: 'premium-component-1', portName: 'data_in' } },
    { id: 'conn-9', from: { moduleId: 'nx-mx-calculator-1', portName: 'data_out' }, to: { moduleId: 'additional-name-1', portName: 'data_in' } },
    { id: 'conn-10', from: { moduleId: 'premium-component-1', portName: 'premium_components_out' }, to: { moduleId: 'net-premium-calculator-1', portName: 'premium_components_in' } },
    { id: 'conn-11', from: { moduleId: 'additional-name-1', portName: 'variables_out' }, to: { moduleId: 'net-premium-calculator-1', portName: 'additional_vars_in' } },
    { id: 'conn-12', from: { moduleId: 'net-premium-calculator-1', portName: 'premium_out' }, to: { moduleId: 'gross-premium-calculator-1', portName: 'net_premium_in' } },
];

const PREDEFINED_SAMPLES = [
    {
        name: "종신보험",
        modules: initialModules,
        connections: initialConnections
    }
];

const App: React.FC = () => {
  const [modules, setModules, undo, redo, resetModules, canUndo, canRedo] = useHistoryState<CanvasModule[]>(initialModules);
  const [connections, _setConnections] = useState<Connection[]>(initialConnections);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [productName, setProductName] = useState('New Life Product');
  const [isEditingProductName, setIsEditingProductName] = useState(false);
  
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewingDataForModule, setViewingDataForModule] = useState<CanvasModule | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const folderHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const [clipboard, setClipboard] = useState<{ modules: CanvasModule[], connections: Connection[] } | null>(null);
  const pasteOffset = useRef(0);

  const [isDirty, setIsDirty] = useState(false);
  const [saveButtonText, setSaveButtonText] = useState('Save');

  const [isCodePanelVisible, setIsCodePanelVisible] = useState(false);
  const [terminalOutputs, setTerminalOutputs] = useState<Record<string, string[]>>({});
  
  // Controls Panel State
  const [controlsPosition, setControlsPosition] = useState({ x: 0, y: 0 });
  const isDraggingControls = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const hasInitialRearranged = useRef(false);
  
  const [isSampleMenuOpen, setIsSampleMenuOpen] = useState(false);
  const [isToolboxExpanded, setIsToolboxExpanded] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPipelineExecutionModalOpen, setIsPipelineExecutionModalOpen] = useState(false);

  const setConnections = useCallback((value: React.SetStateAction<Connection[]>) => {
    _setConnections(value);
    setIsDirty(true);
  }, []);

  const handleEditParameters = useCallback((moduleId: string) => {
    setEditingModuleId(moduleId);
  }, []);
  
  const editingModule = useMemo(() => {
      return modules.find(m => m.id === editingModuleId) || null;
  }, [modules, editingModuleId]);
  
  const handleFitToView = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const canvasRect = canvasContainerRef.current.getBoundingClientRect();
    
    if (modules.length === 0) {
        setPan({ x: 0, y: 0 });
        setScale(1);
        return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const moduleWidth = 224; // w-56
    const moduleHeight = 80; // approximate height

    modules.forEach(module => {
        minX = Math.min(minX, module.position.x);
        minY = Math.min(minY, module.position.y);
        maxX = Math.max(maxX, module.position.x + moduleWidth);
        maxY = Math.max(maxY, module.position.y + moduleHeight);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const padding = 50;
    const scaleX = (canvasRect.width - padding * 2) / contentWidth;
    const scaleY = (canvasRect.height - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    const newPanX = (canvasRect.width - contentWidth * newScale) / 2 - minX * newScale;
    const newPanY = (canvasRect.height - contentHeight * newScale) / 2 - minY * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  }, [modules]);
  
  const handleRearrangeModules = useCallback(() => {
    if (modules.length === 0) return;

    // 1. Identify unconnected and connected modules
    const allModuleIds = new Set(modules.map(m => m.id));
    const inDegree: Record<string, number> = {};
    const outDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {}; // Adjacency list for traversing

    modules.forEach(m => {
        inDegree[m.id] = 0;
        outDegree[m.id] = 0;
        adj[m.id] = [];
    });

    const connectionsToUse = connections.filter(c => allModuleIds.has(c.from.moduleId) && allModuleIds.has(c.to.moduleId));

    connectionsToUse.forEach(conn => {
        adj[conn.from.moduleId].push(conn.to.moduleId);
        inDegree[conn.to.moduleId]++;
        outDegree[conn.from.moduleId]++;
    });

    const unconnectedModuleIds = modules
        .filter(m => inDegree[m.id] === 0 && outDegree[m.id] === 0)
        .map(m => m.id);
    
    const connectedModuleIds = modules.filter(m => !unconnectedModuleIds.includes(m.id)).map(m => m.id);

    // 2. Compute Levels (Topological Depth) for Connected Modules
    // Simple longest path algorithm for DAGs
    const levels: Record<string, number> = {};
    
    const computeLevel = (id: string, visited: Set<string>): number => {
        if (levels[id] !== undefined) return levels[id];
        if (visited.has(id)) return 0; // Break cycle safely
        
        visited.add(id);
        
        // Find parents
        const parents = connectionsToUse.filter(c => c.to.moduleId === id).map(c => c.from.moduleId);
        
        if (parents.length === 0) {
            levels[id] = 0;
        } else {
            let maxParentLevel = -1;
            parents.forEach(pid => {
                maxParentLevel = Math.max(maxParentLevel, computeLevel(pid, new Set(visited)));
            });
            levels[id] = maxParentLevel + 1;
        }
        return levels[id];
    };

    connectedModuleIds.forEach(id => computeLevel(id, new Set()));

    // 3. Group nodes by Level
    const levelGroups: Record<number, string[]> = {};
    let maxLevel = 0;
    
    Object.entries(levels).forEach(([id, lvl]) => {
        if (!connectedModuleIds.includes(id)) return;
        if (!levelGroups[lvl]) levelGroups[lvl] = [];
        levelGroups[lvl].push(id);
        maxLevel = Math.max(maxLevel, lvl);
    });

    // 4. Layout Configuration
    const newModules = [...modules];
    const moduleWidth = 224;
    const moduleHeight = 80; // Height of module card
    const colSpacing = 60; // Horizontal gap
    const rowSpacing = 40; // Vertical gap between stacked items
    const initialX = 50;
    const initialY = 50;
    const groupGap = 100;

    // --- Place Unconnected Modules (Left Column) ---
    let maxX_Unconnected = initialX;
    if (unconnectedModuleIds.length > 0) {
        unconnectedModuleIds.forEach((moduleId, index) => {
            const moduleIndex = newModules.findIndex(m => m.id === moduleId);
            if (moduleIndex !== -1) {
                const x = initialX;
                const y = initialY + index * (moduleHeight + rowSpacing);
                newModules[moduleIndex].position = { x, y };
            }
        });
        maxX_Unconnected += moduleWidth; 
    } else {
        maxX_Unconnected = initialX - groupGap; // Reset if empty
    }

    // --- Place Connected Modules (Layered Layout) ---
    const startX_Connected = maxX_Unconnected + groupGap;
    
    // Sort groups to minimize crossing (Heuristic: Average Y of parents)
    // We process levels 1..N
    for (let l = 1; l <= maxLevel; l++) {
        if (!levelGroups[l]) continue;
        levelGroups[l].sort((a, b) => {
            const getAvgParentY = (nodeId: string) => {
                const parents = connectionsToUse.filter(c => c.to.moduleId === nodeId).map(c => c.from.moduleId);
                if (parents.length === 0) return 0;
                const parentYs = parents.map(pid => {
                    const pm = newModules.find(m => m.id === pid);
                    return pm ? pm.position.y : 0;
                });
                return parentYs.reduce((sum, y) => sum + y, 0) / parentYs.length;
            };
            return getAvgParentY(a) - getAvgParentY(b);
        });
    }

    // If level 0 has multiple inputs, spread them out first
    if (levelGroups[0]) {
        // Keep them in current ID order or existing Y order if possible? 
        // Just ID order for stability or preserve array order
    }

    // 5. Assign coordinates with 5-column wrapping logic
    const COLUMNS_PER_ROW = 5;
    const COLUMN_WIDTH = moduleWidth + colSpacing;
    
    // We need to track the Y-offset for each "Row of Columns"
    let currentYBase = initialY;
    
    for (let rowStartLevel = 0; rowStartLevel <= maxLevel; rowStartLevel += COLUMNS_PER_ROW) {
        let maxStackHeightInRow = 0;
        
        // First pass: determine max height needed for this row of columns
        for (let l = rowStartLevel; l < rowStartLevel + COLUMNS_PER_ROW; l++) {
            if (levelGroups[l]) {
                const stackHeight = levelGroups[l].length * (moduleHeight + rowSpacing);
                maxStackHeightInRow = Math.max(maxStackHeightInRow, stackHeight);
            }
        }

        // Second pass: Place nodes
        for (let l = rowStartLevel; l < rowStartLevel + COLUMNS_PER_ROW; l++) {
            if (!levelGroups[l]) continue;
            
            const group = levelGroups[l];
            const colIndex = l % COLUMNS_PER_ROW;
            const x = startX_Connected + colIndex * COLUMN_WIDTH;
            
            // Place stacked items
            group.forEach((moduleId, stackIndex) => {
                const moduleIndex = newModules.findIndex(m => m.id === moduleId);
                if (moduleIndex !== -1) {
                    // Simple stacking from top of the row base
                    const y = currentYBase + stackIndex * (moduleHeight + rowSpacing);
                    newModules[moduleIndex].position = { x, y };
                }
            });
        }
        
        // Advance Y base for the next row of columns
        currentYBase += maxStackHeightInRow + 80; // Extra padding between graph rows
    }
    
    setModules(newModules);
    setIsDirty(true);
    setTimeout(() => handleFitToView(), 0);
  }, [modules, connections, setModules, handleFitToView]);

  // Auto rearrange on start
  useEffect(() => {
    if (!hasInitialRearranged.current && modules.length > 0) {
        setTimeout(() => {
            handleRearrangeModules();
            hasInitialRearranged.current = true;
        }, 100);
    }
  }, []);
  
  const handleSavePipeline = useCallback(async () => {
    try {
        const pipelineState = { modules, connections, productName };
        const blob = new Blob([JSON.stringify(pipelineState, null, 2)], { type: 'application/json' });
        const fileName = `${productName.replace(/[<>:"/\\|?*]/g, '_')}.lifx`;

        if ((window as any).showSaveFilePicker) {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'Life Matrix File',
                    accept: { 'application/json': ['.lifx'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        setIsDirty(false);
        setSaveButtonText('Saved!');
        setTimeout(() => setSaveButtonText('Save'), 2000);
    } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error('Failed to save pipeline:', error);
        }
    }
  }, [modules, connections, productName]);

  const handleLoadPipeline = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.lifx';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const content = e.target?.result as string;
          if (!content) return;
          const savedState = JSON.parse(content);
          if (savedState.modules && savedState.connections) {
            resetModules(savedState.modules);
            _setConnections(savedState.connections);
            if (savedState.productName) setProductName(savedState.productName);
            setSelectedModuleIds([]);
            setIsDirty(false);
          }
        } catch (error) {
          console.error('Failed to load or parse pipeline file:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [resetModules]);
  
  const handleSetFolder = useCallback(async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support the File System Access API.');
        return;
      }
      const handle = await (window as any).showDirectoryPicker();
      folderHandleRef.current = handle;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to set save folder:', error);
      }
    }
  }, []);

  const handleLoadSample = (sample: typeof PREDEFINED_SAMPLES[0]) => {
    resetModules(sample.modules);
    _setConnections(sample.connections);
    setProductName(sample.name);
    setSelectedModuleIds([]);
    setIsDirty(false);
    setIsSampleMenuOpen(false);
    // Trigger auto-layout after a short delay
    setTimeout(() => {
        hasInitialRearranged.current = false; // Reset to force layout
        handleRearrangeModules();
    }, 100);
  };
  
  const createModule = useCallback((type: ModuleType, position?: { x: number, y: number }) => {
    const defaultData = DEFAULT_MODULES.find(m => m.type === type);
    if (!defaultData) return;
    
    const moduleInfo = TOOLBOX_MODULES.find(m => m.type === type);
    const baseName = moduleInfo ? moduleInfo.name : type;
    const count = modules.filter(m => m.type === type).length + 1;

    let finalPosition = position;
    if (!finalPosition) {
        if (canvasContainerRef.current) {
            const canvasRect = canvasContainerRef.current.getBoundingClientRect();
            finalPosition = {
                x: (canvasRect.width / 2 - 112 - pan.x) / scale, // 112 is half new module width (224/2)
                y: (canvasRect.height / 2 - 30 - pan.y) / scale, // 30 is half new module height (60/2)
            };
        } else {
            finalPosition = { x: 100, y: 100 };
        }
    }

    const newModule: CanvasModule = {
      id: `${type}-${Date.now()}`,
      name: `${baseName} ${count}`,
      type,
      position: finalPosition,
      status: ModuleStatus.Pending,
      parameters: { ...defaultData.parameters },
      inputs: [...defaultData.inputs],
      outputs: [...defaultData.outputs],
    };

    setModules(prev => [...prev, newModule]);
    setSelectedModuleIds([newModule.id]);
    setIsDirty(true);
  }, [modules, setModules, setSelectedModuleIds, scale, pan]);

  const updateModulePositions = useCallback((updates: {id: string, position: {x: number, y: number}}[]) => {
      const updatesMap = new Map(updates.map(u => [u.id, u.position]));
      setModules(prev => prev.map(m => {
          const newPos = updatesMap.get(m.id);
          return newPos ? { ...m, position: newPos } : m;
      }), true);
      setIsDirty(true);
  }, [setModules]);

  const updateModuleParameters = useCallback((id:string, newParams: Record<string, any>) => {
    setModules(prevModules => {
        // 1. Build adjacency list for downstream identification
        const adj: Record<string, string[]> = {};
        connections.forEach(conn => {
            if (!adj[conn.from.moduleId]) adj[conn.from.moduleId] = [];
            adj[conn.from.moduleId].push(conn.to.moduleId);
        });

        // 2. Find all downstream modules using BFS
        const modulesToReset = new Set<string>();
        const queue = [id]; // Start with current module

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const downstream = adj[currentId] || [];
            downstream.forEach(childId => {
                if (!modulesToReset.has(childId)) {
                    modulesToReset.add(childId);
                    queue.push(childId);
                }
            });
        }

        return prevModules.map(m => {
            // Update the module itself
            if (m.id === id) {
                return { 
                    ...m, 
                    parameters: {...m.parameters, ...newParams},
                    status: ModuleStatus.Pending, 
                    outputData: undefined 
                };
            }
            // Reset downstream modules
            if (modulesToReset.has(m.id)) {
                return { ...m, status: ModuleStatus.Pending, outputData: undefined };
            }
            return m;
        });
    });
    setIsDirty(true);
  }, [setModules, connections]);

  const updateModuleName = useCallback((id: string, newName: string) => {
    setModules(prev => prev.map(m => (m.id === id ? { ...m, name: newName } : m)));
    setIsDirty(true);
  }, [setModules]);

  const deleteModules = useCallback((idsToDelete: string[]) => {
    setModules(prev => prev.filter(m => !idsToDelete.includes(m.id)));
    setConnections(prev => prev.filter(c => !idsToDelete.includes(c.from.moduleId) && !idsToDelete.includes(c.to.moduleId)));
    setSelectedModuleIds(prev => prev.filter(id => !idsToDelete.includes(id)));
    setIsDirty(true);
  }, [setModules, setConnections, setSelectedModuleIds]);

  const handleViewDetails = (moduleId: string) => {
      const module = modules.find(m => m.id === moduleId);
      if (module?.outputData) {
          setViewingDataForModule(module);
      }
  };
    
  const handleCloseModal = () => {
      setViewingDataForModule(null);
  };

  const renderOutputModal = () => {
    const currentViewingModule = viewingDataForModule ? modules.find(m => m.id === viewingDataForModule.id) : null;
    
    if (!currentViewingModule || !currentViewingModule.outputData) return null;
    const { outputData } = currentViewingModule;

    switch (outputData.type) {
      case 'DataPreview':
      case 'KMeansOutput':
      case 'HierarchicalClusteringOutput':
      case 'DBSCANOutput':
      case 'PCAOutput':
      case 'ScenarioRunnerOutput':
      case 'PremiumComponentOutput':
        return <DataPreviewModal module={currentViewingModule} projectName={productName} onClose={handleCloseModal} />;
      case 'StatisticsOutput':
        return <StatisticsPreviewModal module={currentViewingModule} projectName={productName} onClose={handleCloseModal} />;
      case 'SplitDataOutput':
        return <SplitDataPreviewModal module={currentViewingModule} onClose={handleCloseModal} />;
      case 'TrainedModelOutput':
        return <TrainedModelPreviewModal module={currentViewingModule} projectName={productName} onClose={handleCloseModal} />;
      case 'StatsModelsResultOutput':
        return <StatsModelsResultPreviewModal module={currentViewingModule} projectName={productName} onClose={handleCloseModal} />;
      case 'EvaluationOutput':
        return <EvaluationPreviewModal module={currentViewingModule} onClose={handleCloseModal} />;
      case 'XoLPriceOutput':
        return <XoLPricePreviewModal module={currentViewingModule} onClose={handleCloseModal} />;
      case 'FinalXolPriceOutput':
        return <FinalXolPricePreviewModal module={currentViewingModule} onClose={handleCloseModal} />;
      case 'NetPremiumOutput':
      case 'GrossPremiumOutput':
        return <NetPremiumPreviewModal module={currentViewingModule} projectName={productName} onClose={handleCloseModal} />;
      case 'PipelineExplainerOutput':
        return <PipelineReportModal module={currentViewingModule} onClose={handleCloseModal} />;
      default:
        return null;
    }
  };
    
    const roundTo5 = (num: number) => {
        return Number(num.toFixed(5));
    };
    
    const getTopologicalSort = useCallback((nodes: CanvasModule[], edges: Connection[]): string[] => {
      const adj: Record<string, string[]> = {};
      const inDegree: Record<string, number> = {};

      nodes.forEach(m => {
          adj[m.id] = [];
          inDegree[m.id] = 0;
      });

      edges.forEach(conn => {
          if (adj[conn.from.moduleId] && inDegree[conn.to.moduleId] !== undefined) {
              adj[conn.from.moduleId].push(conn.to.moduleId);
              inDegree[conn.to.moduleId]++;
          }
      });

      const queue = nodes.filter(m => inDegree[m.id] === 0).map(m => m.id);
      const sorted: string[] = [];

      while (queue.length > 0) {
          const u = queue.shift()!;
          sorted.push(u);

          (adj[u] || []).forEach(v => {
              if (inDegree[v] !== undefined) {
                  inDegree[v]--;
                  if (inDegree[v] === 0) {
                      queue.push(v);
                  }
              }
          });
      }

      // Add remaining nodes (cycles or disjoint parts that weren't caught)
      nodes.forEach(m => {
          if (!sorted.includes(m.id)) sorted.push(m.id);
      });

      return sorted;
    }, []);

    const executePipeline = useCallback(async (
        pipelineModules: CanvasModule[],
        pipelineConnections: Connection[],
        runQueue: string[],
        logFn: (moduleId: string, message: string) => void,
        overriddenParams: Record<string, Record<string, any>> | undefined,
        throwOnError: boolean
    ): Promise<CanvasModule[]> => {
        let currentModules = JSON.parse(JSON.stringify(pipelineModules));

        const getGlobalPolicyInfo = (): PolicyInfoOutput => {
            const policyModule = currentModules.find(m => m.type === ModuleType.DefinePolicyInfo);
            if (!policyModule) {
                throw new Error("A 'Define Policy Info' module is required in the canvas.");
            }
            if (policyModule.status === ModuleStatus.Success && policyModule.outputData && policyModule.outputData.type === 'PolicyInfoOutput') {
                 return policyModule.outputData as PolicyInfoOutput;
            }
            
            const params = (overriddenParams && overriddenParams[policyModule.id])
                ? { ...policyModule.parameters, ...overriddenParams[policyModule.id] }
                : policyModule.parameters;
            
            // Handle Maturity Age logic
            let policyTerm = Number(params.policyTerm);
            if (params.maturityAge && Number(params.maturityAge) > 0) {
                const calculatedTerm = Number(params.maturityAge) - Number(params.entryAge);
                // Fallback logic: if calculatedTerm is invalid, check if original policyTerm is valid
                if (calculatedTerm <= 0) {
                    if (policyTerm > 0) {
                        // Use original policyTerm, ignore maturityAge
                        // (No action needed, policyTerm is already set)
                    } else {
                         // Both invalid, let calculated term pass through to trigger error or be handled
                         policyTerm = calculatedTerm;
                    }
                } else {
                    policyTerm = calculatedTerm;
                }
            }

            return {
                type: 'PolicyInfoOutput',
                entryAge: Number(params.entryAge),
                gender: params.gender,
                policyTerm: policyTerm,
                paymentTerm: Number(params.paymentTerm),
                interestRate: Number(params.interestRate) / 100,
            };
        };

        const getAndValidateConnectedInput = <T extends ModuleOutput['type']>(
            moduleId: string, 
            portName: string, 
            expectedType: T
        ): Extract<ModuleOutput, { type: T }> => {
            const inputConnection = pipelineConnections.find(c => c.to.moduleId === moduleId && c.to.portName === portName);
            if (!inputConnection) throw new Error(`Input port '${portName}' is not connected.`);
            const sourceModule = currentModules.find(m => m.id === inputConnection.from.moduleId);
            if (!sourceModule) throw new Error(`Source module for port '${portName}' not found.`);
            if (sourceModule.status !== ModuleStatus.Success) throw new Error(`The upstream module '${sourceModule.name}' connected to '${portName}' has not run successfully.`);
            if (!sourceModule.outputData) throw new Error(`The upstream module '${sourceModule.name}' ran successfully but produced no output.`);
            if (sourceModule.outputData.type !== expectedType) throw new Error(`Data from upstream module '${sourceModule.name}' has an unexpected type. Expected '${expectedType}', got '${sourceModule.outputData.type}'.`);
            return sourceModule.outputData as Extract<ModuleOutput, { type: T }>;
        };

        for (const moduleId of runQueue) {
            let module = currentModules.find(m => m.id === moduleId)!;
            
            const isSourceModule = [ModuleType.LoadData, ModuleType.DefinePolicyInfo, ModuleType.ScenarioRunner, ModuleType.PipelineExplainer].includes(module.type);
            const hasInputConnections = pipelineConnections.some(c => c.to.moduleId === moduleId);
            
            if (!isSourceModule && !hasInputConnections) {
                logFn(moduleId, "Skipped: Input port not connected. Module will remain in pending state.");
                const skippedModule = { ...module, status: ModuleStatus.Pending };
                const idx = currentModules.findIndex(m => m.id === moduleId);
                currentModules[idx] = skippedModule;
                continue;
            }

            if (overriddenParams && overriddenParams[moduleId]) {
                module = { ...module, parameters: { ...module.parameters, ...overriddenParams[moduleId] }};
            }
            
            logFn(moduleId, `Running module: ${module.name}`);
            
            let newStatus: ModuleStatus = ModuleStatus.Error;
            let newOutputData: CanvasModule['outputData'] | undefined = undefined;

            try {
                if (module.type === ModuleType.LoadData) {
                    const fileContent = module.parameters.fileContent as string;
                    if (!fileContent) throw new Error("No file content loaded.");
                    const lines = fileContent.trim().split('\n');
                    if (lines.length < 1) throw new Error("CSV file is empty or invalid.");
                    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                    const stringRows = lines.slice(1).map(line => {
                        const values = line.split(',');
                        const rowObj: Record<string, string> = {};
                        header.forEach((col, index) => {
                            rowObj[col] = values[index]?.trim().replace(/"/g, '') || '';
                        });
                        return rowObj;
                    });
                    const columns = header.map(name => {
                        const sample = stringRows.slice(0, 100).map(r => r[name]).filter(v => v && v.trim() !== '');
                        const allAreNumbers = sample.length > 0 && sample.every(v => !isNaN(Number(v)));
                        return { name, type: allAreNumbers ? 'number' : 'string' };
                    });
                    const rows = stringRows.map(stringRow => {
                        const typedRow: Record<string, string | number | null> = {};
                        for(const col of columns) {
                            const val = stringRow[col.name];
                            if(col.type === 'number') typedRow[col.name] = (val && val.trim() !== '') ? parseFloat(val) : null;
                            else typedRow[col.name] = val;
                        }
                        return typedRow;
                    });
                    newOutputData = { type: 'DataPreview', columns, totalRowCount: rows.length, rows: rows.slice(0, 1000) };
                } else if (module.type === ModuleType.SelectData) {
                    const inputData = getAndValidateConnectedInput(module.id, 'data_in', 'DataPreview');
                    if (!inputData.rows) throw new Error("Input data is valid but contains no rows.");

                    const { selections } = module.parameters;
                    const populatedSelections = (selections && selections.length > 0) 
                        ? selections 
                        : inputData.columns.map((c: any) => ({ originalName: c.name, selected: true, newName: c.name }));

                    const selectedAndRenamed = populatedSelections.filter((s: any) => s.selected);
                    if (selectedAndRenamed.length === 0) throw new Error("No columns were selected.");
                    
                    const outputColumnsInfo = inputData.columns
                        .filter(c => selectedAndRenamed.some((s: any) => s.originalName === c.name))
                        .map(c => {
                            const selection = selectedAndRenamed.find((s: any) => s.originalName === c.name);
                            return { ...c, name: selection.newName };
                        });

                    const outputRows = inputData.rows.map(row => {
                        const newRow: Record<string, any> = {};
                        selectedAndRenamed.forEach((s: any) => { newRow[s.newName] = row[s.originalName]; });
                        return newRow;
                    });
                    newOutputData = { type: 'DataPreview', columns: outputColumnsInfo, totalRowCount: outputRows.length, rows: outputRows };
                } else if (module.type === ModuleType.RateModifier) {
                    const inputData = getAndValidateConnectedInput(module.id, 'data_in', 'DataPreview');
                    if (!inputData.rows) throw new Error("Input data contains no rows.");
                    const { calculations } = module.parameters;

                    if (!calculations || calculations.length === 0) {
                         newOutputData = inputData;
                    } else {
                        const outputRows = inputData.rows.map(r => ({ ...r }));
                        const outputColumnsInfo = [...inputData.columns];

                        for (const calc of calculations) {
                            const { newColumnName, formula } = calc;
                            if (!newColumnName || !formula) continue;
                            for (const row of outputRows) {
                                let evalFormula = formula;
                                const keys = Object.keys(row).sort((a, b) => b.length - a.length);
                                for (const key of keys) {
                                    const val = row[key];
                                    evalFormula = evalFormula.split(`[${key}]`).join(String(val ?? 0));
                                }
                                try {
                                    const result = new Function('return ' + evalFormula)();
                                    row[newColumnName] = typeof result === 'number' ? roundTo5(result) : result;
                                } catch (e) {
                                    row[newColumnName] = null;
                                }
                            }
                            if (!outputColumnsInfo.some(c => c.name === newColumnName)) {
                                outputColumnsInfo.push({ name: newColumnName, type: 'number' });
                            }
                        }
                        newOutputData = { type: 'DataPreview', columns: outputColumnsInfo, totalRowCount: outputRows.length, rows: outputRows };
                    }
                } else if (module.type === ModuleType.DefinePolicyInfo) {
                    const params = module.parameters;
                    let policyTerm = Number(params.policyTerm);
                    if (params.maturityAge && Number(params.maturityAge) > 0) {
                         const calculatedTerm = Number(params.maturityAge) - Number(params.entryAge);
                         if(calculatedTerm > 0) {
                            policyTerm = calculatedTerm;
                         }
                    }
                    newOutputData = {
                        type: 'PolicyInfoOutput',
                        entryAge: Number(params.entryAge),
                        gender: params.gender,
                        policyTerm: policyTerm,
                        paymentTerm: Number(params.paymentTerm),
                        interestRate: Number(params.interestRate) / 100,
                    };
                } else if (module.type === ModuleType.SelectRiskRates) {
                    const riskData = getAndValidateConnectedInput(module.id, 'risk_data_in', 'DataPreview');
                    const policyInfo = getGlobalPolicyInfo();

                    const { ageColumn, genderColumn } = module.parameters;
                    const { entryAge, policyTerm, gender, interestRate } = policyInfo;

                    if (!ageColumn || !genderColumn) throw new Error("Age and Gender columns must be specified in the module parameters.");
                    if (interestRate === undefined) throw new Error("Interest Rate is not defined in the connected Policy Info module.");
                    if (policyTerm <= 0) throw new Error(`Calculated Policy Term is ${policyTerm} (Entry Age: ${entryAge}). Policy Term must be positive. Check Maturity Age or Policy Term settings.`);

                    const filteredRows = riskData.rows?.filter(row => {
                        const rowGender = row[genderColumn];
                        const rowAge = Number(row[ageColumn]);
                        return rowGender === gender && rowAge >= entryAge && rowAge < (entryAge + policyTerm);
                    });

                    if (!filteredRows || filteredRows.length === 0) {
                        const availableGenders = [...new Set(riskData.rows?.map(r => r[genderColumn]))];
                        throw new Error(`No risk data found for gender "${gender}" and age range ${entryAge}-${entryAge + policyTerm - 1}. Available genders in data: [${availableGenders.join(', ')}]. Check column settings and policy info.`);
                    }
                    
                    const i = interestRate;
                    const sortedRows = [...filteredRows].sort((a, b) => Number(a[ageColumn]) - Number(b[ageColumn]));

                    const outputRows = sortedRows.map((row, t) => {
                        const newRow: Record<string, any> = { ...row };
                        
                        // Rename Age column if it's not already 'Age'
                        if (ageColumn !== 'Age') {
                            newRow['Age'] = newRow[ageColumn];
                            delete newRow[ageColumn];
                        }

                        // Rename Gender column if it's not already 'Gender'
                        if (genderColumn !== 'Gender') {
                            newRow['Gender'] = newRow[genderColumn];
                            delete newRow[genderColumn];
                        }

                        // Add interest rates
                        newRow['i_prem'] = roundTo5(1 / Math.pow(1 + i, t));
                        newRow['i_claim'] = roundTo5(1 / Math.pow(1 + i, t + 0.5));
                        
                        return newRow;
                    });

                    const baseColumns = riskData.columns
                        .filter(c => c.name !== 'i_prem' && c.name !== 'i_claim')
                        .map(c => {
                            if (c.name === ageColumn) return { ...c, name: 'Age' };
                            if (c.name === genderColumn) return { ...c, name: 'Gender' };
                            return c;
                        });

                    const outputColumnsInfo = [
                        ...baseColumns,
                        { name: 'i_prem', type: 'number' as const },
                        { name: 'i_claim', type: 'number' as const },
                    ];

                    newOutputData = { type: 'DataPreview', columns: outputColumnsInfo, totalRowCount: outputRows.length, rows: outputRows };
                } else if (module.type === ModuleType.CalculateSurvivors) {
                    const inputData = getAndValidateConnectedInput(module.id, 'data_in', 'DataPreview');
                    if (!inputData.rows) throw new Error("Input data is valid but contains no rows.");

                    const { ageColumn, mortalityColumn, calculations } = module.parameters;

                    if (!ageColumn || ageColumn === 'None') throw new Error("Age Column must be specified.");
                    if (!calculations || !Array.isArray(calculations) || calculations.length === 0) {
                        throw new Error("At least one lx calculation must be defined.");
                    }

                    const sortedRows = [...inputData.rows].sort((a, b) => Number(a[ageColumn]) - Number(b[ageColumn]));
                    if (sortedRows.length > 0 && sortedRows[0]['i_prem'] === undefined) {
                        throw new Error("Input data must contain an 'i_prem' column for Dx calculations. Connect an 'Age Gender Matching' module.");
                    }

                    const outputRows = sortedRows.map(r => ({ ...r })); // Deep copy
                    const outputColumnsInfo = [...inputData.columns];

                    const getSafeRate = (row: Record<string, any>, colName: string) => {
                        const val = row[colName];
                        if (val === null || val === undefined) return 0;
                        const num = Number(val);
                        if (isNaN(num)) return 0; 
                        return num;
                    };

                    for (const calc of calculations) {
                        let currentSurvivors = 100000;
                        const lxColName = `lx_${calc.name}`;
                        const decrementRatesInCalc: string[] = calc.decrementRates || [];
                        const isMortalityPresent = mortalityColumn !== 'None' && decrementRatesInCalc.includes(mortalityColumn);
                        const otherDecrementRates = decrementRatesInCalc.filter(r => r !== mortalityColumn);

                        for (const row of outputRows) {
                            row[lxColName] = roundTo5(currentSurvivors); // Round to 5 decimal places
                            let deaths = 0;
                            if (isMortalityPresent && otherDecrementRates.length === 0) {
                                const mortalityRate = getSafeRate(row, mortalityColumn);
                                deaths = currentSurvivors * mortalityRate;
                            } else if (!isMortalityPresent && otherDecrementRates.length > 0) {
                                const survivalProduct = otherDecrementRates.reduce((prod, rateCol) => prod * (1 - getSafeRate(row, rateCol)), 1);
                                deaths = currentSurvivors * (1 - survivalProduct);
                            } else if (isMortalityPresent && otherDecrementRates.length > 0) {
                                const mortalityRate = getSafeRate(row, mortalityColumn);
                                const otherSurvivalProduct = otherDecrementRates.reduce((prod, rateCol) => prod * (1 - getSafeRate(row, rateCol)), 1);
                                const q_others = 1 - otherSurvivalProduct;
                                const totalDecrementFactor = mortalityRate + q_others - (mortalityRate * q_others / 2.0);
                                deaths = currentSurvivors * totalDecrementFactor;
                            }
                            currentSurvivors -= deaths;
                        }
                        
                        if (!outputColumnsInfo.some(c => c.name === lxColName)) {
                            outputColumnsInfo.push({ name: lxColName, type: 'number' });
                        }
                        const dxColName = `Dx_${calc.name}`;
                        for (const row of outputRows) {
                             // Round Dx to 5 decimal places
                            row[dxColName] = roundTo5((Number(row[lxColName]) || 0) * (Number(row['i_prem']) || 0));
                        }
                         if (!outputColumnsInfo.some(c => c.name === dxColName)) {
                            outputColumnsInfo.push({ name: dxColName, type: 'number' });
                        }
                    }
                    newOutputData = { type: 'DataPreview', columns: outputColumnsInfo, totalRowCount: outputRows.length, rows: outputRows };
                } else if (module.type === ModuleType.ClaimsCalculator) {
                    const inputData = getAndValidateConnectedInput(module.id, 'data_in', 'DataPreview');
                    if (!inputData.rows) throw new Error("Input data is valid but contains no rows.");
                    
                    const calculations = module.parameters.calculations || [];
                    
                    if (inputData.rows.length > 0 && inputData.rows[0]['i_claim'] === undefined) {
                         throw new Error("Input data must contain an 'i_claim' column. Connect an 'Age Gender Matching' module.");
                    }

                    // Deep copy rows to prevent mutating original input
                    const outputRows = inputData.rows.map(r => ({ ...r }));
                    const outputColumnsInfo = [...inputData.columns];
                    
                    // Set to track ALL column names to ensure global uniqueness
                    const usedColumnNames = new Set(outputColumnsInfo.map(c => c.name));

                    const getSafeName = (baseName: string) => {
                        let name = baseName;
                        let counter = 1;
                        while (usedColumnNames.has(name)) {
                            name = `${baseName}_${counter}`;
                            counter++;
                        }
                        return name;
                    };
                    
                    // Use for...of loop to ensure sequential execution and correct column name tracking
                    for (const calc of calculations) {
                        const { lxColumn, riskRateColumn } = calc;
                        
                        // 1. Validation: Check if columns are selected
                        if (!lxColumn || !riskRateColumn) {
                            // Skip this calculation if configuration is incomplete
                            continue;
                        }

                        const calcName = calc.name || riskRateColumn || 'Calc';

                        // 2. Generate unique column names
                        const dxBaseName = `dx_${calcName}`;
                        const cxBaseName = `Cx_${calcName}`;
                        
                        const dxColName = getSafeName(dxBaseName);
                        usedColumnNames.add(dxColName); // Important: Register immediately

                        const cxColName = getSafeName(cxBaseName);
                        usedColumnNames.add(cxColName); // Important: Register immediately

                        // 3. Register Column Info
                        outputColumnsInfo.push({ name: dxColName, type: 'number' });
                        outputColumnsInfo.push({ name: cxColName, type: 'number' });

                        // 4. Perform Calculation for all rows
                        for (const row of outputRows) {
                            // Safe number parsing, default to 0 if missing/NaN
                            const lxVal = row[lxColumn];
                            const qVal = row[riskRateColumn];
                            const iClaimVal = row['i_claim'];

                            const lx = !isNaN(Number(lxVal)) ? Number(lxVal) : 0;
                            const q = !isNaN(Number(qVal)) ? Number(qVal) : 0;
                            const i_claim = !isNaN(Number(iClaimVal)) ? Number(iClaimVal) : 0;
                            
                            // Calculate dx WITHOUT immediate rounding to avoid zeroing out small values
                            const rawDx = lx * q;
                            const dxVal = roundTo5(rawDx); 
                            
                            row[dxColName] = dxVal;
                            row[cxColName] = roundTo5(dxVal * i_claim);
                        }
                    }

                    newOutputData = { type: 'DataPreview', columns: outputColumnsInfo, totalRowCount: outputRows.length, rows: outputRows };
                } else if (module.type === ModuleType.NxMxCalculator) {
                    const inputData = getAndValidateConnectedInput(module.id, 'data_in', 'DataPreview');
                    if (!inputData.rows) throw new Error("Input data has no rows.");
                    const { nxCalculations = [], mxCalculations = [] } = module.parameters;
                    const outputRows = inputData.rows.map(r => ({ ...r }));
                    const outputColumnsInfo = [...inputData.columns];

                    for (const calc of nxCalculations) {
                        if (calc.active === false) continue;
                        if (!calc.baseColumn || !calc.name) continue;
                        const baseData = outputRows.map(row => Number(row[calc.baseColumn]) || 0);
                        const cumulativeData = new Array(baseData.length).fill(0);
                        let sum = 0;
                        for (let i = baseData.length - 1; i >= 0; i--) { sum += baseData[i]; cumulativeData[i] = sum; }
                        const newColName = `Nx_${calc.name}`;
                        outputRows.forEach((row, i) => { row[newColName] = roundTo5(cumulativeData[i]); });
                        if (!outputColumnsInfo.some(c => c.name === newColName)) outputColumnsInfo.push({ name: newColName, type: 'number' });
                    }

                    for (const calc of mxCalculations) {
                        if (calc.active === false) continue;
                        if (!calc.baseColumn || !calc.name) continue;
                        const adjustedCxData = outputRows.map((row, index) => {
                            let cx = Number(row[calc.baseColumn]) || 0;
                            let factor = 1.0;
                            if (index === 0) {
                                if (calc.deductibleType === '0.25') factor *= 0.75;
                                else if (calc.deductibleType === '0.5') factor *= 0.5;
                                else if (calc.deductibleType === 'custom') factor *= (1 - (Number(calc.customDeductible) || 0));
                            }
                            const ratio = (calc.paymentRatios || []).find((r: any) => r.year === index + 1);
                            if (ratio) {
                                if (ratio.type === 'Custom') factor *= (Number(ratio.customValue) || 0) / 100;
                                else factor *= parseFloat(ratio.type) / 100;
                            }
                            return cx * factor;
                        });
                        const cumulativeData = new Array(adjustedCxData.length).fill(0);
                        let sum = 0;
                        for (let i = adjustedCxData.length - 1; i >= 0; i--) { sum += adjustedCxData[i]; cumulativeData[i] = sum; }
                        const newColName = `Mx_${calc.name}`;
                        outputRows.forEach((row, i) => { row[newColName] = roundTo5(cumulativeData[i]); });
                        if (!outputColumnsInfo.some(c => c.name === newColName)) outputColumnsInfo.push({ name: newColName, type: 'number' });
                    }
                    newOutputData = { type: 'DataPreview', columns: outputColumnsInfo, totalRowCount: outputRows.length, rows: outputRows };
                } else if (module.type === ModuleType.PremiumComponent) {
                    const inputData = getAndValidateConnectedInput(module.id, 'data_in', 'DataPreview');
                    const policyInfo = getGlobalPolicyInfo();
                    if (!inputData.rows) throw new Error("Input data has no rows.");

                    const { nnxCalculations = [], sumxCalculations = [] } = module.parameters;
                    const { paymentTerm, policyTerm } = policyInfo;
                    const rows = inputData.rows;

                    const nnxResults: Record<string, number> = {};
                    for (const calc of nnxCalculations) {
                        const nx_start = Number(rows[0][calc.nxColumn]);
                        const nx_end = rows[paymentTerm] ? Number(rows[paymentTerm][calc.nxColumn]) : 0;
                        const resultName = `NNX_${calc.nxColumn.replace('Nx_', '')}`;
                        nnxResults[resultName] = roundTo5(nx_start - nx_end);
                    }

                    let sumxValue = 0;
                    const mxResults: Record<string, number> = {};
                    for (const calc of sumxCalculations) {
                        const mx_start = Number(rows[0][calc.mxColumn]);
                        const mx_end = rows[policyTerm] ? Number(rows[policyTerm][calc.mxColumn]) : 0;
                        
                        const benefit_pv = Number(calc.amount) * (mx_start - mx_end);
                        sumxValue += benefit_pv;
                        
                        const resultName = calc.mxColumn.replace('Mx_', '');
                        mxResults[resultName] = roundTo5(benefit_pv);
                    }
                    newOutputData = { 
                        type: 'PremiumComponentOutput', 
                        nnxResults, 
                        sumxValue: roundTo5(sumxValue),
                        mxResults 
                    };
                } else if (module.type === ModuleType.AdditionalName) {
                    const inputData = getAndValidateConnectedInput(module.id, 'data_in', 'DataPreview');
                    const policyInfo = getGlobalPolicyInfo();
                    const definitions = module.parameters.definitions || [];
                    const basicValues = module.parameters.basicValues || [];
                    
                    if (!inputData.rows) throw new Error("Input data has no rows.");
                    
                    const variables: Record<string, number> = {};
                    
                    // Process Basic Values
                    for (const bv of basicValues) {
                        if (bv.name) {
                            variables[bv.name] = Number(bv.value) || 0;
                        }
                    }

                    // Process Custom Definitions
                    for (const def of definitions) {
                        if (!def.name) continue;
                        
                        if (def.type === 'static') {
                            variables[def.name] = Number(def.staticValue) || 0;
                        } else if (def.type === 'lookup') {
                            if (!def.column) continue;
                            
                            let rowIndex = 0;
                            
                            if (def.rowType === 'policyTerm') {
                                rowIndex = policyInfo.policyTerm;
                            } else if (def.rowType === 'paymentTerm') {
                                rowIndex = policyInfo.paymentTerm;
                            } else if (def.rowType === 'entryAgePlus') {
                                // Assumes rows start at entry age or index 0 = duration 0.
                                // Usually commutation columns are indexed by age or duration.
                                // If input comes from NxMxCalculator which inherits from SelectRiskRates, row 0 = Entry Age.
                                // So row index for "Entry Age + X" simply means duration index X.
                                rowIndex = Number(def.customValue) || 0; 
                            } else if (def.rowType === 'custom') {
                                rowIndex = Number(def.customValue) || 0;
                            }
                            
                            // Ensure index is within bounds
                            if (rowIndex < 0) rowIndex = 0;
                            if (rowIndex >= inputData.rows.length) rowIndex = inputData.rows.length - 1;
                            
                            const val = inputData.rows[rowIndex][def.column];
                            variables[def.name] = Number(val) || 0;
                        }
                    }
                    
                    newOutputData = {
                        type: 'AdditionalVariablesOutput',
                        variables
                    };
                } else if (module.type === ModuleType.NetPremiumCalculator) {
                    const premiumComponents = getAndValidateConnectedInput(module.id, 'premium_components_in', 'PremiumComponentOutput');
                    const policyInfo = getGlobalPolicyInfo();
                    const { formula, variableName } = module.parameters;
                    
                    // Optional: Additional Variables
                    let additionalVars: Record<string, number> = {};
                    const additionalVarsConn = pipelineConnections.find(c => c.to.moduleId === module.id && c.to.portName === 'additional_vars_in');
                    if (additionalVarsConn) {
                        try {
                            const output = getAndValidateConnectedInput(module.id, 'additional_vars_in', 'AdditionalVariablesOutput');
                            additionalVars = output.variables;
                        } catch (e) {
                            throw e; 
                        }
                    }

                    if (!formula) throw new Error("Premium formula is not defined.");

                    const context = { 
                        ...premiumComponents.nnxResults, 
                        SUMX: premiumComponents.sumxValue, 
                        m: policyInfo.paymentTerm, 
                        n: policyInfo.policyTerm,
                        ...additionalVars 
                    };
                    
                    let expression = formula;
                    
                    // STRICT Token Replacement: Only handle [Variable]
                    for (const key in context) {
                        const token = `[${key}]`;
                        // Global replace of [Key] with value
                        expression = expression.split(token).join(String((context as any)[key]));
                    }

                    if (/[^0-9+\-*/().\s]/.test(expression)) {
                        throw new Error(`Invalid characters or unresolved variables in formula: ${expression}`);
                    }
                    const netPremium = new Function('return ' + expression)();
                    
                    // Add result to context using user-defined variable name (default PP)
                    const resultVarName = variableName || 'PP';
                    context[resultVarName] = roundTo5(netPremium);

                    newOutputData = { 
                        type: 'NetPremiumOutput', 
                        formula, 
                        substitutedFormula: expression, 
                        netPremium: roundTo5(netPremium),
                        variables: context // Include context for downstream modules
                    };
                } else if (module.type === ModuleType.GrossPremiumCalculator) {
                    const netPremiumInput = getAndValidateConnectedInput(module.id, 'net_premium_in', 'NetPremiumOutput');
                    const { formula, variableName } = module.parameters;

                    // Optional: Additional Variables
                    let additionalVars: Record<string, number> = {};
                    const additionalVarsConn = pipelineConnections.find(c => c.to.moduleId === module.id && c.to.portName === 'additional_vars_in');
                    if (additionalVarsConn) {
                        try {
                            const output = getAndValidateConnectedInput(module.id, 'additional_vars_in', 'AdditionalVariablesOutput');
                            additionalVars = output.variables;
                        } catch (e) {
                            throw e;
                        }
                    }

                    if (!formula) throw new Error("Gross Premium formula is not defined.");

                    // Context construction: Inherit previous context + Additional Vars
                    // Note: NetPremiumCalculator already added its result (e.g., PP) to variables
                    const context = {
                        ...netPremiumInput.variables, 
                        ...additionalVars 
                    };

                    let expression = formula;
                    
                    // STRICT Token Replacement: Only handle [Variable]
                    for (const key in context) {
                        const token = `[${key}]`;
                        expression = expression.split(token).join(String((context as any)[key]));
                    }

                    if (/[^0-9+\-*/().\s]/.test(expression)) {
                        throw new Error(`Invalid characters or unresolved variables in formula: ${expression}`);
                    }
                    const grossPremium = new Function('return ' + expression)();
                    
                    // Add result to context using user-defined variable name (default GP)
                    const resultVarName = variableName || 'GP';
                    context[resultVarName] = roundTo5(grossPremium);

                    newOutputData = { 
                        type: 'GrossPremiumOutput', 
                        formula, 
                        substitutedFormula: expression, 
                        grossPremium: roundTo5(grossPremium),
                        variables: context
                    };
                } else if (module.type === ModuleType.PipelineExplainer) {
                    // Generate a comprehensive report of the pipeline
                    // We will iterate through the topological sort order to explain the flow
                    
                    const sort = getTopologicalSort(currentModules, pipelineConnections);
                    const steps: PipelineReportStep[] = [];

                    // Find the Policy Info first as it's global context
                    const policyInfo = getGlobalPolicyInfo();
                    steps.push({
                        moduleId: 'policy-info-global',
                        moduleName: 'Global Policy Info',
                        moduleType: ModuleType.DefinePolicyInfo,
                        description: 'Global policy parameters used throughout the calculation.',
                        details: [
                            { label: 'Entry Age', value: String(policyInfo.entryAge) },
                            { label: 'Gender', value: policyInfo.gender },
                            { label: 'Policy Term', value: `${policyInfo.policyTerm} years` },
                            { label: 'Payment Term', value: `${policyInfo.paymentTerm} years` },
                            { label: 'Interest Rate', value: `${(policyInfo.interestRate * 100).toFixed(2)}%` }
                        ]
                    });

                    for (const modId of sort) {
                        const mod = currentModules.find(m => m.id === modId);
                        if (!mod || mod.id === moduleId) continue; // Skip self and not found

                        if (mod.type === ModuleType.LoadData) {
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: `Loaded data from ${mod.parameters.source}`,
                                details: []
                            });
                        } else if (mod.type === ModuleType.SelectRiskRates) {
                            steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: 'Selected and filtered risk rate table.',
                                details: [
                                    { label: 'Age Column', value: mod.parameters.ageColumn },
                                    { label: 'Gender Column', value: mod.parameters.genderColumn },
                                    { label: 'Action', value: 'Calculated i_prem and i_claim factors.' }
                                ]
                            });
                        } else if (mod.type === ModuleType.RateModifier) {
                             const calcs = mod.parameters.calculations || [];
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: `Applied ${calcs.length} rate modification formulas.`,
                                details: calcs.map((c: any) => ({
                                    label: `New Column: ${c.newColumnName}`,
                                    value: `Formula: ${c.formula}`
                                }))
                            });
                        } else if (mod.type === ModuleType.CalculateSurvivors) {
                             const calcs = mod.parameters.calculations || [];
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: 'Calculated survivor counts (lx) and Dx.',
                                details: calcs.map((c: any) => ({
                                    label: `Calculation: ${c.name}`,
                                    value: `Decrements: ${(c.decrementRates || []).join(', ')}`
                                }))
                            });
                        } else if (mod.type === ModuleType.ClaimsCalculator) {
                             const calcs = mod.parameters.calculations || [];
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: 'Calculated claim amounts (dx) and Cx.',
                                details: calcs.map((c: any) => ({
                                    label: `Calculation: ${c.name || 'Unnamed'}`,
                                    value: `lx: ${c.lxColumn}, q: ${c.riskRateColumn}`
                                }))
                            });
                        } else if (mod.type === ModuleType.NxMxCalculator) {
                             const nx = mod.parameters.nxCalculations || [];
                             const mx = mod.parameters.mxCalculations || [];
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: 'Calculated commutation functions Nx and Mx.',
                                details: [
                                    ...nx.map((c: any) => ({ label: `Nx: ${c.name}`, value: `From: ${c.baseColumn}` })),
                                    ...mx.map((c: any) => ({ label: `Mx: ${c.name}`, value: `From: ${c.baseColumn} (Deductible: ${c.deductibleType})` }))
                                ]
                            });
                        } else if (mod.type === ModuleType.PremiumComponent) {
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: 'Aggregated NNX and SUMX components.',
                                details: [
                                    ...(mod.parameters.nnxCalculations || []).map((c: any) => ({ label: 'NNX Source', value: c.nxColumn })),
                                    ...(mod.parameters.sumxCalculations || []).map((c: any) => ({ label: 'SUMX Source', value: `${c.mxColumn} (Amount: ${c.amount})` }))
                                ]
                            });
                        } else if (mod.type === ModuleType.AdditionalName) {
                             const defs = mod.parameters.definitions || [];
                             const bvs = mod.parameters.basicValues || [];
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: 'Defined additional variables.',
                                details: [
                                    ...bvs.map((b: any) => ({ label: b.name, value: `Basic Value: ${b.value}` })),
                                    ...defs.map((d: any) => ({
                                        label: d.name,
                                        value: d.type === 'static' ? `Static: ${d.staticValue}` : `Lookup: ${d.column} @ ${d.rowType}`
                                    }))
                                ]
                            });
                        } else if (mod.type === ModuleType.NetPremiumCalculator) {
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: 'Calculated final Net Premium.',
                                details: [
                                    { label: 'Formula', value: mod.parameters.formula },
                                    { label: 'Substituted', value: (mod.outputData as NetPremiumOutput)?.substitutedFormula || 'N/A' },
                                    { label: 'Result', value: String((mod.outputData as NetPremiumOutput)?.netPremium) }
                                ]
                            });
                        } else if (mod.type === ModuleType.GrossPremiumCalculator) {
                             steps.push({
                                moduleId: mod.id,
                                moduleName: mod.name,
                                moduleType: mod.type,
                                description: 'Calculated Gross Premium from Net Premium.',
                                details: [
                                    { label: 'Formula', value: mod.parameters.formula },
                                    { label: 'Substituted', value: (mod.outputData as GrossPremiumOutput)?.substitutedFormula || 'N/A' },
                                    { label: 'Result', value: String((mod.outputData as GrossPremiumOutput)?.grossPremium) }
                                ]
                            });
                        }
                    }

                    newOutputData = {
                        type: 'PipelineExplainerOutput',
                        steps: steps
                    };
                }
                
                newStatus = ModuleStatus.Success;
                logFn(moduleId, `SUCCESS: Module finished successfully.`);
            } catch (error: any) {
                newStatus = ModuleStatus.Error;
                const errorMessage = `ERROR: ${error.message}`;
                logFn(moduleId, errorMessage);
                console.error(`Module [${module.name}] failed: ${error.message}`);
                
                const finalModuleState = { ...module, status: newStatus, outputData: newOutputData };
                const moduleIndex = currentModules.findIndex(m => m.id === moduleId);
                currentModules[moduleIndex] = finalModuleState;
                
                if (throwOnError) {
                    throw new Error(error.message);
                }
                return currentModules;
            }

            const finalModuleState = { ...module, status: newStatus, outputData: newOutputData };
            const moduleIndex = currentModules.findIndex(m => m.id === moduleId);
            currentModules[moduleIndex] = finalModuleState;
        }
        return currentModules;
    }, [getTopologicalSort]);

  const runScenarioRunner = useCallback(async (runnerId: string) => {
    const runnerModule = modules.find(m => m.id === runnerId)!;
    const { scenarios } = runnerModule.parameters;
    
    const log = (message: string) => {
        setTerminalOutputs(prev => ({ ...prev, [runnerId]: [...(prev[runnerId] || []), `[${new Date().toLocaleTimeString()}] ${message}`] }));
    };

    log(`Starting scenario run for ${runnerModule.name}...`);
    setModules(prev => prev.map(m => m.id === runnerId ? { ...m, status: ModuleStatus.Running } : m));

    try {
        const parseValues = (valueStr: string): (string | number)[] => {
            if (valueStr.includes(',')) {
                return valueStr.split(',').map(s => s.trim());
            }
            if (valueStr.includes('-')) {
                const [start, end] = valueStr.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                }
            }
            return [valueStr];
        };

        const scenarioParams = scenarios.map((s: any) => ({ ...s, parsedValues: parseValues(s.values) }));
        const cartesian = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
        const valueArrays = scenarioParams.map((s: any) => s.parsedValues);
        const combinations = valueArrays.length > 0 ? cartesian(...valueArrays) : [[]];

        log(`Generated ${combinations.length} scenarios to run.`);
        const results: Record<string, any>[] = [];
        const resultColumns: ColumnInfo[] = [
            ...scenarios.map((s: any) => ({ name: s.variableName, type: 'string' })),
            { name: 'NetPremium', type: 'number' }
        ];

        for (let i = 0; i < combinations.length; i++) {
            const combo = Array.isArray(combinations[i]) ? combinations[i] : [combinations[i]];
            const overrides: Record<string, Record<string, any>> = {};
            const resultRow: Record<string, any> = {};
            
            // Identify Policy Module ID to handle logic
            const policyModuleId = modules.find(m => m.type === ModuleType.DefinePolicyInfo)?.id;

            scenarios.forEach((scenario: any, index: number) => {
                const value = combo[index];
                
                if (!overrides[scenario.targetModuleId]) {
                    overrides[scenario.targetModuleId] = {};
                }

                // Explicit logic for split PolicyTerm and MaturityAge
                if (scenario.targetModuleId === policyModuleId) {
                    if (scenario.targetParameterName === 'maturityAge') {
                        overrides[scenario.targetModuleId]['maturityAge'] = value;
                         // We do NOT reset policyTerm to 0 here. 
                         // We let the module execution logic decide. 
                         // If maturityAge is valid (>0) and calculated term > 0, it will be used.
                         // If not, original policyTerm will be used (fallback).
                    } else if (scenario.targetParameterName === 'policyTerm') {
                        overrides[scenario.targetModuleId]['policyTerm'] = value;
                        // Reset maturityAge to 0 to ensure calculation based on duration takes precedence
                        overrides[scenario.targetModuleId]['maturityAge'] = 0;
                    } else {
                         overrides[scenario.targetModuleId][scenario.targetParameterName] = value;
                    }
                } else {
                    overrides[scenario.targetModuleId][scenario.targetParameterName] = value;
                }

                // Handle legacy suffix support if needed
                if (scenario.targetModuleId === policyModuleId && typeof value === 'string' && value.endsWith('(Age)')) {
                    const matAge = parseInt(value.replace('(Age)', ''));
                    overrides[scenario.targetModuleId]['maturityAge'] = matAge;
                }

                resultRow[scenario.variableName] = value;
            });
            
            log(`Running scenario ${i + 1}/${combinations.length}: ${JSON.stringify(resultRow)}`);
            
            try {
                const allModules = JSON.parse(JSON.stringify(modules));
                // Use topological sort to ensure correct execution order
                const executionOrder = getTopologicalSort(allModules, connections).filter(id => id !== runnerId);
                
                const finalModules = await executePipeline(allModules, connections, executionOrder, () => {}, overrides, true);
                
                // Capture final Policy Term
                const finalPolicyModule = finalModules.find(m => m.type === ModuleType.DefinePolicyInfo);
                if (finalPolicyModule?.outputData?.type === 'PolicyInfoOutput') {
                    const calculatedTerm = finalPolicyModule.outputData.policyTerm;
                    // Update result table to show calculated Duration if Maturity Age was used
                    scenarios.forEach((s: any) => {
                        if (s.targetModuleId === policyModuleId) {
                             // If user targeted Maturity Age, table should reflect Duration
                             if (s.targetParameterName === 'maturityAge' || (typeof resultRow[s.variableName] === 'string' && resultRow[s.variableName].endsWith('(Age)'))) {
                                 resultRow[s.variableName] = calculatedTerm;
                             }
                        }
                    });
                }

                const premiumModule = finalModules.find(m => m.type === ModuleType.NetPremiumCalculator);
                if (premiumModule?.outputData?.type === 'NetPremiumOutput') {
                    resultRow['NetPremium'] = premiumModule.outputData.netPremium;
                } else {
                    resultRow['NetPremium'] = null; // Mark as failed
                }
                results.push(resultRow);
            } catch (e: any) {
                log(`ERROR: Scenario ${i + 1} failed: ${e.message}`);
                resultRow['NetPremium'] = null;
                results.push(resultRow);
            }
        }
        
        const outputData: ModuleOutput = {
            type: 'ScenarioRunnerOutput',
            columns: resultColumns,
            totalRowCount: results.length,
            rows: results
        };

        setModules(prev => prev.map(m => m.id === runnerId ? { ...m, status: ModuleStatus.Success, outputData } : m));
        log('Scenario run finished successfully.');

    } catch (e: any) {
        log(`FATAL ERROR in Scenario Runner: ${e.message}`);
        setModules(prev => prev.map(m => m.id === runnerId ? { ...m, status: ModuleStatus.Error } : m));
    }
  }, [modules, connections, executePipeline, getTopologicalSort]);

  const runSimulation = useCallback(async (startModuleId?: string) => {
    const isScenarioRun = startModuleId && modules.find(m => m.id === startModuleId)?.type === ModuleType.ScenarioRunner;
    const isPipelineExplainer = startModuleId && modules.find(m => m.id === startModuleId)?.type === ModuleType.PipelineExplainer;
    
    if (isScenarioRun) {
        await runScenarioRunner(startModuleId!);
        return;
    }
    
    const runQueue = startModuleId 
        ? [startModuleId] 
        : (isPipelineExplainer 
            ? [startModuleId!] 
            : getTopologicalSort(modules, connections));
    
    const log = (moduleId: string, message: string) => {
        setTerminalOutputs(prev => ({ ...prev, [moduleId]: [...(prev[moduleId] || []), `[${new Date().toLocaleTimeString()}] ${message}`] }));
    };

    const modulesToRun = modules.map(m => ({ ...m, status: runQueue.includes(m.id) ? ModuleStatus.Running : m.status }));
    setModules(modulesToRun);
    
    try {
        const finalModules = await executePipeline(modulesToRun, connections, runQueue, log, undefined, false);

        const failedModuleInQueue = runQueue
            .map(id => finalModules.find(m => m.id === id))
            .find(m => m?.status === ModuleStatus.Error);

        setModules(finalModules);

        if (failedModuleInQueue) {
            const errorMsg = `Pipeline execution failed at module: ${failedModuleInQueue.name}`;
            console.error(errorMsg);
            alert(`${errorMsg}\n\nCheck the Terminal panel for detailed error logs.`);
            setIsCodePanelVisible(true);
            setSelectedModuleIds([failedModuleInQueue.id]);
        } else if (startModuleId) { // Reset downstream modules on success
            const adj: Record<string, string[]> = {};
            modules.forEach(m => { adj[m.id] = []; });
            connections.forEach(conn => adj[conn.from.moduleId].push(conn.to.moduleId));
            const descendants = new Set<string>();
            const q = [...(adj[startModuleId] || [])];
            q.forEach(id => descendants.add(id));
            let head = 0;
            while (head < q.length) {
                const u = q[head++];
                (adj[u] || []).forEach(v => { if (!descendants.has(v)) { descendants.add(v); q.push(v); }});
            }
            if (descendants.size > 0) {
                const finalDescendants = Array.from(descendants);
                setModules(prev => prev.map(m => finalDescendants.includes(m.id) ? { ...m, status: ModuleStatus.Pending, outputData: undefined } : m));
                setTerminalOutputs(prev => {
                    const newTerminal = { ...prev };
                    finalDescendants.forEach(id => delete newTerminal[id]);
                    return newTerminal;
                });
            }
        }
    } catch (error: any) {
         // This catch block handles unexpected errors outside executePipeline (e.g. during getTopologicalSort or setModules)
         console.error("Unexpected error during simulation run:", error);
         alert(`An unexpected error occurred: ${error.message}`);
    }
  }, [modules, connections, executePipeline, runScenarioRunner, getTopologicalSort]);
  
  const adjustScale = (delta: number) => {
      setScale(prev => Math.max(0.2, Math.min(2, prev + delta)));
  }
  
  const handleControlsMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      isDraggingControls.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
      const handleWindowMouseMove = (e: MouseEvent) => {
          if (!isDraggingControls.current) return;
          const dx = e.clientX - lastMousePos.current.x;
          const dy = e.clientY - lastMousePos.current.y;
          setControlsPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          lastMousePos.current = { x: e.clientX, y: e.clientY };
      };
      const handleWindowMouseUp = () => {
          isDraggingControls.current = false;
      };
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      return () => {
          window.removeEventListener('mousemove', handleWindowMouseMove);
          window.removeEventListener('mouseup', handleWindowMouseUp);
      };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const isEditingText = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable);
        if (isEditingText) return;

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') { e.preventDefault(); undo(); } 
            else if (e.key === 'y') { e.preventDefault(); redo(); } 
            else if (e.key === 'a') {
                e.preventDefault();
                setSelectedModuleIds(modules.map(m => m.id));
            }
            else if (e.key === 'c') {
                if (selectedModuleIds.length > 0) {
                    e.preventDefault(); pasteOffset.current = 0;
                    const selectedModules = modules.filter(m => selectedModuleIds.includes(m.id));
                    const selectedIdsSet = new Set(selectedModuleIds);
                    const internalConnections = connections.filter(c => selectedIdsSet.has(c.from.moduleId) && selectedIdsSet.has(c.to.moduleId));
                    setClipboard({ modules: JSON.parse(JSON.stringify(selectedModules)), connections: JSON.parse(JSON.stringify(internalConnections)) });
                }
            } else if (e.key === 'v') {
                e.preventDefault();
                if (clipboard) {
                    pasteOffset.current += 30; const idMap: Record<string, string> = {};
                    const newModules = clipboard.modules.map(mod => {
                        const newId = `${mod.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                        idMap[mod.id] = newId;
                        return { ...mod, id: newId, position: { x: mod.position.x + pasteOffset.current, y: mod.position.y + pasteOffset.current }, status: ModuleStatus.Pending, outputData: undefined };
                    });
                    const newConnections = clipboard.connections.map(conn => ({ ...conn, id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, from: { ...conn.from, moduleId: idMap[conn.from.moduleId] }, to: { ...conn.to, moduleId: idMap[conn.to.moduleId] } }));
                    setModules(prev => [...prev, ...newModules]);
                    setConnections(prev => [...prev, ...newConnections]);
                    setSelectedModuleIds(newModules.map(m => m.id));
                }
            }
        } else if (selectedModuleIds.length > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
            e.preventDefault();
            deleteModules([...selectedModuleIds]);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModuleIds, undo, redo, setModules, setConnections, setSelectedModuleIds, modules, connections, clipboard, deleteModules]);

  const categorizedModules = [
    { name: 'Data', types: [ModuleType.DefinePolicyInfo, ModuleType.LoadData, ModuleType.SelectRiskRates, ModuleType.SelectData, ModuleType.RateModifier] },
    { name: 'Actuarial', types: [ModuleType.CalculateSurvivors, ModuleType.ClaimsCalculator, ModuleType.NxMxCalculator, ModuleType.PremiumComponent, ModuleType.AdditionalName, ModuleType.NetPremiumCalculator, ModuleType.GrossPremiumCalculator] },
    { name: 'Automation', types: [ModuleType.ScenarioRunner, ModuleType.PipelineExplainer] }
  ];

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, type: ModuleType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const lastSelectedModule = useMemo(() => {
    if (selectedModuleIds.length === 0) return null;
    const lastId = selectedModuleIds[selectedModuleIds.length - 1];
    return modules.find(m => m.id === lastId) || null;
  }, [selectedModuleIds, modules]);

  return (
    <div className="bg-gray-900 text-white h-screen w-full flex flex-col overflow-hidden">
        <header className="flex flex-col px-4 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0 z-20 gap-2">
            {/* 최상단: 제목과 모델 이름 */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <LogoIcon className="h-6 w-6 text-blue-400 flex-shrink-0" />
                    <h1 className="text-xl font-bold text-blue-300 tracking-wide whitespace-nowrap">Life Matrix Flow</h1>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-gray-600">|</span>
                    {isEditingProductName ? (
                        <input value={productName} onChange={e => setProductName(e.target.value)} onBlur={() => setIsEditingProductName(false)} onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setIsEditingProductName(false); }} className="bg-gray-800 text-lg font-semibold text-white px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md" autoFocus />
                    ) : (
                        <h2 onClick={() => setIsEditingProductName(true)} className="text-lg font-semibold text-gray-300 hover:bg-gray-700 px-2 py-1 rounded-md cursor-pointer truncate max-w-md" title="Click to edit product name">{productName}</h2>
                    )}
                </div>
            </div>
            
            {/* 버튼들: Samples, Load, Save 등 */}
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setIsSidebarVisible(prev => !prev)} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md transition-colors" title="Toggle Module Sidebar"><Bars3Icon className="h-5 w-5" /></button>

                <div className="h-5 border-l border-gray-700"></div>

                <div className="relative">
                    <button 
                        onClick={() => setIsSampleMenuOpen(!isSampleMenuOpen)} 
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${isSampleMenuOpen ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                        title="Load Sample Models"
                    >
                        <BeakerIcon className="h-4 w-4" />
                        Samples
                    </button>
                    {isSampleMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
                            <div className="p-2 text-xs font-bold text-gray-500 uppercase">Predefined Models</div>
                            {PREDEFINED_SAMPLES.map((sample, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleLoadSample(sample)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-700 last:border-0"
                                >
                                    {sample.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={undo} disabled={!canUndo} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md disabled:text-gray-600 disabled:cursor-not-allowed transition-colors" title="Undo (Ctrl+Z)"><ArrowUturnLeftIcon className="h-5 w-5" /></button>
                <button onClick={redo} disabled={!canRedo} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md disabled:text-gray-600 disabled:cursor-not-allowed transition-colors" title="Redo (Ctrl+Y)"><ArrowUturnRightIcon className="h-5 w-5" /></button>
                <button onClick={() => setIsCodePanelVisible(prev => !prev)} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md transition-colors" title="Toggle Code & Terminal Panel"><CommandLineIcon className="h-5 w-5" /></button>
                
                <div className="h-5 border-l border-gray-700"></div>

                <button onClick={handleSetFolder} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors" title="Set Save Folder"><FolderOpenIcon className="h-4 w-4" />Folder</button>
                <button onClick={handleLoadPipeline} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors" title="Load Pipeline"><FolderOpenIcon className="h-4 w-4" />Load</button>
                <button onClick={handleSavePipeline} disabled={!isDirty} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${!isDirty ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-700 hover:bg-gray-600'}`} title="Save Pipeline">
                    {saveButtonText === 'Save' ? <CodeBracketIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                    {saveButtonText}
                </button>
                <button onClick={() => runSimulation()} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 rounded-md font-bold text-white transition-colors"><PlayIcon className="h-4 w-4" />Run All</button>
            </div>
        </header>

        <div className="flex-grow min-h-0 flex flex-row">
            {isSidebarVisible && (
            <div className="flex-shrink-0 bg-gray-800 border-r border-gray-700 z-10 p-2 relative w-64 overflow-y-auto scrollbar-hide">
                <div className="flex flex-col gap-4">
                <button
                    onClick={() => setIsPipelineExecutionModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-md font-semibold transition-colors w-full text-left mb-2"
                    title="Open Pipeline Execution View"
                >
                    <PlayIcon className="h-4 w-4" />
                    Pipeline Execution
                </button>
                {categorizedModules.map((category, index) => {
                    const isCollapsed = collapsedCategories.has(category.name);
                    const toggleCategory = () => {
                        setCollapsedCategories(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(category.name)) {
                                newSet.delete(category.name);
                            } else {
                                newSet.add(category.name);
                            }
                            return newSet;
                        });
                    };
                    
                    return (
                    <div key={category.name} className="flex flex-col gap-2">
                        <button
                            onClick={toggleCategory}
                            className="flex items-center justify-between text-sm font-semibold text-gray-400 hover:text-gray-300 whitespace-nowrap w-full text-left px-1 py-1 rounded transition-colors"
                        >
                            <span>{category.name}</span>
                            {isCollapsed ? (
                                <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
                            ) : (
                                <ChevronUpIcon className="h-4 w-4 flex-shrink-0" />
                            )}
                        </button>
                        {!isCollapsed && (
                            <div className="flex flex-col gap-2">
                            {TOOLBOX_MODULES.filter(m => category.types.includes(m.type)).map(moduleInfo => (
                                <button 
                                    key={moduleInfo.type} 
                                    onDoubleClick={() => createModule(moduleInfo.type)} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, moduleInfo.type)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors whitespace-nowrap w-full text-left" 
                                    title={moduleInfo.description}
                                >
                                    <moduleInfo.icon className="h-4 w-4 flex-shrink-0"/>
                                    {moduleInfo.name}
                                </button>
                            ))}
                            </div>
                        )}
                        {index < categorizedModules.length - 1 && (
                            <div className="w-full h-px bg-gray-600 my-2"></div>
                        )}
                    </div>
                    );
                })}
                </div>
            </div>
            )}
            <main ref={canvasContainerRef} className="flex-grow h-full canvas-bg relative overflow-hidden">
                <Canvas 
                  modules={modules}
                  connections={connections}
                  setConnections={setConnections}
                  selectedModuleIds={selectedModuleIds}
                  setSelectedModuleIds={setSelectedModuleIds}
                  updateModulePositions={updateModulePositions}
                  onModuleDrop={(type, pos) => createModule(type, pos)}
                  scale={scale} setScale={setScale} pan={pan} setPan={setPan}
                  canvasContainerRef={canvasContainerRef}
                  onViewDetails={handleViewDetails}
                  onEditParameters={handleEditParameters}
                  onRunModule={(id) => runSimulation(id)}
                  onDeleteModule={(id) => deleteModules([id])}
                  onUpdateModuleName={updateModuleName}
                />
                 <div 
                    onMouseDown={handleControlsMouseDown}
                    style={{
                        transform: `translate(calc(-50% + ${controlsPosition.x}px), ${controlsPosition.y}px)`,
                        cursor: 'grab'
                    }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl z-50 border border-gray-700 select-none transition-transform active:scale-95"
                 >
                    <div className="flex items-center gap-1">
                        <button onClick={() => adjustScale(-0.1)} className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 hover:text-white transition-colors"><MinusIcon className="w-5 h-5"/></button>
                        <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} className="px-2 text-sm font-medium text-gray-300 hover:text-white min-w-[3rem] text-center" title="Reset View">{Math.round(scale * 100)}%</button>
                        <button onClick={() => adjustScale(0.1)} className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 hover:text-white transition-colors"><PlusIcon className="w-5 h-5"/></button>
                    </div>

                    <div className="w-px h-4 bg-gray-700"></div>

                    <div className="flex items-center gap-1">
                        <button onClick={handleFitToView} className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 hover:text-white transition-colors" title="Fit to View">
                            <ArrowsPointingOutIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={handleRearrangeModules} className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 hover:text-white transition-colors" title="Auto Layout">
                             <SparklesIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </main>
            <CodeTerminalPanel
                isVisible={isCodePanelVisible}
                onClose={() => setIsCodePanelVisible(false)}
                selectedModule={lastSelectedModule}
                terminalOutput={lastSelectedModule ? terminalOutputs[lastSelectedModule.id] || [] : []}
            />
        </div>

        {editingModule && (
            <ParameterInputModal
                module={editingModule}
                onClose={() => setEditingModuleId(null)}
                updateModuleParameters={updateModuleParameters}
                modules={modules}
                connections={connections}
                projectName={productName}
                folderHandle={folderHandleRef.current}
            />
        )}

        {renderOutputModal()}

        {isPipelineExecutionModalOpen && (
            <PipelineExecutionModal
                modules={modules}
                connections={connections}
                onClose={() => setIsPipelineExecutionModalOpen(false)}
                onUpdateModule={(id, updates) => {
                    if (updates.parameters) {
                        const currentModule = modules.find(m => m.id === id);
                        if (currentModule) {
                            updateModuleParameters(id, { ...currentModule.parameters, ...updates.parameters });
                        } else {
                            updateModuleParameters(id, updates.parameters);
                        }
                    }
                    if (updates.name) {
                        updateModuleName(id, updates.name);
                    }
                }}
                onRunModule={async (id) => {
                    await runSimulation(id);
                }}
                getTopologicalSort={getTopologicalSort}
                executePipeline={executePipeline}
                folderHandle={folderHandleRef.current}
            />
        )}
    </div>
  );
};

export default App;


import React, { MouseEvent, TouchEvent, useRef, useCallback, useMemo } from 'react';
import { CanvasModule, ModuleStatus, Port, Connection, ModuleType } from '../types';
import { PlayIcon, XMarkIcon } from './icons';
import { TOOLBOX_MODULES } from '../constants';
import { ModuleOutputSummary } from './ModuleOutputSummary';
import { ModuleInputSummary } from './ModuleInputSummary';

interface PortComponentProps {
  port: Port; isInput: boolean; moduleId: string;
  portRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onStartConnection: (moduleId: string, portName: string, clientX: number, clientY: number, isInput: boolean) => void;
  onEndConnection: (moduleId: string, portName: string, isInput: boolean) => void;
  isTappedSource: boolean;
  onTapPort: (moduleId: string, portName: string, isInput: boolean) => void;
  style: React.CSSProperties;
}

interface ModuleNodeProps {
  module: CanvasModule;
  allModules: CanvasModule[];
  allConnections: Connection[];
  isSelected: boolean;
  onEditParameters: (id: string) => void;
  onDragStart: (moduleId: string, e: MouseEvent) => void;
  onTouchDragStart: (moduleId: string, e: TouchEvent) => void;
  portRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onStartConnection: (moduleId: string, portName: string, clientX: number, clientY: number, isInput: boolean) => void;
  onEndConnection: (moduleId: string, portName: string, isInput: boolean) => void;
  onViewDetails: (moduleId: string) => void;
  onRunModule: (moduleId: string) => void;
  tappedSourcePort: { moduleId: string; portName: string; } | null;
  onTapPort: (moduleId: string, portName: string, isInput: boolean) => void;
  cancelDragConnection: () => void;
  onDelete: (id: string) => void;
  onModuleNameChange: (id: string, newName: string) => void;
  scale: number;
  dragConnection: { from: { moduleId: string; portName: string; isInput: boolean; }; to: { x: number; y: number; }; } | null;
  isRunnable: boolean;
}

const statusColors = {
    [ModuleStatus.Pending]: 'bg-gray-800/50 border-gray-600',
    [ModuleStatus.Running]: 'bg-blue-900/50 border-blue-500',
    [ModuleStatus.Success]: 'bg-green-900/50 border-green-500',
    [ModuleStatus.Error]: 'bg-red-900/50 border-red-500',
};

const getModuleBorderColor = (status: ModuleStatus, isRunnable: boolean, moduleType: ModuleType) => {
    // Define Policy Info 모듈은 파란색으로 표시
    if (moduleType === ModuleType.DefinePolicyInfo) {
        return 'border-blue-500';
    }
    // Automation 모듈은 실행 대기 색상 표시 제외
    if (moduleType === ModuleType.ScenarioRunner || moduleType === ModuleType.PipelineExplainer) {
        return statusColors[status].split(' ')[1] || 'border-gray-600';
    }
    // 실행 대기 중인 모듈 (실행 가능하고 아직 실행되지 않은 경우)
    if (isRunnable && status === ModuleStatus.Pending) {
        return 'border-yellow-600/50';
    }
    return statusColors[status].split(' ')[1] || 'border-gray-600';
};

const getModuleBgColor = (status: ModuleStatus, isRunnable: boolean, moduleType: ModuleType) => {
    // Define Policy Info 모듈은 파란색으로 표시
    if (moduleType === ModuleType.DefinePolicyInfo) {
        return 'bg-blue-900/30';
    }
    // Automation 모듈은 실행 대기 색상 표시 제외
    if (moduleType === ModuleType.ScenarioRunner || moduleType === ModuleType.PipelineExplainer) {
        return statusColors[status].split(' ')[0] || 'bg-gray-800/50';
    }
    // 실행 대기 중인 모듈 (실행 가능하고 아직 실행되지 않은 경우)
    if (isRunnable && status === ModuleStatus.Pending) {
        return 'bg-yellow-900/30';
    }
    return statusColors[status].split(' ')[0] || 'bg-gray-800/50';
};

const PortComponent: React.FC<PortComponentProps> = ({ port, isInput, moduleId, portRefs, onStartConnection, onEndConnection, isTappedSource, onTapPort, style }) => {
    const handleMouseDown = (e: MouseEvent) => { e.stopPropagation(); onStartConnection(moduleId, port.name, e.clientX, e.clientY, isInput); };
    const handleMouseUp = (e: MouseEvent) => { e.stopPropagation(); onEndConnection(moduleId, port.name, isInput); };
    const handleTouchStart = (e: TouchEvent) => { e.stopPropagation(); const t = e.touches[0]; onStartConnection(moduleId, port.name, t.clientX, t.clientY, isInput); };
    const handleTouchEnd = (e: TouchEvent) => { e.stopPropagation(); onEndConnection(moduleId, port.name, isInput); };
    const handleClick = (e: MouseEvent) => { e.stopPropagation(); onTapPort(moduleId, port.name, isInput); };

    return (
        <div 
             ref={el => { const key = `${moduleId}-${port.name}-${isInput ? 'in' : 'out'}`; if (el) portRefs.current.set(key, el); else portRefs.current.delete(key); }}
             style={style}
             className={`w-4 h-4 rounded-full border-2 cursor-pointer z-10 ${isTappedSource ? 'bg-purple-500 border-purple-400 ring-2 ring-purple-300' : 'bg-gray-600 border-gray-400 hover:bg-blue-500'}`}
             onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
             onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
             onClick={handleClick}
             title={port.name}
        />
    );
};

export const ComponentRenderer: React.FC<ModuleNodeProps> = ({ 
    module, 
    allModules, 
    allConnections, 
    isSelected, 
    onEditParameters, 
    onDragStart, 
    onTouchDragStart, 
    portRefs, 
    onStartConnection, 
    onEndConnection, 
    onViewDetails, 
    onRunModule, 
    tappedSourcePort, 
    onTapPort, 
    onDelete,
    cancelDragConnection,
    onModuleNameChange,
    scale,
    dragConnection,
    isRunnable 
}) => {
  const lastTapRef = useRef(0);
  const moduleInfo = TOOLBOX_MODULES.find(m => m.type === module.type);

  const handleDelete = (e: MouseEvent | TouchEvent) => { e.stopPropagation(); onDelete(module.id); };
  const handleMouseDown = (e: MouseEvent) => { e.stopPropagation(); onDragStart(module.id, e); };
  
  const handleDoubleClick = (e: MouseEvent) => { e.stopPropagation(); onEditParameters(module.id); };

  const handleTouchStart = (e: TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault(); onEditParameters(module.id);
      lastTapRef.current = 0; return;
    }
    lastTapRef.current = now;
    onTouchDragStart(module.id, e);
  };

  // Automation 모듈은 실행 대기 색상 표시 제외
  const isAutomationModule = module.type === ModuleType.ScenarioRunner || module.type === ModuleType.PipelineExplainer;
  const needsExecution = !isAutomationModule && isRunnable && module.status === ModuleStatus.Pending;
  const moduleBgColor = getModuleBgColor(module.status, isRunnable, module.type);
  const moduleBorderColor = getModuleBorderColor(module.status, isRunnable, module.type);
  const wrapperClasses = `absolute w-56 h-auto min-h-[80px] backdrop-blur-md border rounded-lg shadow-lg flex flex-col cursor-move ${moduleBgColor} ${moduleBorderColor} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-500' : ''}`;
  
  return (
    <div 
      className={wrapperClasses}
      style={{ left: module.position.x, top: module.position.y }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Header: Name & Run */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-900/30 border-b border-gray-700 rounded-t-lg h-12 flex-shrink-0">
         <div className="flex items-center gap-2 overflow-hidden">
            {moduleInfo && <moduleInfo.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            <h3 
                className="font-bold text-gray-200 text-sm leading-tight" 
                style={{ 
                    wordBreak: 'break-word', 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}
                title={module.name}
            >
                {module.name}
            </h3>
         </div>
         <div className="flex items-center gap-1 flex-shrink-0">
             {module.type !== ModuleType.DefinePolicyInfo && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); if(isRunnable) onRunModule(module.id); }}
                    disabled={!isRunnable}
                    className={`p-1 rounded-full transition-colors ${
                        needsExecution 
                            ? 'text-yellow-500 hover:bg-yellow-900/30 hover:text-yellow-400' 
                            : isRunnable 
                            ? 'text-green-500 hover:bg-green-900/30 hover:text-green-400' 
                            : 'text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                    title={needsExecution ? "Ready to run" : isRunnable ? "Run Module" : "Upstream modules must run successfully first"}
                 >
                    <PlayIcon className="w-8 h-8" />
                 </button>
             )}
             <button 
                onClick={handleDelete}
                className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-full transition-colors"
                title="Delete Module"
             >
                <XMarkIcon className="w-4 h-4" />
             </button>
         </div>
      </div>

      {/* Body: Split Left/Right */}
      <div className="flex flex-grow min-h-[32px] relative">
          
           {/* Left: Input Area (1/3) */}
           <div 
                className="w-1/3 border-r border-gray-700 p-1 flex flex-col relative group hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onEditParameters(module.id); }}
                onDoubleClick={(e) => { e.stopPropagation(); onEditParameters(module.id); }}
           >
                {/* Tooltip for Description */}
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-black text-xs text-gray-200 rounded shadow-lg z-50 pointer-events-none border border-gray-600">
                    {moduleInfo?.description}
                    <div className="text-[10px] text-gray-500 mt-1">Click to edit parameters</div>
                </div>

                <span className="font-black text-gray-500 text-[8px] tracking-widest text-center mb-0.5">INPUT</span>

                {/* Parameter Summary */}
                <div className="flex-grow flex items-center justify-center">
                    {(() => {
                        const summary = <ModuleInputSummary module={module} />;
                        return summary || null;
                    })()}
                </div>

                 {/* Input Ports - Positioned on the Left Edge */}
                 {module.inputs.map((port, index) => {
                    const totalPorts = module.inputs.length;
                    const spacing = 100 / (totalPorts + 1);
                    const topPercent = spacing * (index + 1);
                    
                    return (
                        <div key={port.name} className="absolute left-[-9px] z-10" style={{ top: `${topPercent}%`, transform: 'translateY(-50%)' }}>
                            <PortComponent 
                                port={port} isInput={true} moduleId={module.id} portRefs={portRefs}
                                onStartConnection={onStartConnection} onEndConnection={onEndConnection}
                                isTappedSource={tappedSourcePort?.moduleId === module.id && tappedSourcePort?.portName === port.name}
                                onTapPort={onTapPort}
                                style={{}}
                            />
                             {/* Port Label Tooltip */}
                             <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2 px-1 py-0.5 bg-black/80 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-20">
                                {port.name}
                             </div>
                        </div>
                    );
                 })}
           </div>

           {/* Right: Output Area (2/3) */}
           <div 
                className="w-2/3 p-1 flex flex-col justify-center relative hover:bg-gray-700/50 transition-colors cursor-pointer group"
                onClick={(e) => { e.stopPropagation(); onViewDetails(module.id); }}
           >
                 {/* Tooltip for View Results */}
                 <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block px-2 py-1 bg-black text-[10px] text-gray-200 rounded shadow-lg z-50 pointer-events-none border border-gray-600 whitespace-nowrap">
                    Click to view Results
                 </div>

                <ModuleOutputSummary module={module} />

                {/* Output Ports - Positioned on the Right Edge */}
                {module.outputs.map((port, index) => {
                    const totalPorts = module.outputs.length;
                    const spacing = 100 / (totalPorts + 1);
                    const topPercent = spacing * (index + 1);

                    return (
                        <div key={port.name} className="absolute right-[-9px] z-10" style={{ top: `${topPercent}%`, transform: 'translateY(-50%)' }}>
                             <PortComponent 
                                port={port} isInput={false} moduleId={module.id} portRefs={portRefs}
                                onStartConnection={onStartConnection} onEndConnection={onEndConnection}
                                isTappedSource={tappedSourcePort?.moduleId === module.id && tappedSourcePort?.portName === port.name}
                                onTapPort={onTapPort}
                                style={{}}
                            />
                            {/* Port Label Tooltip */}
                             <div className="absolute right-full mr-1 top-1/2 -translate-y-1/2 px-1 py-0.5 bg-black/80 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-20">
                                {port.name}
                             </div>
                        </div>
                    );
                })}
           </div>
      </div>
    </div>
  );
};

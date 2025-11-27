import React, { useState, useEffect } from 'react';
import { CanvasModule } from '../types';
import { XMarkIcon } from './icons';
import { getModuleCode } from '../codeSnippets';

interface CodeTerminalPanelProps {
    selectedModule: CanvasModule | null;
    terminalOutput: string[];
    isVisible: boolean;
    onClose: () => void;
}

export const CodeTerminalPanel: React.FC<CodeTerminalPanelProps> = ({ selectedModule, terminalOutput, isVisible, onClose }) => {
    const [activeTab, setActiveTab] = useState<'code' | 'terminal'>('code');
    const [code, setCode] = useState('');

    useEffect(() => {
        if (selectedModule) {
            setCode(getModuleCode(selectedModule));
        } else {
            setCode('# Select a module to see its code.');
        }
    }, [selectedModule]);

    useEffect(() => {
        if (selectedModule && terminalOutput.some(line => line.includes('ERROR'))) {
            setActiveTab('terminal');
        }
    }, [selectedModule, terminalOutput]);

    if (!isVisible) {
        return null;
    }

    const title = selectedModule ? `${selectedModule.name}` : 'No Module Selected';

    return (
        <div className="w-[450px] flex-shrink-0 bg-gray-800 text-white border-l border-gray-700">
            <div className="flex flex-col h-full">
                <header className="flex items-center justify-between px-4 py-2 bg-gray-900 flex-shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        <h3 className="font-bold truncate" title={title}>{title}</h3>
                        {selectedModule && (
                             <div className="flex items-center text-sm border border-gray-700 rounded-md p-0.5 flex-shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('code'); }} className={`px-3 py-0.5 rounded-sm ${activeTab === 'code' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>Code</button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('terminal'); }} className={`px-3 py-0.5 rounded-sm ${activeTab === 'terminal' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>Terminal</button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center">
                        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:bg-gray-700 rounded-md">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>
                
                {selectedModule ? (
                    <main className="flex-grow p-2 bg-gray-900 overflow-auto font-mono text-sm">
                        {activeTab === 'code' ? (
                            <pre className="whitespace-pre-wrap text-cyan-300">
                                <code>{code}</code>
                            </pre>
                        ) : (
                            <div className="text-gray-300">
                                {terminalOutput.length > 0 ? terminalOutput.map((line, index) => (
                                    <div key={index} className={`flex ${line.includes('ERROR') ? 'text-red-400' : (line.includes('SUCCESS') ? 'text-green-400' : '')}`}>
                                        <span className="flex-shrink-0 mr-2">{'>'}</span>
                                        <pre className="whitespace-pre-wrap flex-1">{line}</pre>
                                    </div>
                                )) : <div>Ready. Run the module to see output.</div>}
                            </div>
                        )}
                    </main>
                ) : (
                     <main className="flex-grow p-4 flex items-center justify-center bg-gray-900 overflow-auto font-sans text-gray-500">
                        Select a module in the canvas to view its details.
                    </main>
                )}
            </div>
        </div>
    );
};
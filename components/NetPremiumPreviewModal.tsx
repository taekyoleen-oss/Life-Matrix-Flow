
import React, { useState } from 'react';
import { CanvasModule, NetPremiumOutput, GrossPremiumOutput } from '../types';
import { XCircleIcon, SparklesIcon } from './icons';
import { GoogleGenAI } from "@google/genai";
import { MarkdownRenderer } from './MarkdownRenderer';

interface NetPremiumPreviewModalProps {
    module: CanvasModule;
    projectName: string;
    onClose: () => void;
}

const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 6,
    }).format(value);
};

export const NetPremiumPreviewModal: React.FC<NetPremiumPreviewModalProps> = ({ module, projectName, onClose }) => {
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

    const output = module.outputData as (NetPremiumOutput | GrossPremiumOutput);
    if (!output || (output.type !== 'NetPremiumOutput' && output.type !== 'GrossPremiumOutput')) return null;

    const isNet = output.type === 'NetPremiumOutput';
    const premiumValue = isNet ? (output as NetPremiumOutput).netPremium : (output as GrossPremiumOutput).grossPremium;
    const { formula, substitutedFormula } = output;
    const label = isNet ? "Net Premium" : "Gross Premium";
    const koreanLabel = isNet ? "순보험료" : "영업보험료";

    const handleInterpret = async () => {
        setIsInterpreting(true);
        setAiInterpretation(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `
You are an actuary explaining a premium calculation result to a product manager for a project named "${projectName}". Use Korean and simple Markdown.

### ${koreanLabel} 산출 결과 요약

**상품명:** ${projectName}
**계산 공식:** \`${formula}\`
**${koreanLabel}:** ${formatValue(premiumValue)}

---

*   **계산 공식 설명:** 이 공식이 무엇을 계산하는 것인지 한 문장으로 설명해 주십시오.
*   **${koreanLabel}의 의미:** 산출된 '${koreanLabel}'가 무엇을 나타내는지, 그리고 이 금액이 어떻게 계산되었는지(예: 미래 보험금의 현재가치 / 연금의 현재가치, 또는 사업비 추가 등) 간략히 설명해 주십시오.
*   **활용 방안:** 이 ${koreanLabel}는 최종 상품 가격 결정이나 수익성 분석에 어떻게 활용될 수 있습니까?

**지시:** 각 항목을 매우 간결하게 작성하십시오.
`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setAiInterpretation(response.text);
        } catch (error) {
            console.error("AI interpretation failed:", error);
            setAiInterpretation("결과를 해석하는 동안 오류가 발생했습니다.");
        } finally {
            setIsInterpreting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                     <h2 className="text-xl font-bold text-gray-800">{label} Results: {module.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow p-6 overflow-auto">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleInterpret}
                            disabled={isInterpreting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-wait transition-colors"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            {isInterpreting ? '분석 중...' : 'AI로 결과 해석하기'}
                        </button>
                    </div>

                    {isInterpreting && <div className="text-center p-4 text-gray-600">AI가 보험료 산출 결과를 분석하고 있습니다...</div>}
                    {aiInterpretation && (
                         <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6">
                            <h3 className="text-lg font-bold text-purple-800 mb-2 font-sans flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5"/>
                                AI 분석 요약
                            </h3>
                            <MarkdownRenderer text={aiInterpretation} />
                        </div>
                    )}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                            Calculated {label}
                        </h3>
                        <div className="space-y-3 text-base">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-gray-600">Formula:</span>
                                <span className="font-mono text-gray-800 font-medium bg-gray-200 px-2 py-1 rounded">{formula}</span>
                            </div>
                            
                            {substitutedFormula && (
                                <div className="py-2 border-b">
                                    <span className="text-gray-600 block mb-1 text-xs font-bold uppercase tracking-wider">Calculation Detail:</span>
                                    <div className="font-mono text-xs text-gray-600 bg-white p-2 rounded border break-all">
                                        {substitutedFormula}
                                    </div>
                                </div>
                            )}

                             <div className="flex justify-between items-center py-3 mt-2 bg-blue-50 rounded-md px-3">
                                <span className="font-bold text-blue-800">{label}:</span>
                                <span className="font-mono text-blue-800 font-bold text-lg">{formatValue(premiumValue)}</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

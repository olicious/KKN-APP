"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { getAIEvaluation, type AIEvaluationState } from "./actions";
import { supabase } from "@/utils/supabase/client";

const initialState: AIEvaluationState = {
  answer: null,
  error: null,
};

type AIEvaluationPanelProps = {
  stats?: {
    revenue: number;
    orders: number;
    productsSold: number;
  }
};

export function AIEvaluationPanel({ stats }: AIEvaluationPanelProps) {
  const [state, setState] = useState<AIEvaluationState>(initialState);
  const [isPending, startTransition] = useTransition();

  const handleEvaluate = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      setState({ answer: null, error: "Sesi tidak valid. Harap muat ulang halaman atau login kembali." });
      return;
    }
    
    startTransition(async () => {
      const result = await getAIEvaluation(authData.user.id, stats);
      setState(result);
    });
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleEvaluate}
        disabled={isPending}
        className="bg-gradient-to-r from-[#b05e45] to-[#d97757] text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 w-full md:w-auto mt-6 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
      >
        <span>✨</span>
        {isPending ? "Sedang menganalisis..." : "Minta Evaluasi AI"}
      </button>

      {state.error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.answer ? (
        <div className="mt-8">
          <div className="bg-gradient-to-r from-[#b05e45] to-[#d97757] text-white p-4 rounded-xl font-bold text-lg mb-4 flex items-center gap-2">
            ✨ Ringkasan Evaluasi AI
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.answer.split('\n').filter(line => line.trim() !== '').map((item, index) => {
              let title = null;
              let content = item.replace(/\*/g, '').trim();
              
              const splitIndex = item.indexOf(':') !== -1 ? item.indexOf(':') : item.indexOf('-');
              if (splitIndex !== -1 && splitIndex < 60) {
                title = item.substring(0, splitIndex).replace(/^(?:\d+\.|-|\*)\s*/, '').replace(/\*/g, '').trim();
                content = item.substring(splitIndex + 1).replace(/\*/g, '').trim();
              } else {
                content = content.replace(/^(?:\d+\.|-|\*)\s*/, '').trim();
              }

              return (
                <div key={index} className="bg-white border border-[#e8dacd] p-5 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  {title ? (
                    <>
                      <strong className="text-[#2d4037] text-base block mb-2">{title}</strong>
                      <p className="text-gray-700 leading-relaxed text-sm">{content}</p>
                    </>
                  ) : (
                    <p className="text-gray-700 leading-relaxed text-sm">{content}</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 italic mt-6 text-right">Analisis Terakhir: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      ) : null}
    </div>
  );
}

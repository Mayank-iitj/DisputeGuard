import React, { useState, useRef } from 'react';
import { api } from '../api/client';
import {
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Info,
  Maximize2,
  ExternalLink,
} from 'lucide-react';

interface ScenarioStep {
  title: string;
  narration: string;
}

const SCENARIO_A_STEPS: ScenarioStep[] = [
  {
    title: 'Step 1/6: Dispute Open & Proof-First',
    narration:
      'Aiko (Buyer in Japan) reports that her ceramic pour-over set arrived damaged. DisputeGuard opens a shared channel on Nexconn and immediately posts a guided photo request card. Payment is secured in escrow.',
  },
  {
    title: 'Step 2/6: Live Cross-Border Translation',
    narration:
      'Aiko writes in Japanese: "コップが割れて届きました". Marco (Seller in Spain) instantly reads it in Spanish: "Las tazas llegaron rotas", with a one-tap toggle to inspect the original text.',
  },
  {
    title: 'Step 3/6: AI Vision Assessment',
    narration:
      'Aiko submits photos of the cracked rim. DisputeGuard downscales and hashes the images, running a vision model that returns severity 2/3 (partial functional impact) with an explicit "AI-assessed, not verified" label.',
  },
  {
    title: 'Step 4/6: Deterministic Policy Proposal',
    narration:
      'The deterministic policy engine (not the LLM!) evaluates the claim against versioned rules and issues two bounded options: Keep item with 40% refund ($33.60), or Free Replacement.',
  },
  {
    title: 'Step 5/6: Mutual Settlement',
    narration:
      'Aiko accepts the 40% partial refund. Marco reviews and accepts the same option. Status chips update in real time across both panes.',
  },
  {
    title: 'Step 6/6: Auto-Settle & Escrow Release',
    narration:
      'Since the agreed refund ($33.60) is below the $50.00 auto-approve ceiling, DisputeGuard settles automatically. Escrow transitions to REFUNDED_PARTIAL, an immutable ledger entry is written, and channel composers lock.',
  },
];

const SCENARIO_B_STEPS: ScenarioStep[] = [
  {
    title: 'Step 1/6: Dispute Initiation',
    narration:
      'Aiko opens a dispute for ord_1044 (Silk scarf). The channel is initialized on Nexconn with Aiko, Marco, and the DisputeGuard Arbitrator bot.',
  },
  {
    title: 'Step 2/6: Politeness Masking Detection',
    narration:
      'Aiko sends a formal request in Japanese indicating a third inquiry. The risk engine flags politeness masking: the surface phrasing is polite, but underlying frustration is high. A tone note is attached.',
  },
  {
    title: 'Step 3/6: Escalation Firewall Freeze',
    narration:
      'Frustrated by delays, Aiko sends: "解決されない場合は、カード会社にチャージバックを申請します" (threatening a chargeback). Within seconds, the Escalation Firewall freezes escrow, posts a calm bilingual notice (hiding risk details from users), and flags the case to Dispatch.',
  },
  {
    title: 'Step 4/6: Priority Queue & AI Brief',
    narration:
      'In the Dispatch Center, Priya sees the case flash to the top of the priority queue (priority 98.8). Opening the case displays an English transcript, image evidence, and an AI Brief with confidential threat quotes.',
  },
  {
    title: 'Step 5/6: Arbitrator Takeover & Copilot',
    narration:
      'Priya clicks "Take Over Case" and joins the channel. She selects the "De-escalate" intent in the AI Copilot to generate a grounded Japanese response with an English preview and policy amount checks.',
  },
  {
    title: 'Step 6/6: One-Click Resolution & Release',
    narration:
      'Priya clicks "Approve Full Refund ($56.00) & Settle", enters an audit note, and confirms. DisputeGuard updates the immutable escrow ledger, emits the final resolution card, and locks the channel.',
  },
];

export const StagePage: React.FC = () => {
  const [scenario, setScenario] = useState<'A' | 'B'>('A');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const buyerIframeRef = useRef<HTMLIFrameElement>(null);
  const sellerIframeRef = useRef<HTMLIFrameElement>(null);
  const dispatchIframeRef = useRef<HTMLIFrameElement>(null);

  const steps = scenario === 'A' ? SCENARIO_A_STEPS : SCENARIO_B_STEPS;
  const currentStep = steps[stepIndex] || steps[0];

  const handleNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.resetDemo();
      setStepIndex(0);
      // Reload iframes cleanly
      if (buyerIframeRef.current) buyerIframeRef.current.src = '/buyer';
      if (sellerIframeRef.current) sellerIframeRef.current.src = '/seller';
      if (dispatchIframeRef.current) dispatchIframeRef.current.src = '/dispatch';
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Judge Control Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md">
              DG
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">
                DisputeGuard AI
              </span>
              <span className="text-[10px] text-sky-400 font-semibold block -mt-1">
                Nexconn Build Challenge 2026 Judge Sandbox
              </span>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80 ml-2 text-xs">
            <button
              onClick={() => {
                setScenario('A');
                setStepIndex(0);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                scenario === 'A'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scenario A: Damaged Cup (Auto-Settle)
            </button>
            <button
              onClick={() => {
                setScenario('B');
                setStepIndex(0);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                scenario === 'B'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scenario B: Escalation Firewall & Takeover
            </button>
          </div>
        </div>

        {/* Step progress & rehearsal controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="text-slate-400 mr-2 font-medium">Progress:</span>
            <span className="font-bold text-sky-400 mr-3">
              Step {stepIndex + 1} of {steps.length}
            </span>

            <button
              onClick={handlePrevStep}
              disabled={stepIndex === 0}
              className="px-2 py-0.5 rounded text-xs text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              ◂ Prev
            </button>
            <button
              onClick={handleNextStep}
              disabled={stepIndex === steps.length - 1}
              className="px-2.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold disabled:opacity-30 flex items-center gap-1 cursor-pointer transition active:scale-95 ml-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            title="Reset database and all panes to initial seed state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </header>

      {/* Three Side-by-Side Live Synchronized Panes */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-900 overflow-hidden">
        {/* Pane 1: Buyer Aiko (ja) */}
        <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
          <div className="h-7 bg-slate-800 text-slate-300 px-3 flex items-center justify-between text-[11px] font-semibold border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white">BUYER: Aiko Tanaka</span>
              <span className="text-slate-400 font-mono">(日本語 / ja)</span>
            </div>
            <a
              href="/buyer"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
            >
              <span>Pop out</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <iframe
            ref={buyerIframeRef}
            src="/buyer"
            title="Buyer Aiko Portal"
            className="flex-1 w-full h-full border-0 bg-white"
          />
        </div>

        {/* Pane 2: Seller Marco (es) */}
        <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
          <div className="h-7 bg-slate-800 text-slate-300 px-3 flex items-center justify-between text-[11px] font-semibold border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white">SELLER: Marco Rossi</span>
              <span className="text-slate-400 font-mono">(Español / es)</span>
            </div>
            <a
              href="/seller"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
            >
              <span>Pop out</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <iframe
            ref={sellerIframeRef}
            src="/seller"
            title="Seller Marco Portal"
            className="flex-1 w-full h-full border-0 bg-white"
          />
        </div>

        {/* Pane 3: Dispatch Center Priya (en) */}
        <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
          <div className="h-7 bg-slate-800 text-slate-300 px-3 flex items-center justify-between text-[11px] font-semibold border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white">DISPATCH: Priya Sharma</span>
              <span className="text-sky-400 font-mono">(Staff Arbitrator / en)</span>
            </div>
            <a
              href="/dispatch"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
            >
              <span>Pop out</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <iframe
            ref={dispatchIframeRef}
            src="/dispatch"
            title="DisputeGuard Dispatch Console"
            className="flex-1 w-full h-full border-0 bg-slate-900"
          />
        </div>
      </div>

      {/* Bottom Live Narration Bar */}
      <footer className="h-16 bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800/80 text-sky-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-400">{currentStep.title}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Live Walkthrough Narration
            </span>
          </div>
          <p className="text-xs text-slate-300 truncate font-medium">
            {currentStep.narration}
          </p>
        </div>
      </footer>
    </div>
  );
};

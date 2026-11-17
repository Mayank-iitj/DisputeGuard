import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { stageDriver } from '../services/stageDriver';
import { soundFx } from '../services/soundFx';
import {
  RotateCcw,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  CheckCircle2,
  Zap,
  Terminal,
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
      'Aiko opens a dispute for ord_1044 (Silk scarf, $56.00). The channel is initialized on Nexconn with Aiko, Marco, and the DisputeGuard Arbitrator bot.',
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
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.isMuted());

  const buyerIframeRef = useRef<HTMLIFrameElement>(null);
  const sellerIframeRef = useRef<HTMLIFrameElement>(null);
  const dispatchIframeRef = useRef<HTMLIFrameElement>(null);
  const playTimerRef = useRef<any>(null);

  const steps = scenario === 'A' ? SCENARIO_A_STEPS : SCENARIO_B_STEPS;
  const currentStep = steps[stepIndex] || steps[0];

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  const handleNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
      setStatusNote(null);
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
      setStatusNote(null);
    }
  };

  const executeStep = async (targetIndex: number): Promise<boolean> => {
    setIsExecuting(true);
    setStatusNote('Executing step...');
    try {
      let res;
      if (scenario === 'A') {
        res = await stageDriver.executeScenarioAStep(targetIndex);
      } else {
        res = await stageDriver.executeScenarioBStep(targetIndex);
      }

      if (res.success) {
        setStatusNote(res.message || 'Step executed successfully.');
        return true;
      } else {
        setStatusNote(res.message || 'Step execution returned an error.');
        return false;
      }
    } catch (e: any) {
      console.error('Error executing step:', e);
      setStatusNote(`Error: ${e.message || 'Execution failed'}`);
      return false;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteCurrentStep = async () => {
    const ok = await executeStep(stepIndex);
    if (ok && stepIndex < steps.length - 1) {
      setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, 700);
    }
  };

  const handleToggleAutoPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    } else {
      setIsPlaying(true);
      runAutoPlayLoop(stepIndex);
    }
  };

  const runAutoPlayLoop = async (currentIdx: number) => {
    if (currentIdx >= steps.length) {
      setIsPlaying(false);
      return;
    }

    const ok = await executeStep(currentIdx);
    if (!ok) {
      setIsPlaying(false);
      return;
    }

    if (currentIdx < steps.length - 1) {
      playTimerRef.current = setTimeout(() => {
        setStepIndex(currentIdx + 1);
        runAutoPlayLoop(currentIdx + 1);
      }, 2600);
    } else {
      setIsPlaying(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setIsPlaying(false);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    try {
      await api.resetDemo();
      stageDriver.reset();
      setStepIndex(0);
      setStatusNote('DisputeGuard reset to initial clean seed state.');
      if (buyerIframeRef.current) buyerIframeRef.current.src = '/buyer';
      if (sellerIframeRef.current) sellerIframeRef.current.src = '/seller';
      if (dispatchIframeRef.current) dispatchIframeRef.current.src = '/dispatch';
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleMute = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F17] text-slate-100 font-sans overflow-hidden select-none antialiased">
      {/* Precision Top Control Bar */}
      <header className="h-12 bg-[#0D1117] border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
              DG
            </div>
            <div>
              <span className="font-semibold text-xs tracking-tight text-white block">
                DisputeGuard Stage
              </span>
              <span className="text-[10px] text-slate-500 font-mono block -mt-0.5">
                Judge Sandbox · 3 Synchronized Panes
              </span>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 ml-2 text-xs font-medium">
            <button
              onClick={() => {
                if (isPlaying) handleToggleAutoPlay();
                setScenario('A');
                setStepIndex(0);
                setStatusNote(null);
              }}
              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                scenario === 'A'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scenario A: Damaged Cup (Auto-Settle)
            </button>
            <button
              onClick={() => {
                if (isPlaying) handleToggleAutoPlay();
                setScenario('B');
                setStepIndex(0);
                setStatusNote(null);
              }}
              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                scenario === 'B'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scenario B: Escalation & Takeover
            </button>
          </div>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {/* Stepper Controls */}
          <div className="flex items-center bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-500 mr-2 font-mono text-[11px]">
              Step {stepIndex + 1}/{steps.length}
            </span>

            <button
              onClick={handlePrevStep}
              disabled={stepIndex === 0 || isExecuting || isPlaying}
              className="px-1.5 py-0.5 rounded text-xs text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              ◂ Prev
            </button>

            {/* Execute Current Step Button */}
            <button
              onClick={handleExecuteCurrentStep}
              disabled={isExecuting || isPlaying}
              className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium disabled:opacity-40 flex items-center gap-1 cursor-pointer transition active:scale-98 ml-1 shadow-2xs"
            >
              <Zap className={`w-3 h-3 ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? 'Running...' : 'Run Step ▸'}</span>
            </button>

            {/* Auto Play Toggle */}
            <button
              onClick={handleToggleAutoPlay}
              className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition active:scale-98 ml-1 ${
                isPlaying
                  ? 'bg-amber-700 hover:bg-amber-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? 'Pause' : 'Auto ⚡'}</span>
            </button>

            <button
              onClick={handleNextStep}
              disabled={stepIndex === steps.length - 1 || isExecuting || isPlaying}
              className="px-1.5 py-0.5 rounded text-xs text-slate-400 hover:text-white disabled:opacity-30 flex items-center cursor-pointer ml-1"
            >
              <span>Skip</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={isResetting || isPlaying}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition cursor-pointer active:scale-98"
            title="Reset database to seed state"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Three Synchronized Panes */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-[#0B0F17] overflow-hidden">
        {/* Pane 1: Buyer Aiko (ja) */}
        <div className="flex flex-col h-full bg-white overflow-hidden">
          <div className="h-7 bg-slate-900 text-slate-300 px-3 flex items-center justify-between text-[11px] font-mono border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-white font-medium">BUYER: Aiko Tanaka</span>
              <span className="text-slate-500">(ja / 日本語)</span>
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
        <div className="flex flex-col h-full bg-white overflow-hidden">
          <div className="h-7 bg-slate-900 text-slate-300 px-3 flex items-center justify-between text-[11px] font-mono border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-white font-medium">SELLER: Marco Rossi</span>
              <span className="text-slate-500">(es / Español)</span>
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
          <div className="h-7 bg-slate-900 text-slate-300 px-3 flex items-center justify-between text-[11px] font-mono border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-white font-medium">DISPATCH: Priya Sharma</span>
              <span className="text-sky-400">(en / Staff Arbitrator)</span>
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

      {/* Bottom Walkthrough Narration Bar */}
      <footer className="h-14 bg-[#0D1117] border-t border-slate-800/80 px-4 py-2 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">{currentStep.title}</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Live Scenario Walkthrough
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate font-normal">
              {currentStep.narration}
            </p>
          </div>
        </div>

        {/* Live action status indicator */}
        {statusNote && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 shrink-0 num-tabular">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate max-w-sm">{statusNote}</span>
          </div>
        )}
      </footer>
    </div>
  );
};

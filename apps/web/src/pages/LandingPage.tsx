import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Languages,
  Camera,
  Scale,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Lock,
  Cpu,
  Layers,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="h-16 border-b border-slate-800 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-sky-500/20">
            DG
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              DisputeGuard AI
            </span>
            <span className="text-[10px] text-sky-400 font-semibold block -mt-1">
              Built on Nexconn Chat SDK
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link
            to="/buyer"
            className="text-slate-300 hover:text-white transition hidden sm:inline-block"
          >
            Buyer Portal
          </Link>
          <Link
            to="/seller"
            className="text-slate-300 hover:text-white transition hidden sm:inline-block"
          >
            Seller Portal
          </Link>
          <Link
            to="/dispatch"
            className="text-slate-300 hover:text-white transition hidden sm:inline-block"
          >
            Dispatch Console
          </Link>
          <Link
            to="/stage"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/25 transition active:scale-95 flex items-center gap-1.5"
          >
            <span>Launch Judge Stage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nexconn Build Challenge 2026 Submission</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-3xl leading-tight">
          Cross-border disputes, resolved{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            inside the chat
          </span>{' '}
          where they start.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Every order dispute becomes a Nexconn channel with a translated conversation, structured
          evidence cards, a bounded refund proposal, an escrow state machine, and a human dispatch
          center for cases above policy threshold.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/stage"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-xl shadow-sky-500/30 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Open Judge 3-Pane Sandbox (/stage)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <span>View Architecture Docs</span>
            <ExternalLink className="w-4 h-4 text-slate-500" />
          </a>
        </div>

        {/* Signature Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 mb-4">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Cross-Border Translation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native real-time translation with one-tap toggle to original text. Flags politeness
              masking where formal phrasing conceals elevated frustration.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Proof-First Evidence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guided 3-angle photo capture stepper. AI vision model scores severity 0-3 with perceptual
              hashing and an explicit "AI-assessed, not verified" label.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Bounded Settlements</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic policy engine computes exact options. Both parties accept under $50.00
              ceiling to auto-settle; mutual agreement above moves to agent review.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Escalation Firewall</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitors threats across languages (chargebacks, police, lawsuits) and instantly freezes
              escrow while posting calm bilingual notices without exposing risk details.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Dispatch Center</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mission-control console with priority formula, AI Case Brief, grounded copilot drafting
              with regex amount guards, and one-click resolution.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Immutable Escrow Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Append-only state machine. Every monetary transition requires an actor and reason code.
              LLM never moves money and never chooses a refund number.
            </p>
          </div>
        </div>

        {/* Non-negotiable principles callout */}
        <div className="mt-16 w-full p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 text-left">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wide mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Guiding Architecture Principle</span>
          </div>
          <p className="text-sm font-semibold text-white">
            "AI proposes, code computes, a human approves above a threshold."
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Prompt injection and hallucinations cannot move funds. The database is the source of truth;
            Nexconn is the live conversation and card bus users see.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        DisputeGuard AI — Built for the Nexconn Build Challenge 2026.
      </footer>
    </div>
  );
};

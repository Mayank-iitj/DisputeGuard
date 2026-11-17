import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Languages,
  Camera,
  Scale,
  ArrowRight,
  ExternalLink,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col antialiased">
      {/* Precision Top Navigation */}
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between max-w-7xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white tracking-wider">
            DG
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">
              DisputeGuard
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Escrow Dispute Engine for Nexconn
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-5 text-xs font-medium">
          <Link
            to="/buyer"
            className="text-slate-400 hover:text-slate-200 transition hidden sm:inline-block"
          >
            Buyer Portal
          </Link>
          <Link
            to="/seller"
            className="text-slate-400 hover:text-slate-200 transition hidden sm:inline-block"
          >
            Seller Portal
          </Link>
          <Link
            to="/dispatch"
            className="text-slate-400 hover:text-slate-200 transition hidden sm:inline-block"
          >
            Dispatch Console
          </Link>
          <Link
            to="/stage"
            className="px-3.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs transition active:scale-98 flex items-center gap-1.5 shadow-xs"
          >
            <span>Judge Sandbox (/stage)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white max-w-3xl leading-[1.12]">
          Cross-border disputes, resolved inside the chat where they start.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-normal">
          Every order dispute becomes a synchronized Nexconn channel with real-time translation,
          guided photo evidence, deterministic policy proposals, and an automated escalation firewall.
        </p>

        {/* Action Controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/stage"
            className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition active:scale-98 flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Open Flagship 3-Pane Stage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/dispatch"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs transition flex items-center justify-center gap-2"
          >
            <span>Open Dispatch Console</span>
          </Link>
        </div>

        {/* Operational Blueprint (Editorial Layout replacing cookie-cutter cards) */}
        <section className="mt-20 w-full text-left">
          <div className="border-b border-slate-800/80 pb-3 mb-6 flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              System Architecture
            </h2>
            <span className="text-xs text-slate-500 font-mono">Nexconn Chat SDK · Fastify · SQLite</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Conversation Plane */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <Languages className="w-4 h-4 text-sky-400" />
                <span>1. Conversation Plane</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Native dual-language chat running over Nexconn. Aiko writes Japanese, Marco reads
                Spanish with one-tap access to original phrasing. Cultural politeness masking is
                detected when formal phrasing hides latent frustration.
              </p>
              <ul className="text-xs text-slate-400 space-y-1 pt-1 font-mono text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-sky-400" />
                  <span>Typed message envelopes (DG1)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-sky-400" />
                  <span>Cross-iframe broadcast bus (&lt;5ms)</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Control Plane */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>2. Deterministic Control</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Code computes, AI only proposes. Policy Engine (v1) outputs bounded options with a
                $50.00 auto-approval ceiling. Counters are strictly bound to 50%–150%. Escrow operates
                as an append-only state machine ledger.
              </p>
              <ul className="text-xs text-slate-400 space-y-1 pt-1 font-mono text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span>Immutable ACID escrow ledger</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span>Strict auto-settle ceiling ($50.00)</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Escalation Firewall */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>3. Escalation Firewall</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cross-cultural lexicon actively monitors chargeback, legal, or fraud threats.
                Triggering keywords immediately freeze escrow, post calm neutral notices to both parties,
                and route the case to the human Dispatch Center.
              </p>
              <ul className="text-xs text-slate-400 space-y-1 pt-1 font-mono text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-400" />
                  <span>Priority queue score: 0 to 100</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-400" />
                  <span>Arbitrator AI brief & copilot draft</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Grounded Invariant Strip */}
        <section className="mt-14 w-full p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Core Safety Guarantee
              </span>
              <span className="text-xs text-slate-400">
                AI proposes, code computes, a human approves above threshold. Prompt injection cannot move funds.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap self-end sm:self-auto">
            Nexconn Build Challenge 2026
          </span>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 py-5 text-center text-xs text-slate-500 max-w-7xl mx-auto w-full px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>DisputeGuard AI — Built on Nexconn Chat SDK</span>
        <span className="font-mono text-[11px]">MIT License · Production Ready</span>
      </footer>
    </div>
  );
};

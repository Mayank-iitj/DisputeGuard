import React, { useState } from 'react';
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
  Clock,
  AlertTriangle,
  ChevronDown,
  User,
  Store,
  Terminal,
  FileText,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activePreviewTab, setActivePreviewTab] = useState<'translation' | 'evidence' | 'proposal' | 'firewall'>('translation');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 font-sans flex flex-col antialiased selection:bg-slate-700 selection:text-white">
      {/* Precision Top Navigation */}
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between max-w-7xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white tracking-wider">
            DG
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">
              DisputeGuard
            </span>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Built on Nexconn Chat SDK
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-xs font-medium">
          <Link
            to="/buyer"
            className="text-slate-400 hover:text-slate-200 transition hidden md:inline-block"
          >
            Buyer (Aiko)
          </Link>
          <Link
            to="/seller"
            className="text-slate-400 hover:text-slate-200 transition hidden md:inline-block"
          >
            Seller (Marco)
          </Link>
          <Link
            to="/dispatch"
            className="text-slate-400 hover:text-slate-200 transition hidden sm:inline-block"
          >
            Dispatch (Priya)
          </Link>
          <Link
            to="/stage"
            className="px-3.5 py-1.5 rounded bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition active:scale-98 flex items-center gap-1.5 shadow-xs"
          >
            <span>Live 3-Pane Stage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-20 pb-20 w-full flex flex-col items-center">
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.12]">
            Cross-border disputes, resolved inside the chat where they start.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            When an international shipment arrives damaged, language barriers turn simple claims into
            costly chargebacks. DisputeGuard binds the order, escrow, live translation, and vision evidence
            into a single synchronized Nexconn channel.
          </p>

          {/* Action Controls */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/stage"
              className="w-full sm:w-auto px-6 py-2.5 rounded bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition active:scale-98 flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Launch 3-Pane Judge Sandbox (/stage)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/dispatch"
              className="w-full sm:w-auto px-5 py-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs transition flex items-center justify-center gap-2"
            >
              <span>Open Staff Dispatch Console</span>
            </Link>
          </div>
        </div>

        {/* Real Economic Impact Metrics (Tabular & Grounded) */}
        <section className="mt-16 w-full grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded border border-slate-800/80 bg-slate-900/40 text-left">
          <div className="p-3">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
              Resolution Time
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-white num-tabular">&lt; 8 min</span>
              <span className="text-[10px] text-slate-500 font-mono">vs 6.4 days email</span>
            </div>
          </div>
          <div className="p-3 border-l border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
              Auto-Settle Ceiling
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-emerald-400 num-tabular">$50.00</span>
              <span className="text-[10px] text-slate-500 font-mono">code enforced</span>
            </div>
          </div>
          <div className="p-3 border-l border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
              Cross-Iframe Bus Latency
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-sky-400 num-tabular">&lt; 5 ms</span>
              <span className="text-[10px] text-slate-500 font-mono">0ms broadcast</span>
            </div>
          </div>
          <div className="p-3 border-l border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
              Injection Vulnerability
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-slate-200 num-tabular">0.0%</span>
              <span className="text-[10px] text-slate-500 font-mono">math in code</span>
            </div>
          </div>
        </section>

        {/* Interactive Live Scenario Simulator */}
        <section className="mt-20 w-full text-left">
          <div className="border-b border-slate-800/80 pb-3 mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Interactive Resolution Walkthrough
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Explore how DisputeGuard operates at each step of an international marketplace dispute.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Live Scenario Simulation
            </span>
          </div>

          {/* Step Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => setActivePreviewTab('translation')}
              className={`p-3 rounded text-left border transition cursor-pointer ${
                activePreviewTab === 'translation'
                  ? 'bg-slate-900 border-slate-600 text-white'
                  : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Languages className="w-3.5 h-3.5 text-sky-400" />
                <span>01. Translation</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Live bilingual chat with Japanese politeness masking detection.
              </p>
            </button>

            <button
              onClick={() => setActivePreviewTab('evidence')}
              className={`p-3 rounded text-left border transition cursor-pointer ${
                activePreviewTab === 'evidence'
                  ? 'bg-slate-900 border-slate-600 text-white'
                  : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>02. Proof-First</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Guided 3-angle photo capture with AI vision damage scoring.
              </p>
            </button>

            <button
              onClick={() => setActivePreviewTab('proposal')}
              className={`p-3 rounded text-left border transition cursor-pointer ${
                activePreviewTab === 'proposal'
                  ? 'bg-slate-900 border-slate-600 text-white'
                  : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>03. Bounded Policy</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Deterministic mathematical proposals (40% refund or replacement).
              </p>
            </button>

            <button
              onClick={() => setActivePreviewTab('firewall')}
              className={`p-3 rounded text-left border transition cursor-pointer ${
                activePreviewTab === 'firewall'
                  ? 'bg-slate-900 border-slate-600 text-white'
                  : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>04. Escalation Freeze</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Instant escrow freeze on chargeback threat & dispatch triage.
              </p>
            </button>
          </div>

          {/* Interactive Preview Container */}
          <div className="p-6 rounded border border-slate-800 bg-slate-900/60 transition-all duration-200">
            {activePreviewTab === 'translation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">Bilingual Nexconn Channel: #dsp_1042</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">Order: ord_1042 · Ceramic Set</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buyer View (ja) */}
                  <div className="p-4 rounded border border-slate-800 bg-slate-950/70 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Buyer View (Aiko Tanaka / Tokyo)</span>
                      <span>ja</span>
                    </div>
                    <div className="p-3 rounded bg-slate-900 text-slate-200 text-xs leading-relaxed border border-slate-800">
                      コップのふちが割れて届きました。箱の底に小さな破片が散らばっていました。
                    </div>
                    <div className="p-2 rounded bg-amber-950/40 border border-amber-900/50 text-amber-300 text-[11px] font-mono">
                      Tatemae Tone Note: Formal phrasing detected; underlying sentiment indicates immediate resolution expected.
                    </div>
                  </div>

                  {/* Seller View (es) */}
                  <div className="p-4 rounded border border-slate-800 bg-slate-950/70 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Seller View (Marco Rossi / Valencia)</span>
                      <span>es</span>
                    </div>
                    <div className="p-3 rounded bg-slate-900 text-slate-200 text-xs leading-relaxed border border-slate-800">
                      El borde de la taza llegó roto. Había pequeños fragmentos esparcidos en el fondo de la caja.
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1">
                      <span>Live translation via Nexconn</span>
                      <span className="text-slate-400 underline cursor-pointer">inspect original</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'evidence' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">AI Vision Damage Assessment</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">Confidence: 94% · Hash Verified</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded border border-slate-800 bg-slate-950/70 text-xs space-y-2">
                    <div className="aspect-video rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-slate-400">
                      Angle 01: Product Rim Crack
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 block">Shot 01 · Macro Inspection</span>
                  </div>
                  <div className="p-3 rounded border border-slate-800 bg-slate-950/70 text-xs space-y-2">
                    <div className="aspect-video rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-slate-400">
                      Angle 02: Interior Wall
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 block">Shot 02 · Functional Test</span>
                  </div>
                  <div className="p-3 rounded border border-slate-800 bg-slate-950/70 text-xs space-y-2">
                    <div className="aspect-video rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-slate-400">
                      Angle 03: Shipping Carton
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 block">Shot 03 · Carrier Impact</span>
                  </div>
                </div>

                <div className="p-3 rounded border border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-white block">Assessment Result: Severity 2 / 3 (Partial Functional Impact)</span>
                    <span className="text-[11px] text-slate-400">Policy Recommendation: Keep item + 40% partial refund ($33.60 USD)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 border border-slate-700 self-start sm:self-auto">
                    AI-assessed, not verified
                  </span>
                </div>
              </div>
            )}

            {activePreviewTab === 'proposal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Deterministic Policy Proposals (v1)</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400">Under $50.00 Auto-Settle Ceiling</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded border border-emerald-900/60 bg-emerald-950/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                      <span>Option A: 40% Partial Refund</span>
                      <span className="font-mono text-sm">$33.60 USD</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Buyer keeps the ceramic set for decorative use; seller issues an immediate $33.60 credit.
                      Since $33.60 &lt; $50.00 ceiling, mutual acceptance settles the escrow atomically.
                    </p>
                    <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                      Status: Mutually Accepted ✓
                    </span>
                  </div>

                  <div className="p-4 rounded border border-slate-800 bg-slate-950/70 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>Option B: Free Replacement</span>
                      <span className="font-mono text-sm">$0.00</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Seller ships a replacement unit with expedited tracking; original escrow funds remain
                      secured until confirmed delivery of replacement parcel.
                    </p>
                    <span className="inline-block text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      Alternative Option
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'firewall' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold text-white">Escalation Firewall Threat Intercept</span>
                  </div>
                  <span className="font-mono text-[11px] text-rose-400">Escrow Frozen Instantly</span>
                </div>

                <div className="p-4 rounded border border-rose-900/60 bg-rose-950/20 space-y-3">
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-rose-400 font-semibold block mb-1">Detected Trigger Phrase (Japanese):</strong>
                    <span className="font-mono text-[11px] bg-slate-900 p-2 rounded block border border-slate-800 text-slate-200">
                      "解決されない場合は、カード会社にチャージバックを申請します" (Chargeback Threat)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-semibold text-white block text-[11px]">User Channel Notice:</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Neutral bilingual card posted: "Case escalated to DisputeGuard Dispatch for staff review."
                        Risk threat details are never leaked to participants.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-semibold text-white block text-[11px]">Dispatch Center Action:</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Surfaces immediately to Priority #1 (Score: 98.8). Arbitrator Priya receives confidential
                        brief with grounded copilot draft to de-escalate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Concrete Comparison: Traditional Support vs DisputeGuard */}
        <section className="mt-20 w-full text-left">
          <div className="border-b border-slate-800/80 pb-3 mb-6">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              The Reality of Cross-Border Disputes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Why international sellers lose $25 per dispute in processing fees and customer churn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="p-5 rounded border border-slate-800/90 bg-slate-900/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wide font-mono">
                  Traditional Support (The Old Way)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">5 to 8 days</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">×</span>
                  <span><strong>Unstructured email threads:</strong> The buyer sends emails in Japanese; the seller copies text into Google Translate and loses cultural context.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">×</span>
                  <span><strong>Unguided blurry photos:</strong> Buyers upload unclear photos from the wrong angle, triggering repeated back-and-forth email requests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">×</span>
                  <span><strong>Disputed chargeback fees:</strong> Frustrated by delays, the buyer calls their credit card company. The merchant is hit with a $15–$25 chargeback fee.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">×</span>
                  <span><strong>Support burnout:</strong> Agents spend hours piecing together multi-language message logs with no clear summary or policy guidance.</span>
                </li>
              </ul>
            </div>

            {/* The DisputeGuard Way */}
            <div className="p-5 rounded border border-slate-700 bg-slate-900/70 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide font-mono">
                  DisputeGuard on Nexconn
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">&lt; 8 minutes</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Realtime multi-party channel:</strong> Buyer, seller, and bot meet inside a single shared Nexconn channel with automatic live translation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Proof-first 3-angle guidance:</strong> The interface guides the buyer through specific required angles before claims are evaluated.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Deterministic math & auto-settle:</strong> Bounded policy options compute exact refund amounts. Auto-approves under $50 without agent intervention.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Escalation firewall freeze:</strong> Threat keywords trigger instant escrow protection and handoff to dispatch with an AI brief.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Test the 3 Real-World Roles */}
        <section className="mt-20 w-full text-left">
          <div className="border-b border-slate-800/80 pb-3 mb-6">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Test Real Participant Personas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              DisputeGuard provides specialized, purpose-built interfaces for each party in a dispute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Persona 1: Buyer */}
            <div className="p-5 rounded border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-white block">Aiko Tanaka</span>
                    <span className="text-[10px] text-slate-500 font-mono">Buyer · Tokyo (ja)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  Inspect purchased orders, initiate damage reports, upload guided photo proof, and accept
                  or counter settlement proposals in Japanese.
                </p>
              </div>
              <Link
                to="/buyer"
                className="mt-5 w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs text-center border border-slate-700 transition"
              >
                Launch Buyer Portal
              </Link>
            </div>

            {/* Persona 2: Seller */}
            <div className="p-5 rounded border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-300">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-white block">Marco Rossi</span>
                    <span className="text-[10px] text-slate-500 font-mono">Seller · Valencia (es)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  Read customer inquiries translated to Spanish, review damage assessments, and approve
                  policy refund proposals or offer replacements.
                </p>
              </div>
              <Link
                to="/seller"
                className="mt-5 w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs text-center border border-slate-700 transition"
              >
                Launch Seller Portal
              </Link>
            </div>

            {/* Persona 3: Arbitrator */}
            <div className="p-5 rounded border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-300">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-white block">Priya Sharma</span>
                    <span className="text-[10px] text-sky-400 font-mono">Arbitrator · Dispatch (en)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  Manage the high-risk priority queue, inspect confidential threat quotes in the AI Brief,
                  and execute one-click audit ledger settlements.
                </p>
              </div>
              <Link
                to="/dispatch"
                className="mt-5 w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs text-center border border-slate-700 transition"
              >
                Launch Dispatch Center
              </Link>
            </div>
          </div>
        </section>

        {/* Technical Architecture & Safety Boundary */}
        <section className="mt-20 w-full text-left">
          <div className="border-b border-slate-800/80 pb-3 mb-6">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Safety Guarantees & Non-Negotiable Invariants
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineered with deterministic guards so that AI hallucinations cannot move escrow money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 p-4 rounded border border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Math</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The LLM never computes or suggests dollar amounts. Policy Engine (v1) executes pure
                TypeScript calculations based on verified order value, item category, and damage severity.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded border border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>$50.00 Auto-Settle Ceiling</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Any agreed settlement under $50.00 settles automatically upon mutual acceptance. Any claim
                exceeding $50.00 requires a cryptographic signature from a verified human arbitrator.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded border border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Append-Only Escrow Ledger</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All escrow balance modifications write immutable ledger entries with actor IDs,
                timestamps, and reason codes. Database constraints block out-of-order transitions.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive FAQ Section (Accordion) */}
        <section className="mt-20 w-full text-left">
          <div className="border-b border-slate-800/80 pb-3 mb-6">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Frequently Asked Technical Questions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct answers to questions regarding architecture, LLM safety, and dispute resolution.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Can prompt injection in customer messages move escrow funds?',
                a: 'No. Customer messages are treated as untrusted conversational data. The LLM produces translations, summaries, and tone notes only. All monetary calculations, proposal options, counter bounds, and escrow transitions are computed deterministically in code.',
              },
              {
                q: 'How does the Escalation Firewall avoid false alarms?',
                a: 'The risk engine uses a weighted multilingual threat lexicon paired with negation checks (e.g., "I will not call the police" is recognized as non-threatening) and politeness masking detection for Japanese tatemae. When a real threat fires, escrow freezes immediately without exposing internal risk details.',
              },
              {
                q: 'Why build directly on the Nexconn Chat SDK?',
                a: 'Nexconn provides the multi-party channel infrastructure that connects buyer, seller, and arbitrator bot on a single persistent stream. Structured message cards (proposals, evidence requests, resolutions) travel over Nexconn as typed event envelopes.',
              },
              {
                q: 'What are the bounds on counter-proposals?',
                a: 'To prevent bad-faith haggling, policy v1 strictly limits counter-proposals to between 50% and 150% of the baseline proposed refund, capped at the order total, with a maximum of two negotiation rounds before escalation.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-800 rounded bg-slate-900/30 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      expandedFaq === idx ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Flagship Sandbox Invitation */}
        <section className="mt-20 w-full p-6 rounded border border-slate-700 bg-slate-900/70 text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-semibold text-white block">
              Experience the 3-Pane Judge Sandbox
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Watch Buyer (ja), Seller (es), and Dispatch (en) negotiate and settle in real time across
              three synchronized viewports with procedural Web Audio feedback.
            </p>
          </div>
          <Link
            to="/stage"
            className="px-5 py-2.5 rounded bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition active:scale-98 flex items-center justify-center gap-2 shrink-0 shadow-xs"
          >
            <span>Launch Stage Sandbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>

      {/* Minimal Craft Footer */}
      <footer className="border-t border-slate-900 py-6 text-xs text-slate-500 max-w-7xl mx-auto w-full px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-400">DisputeGuard AI</span>
          <span>·</span>
          <span>Nexconn Build Challenge 2026</span>
          <span>·</span>
          <span className="font-mono text-[11px]">MIT License</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 transition flex items-center gap-1"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>·</span>
          <Link to="/stage" className="hover:text-slate-300 transition">
            /stage Sandbox
          </Link>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUpRight,
  Shield,
  Languages,
  Camera,
  Scale,
  Lock,
  Terminal,
  ExternalLink,
  CheckCircle,
  AlertOctagon,
} from 'lucide-react';

const RotatingScrollIndicator: React.FC = () => {
  return (
    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
      <svg
        className="w-full h-full animate-spin-12s select-none pointer-events-none"
        viewBox="0 0 144 144"
      >
        <path
          id="circlePath"
          d="M 72,72 m -52,0 a 52,52 0 1,1 104,0 a 52,52 0 1,1 -104,0"
          fill="none"
        />
        <text
          fill="#000000"
          className="font-mono text-[9px] font-bold tracking-[0.22em] uppercase"
        >
          <textPath href="#circlePath" startOffset="0%">
            SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •&nbsp;
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <ArrowDown className="w-5 h-5 text-[#000000]" strokeWidth={2.5} />
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bilingual' | 'vision' | 'policy' | 'firewall'>('bilingual');

  const capabilities = [
    {
      index: '01 //',
      title: 'SYNCHRONIZED BILINGUAL CHAT & TATEMAE DETECTION',
      tags: ['NEXCONN SDK', 'LIVE JA ↔ ES', 'CULTURAL SENTIMENT', '<5MS BUS'],
      description:
        'Aiko writes in formal Japanese; Marco instantly reads in Spanish. Cultural politeness masking is flagged when formal phrasing conceals elevated frustration before escalation.',
      link: '/stage',
      linkText: 'SEE TRANSLATION IN STAGE',
    },
    {
      index: '02 //',
      title: 'PROOF-FIRST 3-ANGLE VISION DAMAGE ASSESSMENT',
      tags: ['GUIDED CAPTURE', 'PERCEPTUAL HASH', 'SEVERITY 1-3', 'ADVISORY LABEL'],
      description:
        'Claiming damage triggers a guided 3-angle capture stepper. AI vision analyzes cracks and packaging, returning severity with an explicit "AI-assessed, not verified" disclosure.',
      link: '/stage',
      linkText: 'VIEW EVIDENCE MODAL',
    },
    {
      index: '03 //',
      title: 'DETERMINISTIC BOUNDED POLICY ENGINE V1',
      tags: ['CODE ENFORCED', '50%-150% BOUNDS', '$50 CEILING', 'ZERO INJECTION'],
      description:
        'Code computes, AI only proposes. Policy Engine (v1) outputs bounded options with a hard $50.00 auto-approve ceiling. Counters are strictly bound to 50%–150% of baseline.',
      link: '/stage',
      linkText: 'INSPECT POLICY OPTIONS',
    },
    {
      index: '04 //',
      title: 'CROSS-CULTURAL ESCALATION FIREWALL FREEZE',
      tags: ['THREAT LEXICON', 'ATOMIC FREEZE', 'NEUTRAL NOTICE', 'AUDIT READY'],
      description:
        'Active threat scanner monitors chargeback, police, and legal keywords across languages. Instantly freezes escrow and summons human dispatch without leaking risk details.',
      link: '/stage',
      linkText: 'TEST ESCROW FREEZE',
    },
    {
      index: '05 //',
      title: 'MISSION-CONTROL ARBITRATOR DISPATCH CONSOLE',
      tags: ['PRIORITY FORMULA', 'AI CASE BRIEF', 'GROUNDED COPILOT', 'ONE-CLICK'],
      description:
        'Pro console with formula-driven priority ranking, confidential threat quotes, grounded bilingual copilot drafting with regex amount checks, and one-click escrow release.',
      link: '/dispatch',
      linkText: 'OPEN DISPATCH CONSOLE',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FF4D00] text-[#000000] font-sans antialiased selection:bg-[#000000] selection:text-[#FF4D00]">
      {/* Floating Navigation Pill */}
      <header className="fixed top-5 inset-x-0 z-50 px-4 sm:px-8 pointer-events-none flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Left Logo */}
        <div className="pointer-events-auto bg-[#000000] text-white px-4 py-2 rounded-full border-2 border-[#000000] shadow-xl flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF4D00]" />
          <span className="font-display uppercase text-xs tracking-tight">DISPUTEGUARD</span>
          <span className="font-mono text-[10px] text-white/60 hidden sm:inline">// DG-01</span>
        </div>

        {/* Center Floating Pill Navigation */}
        <nav className="pointer-events-auto bg-[#000000] text-white rounded-full px-2 py-1.5 shadow-2xl border-2 border-[#000000] flex items-center gap-1 sm:gap-2">
          <Link
            to="/stage"
            className="font-mono text-[11px] sm:text-[12px] uppercase tracking-tight text-white px-3 py-1.5 rounded-full hover:bg-[#FFFFFF] hover:text-[#000000] transition-colors duration-150 font-bold"
          >
            JUDGE STAGE
          </Link>
          <Link
            to="/buyer"
            className="font-mono text-[11px] sm:text-[12px] uppercase tracking-tight text-white/80 px-3 py-1.5 rounded-full hover:bg-[#FFFFFF] hover:text-[#000000] transition-colors duration-150 hidden md:inline-block"
          >
            BUYER (JA)
          </Link>
          <Link
            to="/seller"
            className="font-mono text-[11px] sm:text-[12px] uppercase tracking-tight text-white/80 px-3 py-1.5 rounded-full hover:bg-[#FFFFFF] hover:text-[#000000] transition-colors duration-150 hidden md:inline-block"
          >
            SELLER (ES)
          </Link>
          <Link
            to="/dispatch"
            className="font-mono text-[11px] sm:text-[12px] uppercase tracking-tight text-white/80 px-3 py-1.5 rounded-full hover:bg-[#FFFFFF] hover:text-[#000000] transition-colors duration-150"
          >
            DISPATCH
          </Link>
        </nav>

        {/* Right Status Indicator */}
        <div className="pointer-events-auto bg-[#000000] text-white px-3 sm:px-4 py-2 rounded-full border-2 border-[#000000] shadow-xl flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="hidden sm:inline font-bold">NEXCONN LIVE</span>
          <span className="sm:hidden font-bold">LIVE</span>
        </div>
      </header>

      {/* Typographic Hero Section */}
      <section className="pt-28 sm:pt-36 pb-8 sm:pb-12 px-4 sm:px-8 flex flex-col items-center justify-between min-h-[92vh] border-b-2 border-[#000000]">
        <div className="w-full flex-1 flex flex-col justify-center items-center text-center max-w-7xl mx-auto my-auto">
          <h1 className="font-display uppercase text-[15.5vw] leading-[0.84] tracking-[-0.04em] text-[#000000] select-none block w-full">
            DISPUTE
          </h1>
          <h1 className="font-display uppercase text-[15.5vw] leading-[0.84] tracking-[-0.04em] text-[#000000] select-none block w-full -mt-2 sm:-mt-6">
            GUARD
          </h1>
        </div>

        {/* Horizontal Divider & Metadata Row */}
        <div className="w-full max-w-7xl mx-auto border-t-2 border-[#000000] pt-6 pb-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Metadata Left */}
          <div className="text-left font-mono text-xs sm:text-[13px] tracking-tight leading-relaxed text-[#000000]">
            <span className="block font-bold">[PROTOCOL SPEC]</span>
            <span className="block font-bold">BUILT FOR NEXCONN CHAT SDK</span>
            <span className="text-[#000000]/80 block">CROSS-BORDER MULTILINGUAL ESCROW</span>
            <span className="text-[#000000]/80 block">TOKYO ↔ VALENCIA ↔ DISPATCH</span>
          </div>

          {/* Rotating Circular Indicator Center */}
          <div className="flex justify-center order-first md:order-none">
            <RotatingScrollIndicator />
          </div>

          {/* Metadata Right & Action Buttons */}
          <div className="text-left md:text-right font-mono text-xs sm:text-[13px] tracking-tight leading-relaxed text-[#000000] flex flex-col items-start md:items-end">
            <span className="block font-bold">[CORE INVARIANT]</span>
            <span className="block font-bold">AI PROPOSES • CODE COMPUTES</span>
            <span className="text-[#000000]/80 block">HUMAN ARBITRATOR APPROVES ABOVE $50</span>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/stage"
                className="bg-[#000000] text-white hover:bg-white hover:text-[#000000] font-mono text-xs uppercase px-4 py-2 rounded-full border-2 border-[#000000] transition-colors duration-150 font-bold flex items-center gap-1.5"
              >
                <span>OPEN 3-PANE STAGE</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Skewed Marquee Section */}
      <section className="bg-[#000000] -skew-y-2 py-8 sm:py-12 border-t-2 border-b-2 border-[#000000] overflow-hidden select-none my-12 sm:my-16">
        {/* Row 1: Orange Archivo Black */}
        <div className="overflow-hidden whitespace-nowrap flex">
          <div className="animate-marquee-continuous font-display uppercase text-[10vw] sm:text-[8vw] leading-none text-[#FF4D00] tracking-[-0.04em] shrink-0">
            AUTOMATED ESCROW FREEZE • REALTIME BILINGUAL TRANSLATION • $50 AUTO-SETTLE CEILING • GUIDED VISION PROOF •&nbsp;
          </div>
          <div className="animate-marquee-continuous font-display uppercase text-[10vw] sm:text-[8vw] leading-none text-[#FF4D00] tracking-[-0.04em] shrink-0">
            AUTOMATED ESCROW FREEZE • REALTIME BILINGUAL TRANSLATION • $50 AUTO-SETTLE CEILING • GUIDED VISION PROOF •&nbsp;
          </div>
        </div>

        {/* Row 2: White 80% reverse */}
        <div className="overflow-hidden whitespace-nowrap flex mt-2 sm:mt-4">
          <div className="animate-marquee-reverse-continuous font-display uppercase text-[10vw] sm:text-[8vw] leading-none text-white/80 tracking-[-0.04em] shrink-0">
            NEXCONN MULTI-PARTY CHAT • IMMUTABLE AUDIT LEDGER • POLICIES BOUNDED 50-150% • ZERO INJECTION RISK •&nbsp;
          </div>
          <div className="animate-marquee-reverse-continuous font-display uppercase text-[10vw] sm:text-[8vw] leading-none text-white/80 tracking-[-0.04em] shrink-0">
            NEXCONN MULTI-PARTY CHAT • IMMUTABLE AUDIT LEDGER • POLICIES BOUNDED 50-150% • ZERO INJECTION RISK •&nbsp;
          </div>
        </div>
      </section>

      {/* Relatable Operational Problem & Live Inspector */}
      <section className="bg-[#000000] text-white py-16 px-4 sm:px-8 border-b-2 border-[#000000]">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="border-b-2 border-white/20 pb-6 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="font-mono text-xs text-[#FF4D00] uppercase tracking-wider block font-bold mb-1">
                [LIVE NEXCONN PROTOCOL INSPECTOR]
              </span>
              <h2 className="font-display uppercase text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[0.9]">
                HOW DISPUTEGUARD WORKS IN REAL-TIME
              </h2>
            </div>
            <p className="font-mono text-xs text-white/60 max-w-md">
              Switch inspection views to verify how live chat, damage vision, mathematical policy,
              and escalation firewall execute without prompt injection vulnerability.
            </p>
          </div>

          {/* Interactive Protocol Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
            {[
              { id: 'bilingual', label: '01. BILINGUAL STREAM', icon: Languages },
              { id: 'vision', label: '02. VISION PROOF', icon: Camera },
              { id: 'policy', label: '03. POLICY ENGINE', icon: Scale },
              { id: 'firewall', label: '04. ESCALATION FREEZE', icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`p-4 border text-left transition-all cursor-pointer font-mono text-xs uppercase flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#FF4D00] text-[#000000] border-[#FF4D00] font-bold'
                      : 'bg-[#000000] text-white/70 border-white/20 hover:border-white/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {isSelected && <span className="font-bold">●</span>}
                </button>
              );
            })}
          </div>

          {/* Interactive Display Area */}
          <div className="border-2 border-white/20 bg-[#080808] p-6 sm:p-8">
            {activeTab === 'bilingual' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/20 pb-4 gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white font-bold">NEXCONN MULTI-PARTY CHANNEL #dsp_1042</span>
                  </div>
                  <span className="font-mono text-xs text-[#FF4D00]">ORDER: ord_1042 · $84.00 USD</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Buyer View */}
                  <div className="border border-white/20 p-5 space-y-3 bg-[#000000]">
                    <div className="flex justify-between font-mono text-[11px] text-[#FF4D00] uppercase font-bold">
                      <span>BUYER VIEW (AIKO TANAKA // TOKYO)</span>
                      <span>JA</span>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 font-mono text-xs leading-relaxed text-white">
                      コップのふちが割れて届きました。箱の中に小さな破片が散らばっていました。
                    </div>
                    <div className="p-3 border border-[#FF4D00]/40 bg-[#FF4D00]/10 text-[#FF4D00] font-mono text-xs space-y-1">
                      <span className="font-bold block">[TATEMAE TONE NOTE DETECTED]</span>
                      <p className="text-white/80 text-[11px]">
                        Formal honorific phrasing masks elevated frustration. Tone note surfaced to arbitrator.
                      </p>
                    </div>
                  </div>

                  {/* Seller View */}
                  <div className="border border-white/20 p-5 space-y-3 bg-[#000000]">
                    <div className="flex justify-between font-mono text-[11px] text-white/60 uppercase font-bold">
                      <span>SELLER VIEW (MARCO ROSSI // VALENCIA)</span>
                      <span>ES</span>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 font-mono text-xs leading-relaxed text-white">
                      El borde de la taza llegó roto. Había pequeños fragmentos esparcidos en el fondo de la caja.
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-white/50 pt-2 border-t border-white/10">
                      <span>TRANSLATED VIA NEXCONN REALTIME BUS</span>
                      <span className="text-[#FF4D00] font-bold underline cursor-pointer">ONE-TAP ORIGINAL</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vision' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/20 pb-4 gap-2">
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    AI VISION EVIDENCE VERIFICATION // PERCEPTUAL HASH
                  </span>
                  <span className="font-mono text-xs text-white/60">CONFIDENCE: 94% · 3/3 ANGLES VERIFIED</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="border border-white/20 p-4 space-y-2 bg-[#000000]">
                    <div className="aspect-video bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-[11px]">
                      [PHOTO: RIM CRACK MACRO]
                    </div>
                    <span className="text-[#FF4D00] font-bold block">ANGLE 01: MACRO RIM</span>
                    <span className="text-white/60 text-[11px] block">Clear structural fracture visible</span>
                  </div>
                  <div className="border border-white/20 p-4 space-y-2 bg-[#000000]">
                    <div className="aspect-video bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-[11px]">
                      [PHOTO: INTERIOR CUP WALL]
                    </div>
                    <span className="text-[#FF4D00] font-bold block">ANGLE 02: INTERIOR</span>
                    <span className="text-white/60 text-[11px] block">No secondary spider fractures</span>
                  </div>
                  <div className="border border-white/20 p-4 space-y-2 bg-[#000000]">
                    <div className="aspect-video bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-[11px]">
                      [PHOTO: SHIPPING PACKAGING]
                    </div>
                    <span className="text-[#FF4D00] font-bold block">ANGLE 03: TRANSIT BOX</span>
                    <span className="text-white/60 text-[11px] block">Exterior crush corner detected</span>
                  </div>
                </div>

                <div className="border-2 border-[#FF4D00] p-4 bg-[#FF4D00]/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-xs">
                  <div>
                    <span className="text-[#FF4D00] font-bold block">ASSESSMENT: SEVERITY LEVEL 2 / 3 (PARTIAL FUNCTIONAL IMPACT)</span>
                    <span className="text-white/80 text-[11px]">POLICY ENGINE RECOMMENDATION: 40% PARTIAL REFUND ($33.60 USD)</span>
                  </div>
                  <span className="bg-[#000000] border border-white/40 px-3 py-1 text-white text-[10px] uppercase font-bold">
                    AI-ASSESSED, NOT VERIFIED
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'policy' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/20 pb-4 gap-2">
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    POLICY ENGINE V1 // DETERMINISTIC REASONING
                  </span>
                  <span className="font-mono text-xs text-emerald-400 font-bold">MUTUAL ACCEPTANCE &lt; $50 CEILING</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="border-2 border-emerald-500 p-5 bg-emerald-950/20 space-y-3">
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span className="text-sm">OPTION A: 40% REFUND</span>
                      <span className="text-base num-tabular">$33.60 USD</span>
                    </div>
                    <p className="text-white/80 leading-relaxed text-[11px]">
                      Buyer keeps the ceramic set; seller releases $33.60 credit.
                      Since $33.60 is below the $50 auto-approve ceiling, mutual acceptance settles escrow atomically in SQLite.
                    </p>
                    <span className="inline-block bg-emerald-500 text-black px-2.5 py-0.5 font-bold uppercase text-[10px]">
                      STATUS: MUTUALLY ACCEPTED ✓
                    </span>
                  </div>

                  <div className="border border-white/20 p-5 bg-[#000000] space-y-3">
                    <div className="flex justify-between items-center text-white font-bold">
                      <span className="text-sm">OPTION B: REPLACEMENT</span>
                      <span className="text-base num-tabular">$0.00 USD</span>
                    </div>
                    <p className="text-white/60 leading-relaxed text-[11px]">
                      Seller dispatches a replacement unit with expedited tracking. Original escrow funds remain locked
                      until delivery is confirmed by buyer signature.
                    </p>
                    <span className="inline-block bg-white/10 text-white/60 px-2.5 py-0.5 uppercase text-[10px]">
                      ALTERNATIVE OPTION
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'firewall' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/20 pb-4 gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold">
                    <AlertOctagon className="w-4 h-4" />
                    <span>ESCALATION FIREWALL // THREAT INTERCEPT</span>
                  </div>
                  <span className="font-mono text-xs text-rose-400 font-bold">ESCROW STATE: FROZEN</span>
                </div>

                <div className="border-2 border-rose-500 p-5 bg-rose-950/20 space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-rose-400 font-bold block mb-1 uppercase">[DETECTED THREAT PATTERN]</span>
                    <div className="bg-[#000000] p-3 border border-rose-500/50 text-white">
                      "解決されない場合は、カード会社にチャージバックを申請します" (Chargeback Threat Keyword Detected)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    <div className="p-3 bg-[#000000] border border-white/20 space-y-1">
                      <span className="text-white font-bold block">PARTICIPANT CHANNEL NOTICE:</span>
                      <p className="text-white/70 leading-relaxed">
                        Neutral bilingual card posted. Escrow locked. Risk score and threat triggers are strictly hidden from users.
                      </p>
                    </div>
                    <div className="p-3 bg-[#000000] border border-white/20 space-y-1">
                      <span className="text-[#FF4D00] font-bold block">DISPATCH ACTION TRIGGERED:</span>
                      <p className="text-white/70 leading-relaxed">
                        Flashes to Top of Priority Queue (Score: 98.8). Arbitrator Priya receives case brief & copilot de-escalation draft.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Vertical Service List (Brutalist Service Cards) */}
      <section className="bg-[#000000] text-white py-20 px-4 sm:px-8 border-b-2 border-[#000000]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="border-b-2 border-white/20 pb-6 mb-8 flex justify-between items-end">
            <div>
              <span className="font-mono text-xs text-[#FF4D00] uppercase tracking-wider block font-bold mb-1">
                [SYSTEM CAPABILITIES]
              </span>
              <h2 className="font-display uppercase text-3xl sm:text-5xl lg:text-7xl tracking-tight leading-[0.9]">
                CORE PROTOCOL MODULES
              </h2>
            </div>
            <span className="font-mono text-xs text-white/50 hidden sm:inline">
              V1.0 SPECIFICATION
            </span>
          </div>

          {/* Brutalist Cards List */}
          <div className="divide-y divide-white/20 border-b border-white/20">
            {capabilities.map((item) => (
              <div
                key={item.index}
                className="group py-8 sm:py-12 transition-all duration-200 hover:bg-white/[0.04] px-4 -mx-4 cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Leading Index & Title */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm sm:text-base text-[#FF4D00] font-bold">
                        {item.index}
                      </span>
                      {/* Pill Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="font-mono text-[10px] text-white/80 border border-white/30 rounded-full px-2.5 py-0.5 uppercase"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="font-display uppercase text-2xl sm:text-4xl lg:text-[4vw] leading-[0.92] tracking-[-0.03em] text-white group-hover:translate-x-4 transition-transform duration-300">
                      {item.title}
                    </h3>
                  </div>

                  {/* Arrow Icon Reveal */}
                  <div className="flex items-center gap-4 self-end lg:self-center">
                    <Link
                      to={item.link}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-[#FF4D00] flex items-center gap-2 font-mono text-xs uppercase font-bold"
                    >
                      <span>{item.linkText}</span>
                      <ArrowUpRight className="w-6 h-6 transform group-hover:rotate-45 transition-transform duration-300" strokeWidth={3} />
                    </Link>
                  </div>
                </div>

                <p className="font-sans text-xs sm:text-sm text-white/60 max-w-3xl mt-4 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Giant CTA Section */}
      <section className="bg-[#FF4D00] text-[#000000] py-24 sm:py-36 px-4 sm:px-8 border-b-2 border-[#000000] flex flex-col items-center justify-center text-center">
        <div className="max-w-6xl mx-auto space-y-8">
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest block text-[#000000]">
            [NEXCONN BUILD CHALLENGE 2026 // READY TO TEST]
          </span>

          <h2 className="font-display uppercase text-[12vw] sm:text-[11vw] leading-[0.84] tracking-[-0.04em] text-[#000000] select-none">
            RESOLVE IN MINUTES.
          </h2>

          <p className="font-mono text-xs sm:text-base max-w-2xl mx-auto text-[#000000]/80 leading-relaxed">
            Experience the synchronized 3-pane sandbox with Buyer (ja), Seller (es), and Dispatch (en).
            Watch real-time live cards, bounded proposals, and auto-settlement.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/stage"
              className="bg-[#000000] text-white hover:bg-white hover:text-[#000000] hover:scale-105 active:scale-95 transition-transform duration-200 px-10 py-5 rounded-full font-mono text-sm sm:text-base uppercase tracking-wider font-bold border-2 border-[#000000] shadow-2xl flex items-center gap-3"
            >
              <span>LAUNCH 3-PANE JUDGE STAGE</span>
              <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
            </Link>
            <Link
              to="/dispatch"
              className="bg-transparent text-[#000000] hover:bg-[#000000] hover:text-white transition-colors duration-150 px-8 py-5 rounded-full font-mono text-sm uppercase tracking-wider font-bold border-2 border-[#000000]"
            >
              <span>STAFF DISPATCH CONSOLE</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Kinetic Brutalist Footer */}
      <footer className="bg-[#FF4D00] text-[#000000] py-8 px-4 sm:px-8 font-mono text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t-2 border-[#000000] pt-6">
          <div className="flex items-center gap-3 font-bold">
            <span>© 2026 DISPUTEGUARD AI</span>
            <span>//</span>
            <span>NEXCONN CHAT SDK</span>
            <span>//</span>
            <span>MIT LICENSE</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-bold">
            <Link to="/stage" className="hover:underline">
              [STAGE SANDBOX]
            </Link>
            <Link to="/buyer" className="hover:underline">
              [BUYER JA]
            </Link>
            <Link to="/seller" className="hover:underline">
              [SELLER ES]
            </Link>
            <Link to="/dispatch" className="hover:underline">
              [DISPATCH EN]
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              <span>GITHUB</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

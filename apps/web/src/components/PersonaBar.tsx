import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../api/client';
import { stageDriver } from '../services/stageDriver';
import { soundFx } from '../services/soundFx';
import {
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Radio,
} from 'lucide-react';

export const PersonaBar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.isMuted());
  const [showSimMenu, setShowSimMenu] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      soundFx.playStep();
      await api.resetDemo();
      // Broadcast to all tabs
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('disputeguard_realtime_bus');
        bc.postMessage({ type: 'realtime_event', action: 'refresh_dispute' });
        bc.close();
      }
      showToast('State reset to seed baseline ✓');
    } catch (e) {
      console.error('Reset error:', e);
      showToast('Reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSimulate = async (scenario: 'A' | 'B') => {
    setShowSimMenu(false);
    setIsSimulating(true);
    try {
      if (scenario === 'A') {
        showToast('Running Scenario: Damaged Cup (Auto-Settle)...');
        for (let i = 0; i <= 5; i++) {
          await stageDriver.executeScenarioAStep(i);
          await new Promise((r) => setTimeout(r, 600));
        }
        soundFx.playResolution();
        showToast('Scenario A Complete: Bounded $33.60 Auto-Settled ✓');
      } else {
        showToast('Running Scenario: Chargeback Threat (Escrow Freeze)...');
        for (let i = 0; i <= 5; i++) {
          await stageDriver.executeScenarioBStep(i);
          await new Promise((r) => setTimeout(r, 600));
        }
        soundFx.playResolution();
        showToast('Scenario B Complete: Threat Intercepted & Resolved ✓');
      }
    } catch (e) {
      console.error('Simulate error:', e);
      showToast('Simulation completed with partial steps');
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleSound = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  const personas = [
    {
      id: 'buyer',
      path: '/buyer',
      title: 'Buyer Portal',
      user: 'Aiko Tanaka',
      locale: 'Tokyo · ja',
      badge: 'JA',
    },
    {
      id: 'seller',
      path: '/seller',
      title: 'Seller Portal',
      user: 'Marco Rossi',
      locale: 'Valencia · es',
      badge: 'ES',
    },
    {
      id: 'dispatch',
      path: '/dispatch',
      title: 'Dispatch Console',
      user: 'Priya Sharma',
      locale: 'Arbitrator · en',
      badge: 'HQ',
    },
  ];

  return (
    <>
      <div className="bg-[#000000] text-white border-b-2 border-black px-3 py-1.5 flex items-center justify-between text-xs font-mono select-none shrink-0 z-40 relative">
        {/* Left: Brand & Home Link */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 hover:text-[#FF4D00] transition-colors font-bold text-[11px] tracking-tight text-white group"
            title="Return to Landing Page"
          >
            <div className="w-2 h-2 rounded-full bg-[#FF4D00] group-hover:scale-125 transition-transform" />
            <span className="font-display uppercase tracking-tight">DG // DISPUTEGUARD</span>
          </Link>

          <span className="text-white/30 hidden sm:inline">|</span>

          {/* Persona Switcher Tabs */}
          <nav className="flex items-center gap-1">
            {personas.map((p) => {
              const isActive = currentPath === p.path;
              return (
                <Link
                  key={p.id}
                  to={p.path}
                  className={`px-2.5 py-1 rounded transition-all text-[11px] flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#FF4D00] text-black font-bold shadow'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                      isActive ? 'bg-black text-white' : 'bg-white/20 text-white/90'
                    }`}
                  >
                    {p.badge}
                  </span>
                  <span className="hidden md:inline font-medium">{p.title}</span>
                  <span className="md:hidden font-medium">{p.badge}</span>
                  <span className="text-[10px] opacity-75 hidden xl:inline">({p.user})</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Realtime status, Simulator triggers, Reset button, Sound */}
        <div className="flex items-center gap-2">
          {/* Realtime Bus Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-emerald-400 font-bold"
            title="Live cross-tab WebSocket & BroadcastChannel bus active"
          >
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>REALTIME BUS</span>
          </div>

          {/* Quick Simulation Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowSimMenu(!showSimMenu)}
              disabled={isSimulating}
              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              title="Trigger instant end-to-end simulation"
            >
              <Zap className="w-3 h-3 text-[#FF4D00]" />
              <span className="hidden lg:inline">{isSimulating ? 'SIMULATING...' : 'LIVE SIMULATOR'}</span>
              <span className="lg:hidden">SIM</span>
            </button>

            {showSimMenu && (
              <div className="absolute right-0 mt-1 w-72 bg-[#000000] border-2 border-white/20 rounded shadow-2xl p-2 text-xs space-y-1 z-50">
                <div className="px-2 py-1 text-[10px] text-white/50 uppercase font-bold border-b border-white/10">
                  Instant E2E Simulation
                </div>
                <button
                  onClick={() => handleSimulate('A')}
                  className="w-full text-left p-2 rounded hover:bg-white/10 text-white transition flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between font-bold text-[#FF4D00]">
                    <span>01 // DAMAGED CUP SETTLEMENT</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] text-white/70">
                    Dispute intake → 3-angle vision → bounded $33.60 proposal → auto-settle.
                  </span>
                </button>
                <button
                  onClick={() => handleSimulate('B')}
                  className="w-full text-left p-2 rounded hover:bg-white/10 text-white transition flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between font-bold text-rose-400">
                    <span>02 // ESCALATION FIREWALL FREEZE</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] text-white/70">
                    Tatemae detection → chargeback threat → atomic escrow freeze → arbitrator takeover.
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isMuted ? 'Unmute Audio Feedback' : 'Mute Audio Feedback'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white/50" /> : <Volume2 className="w-3.5 h-3.5 text-[#FF4D00]" />}
          </button>

          {/* Reset Demo State Button */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Restore fresh seed state for all personas"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin text-[#FF4D00]' : ''}`} />
            <span className="hidden md:inline">RESET SEED</span>
          </button>
        </div>
      </div>

      {/* Instant Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#000000] text-white border-2 border-[#FF4D00] px-4 py-2 rounded shadow-2xl font-mono text-xs flex items-center gap-2 transition-all duration-200 ease-out">
          <CheckCircle2 className="w-4 h-4 text-[#FF4D00]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

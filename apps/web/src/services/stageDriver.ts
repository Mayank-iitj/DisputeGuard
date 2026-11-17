// DisputeGuard Stage Scenario Driver
// Drives automated or step-by-step end-to-end execution across the 3 sandbox panes

import { api } from '../api/client';
import { getChatClient } from '../nexconn/client';
import { soundFx } from './soundFx';

interface StepResult {
  success: boolean;
  message?: string;
  disputeId?: string;
}

class StageDriverService {
  private activeDisputeAId: string | null = null;
  private activeDisputeBId: string | null = null;
  private bc: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel('disputeguard_realtime_bus');
      } catch (e) {
        console.warn('BroadcastChannel error in StageDriver:', e);
      }
    }
  }

  private broadcastStageAction(action: string, payload: any = {}) {
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'stage_action', action, ...payload });
      } catch (e) {}
    }
  }

  // ==========================================
  // SCENARIO A: Damaged Cup (Auto-Settle)
  // ==========================================
  async executeScenarioAStep(stepIndex: number): Promise<StepResult> {
    soundFx.playStep();

    switch (stepIndex) {
      // Step 1: Open Dispute & Proof-First
      case 0: {
        await api.loginPersona('buyer_aiko');
        const dispute = await api.createDispute(
          'ord_1042',
          'damaged',
          'コップが割れて届きました。'
        );
        this.activeDisputeAId = dispute.id;
        this.broadcastStageAction('select_dispute', { disputeId: dispute.id, orderId: 'ord_1042' });
        return {
          success: true,
          disputeId: dispute.id,
          message: 'Dispute opened for ord_1042. Guided proof request emitted.',
        };
      }

      // Step 2: Live Cross-Border Translation
      case 1: {
        const disputeId = await this.ensureDisputeA();
        const dispute = await api.getDispute(disputeId);
        await api.loginPersona('buyer_aiko');
        const chat = getChatClient();
        await chat.joinChannel(dispute.channelId);

        const text = 'コップのふちが割れていて、箱の中に破片が落ちていました。怪我をしそうでした。';
        const { uid } = await chat.sendText(dispute.channelId, text);
        await api.observe(disputeId, uid, text);

        return {
          success: true,
          message: 'Aiko sent Japanese message; Marco received live Spanish translation.',
        };
      }

      // Step 3: AI Vision Assessment
      case 2: {
        const disputeId = await this.ensureDisputeA();
        await api.loginPersona('buyer_aiko');

        const evidenceFiles = [
          {
            name: 'cup_crack_rim.jpg',
            label: 'rim_crack',
            url: '/img/fixture_cup_crack_1.jpg',
          },
          {
            name: 'cup_crack_interior.jpg',
            label: 'interior_crack',
            url: '/img/fixture_cup_crack_2.jpg',
          },
          {
            name: 'shipping_box.jpg',
            label: 'shipping_box',
            url: '/img/fixture_cup_crack_pkg.jpg',
          },
        ];

        const res = await api.submitEvidence(disputeId, evidenceFiles);
        this.broadcastStageAction('refresh_dispute', { disputeId });
        return {
          success: true,
          message: 'Photos assessed by AI Vision (Severity 2/3, 40% recommended refund).',
        };
      }

      // Step 4: Deterministic Policy Proposal
      case 3: {
        const disputeId = await this.ensureDisputeA();
        const dispute = await api.getDispute(disputeId);
        this.broadcastStageAction('refresh_dispute', { disputeId });
        return {
          success: true,
          message: `Policy engine v1 generated 2 bounded options (${dispute.proposal?.options?.length || 2} proposals posted).`,
        };
      }

      // Step 5: Mutual Settlement
      case 4: {
        const disputeId = await this.ensureDisputeA();
        const dispute = await api.getDispute(disputeId);
        const proposal = dispute.proposal;
        if (!proposal || !proposal.options || proposal.options.length === 0) {
          throw new Error('No proposal found to accept');
        }

        const option1Id = proposal.options[0].id; // 40% partial refund

        // Buyer accepts
        await api.loginPersona('buyer_aiko');
        await api.respondProposal(disputeId, proposal.id, 'accept', option1Id);

        // Seller accepts
        await api.loginPersona('seller_marco');
        await api.respondProposal(disputeId, proposal.id, 'accept', option1Id);

        this.broadcastStageAction('refresh_dispute', { disputeId });
        return {
          success: true,
          message: 'Aiko and Marco mutually accepted Option 1 (40% partial refund).',
        };
      }

      // Step 6: Auto-Settle & Escrow Release
      case 5: {
        const disputeId = await this.ensureDisputeA();
        const dispute = await api.getDispute(disputeId);
        this.broadcastStageAction('refresh_dispute', { disputeId });
        soundFx.playResolution();
        return {
          success: true,
          message:
            'Auto-settled ($33.60 < $50.00 ceiling). Escrow released; immutable ledger entry stamped.',
        };
      }

      default:
        return { success: false, message: 'Invalid step index' };
    }
  }

  // ==========================================
  // SCENARIO B: Escalation Firewall & Takeover
  // ==========================================
  async executeScenarioBStep(stepIndex: number): Promise<StepResult> {
    soundFx.playStep();

    switch (stepIndex) {
      // Step 1: Open Dispute ord_1044 ($56.00)
      case 0: {
        await api.loginPersona('buyer_aiko');
        const dispute = await api.createDispute(
          'ord_1044',
          'wrong_item_or_size',
          'サイズMを注文したのにサイズLが届きました。'
        );
        this.activeDisputeBId = dispute.id;
        this.broadcastStageAction('select_dispute', { disputeId: dispute.id, orderId: 'ord_1044' });
        return {
          success: true,
          disputeId: dispute.id,
          message: 'Dispute opened for Silk Scarf (ord_1044, $56.00).',
        };
      }

      // Step 2: Politeness Masking Detection
      case 1: {
        const disputeId = await this.ensureDisputeB();
        const dispute = await api.getDispute(disputeId);
        await api.loginPersona('buyer_aiko');
        const chat = getChatClient();
        await chat.joinChannel(dispute.channelId);

        const politeFrustration =
          'お世話になっております。すでに3回ご連絡しておりますが、いつご対応いただけますでしょうか。商品の状態が説明と全く異なっており、大変困惑しております。早急な対応をお願いします。';
        const { uid } = await chat.sendText(dispute.channelId, politeFrustration);
        await api.observe(disputeId, uid, politeFrustration);

        this.broadcastStageAction('refresh_dispute', { disputeId });
        return {
          success: true,
          message: 'Politeness Masking detected: high latent frustration behind polite Japanese phrasing.',
        };
      }

      // Step 3: Escalation Firewall Freeze
      case 2: {
        const disputeId = await this.ensureDisputeB();
        const dispute = await api.getDispute(disputeId);
        await api.loginPersona('buyer_aiko');
        const chat = getChatClient();
        await chat.joinChannel(dispute.channelId);

        const chargebackThreat =
          '解決されない場合は、カード会社にチャージバックを申請します。消費者センターにも通報します。';
        const { uid } = await chat.sendText(dispute.channelId, chargebackThreat);
        await api.observe(disputeId, uid, chargebackThreat);

        soundFx.playFreeze();
        this.broadcastStageAction('refresh_dispute', { disputeId });
        return {
          success: true,
          message:
            'Escalation Firewall triggered! Risk score: 98.8. Escrow frozen; neutral bilingual notice posted.',
        };
      }

      // Step 4: Priority Queue & AI Brief
      case 3: {
        const disputeId = await this.ensureDisputeB();
        this.broadcastStageAction('select_dispatch', { disputeId });
        return {
          success: true,
          message:
            'Case surfaced to #1 in Dispatch Priority Queue. AI Brief generated with confidential quote.',
        };
      }

      // Step 5: Arbitrator Takeover & Copilot
      case 4: {
        const disputeId = await this.ensureDisputeB();
        await api.loginPersona('agent_priya');
        await api.takeover(disputeId, true);

        // Send copilot greeting
        const chat = getChatClient();
        const dispute = await api.getDispute(disputeId);
        await chat.joinChannel(dispute.channelId);

        const copilotMsg =
          'ご不便をおかけして誠に申し訳ございません。DisputeGuard専任担当のPriyaが引き継ぎました。全額返金にて迅速に対応させていただきます。';
        await chat.sendText(dispute.channelId, copilotMsg);

        this.broadcastStageAction('refresh_dispute', { disputeId });
        return {
          success: true,
          message: 'Priya took over case, joined channel, and sent copilot de-escalation response.',
        };
      }

      // Step 6: One-Click Resolution & Release
      case 5: {
        const disputeId = await this.ensureDisputeB();
        await api.loginPersona('agent_priya');
        await api.resolveDispute(
          disputeId,
          'refund_full',
          'Escalation verified: chargeback risk de-escalated via full refund under policy v1.'
        );

        soundFx.playResolution();
        this.broadcastStageAction('refresh_dispute', { disputeId });
        return {
          success: true,
          message:
            'Approved Full Refund ($56.00). Escrow released to buyer; audit ledger stamped; dispute settled.',
        };
      }

      default:
        return { success: false, message: 'Invalid step index' };
    }
  }

  private async ensureDisputeA(): Promise<string> {
    if (this.activeDisputeAId) return this.activeDisputeAId;
    await api.loginPersona('buyer_aiko');
    const orders = await api.getOrders();
    const ord = orders.items.find((o) => o.id === 'ord_1042');
    if (ord && ord.disputeId) {
      this.activeDisputeAId = ord.disputeId;
      return ord.disputeId;
    }
    const created = await api.createDispute('ord_1042', 'damaged', 'コップが割れて届きました。');
    this.activeDisputeAId = created.id;
    return created.id;
  }

  private async ensureDisputeB(): Promise<string> {
    if (this.activeDisputeBId) return this.activeDisputeBId;
    await api.loginPersona('buyer_aiko');
    const orders = await api.getOrders();
    const ord = orders.items.find((o) => o.id === 'ord_1044');
    if (ord && ord.disputeId) {
      this.activeDisputeBId = ord.disputeId;
      return ord.disputeId;
    }
    const created = await api.createDispute(
      'ord_1044',
      'wrong_item_or_size',
      'サイズMを注文したのにサイズLが届きました。'
    );
    this.activeDisputeBId = created.id;
    return created.id;
  }

  public reset() {
    this.activeDisputeAId = null;
    this.activeDisputeBId = null;
  }
}

export const stageDriver = new StageDriverService();

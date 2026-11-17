import React from 'react';
import { DgEnvelope } from '@dg/shared';
import { WelcomeCard } from './WelcomeCard';
import { ProofRequestCard } from './ProofRequestCard';
import { EvidenceResultCard } from './EvidenceResultCard';
import { ProposalCard } from './ProposalCard';
import { EscalationNoticeCard } from './EscalationNoticeCard';
import { AgentJoinedCard } from './AgentJoinedCard';
import { ResolutionCard } from './ResolutionCard';
import { EscrowStatusCard } from './EscrowStatusCard';
import { SystemNoteCard } from './SystemNoteCard';

export interface CardRendererProps {
  envelope: DgEnvelope;
  currentUserId: string;
  isBuyer: boolean;
  userLang?: string;
  counterpartName?: string;
  isFrozen?: boolean;
  onOpenUpload?: () => void;
  onAcceptProposal?: (optionId: string) => void;
  onCounterProposal?: (optionId: string) => void;
  onDeclineProposal?: (optionId: string) => void;
}

export const CardRenderer: React.FC<CardRendererProps> = ({
  envelope,
  currentUserId,
  isBuyer,
  userLang = 'en',
  counterpartName = 'Counterpart',
  isFrozen = false,
  onOpenUpload,
  onAcceptProposal,
  onCounterProposal,
  onDeclineProposal,
}) => {
  const { kind, data } = envelope;

  switch (kind) {
    case 'card.welcome':
      return <WelcomeCard data={data as any} />;
    case 'card.proof_request':
      return <ProofRequestCard data={data as any} isBuyer={isBuyer} onOpenUpload={onOpenUpload} />;
    case 'card.evidence_result':
      return <EvidenceResultCard data={data as any} />;
    case 'card.proposal':
      return (
        <ProposalCard
          data={data as any}
          isBuyer={isBuyer}
          counterpartName={counterpartName}
          isFrozen={isFrozen}
          onAccept={onAcceptProposal}
          onCounter={onCounterProposal}
          onDecline={onDeclineProposal}
        />
      );
    case 'card.escalation_notice':
      return <EscalationNoticeCard data={data as any} userLang={userLang} />;
    case 'card.agent_joined':
      return <AgentJoinedCard data={data as any} />;
    case 'card.resolution':
      return <ResolutionCard data={data as any} />;
    case 'card.escrow_status':
      return <EscrowStatusCard data={data as any} />;
    case 'card.system_note':
      return <SystemNoteCard data={data as any} />;
    default:
      return null;
  }
};

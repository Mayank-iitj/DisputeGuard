import { buildApp } from '../src/index';

async function runSmoke() {
  console.log('--- Starting DisputeGuard Smoke Test ---');
  const { app, outbox } = await buildApp();

  // Reset demo state first to guarantee clean seed state
  await app.inject({ method: 'POST', url: '/api/v1/demo/reset' });

  // 1. Health check
  const healthRes = await app.inject({ method: 'GET', url: '/api/v1/health' });
  if (healthRes.statusCode !== 200) throw new Error('Health check failed');
  console.log('✓ /health OK');

  // 2. Demo session for buyer Aiko
  const aikoRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/demo-session',
    payload: { persona: 'buyer_aiko' },
  });
  if (aikoRes.statusCode !== 200) throw new Error('Aiko login failed');
  const aikoData = JSON.parse(aikoRes.body);
  const aikoJwt = aikoData.jwt;
  console.log('✓ Aiko demo-session OK (token + nexconn credentials received)');

  // 3. Demo session for seller Marco
  const marcoRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/demo-session',
    payload: { persona: 'seller_marco' },
  });
  if (marcoRes.statusCode !== 200) throw new Error('Marco login failed');
  const marcoJwt = JSON.parse(marcoRes.body).jwt;
  console.log('✓ Marco demo-session OK');

  // 4. Demo session for Agent Priya
  const priyaRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/demo-session',
    payload: { persona: 'agent_priya' },
  });
  if (priyaRes.statusCode !== 200) throw new Error('Priya login failed');
  const priyaJwt = JSON.parse(priyaRes.body).jwt;
  console.log('✓ Priya demo-session OK');

  // 5. Fetch orders for Aiko
  const ordersRes = await app.inject({
    method: 'GET',
    url: '/api/v1/orders',
    headers: { authorization: `Bearer ${aikoJwt}` },
  });
  const orders = JSON.parse(ordersRes.body);
  if (!orders.items || orders.items.length === 0) throw new Error('No orders found');
  console.log(`✓ Orders list OK (${orders.items.length} seeded orders)`);

  // 6. Open dispute for ord_1042
  const disputeRes = await app.inject({
    method: 'POST',
    url: '/api/v1/disputes',
    headers: { authorization: `Bearer ${aikoJwt}` },
    payload: { orderId: 'ord_1042', reason: 'damaged', text: 'コップが割れていました' },
  });
  const dispute = JSON.parse(disputeRes.body);
  if (disputeRes.statusCode !== 201 && disputeRes.statusCode !== 200) {
    throw new Error('Dispute create failed: ' + disputeRes.body);
  }
  console.log(`✓ Dispute opened OK: ${dispute.id} (Escrow: ${dispute.escrow.state})`);

  // 7. Flush outbox
  await outbox.flush();
  console.log('✓ Outbox flushed to Nexconn/Fallback bus');

  // 8. Observe message with chargeback threat to verify Escalation Firewall
  const observeRes = await app.inject({
    method: 'POST',
    url: `/api/v1/disputes/${dispute.id}/observe`,
    headers: { authorization: `Bearer ${aikoJwt}` },
    payload: {
      messageUid: 'msg_threat_1',
      text: '解決されない場合は、カード会社にチャージバックを申請します',
    },
  });
  const obsData = JSON.parse(observeRes.body);
  if (observeRes.statusCode !== 200) {
    console.error('Observe returned status', observeRes.statusCode, obsData);
    throw new Error('Observe failed');
  }
  if (!obsData.risk || !obsData.risk.frozen) {
    console.error('Observe response:', obsData);
    throw new Error('Expected threat to freeze escrow!');
  }
  console.log('✓ Escalation Firewall triggered: Escrow FROZEN, high risk verified');

  // 9. Check Agent Queue
  const queueRes = await app.inject({
    method: 'GET',
    url: '/api/v1/agent/queue',
    headers: { authorization: `Bearer ${priyaJwt}` },
  });
  const queue = JSON.parse(queueRes.body);
  if (queue.items.length === 0 || !queue.items[0].risk.frozen) {
    throw new Error('Expected frozen case in queue');
  }
  console.log(`✓ Agent Queue OK (${queue.items.length} cases, top priority: ${queue.items[0].priority})`);

  // 10. Agent Takeover
  const takeoverRes = await app.inject({
    method: 'POST',
    url: `/api/v1/agent/disputes/${dispute.id}/takeover`,
    headers: { authorization: `Bearer ${priyaJwt}` },
    payload: { force: true },
  });
  if (takeoverRes.statusCode !== 200) throw new Error('Takeover failed');
  console.log('✓ Agent Takeover OK');

  // 11. Agent Resolve with full refund
  const resolveRes = await app.inject({
    method: 'POST',
    url: `/api/v1/agent/disputes/${dispute.id}/resolve`,
    headers: { authorization: `Bearer ${priyaJwt}` },
    payload: {
      action: 'refund_full',
      note: 'Verified damaged item and customer complaint; goodwill full refund',
    },
  });
  const resolved = JSON.parse(resolveRes.body);
  if (resolved.dispute.status !== 'RESOLVED' || resolved.escrow.state !== 'REFUNDED_FULL') {
    throw new Error('Resolution failed: ' + resolveRes.body);
  }
  console.log('✓ Agent One-Click Resolution OK: Escrow REFUNDED_FULL, dispute RESOLVED');

  // 12. Reset to clean seed
  const resetRes = await app.inject({ method: 'POST', url: '/api/v1/demo/reset' });
  if (resetRes.statusCode !== 200) throw new Error('Reset failed');
  console.log('✓ /demo/reset OK');

  outbox.stop();
  console.log('--- ALL SMOKE TESTS PASSED! DISPUTEGUARD API READY TO WIN! ---');
}

runSmoke().catch((e) => {
  console.error('Smoke test failed:', e);
  process.exit(1);
});

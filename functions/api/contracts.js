export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) {
    return new Response(JSON.stringify({ error: '用户不存在' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // GET - get active contract
  if (request.method === 'GET') {
    const contract = await env.DB.prepare(
      'SELECT * FROM contracts WHERE pharmacy_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).bind(user.pharmacy_id).first();

    // Get score counts for both users
    if (contract) {
      const myCheckins = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM check_ins WHERE user_id = ? AND date >= ? AND status != 'missed'"
      ).bind(userId, contract.start_date).first();

      const partnerCheckins = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM check_ins WHERE user_id IN
         (SELECT id FROM users WHERE pharmacy_id = ? AND id != ?) AND date >= ? AND status != 'missed'`
      ).bind(user.pharmacy_id, userId, contract.start_date).first();

      contract.myScore = myCheckins.count || 0;
      contract.partnerScore = partnerCheckins.count || 0;
    }

    return new Response(JSON.stringify(contract), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // POST - create contract
  if (request.method === 'POST' && !url.pathname.endsWith('/settle')) {
    const data = await request.json();

    // Deactivate old contracts
    await env.DB.prepare('UPDATE contracts SET is_active = 0 WHERE pharmacy_id = ?')
      .bind(user.pharmacy_id).run();

    const contractId = crypto.randomUUID();
    const today = new Date().toISOString().split('T')[0];

    await env.DB.prepare(
      `INSERT INTO contracts (id, pharmacy_id, name, rules, settlement_type, punishment, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      contractId, user.pharmacy_id, data.name || '吃药契约',
      JSON.stringify(data.rules || { ontime: 10, late: 3, missed: -5, bonus: 20 }),
      data.settlementType || 'weekly', data.punishment || '', today, data.endDate || null
    ).run();

    return new Response(JSON.stringify({ id: contractId }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json' }
  });
}

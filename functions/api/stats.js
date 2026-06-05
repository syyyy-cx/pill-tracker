export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);
  const period = parseInt(url.searchParams.get('period') || '7');

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) {
    return new Response(JSON.stringify({ error: '用户不存在' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  const start = startDate.toISOString().split('T')[0];

  // Daily breakdown
  const daily = await env.DB.prepare(
    `SELECT date,
            COUNT(*) as total,
            SUM(CASE WHEN status='ontime' THEN 1 ELSE 0 END) as ontime,
            SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late,
            SUM(CASE WHEN status='missed' THEN 1 ELSE 0 END) as missed
     FROM check_ins WHERE user_id = ? AND date >= ?
     GROUP BY date ORDER BY date ASC`
  ).bind(userId, start).all();

  // Overall totals
  const totals = await env.DB.prepare(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN status='ontime' THEN 1 ELSE 0 END) as ontime,
            SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late,
            SUM(CASE WHEN status='missed' THEN 1 ELSE 0 END) as missed
     FROM check_ins WHERE user_id = ? AND date >= ?`
  ).bind(userId, start).first();

  return new Response(JSON.stringify({
    daily: daily.results,
    total: totals.total || 0,
    ontime: totals.ontime || 0,
    late: totals.late || 0,
    missed: totals.missed || 0,
    rate: totals.total > 0
      ? Math.round(((totals.ontime + totals.late) / totals.total) * 100)
      : 0
  }), { headers: { 'Content-Type': 'application/json' } });
}

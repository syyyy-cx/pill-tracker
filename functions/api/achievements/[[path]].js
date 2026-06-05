export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);

  // GET - list achievements
  if (request.method === 'GET') {
    const achievements = await env.DB.prepare(
      `SELECT a.*, ap.unlocked_at, ap.progress
       FROM achievements a
       LEFT JOIN achievement_progress ap ON a.id = ap.achievement_id AND ap.user_id = ?
       ORDER BY a.id`
    ).bind(userId).all();

    for (const ach of achievements.results) {
      const existing = await env.DB.prepare(
        'SELECT id FROM achievement_progress WHERE user_id = ? AND achievement_id = ?'
      ).bind(userId, ach.id).first();
      if (!existing) {
        await env.DB.prepare(
          'INSERT INTO achievement_progress (id, user_id, achievement_id, progress) VALUES (?, ?, ?, 0)'
        ).bind(crypto.randomUUID(), userId, ach.id).run();
        ach.progress = 0
      }
      if (ach.progress === null) ach.progress = 0
    }

    return new Response(JSON.stringify(achievements.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // POST /check - check and unlock achievements
  if (request.method === 'POST') {
    const user = await env.DB.prepare(
      'SELECT pharmacy_id FROM users WHERE id = ?'
    ).bind(userId).first();
    if (!user) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });

    const unlocked = []
    const achievements = await env.DB.prepare(
      `SELECT a.*, ap.unlocked_at, ap.id as progress_id
       FROM achievements a
       LEFT JOIN achievement_progress ap ON a.id = ap.achievement_id AND ap.user_id = ?
       ORDER BY a.id`
    ).bind(userId).all();

    // Get stats
    const allCheckins = await env.DB.prepare(
      "SELECT * FROM check_ins WHERE user_id = ? ORDER BY date DESC"
    ).bind(userId).all();

    const today = new Date().toISOString().split('T')[0];

    // Count distinct dates with checkins
    const checkinDates = [...new Set(allCheckins.results.map(c => c.date))].sort().reverse()
    const totalCheckins = allCheckins.results.length

    // Streak
    let streak = 0
    for (let i = 0; i < checkinDates.length; i++) {
      const expected = new Date()
      expected.setDate(expected.getDate() - i)
      const expectedDate = expected.toISOString().split('T')[0]
      if (checkinDates[i] === expectedDate) streak++
      else break
    }

    // Message checkins count
    const messageCount = allCheckins.results.filter(c => c.message && c.message !== '').length

    // Medicines count
    const medResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM medicines WHERE pharmacy_id = ? AND is_active = 1'
    ).bind(user.pharmacy_id).first();
    const medicineCount = medResult.count

    // Partner check-in today
    const partnerToday = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM check_ins WHERE user_id IN
       (SELECT id FROM users WHERE pharmacy_id = ? AND id != ?) AND date = ?`
    ).bind(user.pharmacy_id, userId, today).first();

    for (const ach of achievements.results) {
      if (ach.unlocked_at) continue // already unlocked

      let shouldUnlock = false

      switch (ach.id) {
        case 1: // 初次打卡
          shouldUnlock = totalCheckins > 0
          break
        case 2: // 连续 3 天
          shouldUnlock = streak >= 3
          break
        case 3: // 连续 7 天
          shouldUnlock = streak >= 7
          break
        case 4: // 连续 30 天
          shouldUnlock = streak >= 30
          break
        case 5: // 心有灵犀
          shouldUnlock = partnerToday.count > 0
          break
        case 6: // 药箱满满
          shouldUnlock = medicineCount >= 5
          break
        case 7: // 全勤战神（周）
          shouldUnlock = streak >= 7
          break
        case 8: // 全勤战神（月）
          shouldUnlock = streak >= 30
          break
        case 10: // 甜言蜜语
          shouldUnlock = messageCount >= 10
          break
      }

      if (shouldUnlock) {
        await env.DB.prepare(
          'UPDATE achievement_progress SET unlocked_at = datetime("now"), progress = 100 WHERE id = ?'
        ).bind(ach.progress_id).run()
        unlocked.push(ach.id)
      }
    }

    return new Response(JSON.stringify({ unlocked }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
}

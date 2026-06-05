
export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;

  // Get achievements with user's progress
  const achievements = await env.DB.prepare(
    `SELECT a.*, ap.unlocked_at, ap.progress
     FROM achievements a
     LEFT JOIN achievement_progress ap ON a.id = ap.achievement_id AND ap.user_id = ?
     ORDER BY a.id`
  ).bind(userId).all();

  // Auto-create progress entries for any missing achievements
  for (const ach of achievements.results) {
    if (ach.unlocked_at === null && ach.progress === undefined) {
      // Check if progress record exists at all
      const existing = await env.DB.prepare(
        'SELECT id FROM achievement_progress WHERE user_id = ? AND achievement_id = ?'
      ).bind(userId, ach.id).first();
      if (!existing) {
        await env.DB.prepare(
          'INSERT INTO achievement_progress (id, user_id, achievement_id, progress) VALUES (?, ?, ?, 0)'
        ).bind(crypto.randomUUID(), userId, ach.id).run();
        ach.progress = 0
      }
    }
    // Convert null to 0 for display
    if (ach.progress === null) ach.progress = 0
  }

  return new Response(JSON.stringify(achievements.results), {
    headers: { 'Content-Type': 'application/json' }
  });
}

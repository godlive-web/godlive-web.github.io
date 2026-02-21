export default async function handler(req, res) {
  // ========== 完全对齐 getBill.js 的 CORS 配置 ==========
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  // ======================================================

  res.setHeader('Content-Type', 'application/json');

  // 强化：解码中文参数
  let achievement = req.query.achievement;
  if (achievement) {
    achievement = decodeURIComponent(achievement);
  }

  const BADGE_DESC_MAP = {
    '蓝图画师': '秋风Auting的蓝图画师专属认证铭牌...',
    '官方合作画师': '秋风Auting的官方合作画师认证铭牌...',
    '神界创始人': '神界创始人的专属认证铭牌，为神界圈核心发起人。',
    '探索者': '神界阁新功能专属自定义成就铭牌...',
  };

  if (!achievement) {
    return res.status(400).json({ success: false, message: '请传入achievement参数' });
  }
  const desc = BADGE_DESC_MAP[achievement];
  if (!desc) {
    return res.status(404).json({ success: false, message: `未配置「${achievement}」的介绍文本` });
  }

  return res.status(200).json({
    success: true,
    data: { achievement: achievement, description: desc }
  });
}

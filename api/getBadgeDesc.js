export default async function handler(req, res) {
  // ========== 第一步：先处理CORS（必须在所有逻辑最前面） ==========
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    res.status(200).end();
    return;
  }

  // ========== 第二步：业务逻辑（强化中文参数） ==========
  res.setHeader('Content-Type', 'application/json');

  // 主动解码中文参数
  let achievement = req.query.achievement;
  if (achievement) {
    achievement = decodeURIComponent(achievement);
  }

  // 介绍配置（不变）
  const BADGE_DESC_MAP = {
    '蓝图画师': '秋风Auting的蓝图画师专属认证铭牌...',
    '官方合作画师': '秋风Auting的官方合作画师认证铭牌...',
    '神界创始人': '神界创始人的专属认证铭牌，为神界圈核心发起人。',
    '探索者': '神界阁新功能专属自定义成就铭牌...',
  };

  // 参数校验（不变）
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

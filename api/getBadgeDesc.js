export default async function handler(req, res) {
  // 【完整 CORS 配置，必须包含 OPTIONS 处理】
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 关键：处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 【下面的逻辑保持不变】
  const BADGE_DESC_MAP = {
    '蓝图画师': '秋风Auting的蓝图画师专属认证铭牌...',
    '官方合作画师': '秋风Auting的官方合作画师认证铭牌...',
    '神界创始人': '神界创始人的专属认证铭牌，为神界圈核心发起人。',
    '探索者': '神界阁新功能专属自定义成就铭牌...',
  };

  res.setHeader('Content-Type', 'application/json');

  const { achievement } = req.query;
  if (!achievement) {
    return res.status(400).json({
      success: false,
      message: '请传入achievement参数'
    });
  }

  try {
    const desc = BADGE_DESC_MAP[achievement];
    if (!desc) {
      return res.status(404).json({
        success: false,
        message: `未配置「${achievement}」的介绍文本`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        achievement: achievement,
        description: desc
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '获取铭牌介绍失败',
      error: error.message
    });
  }
}

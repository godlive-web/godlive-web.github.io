export default async function handler(req, res) {
  // ========== 第一步：先处理CORS（必须在所有逻辑最前面） ==========
  // 针对中文参数的GET请求，强化CORS配置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 处理OPTIONS预检（中文参数的GET请求，预检更严格）
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    res.status(200).end();
    return;
  }

  // ========== 第二步：业务逻辑（仅强化中文参数处理） ==========
  res.setHeader('Content-Type', 'application/json');

  // 强化：解码中文参数（防止编码/解码不一致）
  let achievement = req.query.achievement;
  if (achievement) {
    achievement = decodeURIComponent(achievement); // 主动解码一次
  }

  // 成就配置（不变）
  const ACHIEVEMENT_BRANCH_MAP = {
    '官方合作画师': 'file',
    '蓝图画师': 'file',
    '神界创始人': 'file',
    '探索者': 'file',
  };

  // 参数校验（不变）
  if (!achievement) {
    return res.status(400).json({ success: false, message: '请传入achievement参数' });
  }
  if (!ACHIEVEMENT_BRANCH_MAP[achievement]) {
    return res.status(404).json({ success: false, message: `未配置${achievement}的分支名` });
  }

  // 生成URL（不变）
  try {
    const branchName = ACHIEVEMENT_BRANCH_MAP[achievement];
    const fileName = `认证铭牌_${achievement}.png`;
    const encodedFileName = encodeURIComponent(fileName);
    const githubUrl = `https://raw.githubusercontent.com/godlive-web/godlive-web.github.io/${branchName}/authentication/${encodedFileName}`;

    return res.status(200).json({
      success: true,
      data: { outputUrl: githubUrl }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: '生成失败', error: error.message });
  }
}

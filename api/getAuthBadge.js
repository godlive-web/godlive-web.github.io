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

  const ACHIEVEMENT_BRANCH_MAP = {
    '官方合作画师': 'file',
    '蓝图画师': 'file',
    '神界创始人': 'file',
    '探索者': 'file',
  };

  if (!achievement) {
    return res.status(400).json({ success: false, message: '请传入achievement参数' });
  }
  if (!ACHIEVEMENT_BRANCH_MAP[achievement]) {
    return res.status(404).json({ success: false, message: `未配置${achievement}的分支名` });
  }

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

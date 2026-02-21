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
  const ACHIEVEMENT_BRANCH_MAP = {
    '官方合作画师': 'file',
    '蓝图画师': 'file',
    '神界创始人': 'file',
    '探索者': 'file',
  };

  const FILE_PREFIX = '认证铭牌_';
  const FOLDER_NAME = 'authentication';
  const REPO_PATH = 'godlive-web/godlive-web.github.io';

  res.setHeader('Content-Type', 'application/json');

  const { achievement } = req.query;
  if (!achievement) {
    return res.status(400).json({
      success: false,
      message: '请传入achievement参数'
    });
  }

  if (!ACHIEVEMENT_BRANCH_MAP[achievement]) {
    return res.status(404).json({
      success: false,
      message: `未配置${achievement}的分支名`
    });
  }

  try {
    const branchName = ACHIEVEMENT_BRANCH_MAP[achievement];
    const fileName = `${FILE_PREFIX}${achievement}.png`;
    const encodedFileName = encodeURIComponent(fileName);
    const githubUrl = `https://raw.githubusercontent.com/${REPO_PATH}/${branchName}/${FOLDER_NAME}/${encodedFileName}`;

    return res.status(200).json({
      success: true,
      data: {
        outputUrl: githubUrl
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '生成失败',
      error: error.message
    });
  }
}

export default async function handler(req, res) {
  // ======================
  // 【成就配置区：在这里添加新成就！】
  // 格式：'成就名称': '对应的分支哈希'
  // ======================
  const ACHIEVEMENT_BRANCH_MAP = {
    '官方合作画师': '57601267cc8cbe9818cae51156c2dfc7eedcc8a0',
    '蓝图画师': '57601267cc8cbe9818cae51156c2dfc7eedcc8a0',
    '神界创始人': '7a97aa3e509bad4b4ef687073904fb0526b3431d',
    '探索者': '02215998c75716fac0751b497101ee697df163ce',
    // 以后加新成就，就在这里加一行，比如：
    // '新成就名称': '对应的分支哈希',
  };

  // ======================
  // 【固定配置，无需修改】
  // ======================
  const FILE_PREFIX = '认证铭牌_';
  const FOLDER_NAME = 'authentication';
  const REPO_PATH = 'godlive-web/godlive-web.github.io';

  // ======================
  // 【核心逻辑，无需修改】
  // ======================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // 获取成就名称参数
  const { achievement } = req.query;
  if (!achievement) {
    return res.status(400).json({
      success: false,
      message: '请传入achievement参数，比如?achievement=神界创始人'
    });
  }

  // 检查成就是否已配置
  if (!ACHIEVEMENT_BRANCH_MAP[achievement]) {
    return res.status(404).json({
      success: false,
      message: `未配置${achievement}的分支哈希，请在ACHIEVEMENT_BRANCH_MAP中添加`
    });
  }

  try {
    // 自动生成铭牌URL
    const branchHash = ACHIEVEMENT_BRANCH_MAP[achievement];
    const fileName = `${FILE_PREFIX}${achievement}.png`;
    const encodedFileName = encodeURIComponent(fileName);
    const githubUrl = `https://github.com/${REPO_PATH}/blob/${branchHash}/${FOLDER_NAME}/${encodedFileName}`;

    return res.status(200).json({
      success: true,
      input: achievement,
      outputUrl: githubUrl
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '生成失败',
      error: error.message
    });
  }
}

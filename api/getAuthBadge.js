// api/getAuthBadge.js
export default async function handler(req, res) {
  // ======================
  // 【你只需要在这里加成就！】
  // 格式：'成就名称': '对应的分支哈希'
  // ======================
  const ACHIEVEMENT_BRANCH_MAP = {
    '官方合作画师': '57601267cc8cbe9818cae51156c2dfc7eedcc8a0', // 旧成就
    '蓝图画师': '57601267cc8cbe9818cae51156c2dfc7eedcc8a0',     // 旧成就
    '神界创始人': '7a97aa3e509bad4b4ef687073904fb0526b3431d',    // 新增成就（只加这行！）
    '探索者': '02215998c75716fac0751b497101ee697df163ce',
    // 以后加新成就，就在这里加一行，比如：
    // '新成就名称': '对应的分支哈希',
  };

  // ======================
  // 【以下固定配置，不用改】
  // ======================
  const FILE_PREFIX = '认证铭牌_'; // 文件名前缀
  const FOLDER_NAME = 'authentication'; // 文件夹名
  const REPO_PATH = 'godlive-web/godlive-web.github.io'; // 仓库路径

  // ======================
  // 【核心逻辑，不用改】
  // ======================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // 获取输入的成就名称
  const { achievement } = req.query;
  if (!achievement) {
    return res.status(400).json({ success: false, message: '请传入achievement参数，比如?achievement=神界创始人' });
  }

  // 检查是否有该成就的配置
  if (!ACHIEVEMENT_BRANCH_MAP[achievement]) {
    return res.status(404).json({ success: false, message: `未配置${achievement}的分支哈希，请在ACHIEVEMENT_BRANCH_MAP中添加` });
  }

  try {
    // 自动拼接URL（完全不用改）
    const branchHash = ACHIEVEMENT_BRANCH_MAP[achievement]; // 匹配对应分支哈希
    const fileName = `${FILE_PREFIX}${achievement}.png`;
    const encodedFileName = encodeURIComponent(fileName);
    const githubUrl = `https://github.com/${REPO_PATH}/blob/${branchHash}/${FOLDER_NAME}/${encodedFileName}`;

    return res.status(200).json({
      success: true,
      input: achievement,
      outputUrl: githubUrl // 生成你要的URL
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: '生成失败', error: error.message });
  }
}

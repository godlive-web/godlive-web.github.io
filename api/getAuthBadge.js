export default async function handler(req, res) {
  // ======================
  // 【成就配置区：只需要改成就名称，不用改哈希了！】
  // 格式：'成就名称': '存放图片的分支名'（比如file）
  // ======================
  const ACHIEVEMENT_BRANCH_MAP = {
    '官方合作画师': 'file',
    '蓝图画师': 'file',
    '神界创始人': 'file',
    '探索者': 'file',
    // 以后加新成就，只需要加：'新成就名称': 'file',
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
      message: `未配置${achievement}的分支名，请在ACHIEVEMENT_BRANCH_MAP中添加`
    });
  }

  try {
    // ✅ 关键修改：用分支名代替固定哈希
    const branchName = ACHIEVEMENT_BRANCH_MAP[achievement]; // 现在取分支名，不是哈希
    const fileName = `${FILE_PREFIX}${achievement}.png`;
    const encodedFileName = encodeURIComponent(fileName);
    // ✅ 新URL：raw.githubusercontent.com/仓库/分支名/文件夹/文件名
    const githubUrl = `https://raw.githubusercontent.com/${REPO_PATH}/${branchName}/${FOLDER_NAME}/${encodedFileName}`;

    // 返回成功结果
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

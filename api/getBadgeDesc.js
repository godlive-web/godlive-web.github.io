// api/getBadgeDesc.js - 铭牌名称→介绍文本转换API
export default async function handler(req, res) {
  // ======================
  // 【你只需要修改这里！】
  // 格式：'成就名称': '对应的介绍文本'
  // ======================
  const BADGE_DESC_MAP = {
    '蓝图画师': '秋风Auting的蓝图画师专属认证铭牌，负责秋风Auting的原始形象设计，对秋风Auting的个人形象享有署名权，并特别享有修改权、保护作品完整权和信息网络传播权。',
    '官方合作画师': '秋风Auting的官方合作画师认证铭牌，它意味着您已被授权为秋风Auting创作衍生形象内容，享有相关作品的署名权，但需遵守秋风Auting官方合作规范文档。有关合作详询请查阅秋风Auting官网合作中心的相关文件。',
    '神界创始人': '神界创始人的专属认证铭牌，为神界圈核心发起人。',
    '探索者': '神界阁新功能专属自定义成就铭牌，通过测试神界阁的新功能获取该铭牌。此后，您也将拥有优先体验新功能的资格。',
    // 新增成就介绍：直接加一行，比如
    // '新成就名称': '对应的介绍文本',
  };

  // ======================
  // 【以下代码完全不用改】
  // ======================
  // 跨域配置（和之前的API保持一致）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  // 获取输入的成就名称（比如：蓝图画师）
  const { achievement } = req.query;
  // 参数校验：未传入则返回错误
  if (!achievement) {
    return res.status(400).json({
      success: false,
      message: '请传入achievement参数，比如?achievement=蓝图画师'
    });
  }

  try {
    // 查找对应的介绍文本
    const desc = BADGE_DESC_MAP[achievement];
    // 未找到对应成就则返回404
    if (!desc) {
      return res.status(404).json({
        success: false,
        message: `未配置「${achievement}」的介绍文本，请在BADGE_DESC_MAP中添加`
      });
    }

    // 返回成功结果
    return res.status(200).json({
      success: true,
      data: {
        achievement: achievement, // 输入的成就名称
        description: desc         // 对应的介绍文本
      }
    });
  } catch (error) {
    // 异常处理
    return res.status(500).json({
      success: false,
      message: '获取铭牌介绍失败',
      error: error.message
    });
  }
}

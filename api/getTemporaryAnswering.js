export default async function handler(req, res) {
  // ========== CORS跨域配置 ==========
  const FRONTEND_ORIGIN = "https://godlive-web.github.io"; 
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end(); 
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // =================================

  try {
    // 配置GitHub仓库信息
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "godlive-web";
    const REPO_NAME = "godlive-web.github.io";
    const FILE_PATH = "EntryCircleQuestion_Bank/TemporaryAnswering.json";

    // 校验GitHub Token是否配置
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, msg: "服务器未配置GITHUB_TOKEN" });
    }

    // 从GitHub获取文件
    console.log(`开始获取文件：${FILE_PATH}`);
    const getFileRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    if (!getFileRes.ok) {
      if (getFileRes.status === 404) {
        // 文件不存在，返回空数组
        return res.status(200).json({ 
          success: true, 
          data: [],
          msg: "暂无匿名用户数据"
        });
      }
      const errorData = await getFileRes.json();
      console.error(`文件获取失败：${errorData.message}`);
      return res.status(500).json({ 
        success: false, 
        msg: `获取文件失败：${errorData.message}` 
      });
    }

    const fileData = await getFileRes.json();
    
    // 解码Base64内容
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    let data = [];
    try {
      data = JSON.parse(content);
      if (!Array.isArray(data)) {
        data = [];
      }
    } catch (e) {
      data = [];
    }

    console.log('获取匿名用户数据成功');
    return res.status(200).json({ 
      success: true, 
      data: data,
      msg: "获取成功"
    });

  } catch (error) {
    console.error("处理请求时发生错误：", error);
    return res.status(500).json({ 
      success: false, 
      msg: `服务器内部错误：${error.message}` 
    });
  }
}

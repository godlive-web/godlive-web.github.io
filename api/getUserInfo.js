export default async function handler(req, res) {
  // 跨域配置（支持前端域名）
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理OPTIONS预检请求
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // 🔴 修复1：参数名从 userid 改成 userId（和前端一致）
  const { userId } = req.query; 
  // 🔴 修复2：校验时用 userId 而不是 userid
  if (!userId || userId.trim() === '') {
    return res.status(400).json({
      success: false,
      msg: "请传入userId参数"
    });
  }

  // 环境变量校验
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN环境变量未配置");
    return res.status(500).json({
      success: false,
      msg: "服务器配置错误：GITHUB_TOKEN未设置"
    });
  }

  const OWNER = "godlive-web";
  const REPO = "godlive";
  // 🔴 修复3：文件路径里用 userId 而不是 userid
  const FILE_PATH = `data/usersdata/${userId}.json`; 

  try {
    // 请求GitHub文件
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    // 文件不存在处理
    if (!response.ok) {
      // 🔴 修复4：提示文字里用 userId
      return res.status(404).json({
        success: false,
        msg: `未找到用户信息文件（ID: ${userId}），请检查ID是否正确`,
      });
    }

    // 解析GitHub返回内容
    const data = await response.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");
    
    // 【关键】单独捕获JSON解析错误，精准返回原因
    let userData;
    try {
      userData = JSON.parse(content);
    } catch (jsonErr) {
      console.error("用户JSON文件解析失败:", jsonErr, "文件原始内容:", content);
      // 🔴 修复5：提示文字里用 userId
      return res.status(500).json({
        success: false,
        msg: `用户${userId}的JSON文件格式错误，请检查语法：${jsonErr.message}`
      });
    }

    // 正常返回数据
    res.status(200).json({
      success: true,
      data: userData,
    });

  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({
      success: false,
      msg: `服务器错误：${error.message}`,
    });
  }
}

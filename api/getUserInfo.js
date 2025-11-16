export default async function handler(req, res) {
  // ========== 新增：CORS跨域配置 ==========
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // ========================================

    // 新增：处理OPTIONS预检请求
  if (req.method === "OPTIONS") {
    res.status(204).end(); // 204表示成功且无内容
    return;
  }

  // 把 userID 改成 userId
  const { userId } = req.query; 
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = "godlive-web";
  const REPO = "godlive";
  // 把 userID 改成 userId
  const FILE_PATH = `data/usersdata/${userId}.json`; 

  try {
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      // 把 userID 改成 userId
      return res.status(404).json({
        success: false,
        msg: `未找到用户信息文件（ID: ${userId}），请检查ID是否正确`,
      });
    }

    const data = await response.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");
    const userData = JSON.parse(content);

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({
      success: false,
      msg: "服务器错误，请稍后重试",
    });
  }
}

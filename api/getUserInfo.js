export default async function handler(req, res) {
  const { userID } = req.query; // 从请求参数获取用户ID
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Vercel环境变量中配置的GitHub令牌
  const OWNER = "godlive-web"; // 仓库所有者
  const REPO = "godlive"; // 仓库名称
  const FILE_PATH = `data/usersdata/${userID}.json`; // 动态文件路径：ID.json

  try {
    // 调用GitHub API获取文件内容（Base64编码）
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`, // 身份验证
          Accept: "application/vnd.github.v3+json", // API版本
        },
      }
    );

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        msg: `未找到用户信息文件（ID: ${userID}），请检查ID是否正确`,
      });
    }

    const data = await response.json();
    // 解码Base64内容为JSON
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

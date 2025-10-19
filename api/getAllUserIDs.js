export default async function handler(req, res) {
  // CORS 配置（与 getUserInfo 保持一致）
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = "godlive-web";
  const REPO = "godlive";
  const FOLDER_PATH = "data/usersdata"; // 用户数据文件夹路径

  try {
    // 调用 GitHub API 获取目录下的所有文件（即所有 ID.json）
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FOLDER_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        msg: "未找到用户数据目录",
      });
    }

    const files = await response.json();
    // 提取所有文件名（如 "051809.json"）中的 ID（即 "051809"）
    const userIDs = files
      .filter(file => file.type === "file" && file.name.endsWith(".json"))
      .map(file => file.name.replace(".json", ""));

    res.status(200).json({
      success: true,
      data: userIDs, // 返回所有用户 ID 数组
    });
  } catch (error) {
    console.error("获取用户 ID 列表失败:", error);
    res.status(500).json({
      success: false,
      msg: "服务器错误，无法获取用户列表",
    });
  }
}

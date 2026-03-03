export default async function handler(req, res) {
  // CORS配置（允许所有域名访问，包括本地开发环境）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // 处理OPTIONS预检请求
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const { fileName, questions } = req.body;

    if (!fileName || !questions) {
      return res.status(400).json({ success: false, msg: "缺少必要参数" });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = "godlive-web";
    const REPO = "godlive-web.github.io";
    const FILE_PATH = `EntryCircleQuestion_Bank/${fileName}`;

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, msg: "服务器未配置GITHUB_TOKEN" });
    }

    // 获取当前文件
    const getFileRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    let fileSHA = null;
    if (getFileRes.ok) {
      const fileData = await getFileRes.json();
      fileSHA = fileData.sha;
    }

    // 更新文件
    const content = Buffer.from(JSON.stringify({ questions }, null, 2)).toString("base64");

    const updateRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `更新题库 ${fileName}`,
          content: content,
          sha: fileSHA,
          branch: "main"
        })
      }
    );

    if (updateRes.ok) {
      return res.status(200).json({ success: true, msg: "题库更新成功" });
    } else {
      const errorData = await updateRes.json();
      return res.status(500).json({ success: false, msg: `更新失败：${errorData.message}` });
    }
  } catch (err) {
    console.error("更新题库错误：", err);
    return res.status(500).json({ success: false, msg: `服务器错误：${err.message}` });
  }
}
export default async function handler(req, res) {
  // CORS配置
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    if (req.method === "GET") {
      // 获取题库数据
      const { type } = req.query; // type: 'K' or 'Z'

      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
      const REPO_OWNER = "godlive-web";
      const REPO_NAME = "godlive";
      const FILE_PATH = `EntryCircleQuestion_Bank/${type || 'K'}.json`;

      if (!GITHUB_TOKEN) {
        return res.status(500).json({ success: false, msg: "服务器未配置GITHUB_TOKEN" });
      }

      // 从GitHub获取文件
      const getFileRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );

      if (!getFileRes.ok) {
        if (getFileRes.status === 404) {
          return res.status(404).json({ success: false, msg: `题库文件不存在：${FILE_PATH}` });
        }
        const errorData = await getFileRes.json();
        return res.status(500).json({ success: false, msg: `获取文件失败：${errorData.message}` });
      }

      const fileData = await getFileRes.json();
      const content = Buffer.from(fileData.content, 'base64').toString('utf8');
      const questions = JSON.parse(content);

      return res.status(200).json({ success: true, data: questions });
    } else if (req.method === "POST") {
      // 更新题库数据
      const { fileName, questions } = req.body;

      if (!fileName || !questions) {
        return res.status(400).json({ success: false, msg: "缺少必要参数" });
      }

      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
      const OWNER = "godlive-web";
      const REPO = "godlive";
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
    } else {
      return res.status(405).json({ success: false, msg: "不支持的请求方法" });
    }
  } catch (err) {
    console.error("处理题库错误：", err);
    return res.status(500).json({ success: false, msg: `服务器错误：${err.message}` });
  }
}
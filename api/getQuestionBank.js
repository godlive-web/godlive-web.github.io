export default async function handler(req, res) {
  // CORS配置
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

  try {
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
  } catch (error) {
    console.error("获取题库失败：", error);
    return res.status(500).json({ success: false, msg: `服务器内部错误：${error.message}` });
  }
}
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  // 配置CORS，允许前端域名访问
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN, // 从Vercel环境变量读取GitHub令牌
    });

    const owner = "godlive-web";
    const repo = "godlive";
    const path = "data/bill.json";

    // 调用GitHub API获取私密仓库的文件内容
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: "main", // 仓库分支（如main/master）
    });

    // 解码Base64内容并返回
    const content = Buffer.from(data.content, "base64").toString("utf8");
    const bills = JSON.parse(content);

    res.status(200).json(bills);
  } catch (error) {
    console.error("获取bill.json失败:", error);
    res.status(500).json({ error: "无法获取议案数据，请稍后再试" });
  }
}

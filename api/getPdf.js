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
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: "缺少PDF文件URL参数" });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN, // 从Vercel环境变量读取GitHub令牌
    });

    // 解析GitHub文件URL
    const urlParts = url.match(/https:\/\/(raw\.)?githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
    if (!urlParts) {
      return res.status(400).json({ error: "无效的GitHub文件URL" });
    }

    const [, , owner, repo, ref, path] = urlParts;

    // 调用GitHub API获取文件内容
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    // 解码Base64内容
    const pdfContent = Buffer.from(data.content, "base64");

    // 设置响应头，返回PDF文件
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=document.pdf");
    res.status(200).send(pdfContent);
  } catch (error) {
    console.error("获取PDF文件失败:", error);
    res.status(500).json({ error: "无法获取PDF文件，请稍后再试" });
  }
}

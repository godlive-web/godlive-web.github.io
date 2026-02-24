import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  // 配置CORS，允许所有域名访问（因为需要支持外部预览服务）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Origin");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: "缺少PDF文件URL参数" });
    }

    console.log('接收到的PDF URL:', url);

    // 检查环境变量
    if (!process.env.GITHUB_TOKEN) {
      console.error('GitHub Token未配置');
      return res.status(500).json({ error: "服务器配置错误，GitHub Token未配置" });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // 解析GitHub文件URL
    const urlParts = url.match(/https:\/\/(raw\.)?githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
    if (!urlParts) {
      console.error('URL解析失败:', url);
      return res.status(400).json({ error: "无效的GitHub文件URL" });
    }

    const [, , owner, repo, ref, path] = urlParts;
    console.log('解析后的参数:', { owner, repo, ref, path });

    try {
      // 调用GitHub API获取文件内容
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      // 检查返回数据
      if (!data || !data.content) {
        console.error('文件内容获取失败:', data);
        return res.status(500).json({ error: "文件内容获取失败" });
      }

      // 解码Base64内容
      const pdfContent = Buffer.from(data.content, "base64");
      console.log('PDF文件获取成功，大小:', pdfContent.length, '字节');

      // 设置响应头，返回PDF文件
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=document.pdf");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Origin");
      res.status(200).send(pdfContent);
    } catch (octokitError) {
      console.error('GitHub API调用失败:', octokitError);
      console.error('错误详情:', octokitError.message);
      console.error('错误状态:', octokitError.status);
      res.status(500).json({ error: "GitHub API调用失败", details: octokitError.message });
    }
  } catch (error) {
    console.error("获取PDF文件失败:", error);
    console.error('错误详情:', error.message);
    res.status(500).json({ error: "无法获取PDF文件，请稍后再试", details: error.message });
  }
}

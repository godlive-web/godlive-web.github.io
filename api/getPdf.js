import { Octokit } from '@octokit/rest';

// 内存缓存（适合Serverless环境，函数执行期间有效）
const memoryCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时缓存

export default async function handler(req, res) {
  // 配置CORS，允许所有域名访问
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

    // 检查内存缓存
    const cacheKey = url;
    const cachedItem = memoryCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedItem && (now - cachedItem.timestamp) < CACHE_EXPIRY) {
      console.log('使用内存缓存的PDF文件');
      // 设置响应头，返回缓存的PDF文件
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=document.pdf");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 客户端缓存24小时
      res.setHeader("X-Cache", "HIT");
      res.status(200).send(cachedItem.content);
      return;
    }

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

    const [, , owner, repo, ref, filePath] = urlParts;
    console.log('解析后的参数:', { owner, repo, ref, filePath });

    try {
      console.log('准备调用GitHub API:', { owner, repo, path: filePath, ref });
      console.log('GitHub Token配置状态:', process.env.GITHUB_TOKEN ? '已配置' : '未配置');
      
      // 调用GitHub API获取文件内容
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref,
      });

      console.log('GitHub API调用成功，返回数据类型:', typeof data);
      
      // 检查返回数据
      if (!data || !data.content) {
        console.error('文件内容获取失败:', data);
        return res.status(500).json({ error: "文件内容获取失败", details: JSON.stringify(data) });
      }

      console.log('文件内容存在，编码类型:', data.encoding);
      
      // 解码Base64内容
      const pdfContent = Buffer.from(data.content, "base64");
      console.log('PDF文件获取成功，大小:', pdfContent.length, '字节');

      // 保存到内存缓存
      memoryCache.set(cacheKey, {
        content: pdfContent,
        timestamp: now
      });

      // 设置响应头，返回PDF文件
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=document.pdf");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 客户端缓存24小时
      res.setHeader("X-Cache", "MISS");
      res.status(200).send(pdfContent);
    } catch (octokitError) {
      console.error('GitHub API调用失败:', octokitError);
      console.error('错误详情:', octokitError.message);
      console.error('错误状态:', octokitError.status);
      console.error('错误完整信息:', JSON.stringify(octokitError));
      
      // 分类处理不同类型的错误
      if (octokitError.status === 401) {
        res.status(401).json({ error: "GitHub Token认证失败", details: "Token无效或权限不足" });
      } else if (octokitError.status === 403) {
        res.status(403).json({ error: "访问权限不足", details: "Token没有访问该私有仓库的权限" });
      } else if (octokitError.status === 404) {
        res.status(404).json({ error: "文件不存在", details: `无法找到文件: ${filePath}` });
      } else {
        res.status(500).json({ error: "GitHub API调用失败", details: octokitError.message });
      }
    }
  } catch (error) {
    console.error("获取PDF文件失败:", error);
    console.error('错误详情:', error.message);
    res.status(500).json({ error: "无法获取PDF文件，请稍后再试", details: error.message });
  }
}

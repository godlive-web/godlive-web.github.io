import { Octokit } from '@octokit/rest';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// 缓存目录
const CACHE_DIR = path.join(process.cwd(), 'cache');

// 确保缓存目录存在
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('创建缓存目录失败:', error);
  }
}

// 生成缓存文件名
function generateCacheKey(url) {
  return createHash('md5').update(url).digest('hex') + '.pdf';
}

// 检查缓存是否存在
async function checkCache(url) {
  const cacheKey = generateCacheKey(url);
  const cachePath = path.join(CACHE_DIR, cacheKey);
  
  try {
    const stats = await fs.stat(cachePath);
    // 检查缓存是否在24小时内
    const now = Date.now();
    const cacheTime = stats.mtime.getTime();
    const cacheAge = now - cacheTime;
    const maxCacheAge = 24 * 60 * 60 * 1000; // 24小时
    
    if (cacheAge < maxCacheAge) {
      console.log('使用缓存的PDF文件:', cachePath);
      return await fs.readFile(cachePath);
    } else {
      // 缓存过期，删除
      await fs.unlink(cachePath);
      return null;
    }
  } catch (error) {
    // 缓存不存在或读取失败
    return null;
  }
}

// 保存到缓存
async function saveToCache(url, content) {
  const cacheKey = generateCacheKey(url);
  const cachePath = path.join(CACHE_DIR, cacheKey);
  
  try {
    await fs.writeFile(cachePath, content);
    console.log('PDF文件已缓存:', cachePath);
  } catch (error) {
    console.error('保存缓存失败:', error);
  }
}

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

    // 确保缓存目录存在
    await ensureCacheDir();

    // 检查缓存
    const cachedContent = await checkCache(url);
    if (cachedContent) {
      // 设置响应头，返回缓存的PDF文件
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=document.pdf");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Origin");
      res.setHeader("X-Cache", "HIT");
      res.status(200).send(cachedContent);
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

      // 保存到缓存
      await saveToCache(url, pdfContent);

      // 设置响应头，返回PDF文件
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=document.pdf");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Origin");
      res.setHeader("X-Cache", "MISS");
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

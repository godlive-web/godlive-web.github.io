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

    console.log('接收到的PDF URL:', url);
    
    // 直接使用fetch获取原始PDF文件
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/octet-stream'
      }
    });

    if (!response.ok) {
      console.error('获取PDF文件失败，状态码:', response.status);
      return res.status(500).json({ 
        error: "无法获取PDF文件",
        status: response.status,
        url: url
      });
    }

    // 获取PDF内容
    const pdfContent = await response.buffer();
    console.log('PDF文件获取成功，大小:', pdfContent.length, '字节');

    // 设置响应头，返回PDF文件
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=document.pdf");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(pdfContent);
  } catch (error) {
    console.error("获取PDF文件失败:", error);
    console.error("错误详情:", error.message);
    console.error("错误堆栈:", error.stack);
    res.status(500).json({ 
      error: "无法获取PDF文件，请稍后再试",
      details: error.message,
      url: url
    });
  }
}

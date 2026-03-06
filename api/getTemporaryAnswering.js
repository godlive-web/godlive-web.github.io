export default async function handler(req, res) {
  // ========== CORS跨域配置 ==========
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
  // =================================

  try {
    // 配置GitHub仓库信息
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "godlive-web";
    const REPO_NAME = "godlive";
    const FILE_PATH = "data/EntryCircleQuestion_Bank/TemporaryAnswering.json";

    // 校验GitHub Token是否配置
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, msg: "服务器未配置GITHUB_TOKEN" });
    }

    if (req.method === "GET") {
      // 从GitHub获取文件
      console.log(`开始获取文件：${FILE_PATH}`);
      const getFileRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );

      if (!getFileRes.ok) {
        if (getFileRes.status === 404) {
          // 文件不存在，返回空数组
          return res.status(200).json({ 
            success: true, 
            data: [],
            msg: "暂无匿名用户数据"
          });
        }
        const errorData = await getFileRes.json();
        console.error(`文件获取失败：${errorData.message}`);
        return res.status(500).json({ 
          success: false, 
          msg: `获取文件失败：${errorData.message}` 
        });
      }

      const fileData = await getFileRes.json();
      
      // 解码Base64内容
      const content = Buffer.from(fileData.content, 'base64').toString('utf8');
      let data = [];
      try {
        data = JSON.parse(content);
        if (!Array.isArray(data)) {
          data = [];
        }
      } catch (e) {
        data = [];
      }

      console.log('获取匿名用户数据成功');
      return res.status(200).json({ 
        success: true, 
        data: data,
        msg: "获取成功"
      });
    } else if (req.method === "POST") {
      // 更新临时用户数据
      const { 虚拟用户, 密钥, 使用题库 } = req.body;
      
      if (!虚拟用户 || !密钥) {
        return res.status(400).json({ success: false, msg: "缺少虚拟用户或密钥" });
      }
      
      // 从GitHub获取文件
      const getFileRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );
      
      let currentData = [];
      let fileSHA = null;
      
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        fileSHA = fileData.sha;
        try {
          const content = Buffer.from(fileData.content, 'base64').toString('utf8');
          currentData = JSON.parse(content);
          if (!Array.isArray(currentData)) {
            currentData = [];
          }
        } catch (e) {
          currentData = [];
        }
      } else if (getFileRes.status === 404) {
        console.log('文件不存在，将创建新文件');
      } else {
        const errorData = await getFileRes.json();
        console.error(`文件获取失败：${errorData.message}`);
        return res.status(500).json({ 
          success: false, 
          msg: `获取文件失败：${errorData.message}` 
        });
      }
      
      // 查找并更新用户
      const existingIndex = currentData.findIndex(
        item => item.虚拟用户 === 虚拟用户 && item.密钥 === 密钥
      );
      
      if (existingIndex >= 0) {
        currentData[existingIndex] = {
          ...currentData[existingIndex],
          使用题库: 使用题库 || currentData[existingIndex].使用题库
        };
      } else {
        currentData.push({
          虚拟用户,
          密钥,
          使用题库: 使用题库 || ''
        });
      }
      
      // 编码为Base64
      const newContent = Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64');
      
      const updateBody = {
        message: `更新匿名用户答题数据：${虚拟用户}`,
        content: newContent,
        branch: "main"
      };
      
      if (fileSHA) {
        updateBody.sha = fileSHA;
      }
      
      // 提交到GitHub
      const updateRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updateBody)
        }
      );
      
      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        console.error(`文件更新失败：${errorData.message}`);
        return res.status(500).json({ 
          success: false, 
          msg: `GitHub更新失败：${errorData.message}` 
        });
      }
      
      console.log('更新匿名用户数据成功');
      return res.status(200).json({ 
        success: true, 
        msg: "保存成功",
        data: currentData
      });
    } else {
      return res.status(405).json({ success: false, msg: "不支持的请求方法" });
    }

  } catch (error) {
    console.error("处理请求时发生错误：", error);
    return res.status(500).json({ 
      success: false, 
      msg: `服务器内部错误：${error.message}` 
    });
  }
}

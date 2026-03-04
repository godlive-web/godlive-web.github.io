// 新增：Unicode兼容的Base64工具函数（处理中文等特殊字符）
function utf8ToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}

export default async function handler(req, res) {
  // ========== CORS跨域配置 ==========
  const FRONTEND_ORIGIN = "https://godlive-web.github.io"; 
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end(); 
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // =================================

  try {
    // 1. 从请求体获取匿名用户数据
    const { 虚拟用户, 密钥, 使用题库 } = req.body;
    
    // 校验：必须传递必要字段
    if (!虚拟用户 || !密钥) {
      return res.status(400).json({ success: false, msg: "缺少虚拟用户或密钥" });
    }

    // 2. 配置GitHub仓库信息
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "godlive-web";
    const REPO_NAME = "godlive-web.github.io";
    const FILE_PATH = "EntryCircleQuestion_Bank/TemporaryAnswering.json";

    // 3. 校验GitHub Token是否配置
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, msg: "服务器未配置GITHUB_TOKEN" });
    }

    // 4. 从GitHub获取当前文件
    console.log(`开始获取文件：${FILE_PATH}`);
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
        const content = b64ToUtf8(fileData.content);
        currentData = JSON.parse(content);
        if (!Array.isArray(currentData)) {
          currentData = [];
        }
      } catch (e) {
        currentData = [];
      }
    } else if (getFileRes.status === 404) {
      // 文件不存在，创建新文件
      console.log('文件不存在，将创建新文件');
    } else {
      const errorData = await getFileRes.json();
      console.error(`文件获取失败：${errorData.message}`);
      return res.status(500).json({ 
        success: false, 
        msg: `获取文件失败：${errorData.message}` 
      });
    }

    // 5. 检查是否已存在相同的虚拟用户和密钥组合
    const existingIndex = currentData.findIndex(
      item => item.虚拟用户 === 虚拟用户 && item.密钥 === 密钥
    );

    if (existingIndex >= 0) {
      // 更新现有记录
      currentData[existingIndex] = {
        ...currentData[existingIndex],
        使用题库: 使用题库 || currentData[existingIndex].使用题库
      };
    } else {
      // 添加新记录
      currentData.push({
        虚拟用户,
        密钥,
        使用题库: 使用题库 || ''
      });
    }

    // 6. 提交更新到GitHub
    console.log(`开始更新文件：${FILE_PATH}`);
    const newContent = utf8ToB64(JSON.stringify(currentData, null, 2));
    
    const updateBody = {
      message: `更新匿名用户答题数据：${虚拟用户}`,
      content: newContent,
      branch: "main"
    };
    
    if (fileSHA) {
      updateBody.sha = fileSHA;
    }

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

    console.log('匿名用户数据更新成功');
    return res.status(200).json({ 
      success: true, 
      msg: "保存成功",
      data: currentData
    });

  } catch (error) {
    console.error("处理请求时发生错误：", error);
    return res.status(500).json({ 
      success: false, 
      msg: `服务器内部错误：${error.message}` 
    });
  }
}

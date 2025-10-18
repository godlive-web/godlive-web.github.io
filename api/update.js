// 新增：Unicode兼容的Base64工具函数（处理中文等特殊字符）
function utf8ToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}

export default async function handler(req, res) {
  // ========== CORS跨域配置（保留，确保前端能正常请求） ==========
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
  // ==============================================================

  try {
    // 1. 从请求体获取用户ID（关键：用于定位对应的ID.json文件）和修改的信息
    const { userID, 自设名称, 账号名称, 模糊住址, 出生日期, 个人介绍 } = req.body;
    
    // 校验：必须传递userID，否则无法定位文件
    if (!userID) {
      return res.status(400).json({ success: false, msg: "缺少用户ID，无法修改信息" });
    }

    // 2. 配置GitHub仓库信息（根据实际路径修改）
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const PRIVATE_REPO_OWNER = "godlive-web"; // 仓库所有者
    const PRIVATE_REPO_NAME = "godlive"; // 仓库名称
    const JSON_FILE_PATH = `data/usersdata/${userID}.json`; // 动态路径：ID.json（和你的文件存放路径一致）

    // 3. 校验GitHub Token是否配置
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, msg: "服务器未配置GITHUB_TOKEN" });
    }

    // 4. 从GitHub获取当前用户的ID.json文件（含SHA值，用于后续更新）
    console.log(`开始获取文件：${JSON_FILE_PATH}`);
    const getFileRes = await fetch(
      `https://api.github.com/repos/${PRIVATE_REPO_OWNER}/${PRIVATE_REPO_NAME}/contents/${JSON_FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    // 处理文件不存在的情况（如用户ID错误）
    if (!getFileRes.ok) {
      const errorData = await getFileRes.json();
      console.error(`文件获取失败：${errorData.message}`);
      return res.status(404).json({ 
        success: false, 
        msg: `未找到用户信息文件（ID: ${userID}），请检查ID是否正确` 
      });
    }

    const fileData = await getFileRes.json();
    const fileSHA = fileData.sha; // 文件的SHA值，更新时必须传递

    // 5. 解析当前文件内容（使用Unicode兼容的Base64解码）
    const currentContent = b64ToUtf8(fileData.content); // 替换原有atob
    const currentData = JSON.parse(currentContent);
    console.log(`当前文件内容：`, currentData);

    // 6. 合并新信息（保留原有字段，仅覆盖修改的字段）
    const newData = {
      ...currentData, // 保留原有所有字段（如user、入圈时间、账号状态等）
      // 仅更新前端传递的字段（若前端未填则保留原值）
      自设名称: 自设名称 || currentData.自设名称,
      账号名称: 账号名称 || currentData.账号名称,
      模糊住址: 模糊住址 || currentData.模糊住址,
      出生日期: 出生日期 || currentData.出生日期,
      个人介绍: 个人介绍 || currentData.个人介绍
    };

    // 7. 提交更新到GitHub（使用Unicode兼容的Base64编码）
    console.log(`开始更新文件：${JSON_FILE_PATH}`);
    const updateRes = await fetch(
      `https://api.github.com/repos/${PRIVATE_REPO_OWNER}/${PRIVATE_REPO_NAME}/contents/${JSON_FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `更新用户${userID}的个人信息`, // 提交说明（方便查看历史）
          content: utf8ToB64(JSON.stringify(newData, null, 2)), // 替换原有btoa
          sha: fileSHA, // 必须传递原文件的SHA，否则会冲突
          branch: "main" // 仓库主分支（根据实际分支名修改）
        })
      }
    );

    // 8. 处理更新结果
    if (updateRes.ok) {
      console.log(`文件${JSON_FILE_PATH}更新成功`);
      return res.status(200).json({ 
        success: true, 
        msg: "个人信息修改成功！" 
      });
    } else {
      const errorData = await updateRes.json();
      console.error(`文件更新失败：${errorData.message}`);
      return res.status(500).json({ 
        success: false, 
        msg: `修改失败：${errorData.message}` 
      });
    }

  } catch (err) {
    // 捕获所有异常（如网络错误、JSON解析错误等）
    console.error("更新函数执行错误：", err);
    return res.status(500).json({ 
      success: false, 
      msg: `服务器错误：${err.message}` 
    });
  }
}

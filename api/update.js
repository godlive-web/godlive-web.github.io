// 新增：Unicode兼容的Base64工具函数
function utf8ToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}

export default async function handler(req, res) {
  // ========== 原有CORS跨域配置（保留） ==========
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
  // ==============================================

  const { 自设名称, 账号名称, 模糊住址, 出生日期, 个人介绍 } = req.body;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const PRIVATE_REPO_OWNER = "godlive-web";
  const PRIVATE_REPO_NAME = "godlive";
  const JSON_FILE_PATH = "user-info.json"; 

  try {
    console.log('收到的请求体：', req.body); 
    console.log('GITHUB_TOKEN是否存在：', !!process.env.GITHUB_TOKEN); 
    const getFileRes = await fetch(
      `https://api.github.com/repos/${PRIVATE_REPO_OWNER}/${PRIVATE_REPO_NAME}/contents/${JSON_FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    const fileData = await getFileRes.json();
    const fileSHA = fileData.sha;

    // 替换原有atob → 使用b64ToUtf8
    const currentData = JSON.parse(b64ToUtf8(fileData.content));

    const newData = {
      ...currentData,
      自设名称: 自设名称 || currentData.自设名称,
      账号名称: 账号名称 || currentData.账号名称,
      模糊住址: 模糊住址 || currentData.模糊住址,
      出生日期: 出生日期 || currentData.出生日期,
      个人介绍: 个人介绍 || currentData.个人介绍
    };

    const updateRes = await fetch(
      `https://api.github.com/repos/${PRIVATE_REPO_OWNER}/${PRIVATE_REPO_NAME}/contents/${JSON_FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: "更新个人信息",
          // 替换原有btoa → 使用utf8ToB64
          content: utf8ToB64(JSON.stringify(newData, null, 2)),
          sha: fileSHA
        })
      }
    );

    res.status(updateRes.ok ? 200 : 500).json({
      success: updateRes.ok,
      msg: updateRes.ok ? "个人信息修改成功！" : "修改失败，请检查日志"
    });
  } catch (err) {
    console.error('函数执行时发生错误：', err); 
    res.status(500).json({ success: false, msg: `函数错误：${err.message}` });
  }
}

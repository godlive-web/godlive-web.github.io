// api/update.js（适配你的个人信息字段，不用改）
export default async function handler(req, res) {
  // 接收前端传递的新数据（和你的个人信息字段对应）
  const { 自设名称, 账号名称, 模糊住址, 出生日期, 个人介绍 } = req.body;

  // 你的仓库配置（已填好，不用改）
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const PRIVATE_REPO_OWNER = "godlive-web";
  const PRIVATE_REPO_NAME = "godlive";
  const JSON_FILE_PATH = "user-info.json"; // 和你私密仓库的JSON文件名一致，不用改

  try {
    console.log('收到的请求体：', req.body); // 打印前端传过来的参数
    console.log('GITHUB_TOKEN是否存在：', !!process.env.GITHUB_TOKEN); // 检查环境变量是否配置
    // 1. 获取私密仓库中JSON文件的SHA值（不用懂）
    const getFileRes = await fetch(
      `https://api.github.com/repos/${PRIVATE_REPO_OWNER}/${PRIVATE_REPO_NAME}/contents/${JSON_FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    const fileData = await getFileRes.json();
    const fileSHA = fileData.sha;

    // 2. 读取当前JSON的原始数据（保留固定的ID，不用懂）
    const currentData = JSON.parse(atob(fileData.content));

    // 3. 合并新数据（保留ID，更新其他字段，不用懂）
    const newData = {
      ...currentData,
      自设名称: 自设名称 || currentData.自设名称,
      账号名称: 账号名称 || currentData.账号名称,
      模糊住址: 模糊住址 || currentData.模糊住址,
      出生日期: 出生日期 || currentData.出生日期,
      个人介绍: 个人介绍 || currentData.个人介绍
    };

    // 4. 调用GitHub API修改数据（不用懂）
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
          content: btoa(JSON.stringify(newData, null, 2)),
          sha: fileSHA
        })
      }
    );

    res.status(updateRes.ok ? 200 : 500).json({
      success: updateRes.ok,
      msg: updateRes.ok ? "个人信息修改成功！" : "修改失败，请检查日志"
    });
  } catch (err) {
    console.error('函数执行时发生错误：', err); // 打印具体错误信息
    res.status(500).json({ success: false, msg: `函数错误：${err.message}` });
  }
}

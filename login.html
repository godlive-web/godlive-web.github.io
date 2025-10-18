// 1. 需先在Vercel项目根目录执行 npm install bcrypt，再提交package.json和node_modules
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  // 全局CORS配置：所有响应都必须设置！
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检请求（OPTIONS）
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // 接收前端参数：username是用户输入的“纯ID”（无.json后缀）
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, msg: "账号ID和密码不能为空" });
  }

  // GitHub仓库配置
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "godlive-web";
  const REPO_NAME = "godlive";
  const USER_DIR_PATH = "data/usersdata"; // 用户文件目录（main分支）
  const BRANCH = "main";

  try {
    // 中文ID编码处理（若账号是中文，编码后匹配GitHub的中文文件名）
    const encodedUsername = encodeURIComponent(username);
    // 关键修改：自动为账号拼接`.json`后缀，匹配仓库中`ID.json`格式的文件
    const usernameWithSuffix = `${username}.json`;
    const encodedUsernameWithSuffix = `${encodedUsername}.json`;

    // 调用GitHub API，获取usersdata目录下的所有文件列表
    const fileListRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${USER_DIR_PATH}?ref=${BRANCH}`,
      { 
        headers: { 
          Authorization: `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json"
        } 
      }
    );

    if (!fileListRes.ok) {
      const errData = await fileListRes.json();
      throw new Error(`获取用户列表失败：${errData.message || "GitHub API请求错误"}`);
    }

    const fileList = await fileListRes.json();

    // 匹配文件：文件名=纯ID + .json（如051809.json）
    const targetFile = fileList.find(file => {
      return file.name === usernameWithSuffix || file.name === encodedUsernameWithSuffix;
    });

    // 无匹配文件 → 账号ID不存在
    if (!targetFile) {
      return res.status(401).json({ success: false, msg: "账号ID不存在，请检查输入" });
    }

    // 读取用户文件内容（解析你的JSON结构）
    const fileContentRes = await fetch(targetFile.download_url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const fileContentText = await fileContentRes.text();
    let userInfo;
    try {
      userInfo = JSON.parse(fileContentText); // 解析你的JSON（含“账号密码”字段）
    } catch (parseErr) {
      throw new Error(`用户文件格式错误：${parseErr.message}（需为标准JSON）`);
    }

    // 验证密码（匹配你的JSON里的“账号密码”字段）
    if (!userInfo.账号密码) {
      throw new Error("用户文件中缺少“账号密码”字段");
    }
    const isPwdValid = await bcrypt.compare(password, userInfo.账号密码);
    if (!isPwdValid) {
      return res.status(401).json({ success: false, msg: "密码错误，请重新输入" });
    }

    // 验证账号状态
    const accountStatus = Number(userInfo.账号状态) || 0;
    if (accountStatus !== 0) {
      return res.status(403).json({ 
        success: false, 
        msg: `账号状态异常（状态码：${accountStatus}），请联系秋风处理` 
      });
    }

    // 登录成功：剔除敏感字段
    const { "账号密码": _, ...safeUserInfo } = userInfo;
    return res.status(200).json({
      success: true,
      msg: "登录成功",
      userInfo: { ...safeUserInfo, user: username }
    });

  } catch (err) {
    console.error("Vercel登录函数错误：", err);
    return res.status(500).json({ 
      success: false, 
      msg: `服务器错误：${err.message || "请联系管理员检查配置"}` 
    });
  }
}

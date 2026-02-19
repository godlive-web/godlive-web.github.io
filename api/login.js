// 1. 需先在Vercel项目根目录执行 npm install bcrypt，再提交package.json和package-lock.json
//    （无需提交node_modules，Vercel会自动安装依赖）
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  // ====================== 全局CORS配置（必须保留） ======================
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理浏览器预检请求（OPTIONS），必须优先处理
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // ====================== 接收前端传入的登录参数 ======================
  // username：用户输入的纯ID（如 051809，无.json后缀）
  // password：用户输入的密码
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      msg: "账号ID和密码不能为空" 
    });
  }

  // ====================== GitHub仓库配置（无需修改） ======================
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Vercel环境变量中配置的GitHub Token
  const REPO_OWNER = "godlive-web"; // 仓库所有者
  const REPO_NAME = "godlive"; // 仓库名称
  const USER_DIR_PATH = "data/usersdata"; // 用户JSON文件存放目录（main分支）
  const BRANCH = "main"; // 分支名

  try {
    // ====================== 处理中文ID的编码问题 ======================
    const encodedUsername = encodeURIComponent(username); // 中文ID编码（如“张三”→%E5%BC%A0%E4%B8%89）
    const usernameWithSuffix = `${username}.json`; // 拼接.json后缀（如 051809.json）
    const encodedUsernameWithSuffix = `${encodedUsername}.json`; // 编码后的文件名（如 %E5%BC%A0%E4%B8%89.json）

    // ====================== 调用GitHub API获取用户文件列表 ======================
    const fileListRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${USER_DIR_PATH}?ref=${BRANCH}`,
      { 
        headers: { 
          Authorization: `token ${GITHUB_TOKEN}`, // 验证GitHub Token
          "Accept": "application/vnd.github.v3+json"
        } 
      }
    );

    // 检查GitHub API请求是否成功
    if (!fileListRes.ok) {
      const errData = await fileListRes.json();
      throw new Error(`获取用户列表失败：${errData.message || "GitHub API请求错误"}`);
    }

    const fileList = await fileListRes.json(); // 解析文件列表

    // ====================== 匹配用户对应的JSON文件 ======================
    const targetFile = fileList.find(file => {
      // 匹配：原文件名（如 051809.json） 或 编码后的文件名（如 %E5%BC%A0%E4%B8%89.json）
      return file.name === usernameWithSuffix || file.name === encodedUsernameWithSuffix;
    });

    // 未找到匹配文件 → 账号ID不存在
    if (!targetFile) {
      return res.status(401).json({ 
        success: false, 
        msg: "账号ID不存在，请检查输入" 
      });
    }

    // ====================== 读取并解析用户JSON文件内容 ======================
    const fileContentRes = await fetch(targetFile.download_url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const fileContentText = await fileContentRes.text(); // 获取文件原始文本
    
    let userInfo;
    try {
      userInfo = JSON.parse(fileContentText); // 解析为JSON对象（包含所有用户字段：认证成就、自设名称等）
    } catch (parseErr) {
      throw new Error(`用户文件格式错误：${parseErr.message}（需为标准JSON格式）`);
    }

    // ====================== 验证密码 ======================
    if (!userInfo.账号密码) {
      throw new Error("用户JSON文件中缺少「账号密码」字段，请检查文件格式");
    }
    // 对比用户输入的密码 和 GitHub中存储的加密密码
    const isPwdValid = await bcrypt.compare(password, userInfo.账号密码);
    if (!isPwdValid) {
      return res.status(401).json({ 
        success: false, 
        msg: "密码错误，请重新输入" 
      });
    }

    // ====================== 验证账号状态 ======================
    const accountStatus = Number(userInfo.账号状态) || 0;
    if (accountStatus !== 0) {
      return res.status(403).json({ 
        success: false, 
        msg: `账号状态异常（状态码：${accountStatus}），请联系秋风处理` 
      });
    }

    // ====================== 登录成功：返回安全的用户信息 ======================
    // 剔除敏感字段「账号密码」，保留其他所有字段（包括：认证成就、自设名称、入圈时间等）
    const { "账号密码": _, ...safeUserInfo } = userInfo;
    
    // 返回给前端：包含完整用户信息（含认证成就）+ 纯ID
    return res.status(200).json({
      success: true,
      msg: "登录成功",
      userInfo: { 
        ...safeUserInfo, // 保留所有非敏感字段（含认证成就）
        user: username   // 追加纯ID字段（方便前端使用）
      }
    });

  } catch (err) {
    // ====================== 错误捕获与返回 ======================
    console.error("Vercel登录接口错误详情：", err);
    return res.status(500).json({ 
      success: false, 
      msg: `服务器错误：${err.message || "请联系管理员检查GitHub Token或仓库配置"}` 
    });
  }
}

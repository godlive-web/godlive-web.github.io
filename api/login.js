// 1. 需先在Vercel项目根目录执行 npm install bcrypt，再提交package.json和node_modules
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  // 2. CORS跨域配置（允许前端登录页域名）
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  // 处理预检请求
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);

  // 3. 接收前端传递的参数（前端传的“username”=你的JSON里的“user”字段，即账号ID）
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, msg: "账号ID和密码不能为空" });
  }

  // 4. GitHub仓库配置（固定为你的用户数据仓库）
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Vercel环境变量中的GitHub PAT
  const REPO_OWNER = "godlive-web";
  const REPO_NAME = "godlive";
  const USER_DIR_PATH = "data/usersdata"; // 用户文件目录（main分支）
  const BRANCH = "main";

  try {
    // 5. 中文ID核心处理（若账号是中文，编码后匹配GitHub的中文文件名）
    const encodedUsername = encodeURIComponent(username);

    // 6. 调用GitHub API，获取usersdata目录下的所有文件列表
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

    // 7. 匹配文件：文件名=账号ID（支持英文/数字/中文账号）
    const targetFile = fileList.find(file => {
      return file.name === username || file.name === encodedUsername;
    });

    // 8. 无匹配文件 → 账号ID不存在
    if (!targetFile) {
      return res.status(401).json({ success: false, msg: "账号ID不存在，请检查输入" });
    }

    // 9. 读取用户文件内容（解析你的JSON结构）
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

    // 10. 验证密码（关键修改：匹配你的JSON里的“账号密码”字段，而非“password”）
    // 错误1：原代码检查“userInfo.password”，需改成“userInfo.账号密码”
    if (!userInfo.账号密码) {
      throw new Error("用户文件中缺少“账号密码”字段");
    }
    // 正确：用“账号密码”字段的哈希值比对
    const isPwdValid = await bcrypt.compare(password, userInfo.账号密码);
    if (!isPwdValid) {
      return res.status(401).json({ success: false, msg: "密码错误，请重新输入" });
    }

    // 11. 验证账号状态（你的JSON里“账号状态”是字符串“0”，转成数字判断）
    const accountStatus = Number(userInfo.账号状态) || 0;
    if (accountStatus !== 0) {
      return res.status(403).json({ 
        success: false, 
        msg: `账号状态异常（状态码：${accountStatus}），请联系秋风处理` 
      });
    }

    // 12. 登录成功：剔除敏感字段（关键修改：剔除“账号密码”，而非“password”）
    // 错误2：原代码剔除“password”，需改成剔除“账号密码”
    const { "账号密码": _, ...safeUserInfo } = userInfo; // 剔除密码字段，避免泄露
    return res.status(200).json({
      success: true,
      msg: "登录成功",
      userInfo: { ...safeUserInfo, user: username } // 返回安全信息（含自设名称、个人介绍等）
    });

  } catch (err) {
    console.error("Vercel登录函数错误：", err);
    return res.status(500).json({ 
      success: false, 
      msg: `服务器错误：${err.message || "请联系管理员检查配置"}` 
    });
  }
}

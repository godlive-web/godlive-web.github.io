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

  // 3. 接收前端传递的参数（含中文ID）
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, msg: "ID和密码不能为空" });
  }

  // 4. GitHub仓库配置（固定为你的用户数据仓库）
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Vercel环境变量中的GitHub PAT
  const REPO_OWNER = "godlive-web";
  const REPO_NAME = "godlive";
  const USER_DIR_PATH = "data/usersdata"; // 用户文件目录（main分支）
  const BRANCH = "main";

  try {
    // 5. 中文ID核心处理：GitHub会将中文文件名编码为UTF-8百分比形式（如“张三”→“%E5%BC%A0%E4%B8%89”）
    // 所以需要将前端传递的中文ID编码，再与GitHub返回的file.name（已编码）匹配
    const encodedUsername = encodeURIComponent(username); // 关键：中文ID编码

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

    // 7. 遍历文件列表，匹配“编码后的中文ID=GitHub返回的编码文件名”
    // 注意：GitHub返回的file.name中，中文会自动编码为UTF-8百分比形式，需用encodedUsername匹配
    const targetFile = fileList.find(file => {
      // 处理特殊情况：如果文件名是英文/数字，直接匹配；如果是中文，用编码后匹配
      return file.name === username || file.name === encodedUsername;
    });

    // 8. 无匹配文件 → ID不存在（含中文ID场景）
    if (!targetFile) {
      return res.status(401).json({ success: false, msg: "ID不存在，请检查输入（区分中英文大小写）" });
    }

    // 9. 读取匹配文件的内容（支持中文内容解码）
    const fileContentRes = await fetch(targetFile.download_url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    // 处理文件内容编码：确保中文内容正确解码
    const fileContentText = await fileContentRes.text();
    let userInfo;
    try {
      // 解析JSON时，自动处理中文编码
      userInfo = JSON.parse(fileContentText);
    } catch (parseErr) {
      throw new Error(`用户文件格式错误：${parseErr.message}（文件内容需为标准JSON）`);
    }

    // 10. 验证密码（bcrypt比对，与是否中文无关）
    if (!userInfo.password) {
      throw new Error("用户文件中缺少password字段");
    }
    const isPwdValid = await bcrypt.compare(password, userInfo.password);
    if (!isPwdValid) {
      return res.status(401).json({ success: false, msg: "密码错误，请重新输入" });
    }

    // 11. 验证账号状态
    const accountStatus = Number(userInfo.账号状态) || 0;
    if (accountStatus !== 0) {
      return res.status(403).json({ 
        success: false, 
        msg: `账号状态异常（状态码：${accountStatus}），请联系秋风处理` 
      });
    }

    // 12. 登录成功：剔除密码，返回安全用户信息（中文信息会自动JSON序列化）
    const { password: _, ...safeUserInfo } = userInfo;
    return res.status(200).json({
      success: true,
      msg: "登录成功",
      userInfo: { ...safeUserInfo, user: username } // 返回原始中文ID，方便前端显示
    });

  } catch (err) {
    console.error("Vercel登录函数错误：", err);
    return res.status(500).json({ 
      success: false, 
      msg: `服务器错误：${err.message || "请联系管理员检查配置"}` 
    });
  }
}

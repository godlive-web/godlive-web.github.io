export default async function handler(req, res) {
  // ========== CORS跨域配置 ==========
  const FRONTEND_ORIGIN = "https://godlive-web.github.io";
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // =================================

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "godlive-web";
    const REPO_NAME = "godlive-web.github.io";
    const QA_FILE_PATH = "openfill/Introduction/Q&A.json";
    const POLITICAL_FILE_PATH = "openfill/Introduction/PoliticalSystem.json";
    
    // 公告数据存储在私有仓库
    const ANNOUNCEMENT_REPO_OWNER = "godlive-web";
    const ANNOUNCEMENT_REPO_NAME = "godlive";
    const ANNOUNCEMENT_FILE_PATH = "data/announcement.json";

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ success: false, msg: "服务器未配置GITHUB_TOKEN" });
    }

    const { type, action } = req.query;

    // 获取Q&A数据
    if (type === 'qa') {
      if (req.method === 'GET') {
        const qaData = await getFileFromGitHub(REPO_OWNER, REPO_NAME, QA_FILE_PATH, GITHUB_TOKEN);
        return res.status(200).json({ success: true, data: qaData });
      }

      if (req.method === 'POST') {
        // 添加新问题
        const { title, question } = req.body;
        if (!title || !question) {
          return res.status(400).json({ success: false, msg: "标题和问题内容不能为空" });
        }

        const qaData = await getFileFromGitHub(REPO_OWNER, REPO_NAME, QA_FILE_PATH, GITHUB_TOKEN);
        const newQuestion = {
          id: `qa_${Date.now()}`,
          title,
          question,
          answer: "",
          status: "暂未回答",
          relatedContent: [],
          createTime: new Date().toISOString(),
          answerTime: null
        };
        qaData.questions.push(newQuestion);

        await updateFileOnGitHub(REPO_OWNER, REPO_NAME, QA_FILE_PATH, qaData, GITHUB_TOKEN);
        return res.status(200).json({ success: true, data: newQuestion });
      }

      if (req.method === 'PUT') {
        // 更新问题（回答或修改）
        const { id, answer, status, relatedContent } = req.body;
        const qaData = await getFileFromGitHub(REPO_OWNER, REPO_NAME, QA_FILE_PATH, GITHUB_TOKEN);

        const questionIndex = qaData.questions.findIndex(q => q.id === id);
        if (questionIndex === -1) {
          return res.status(404).json({ success: false, msg: "问题不存在" });
        }

        if (answer !== undefined) qaData.questions[questionIndex].answer = answer;
        if (status !== undefined) qaData.questions[questionIndex].status = status;
        if (relatedContent !== undefined) qaData.questions[questionIndex].relatedContent = relatedContent;
        if (answer || status === "已回答" || status === "不予回答") {
          qaData.questions[questionIndex].answerTime = new Date().toISOString();
        }

        await updateFileOnGitHub(REPO_OWNER, REPO_NAME, QA_FILE_PATH, qaData, GITHUB_TOKEN);
        return res.status(200).json({ success: true, data: qaData.questions[questionIndex] });
      }

      if (req.method === 'DELETE') {
        // 删除问题
        const { id } = req.query;
        const qaData = await getFileFromGitHub(REPO_OWNER, REPO_NAME, QA_FILE_PATH, GITHUB_TOKEN);
        qaData.questions = qaData.questions.filter(q => q.id !== id);
        await updateFileOnGitHub(REPO_OWNER, REPO_NAME, QA_FILE_PATH, qaData, GITHUB_TOKEN);
        return res.status(200).json({ success: true, msg: "删除成功" });
      }
    }

    // 获取政治体系数据
    if (type === 'political') {
      if (req.method === 'GET') {
        const politicalData = await getFileFromGitHub(REPO_OWNER, REPO_NAME, POLITICAL_FILE_PATH, GITHUB_TOKEN);
        return res.status(200).json({ success: true, data: politicalData });
      }

      if (req.method === 'POST') {
        // 创建文件夹或文件
        const { itemType, data } = req.body;
        const politicalData = await getFileFromGitHub(REPO_OWNER, REPO_NAME, POLITICAL_FILE_PATH, GITHUB_TOKEN);

        if (itemType === 'folder') {
          const newFolder = {
            id: `folder_${Date.now()}`,
            name: data.name,
            type: 'folder',
            parentId: data.parentId || null,
            createTime: new Date().toISOString()
          };
          politicalData.folders.push(newFolder);
        } else if (itemType === 'file') {
          const newFile = {
            id: `pol_${Date.now()}`,
            name: data.name,
            type: 'file',
            folderId: data.folderId,
            data: {
              机构名称: data.机构名称 || '',
              介绍: data.介绍 || '',
              管辖区域: data.管辖区域 || '',
              设立地点: data.设立地点 || '',
              管理层: data.管理层 || '',
              上级机构: data.上级机构 || [],
              下辖机构: data.下辖机构 || []
            },
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString()
          };
          politicalData.files.push(newFile);
        }

        await updateFileOnGitHub(REPO_OWNER, REPO_NAME, POLITICAL_FILE_PATH, politicalData, GITHUB_TOKEN);
        return res.status(200).json({ success: true });
      }

      if (req.method === 'PUT') {
        // 更新文件或文件夹
        const { id, itemType, data } = req.body;
        const politicalData = await getFileFromGitHub(REPO_OWNER, REPO_NAME, POLITICAL_FILE_PATH, GITHUB_TOKEN);

        if (itemType === 'folder') {
          const folderIndex = politicalData.folders.findIndex(f => f.id === id);
          if (folderIndex !== -1) {
            politicalData.folders[folderIndex].name = data.name;
            politicalData.folders[folderIndex].parentId = data.parentId;
          }
        } else if (itemType === 'file') {
          const fileIndex = politicalData.files.findIndex(f => f.id === id);
          if (fileIndex !== -1) {
            politicalData.files[fileIndex].name = data.name;
            politicalData.files[fileIndex].folderId = data.folderId;
            politicalData.files[fileIndex].data = { ...politicalData.files[fileIndex].data, ...data };
            politicalData.files[fileIndex].updateTime = new Date().toISOString();
          }
        }

        await updateFileOnGitHub(REPO_OWNER, REPO_NAME, POLITICAL_FILE_PATH, politicalData, GITHUB_TOKEN);
        return res.status(200).json({ success: true });
      }

      if (req.method === 'DELETE') {
        // 删除文件或文件夹
        const { id, itemType } = req.query;
        const politicalData = await getFileFromGitHub(REPO_OWNER, REPO_NAME, POLITICAL_FILE_PATH, GITHUB_TOKEN);

        if (itemType === 'folder') {
          politicalData.folders = politicalData.folders.filter(f => f.id !== id);
          // 同时删除该文件夹下的所有文件
          politicalData.files = politicalData.files.filter(f => f.folderId !== id);
        } else if (itemType === 'file') {
          politicalData.files = politicalData.files.filter(f => f.id !== id);
        }

        await updateFileOnGitHub(REPO_OWNER, REPO_NAME, POLITICAL_FILE_PATH, politicalData, GITHUB_TOKEN);
        return res.status(200).json({ success: true, msg: "删除成功" });
      }
    }

    // 公告管理
    if (type === 'announcement') {
      if (req.method === 'GET') {
        const announcementData = await getFileFromGitHub(ANNOUNCEMENT_REPO_OWNER, ANNOUNCEMENT_REPO_NAME, ANNOUNCEMENT_FILE_PATH, GITHUB_TOKEN);
        return res.status(200).json({ success: true, data: announcementData });
      }

      if (req.method === 'POST') {
        const { title, content, author, createdAt, isTop } = req.body;
        if (!title || !content || !author) {
          return res.status(400).json({ success: false, msg: "缺少必填字段：标题、正文或发布者" });
        }

        let announcementData = await getFileFromGitHub(ANNOUNCEMENT_REPO_OWNER, ANNOUNCEMENT_REPO_NAME, ANNOUNCEMENT_FILE_PATH, GITHUB_TOKEN);
        if (!Array.isArray(announcementData)) {
          announcementData = [];
        }

        const newAnnouncement = {
          id: Date.now().toString(),
          title: title,
          content: content,
          author: author,
          createdAt: createdAt || new Date().toISOString(),
          isTop: isTop || false
        };

        if (isTop) {
          announcementData.forEach(item => {
            item.isTop = false;
          });
        }

        announcementData.unshift(newAnnouncement);
        await updateFileOnGitHub(ANNOUNCEMENT_REPO_OWNER, ANNOUNCEMENT_REPO_NAME, ANNOUNCEMENT_FILE_PATH, announcementData, GITHUB_TOKEN);
        return res.status(200).json({ success: true, data: newAnnouncement });
      }

      if (req.method === 'PUT') {
        const { id, title, content, author, createdAt, isTop } = req.body;
        if (!id) {
          return res.status(400).json({ success: false, msg: "缺少公告ID" });
        }

        let announcementData = await getFileFromGitHub(ANNOUNCEMENT_REPO_OWNER, ANNOUNCEMENT_REPO_NAME, ANNOUNCEMENT_FILE_PATH, GITHUB_TOKEN);
        if (!Array.isArray(announcementData)) {
          announcementData = [];
        }

        const announcementIndex = announcementData.findIndex(item => item.id === id);
        if (announcementIndex === -1) {
          return res.status(404).json({ success: false, msg: "未找到该公告" });
        }

        if (isTop !== undefined) {
          announcementData.forEach(item => {
            if (item.id === id) {
              item.isTop = isTop;
            } else if (isTop && item.isTop) {
              item.isTop = false;
            }
          });
        }

        if (title !== undefined) announcementData[announcementIndex].title = title;
        if (content !== undefined) announcementData[announcementIndex].content = content;
        if (author !== undefined) announcementData[announcementIndex].author = author;
        if (createdAt !== undefined) announcementData[announcementIndex].createdAt = createdAt;

        await updateFileOnGitHub(ANNOUNCEMENT_REPO_OWNER, ANNOUNCEMENT_REPO_NAME, ANNOUNCEMENT_FILE_PATH, announcementData, GITHUB_TOKEN);
        return res.status(200).json({ success: true, data: announcementData[announcementIndex] });
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) {
          return res.status(400).json({ success: false, msg: "缺少公告ID" });
        }

        let announcementData = await getFileFromGitHub(ANNOUNCEMENT_REPO_OWNER, ANNOUNCEMENT_REPO_NAME, ANNOUNCEMENT_FILE_PATH, GITHUB_TOKEN);
        if (!Array.isArray(announcementData)) {
          announcementData = [];
        }

        const announcementIndex = announcementData.findIndex(item => item.id === id);
        if (announcementIndex === -1) {
          return res.status(404).json({ success: false, msg: "未找到该公告" });
        }

        announcementData.splice(announcementIndex, 1);
        await updateFileOnGitHub(ANNOUNCEMENT_REPO_OWNER, ANNOUNCEMENT_REPO_NAME, ANNOUNCEMENT_FILE_PATH, announcementData, GITHUB_TOKEN);
        return res.status(200).json({ success: true });
      }
    }

    return res.status(400).json({ success: false, msg: "无效的请求类型" });

  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ success: false, msg: error.message });
  }
}

// 从GitHub获取文件
async function getFileFromGitHub(owner, repo, path, token) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { Authorization: `token ${token}` } }
  );

  if (!response.ok) {
    if (response.status === 404) {
      // 文件不存在，返回默认结构
      if (path.includes('Q&A')) {
        return { questions: [] };
      } else if (path.includes('announcement')) {
        return [];
      } else {
        return { folders: [], files: [] };
      }
    }
    throw new Error(`获取文件失败: ${response.status}`);
  }

  const fileData = await response.json();
  const content = Buffer.from(fileData.content, 'base64').toString('utf8');
  return JSON.parse(content);
}

// 更新文件到GitHub
async function updateFileOnGitHub(owner, repo, path, data, token) {
  // 先获取文件的SHA
  const getResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { Authorization: `token ${token}` } }
  );

  let sha = null;
  if (getResponse.ok) {
    const fileData = await getResponse.json();
    sha = fileData.sha;
  }

  // 更新或创建文件
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = {
    message: `Update ${path}`,
    content: content
  };
  if (sha) body.sha = sha;

  const updateResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    throw new Error(`更新文件失败: ${error.message}`);
  }

  return await updateResponse.json();
}
// scripts/validate-docs.cjs
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');

// ======================= 配置区 =======================
const CONFIG = {
  docRoot: path.resolve(__dirname, '../docs/notes/docs'),             // 文档根目录
  publicRoot: path.resolve(__dirname, '../docs/.vuepress/public'), // 公共资源根目录
  allowedExtensions: ['.md', '.png', '.jpg', '.jpeg'],    // 允许的文件类型
  requiredFrontmatter: ['title', 'permalink'],     // 必填字段
  imageBasePath: '/'                                       // VuePress公共资源基准路径
};

// ===================== 工具函数 ======================
const printError = (msg) => console.log(chalk.red(`❌ ${msg}`));
const printSuccess = (msg) => console.log(chalk.green(`✅ ${msg}`));

// ==================== 核心验证逻辑 ====================
class DocValidator {
  constructor() {
    this.errors = [];
  }

  // 1. 目录结构验证
  checkDirectoryStructure() {
    let hasError = false;

    const checkExtensions = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          checkExtensions(fullPath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (!CONFIG.allowedExtensions.includes(ext)) {
            const relPath = path.relative(CONFIG.docRoot, fullPath);
            this.errors.push(`非法文件类型: ${relPath} (仅允许 ${CONFIG.allowedExtensions.join(', ')})`);
            hasError = true;
          }
        }
      });
    };

    checkExtensions(CONFIG.docRoot);
    return !hasError;
  }

  // 2. Frontmatter验证
  checkFrontmatter() {
    let hasError = false;

    const processFile = (filePath) => {
      const relPath = path.relative(CONFIG.docRoot, filePath);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

        if (!fmMatch) {
          this.errors.push(`${relPath}: 缺少Frontmatter区块`);
          hasError = true;
          return;
        }

        try {
          const frontmatter = yaml.load(fmMatch[1]);
          CONFIG.requiredFrontmatter.forEach(field => {
            if (!frontmatter[field]) {
              this.errors.push(
                `${relPath}: 缺失必要字段 "${field}"\n` +
                `示例格式：\n---\ntitle: 页面标题\neditLink: true\ntags: [指南]\n---`
              );
              hasError = true;
            }
          });
        } catch (e) {
          this.errors.push(`${relPath}: Frontmatter解析错误 - ${e.message}`);
          hasError = true;
        }
      } catch (e) {
        this.errors.push(`${relPath}: 文件读取失败 - ${e.message}`);
        hasError = true;
      }
    };

    const walk = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (path.extname(file) === '.md') {
          processFile(fullPath);
        }
      });
    };

    walk(CONFIG.docRoot);
    return !hasError;
  }

  // 3. 增强版图片验证
  checkImagePaths() {
    let hasError = false;
    const markdownFiles = [];

    // 递归收集所有Markdown文件
    const collectMarkdownFiles = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          collectMarkdownFiles(fullPath);
        } else if (path.extname(file) === '.md') {
          markdownFiles.push(fullPath);
        }
      });
    };
    collectMarkdownFiles(CONFIG.docRoot);

    // 增强版图片解析正则（支持带引号的描述文本）
    const imageRegex = /!\[([^\]]*)\]\((\S+)(?:\s+"([^"]+)")?\)/g;

    markdownFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const relPath = path.relative(CONFIG.docRoot, file);
      
      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        const [_, altText, imgPath, titleText] = match;
        
        // 路径标准化处理
        const normalizedPath = imgPath
          .replace(/\\/g, '/')  // 统一为POSIX路径
          .replace(/\s+.*$/, ''); // 去除可能存在的错误空格

        // 路径有效性验证
        if (
          !normalizedPath.startsWith(CONFIG.imageBasePath) &&
          !normalizedPath.startsWith('http://') &&
          !normalizedPath.startsWith('https://') &&
          !path.isAbsolute(normalizedPath)
        ) {
          this.errors.push(
            `非法图片路径: ${relPath}\n` +
            `发现路径: ${imgPath}\n` +
            `正确示例: ${CONFIG.imageBasePath}img/example.png`
          );
          hasError = true;
        }

        // 本地文件存在性检查
        if (normalizedPath.startsWith(CONFIG.imageBasePath)) {
          const publicRelPath = normalizedPath.replace(CONFIG.imageBasePath, '');
          const absolutePath = path.join(CONFIG.publicRoot, publicRelPath);
          
          if (!fs.existsSync(absolutePath)) {
            this.errors.push(
              `图片文件缺失: ${relPath}\n` +
              `引用路径: ${normalizedPath}\n` +
              `实际路径: ${path.relative(process.cwd(), absolutePath)}`
            );
            hasError = true;
          }
        }
      }
    });

    return !hasError;
  }

  // 运行所有检查
  runAllChecks() {
    const results = [
      this.checkDirectoryStructure(),
      this.checkFrontmatter(),
      this.checkImagePaths()
    ];

    if (this.errors.length > 0) {
      console.log(chalk.red.bold('\n文档规范检查失败！发现以下问题：'));
      this.errors.forEach((err, index) => {
        console.log(chalk.yellow(`${index + 1}. `) + err.replace(/\n/g, '\n    '));
      });
      process.exit(1); // 确保返回非零退出码
    } else {
      printSuccess('所有文档检查通过！');
      process.exit(0);
    }
  }
}

// 执行检查
new DocValidator().runAllChecks();

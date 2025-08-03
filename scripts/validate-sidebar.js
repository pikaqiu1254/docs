import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 读取侧边栏配置文件
const sidebarConfigPath = join(process.cwd(), 'docs/.vuepress/notes/zh_cn/index.ts');
const docsBasePath = join(process.cwd(), 'docs/notes/docs');

// 解析TypeScript配置文件中的sidebar部分
function parseSidebarConfig(content) {
  // 移除注释
  let withoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 查找sidebar定义的开始位置
  const sidebarStartIndex = withoutComments.indexOf('sidebar:');
  if (sidebarStartIndex === -1) {
    throw new Error('未找到sidebar配置');
  }
  
  // 从sidebar:开始解析，找到对应的数组
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  let startIndex = -1;
  let endIndex = -1;
  
  for (let i = sidebarStartIndex + 8; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' || char === "'") {
      inString = !inString;
      continue;
    }
    
    if (inString) {
      continue;
    }
    
    if (char === '[') {
      if (startIndex === -1) {
        startIndex = i;
      }
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount === 0 && startIndex !== -1) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('无法解析sidebar数组');
  }
  
  // 提取sidebar数组部分
  const sidebarCode = withoutComments.substring(startIndex, endIndex);
  
  // 简单替换，使代码可以被解析
  // 这是一个简化的解析器，可能不适用于所有情况
  const preparedCode = sidebarCode
    .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":') // 给键加上引号
    .replace(/,\s*}/g, '}') // 移除尾随逗号
    .replace(/,\s*]/g, ']'); // 移除尾随逗号
  
  try {
    // 使用eval解析（在受控环境中相对安全）
    // 注意：在生产环境中应避免使用eval，但在这种特定情况下是可控的
    return eval(`(${preparedCode})`);
  } catch (e) {
    console.error('解析sidebar配置时出错:', e);
    console.error('准备解析的代码:', preparedCode);
    throw e;
  }
}

// 递归验证侧边栏项目
function validateSidebarItems(items, basePath, prefix = '') {
  const errors = [];
  const fullPath = join(basePath, prefix);
  
  for (const item of items) {
    if (typeof item === 'string') {
      // 处理字符串类型的项目
      const fileName = `${item}.md`;
      const filePath = join(fullPath, fileName);
      
      // 检查文件是否存在
      if (!existsSync(filePath)) {
        errors.push(`文件不存在: ${join(prefix, fileName)}`);
      }
    } else if (typeof item === 'object') {
      // 处理对象类型的项目
      if (item.items) {
        // 递归处理子项目
        const newPrefix = item.prefix ? join(prefix, item.prefix) : prefix;
        const subErrors = validateSidebarItems(item.items, basePath, newPrefix);
        errors.push(...subErrors);
      }
    }
  }
  
  return errors;
}

function main() {
  try {
    // 读取配置文件
    const configContent = readFileSync(sidebarConfigPath, 'utf-8');
    
    // 解析配置
    const sidebar = parseSidebarConfig(configContent);
    
    // 验证侧边栏
    const errors = validateSidebarItems(sidebar, docsBasePath);
    
    // 输出结果
    if (errors.length > 0) {
      console.log('发现以下错误:');
      errors.forEach(error => console.log('- ' + error));
      process.exit(1);
    } else {
      console.log('所有侧边栏配置验证通过!');
    }
  } catch (error) {
    console.error('验证过程中出错:', error.message);
    process.exit(1);
  }
}

main();
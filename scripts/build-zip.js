const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromisify = util.promisify(exec);

// 定义路径
const DIST_DIR = path.join(__dirname, '../dist');
const ZIP_FILE = path.join(__dirname, '../Dictionaries.zip');

// 检查 dist 目录是否存在
const checkDistDirectory = async () => {
  try {
    await fs.promises.stat(DIST_DIR);
    console.log('✅ dist 目录存在');
    return true;
  } catch (error) {
    console.error('❌ 错误: dist 目录不存在，请先执行 build 命令');
    return false;
  }
};

// 删除已存在的 zip 文件
const removeExistingZip = async () => {
  try {
    await fs.promises.stat(ZIP_FILE);
    console.log('🔄 删除已存在的 dist.zip');
    await fs.promises.unlink(ZIP_FILE);
  } catch (error) {
    // 如果文件不存在，忽略错误
  }
};

// 打包 dist 目录
const zipDistDirectory = async () => {
  try {
    console.log('📦 开始打包 dist 目录...');
    
    // 根据不同操作系统使用不同的命令
    let zipCommand;
    if (process.platform === 'win32') {
      // Windows 系统
      zipCommand = `powershell Compress-Archive -Path "${DIST_DIR}\*" -DestinationPath "${ZIP_FILE}"`;
    } else {
      // macOS 或 Linux 系统
      zipCommand = `cd "${path.dirname(DIST_DIR)}" && zip -r "${ZIP_FILE}" dist`;
    }
    
    const { stdout, stderr } = await execPromisify(zipCommand);
    
    if (stderr) {
      console.error('⚠️  打包过程中有警告:', stderr);
    }
    
    console.log('✅ 打包成功! 已生成 dist.zip');
    return true;
  } catch (error) {
    console.error('❌ 打包失败:', error);
    return false;
  }
};

// 主函数
const main = async () => {
  console.log('🚀 开始执行 dist 打包脚本');
  
  // 检查 dist 目录是否存在
  const hasDist = await checkDistDirectory();
  if (!hasDist) {
    process.exit(1);
  }
  
  // 删除已存在的 zip 文件
  await removeExistingZip();
  
  // 打包 dist 目录
  const zipResult = await zipDistDirectory();
  
  if (zipResult) {
    console.log('🎉 打包脚本执行完成!');
    process.exit(0);
  } else {
    console.error('💥 打包脚本执行失败!');
    process.exit(1);
  }
};

// 执行主函数
main();
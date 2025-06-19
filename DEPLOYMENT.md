# AI Dino Arena 部署指南

## Windows Server 2022 部署步骤

### 1. 系统环境准备

#### 安装必要软件

```powershell
# 使用Windows包管理器安装
winget install OpenJS.NodeJS
winget install Python.Python.3.11
winget install Git.Git
winget install Microsoft.VisualStudioCode  # 可选，用于代码编辑
```

#### 验证安装

```powershell
node --version    # 应显示 v20.x.x
npm --version     # 应显示 10.x.x
python --version  # 应显示 Python 3.11.x
git --version     # 应显示 git version 2.x.x
```

### 2. 项目部署

#### 获取项目代码

```powershell
# 创建项目目录
mkdir C:\inetpub\ai-dino-arena
cd C:\inetpub\ai-dino-arena

# 克隆项目（如果有Git仓库）
# git clone <repository-url> .

# 或者直接复制项目文件到此目录
```

#### 安装项目依赖

```powershell
# 安装前端依赖
cd frontend\ai-dino-arena
npm install

# 安装后端依赖
cd ..\..\backend
npm install

# 安装Python依赖
cd ..\ai_trainer
pip install numpy
```

### 3. 生产环境配置

#### 前端构建

```powershell
cd ..\frontend\ai-dino-arena
npm run build
```

构建完成后，`dist`目录包含生产环境的静态文件。

#### 后端配置

修改 `backend\server.js` 中的配置：

```javascript
// 生产环境端口配置
const PORT = process.env.PORT || 80

// 静态文件服务（如果需要）
app.use(express.static(path.join(__dirname, '../frontend/ai-dino-arena/dist')))
```

### 4. IIS配置（推荐）

#### 安装IIS和Node.js模块

```powershell
# 启用IIS功能
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering

# 下载并安装iisnode
# https://github.com/Azure/iisnode/releases
```

#### 创建IIS站点

1. 打开IIS管理器
2. 右键"Sites" → "Add Website"
3. 配置站点信息：
   - Site name: AI-Dino-Arena
   - Physical path: C:\inetpub\ai-dino-arena\frontend\ai-dino-arena\dist
   - Port: 80

#### 配置Node.js应用

创建 `web.config` 文件：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

### 5. 进程管理（PM2方式）

#### 安装PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# 配置Windows服务
pm2-startup install
```

#### 启动应用

```powershell
# 启动后端服务
cd C:\inetpub\ai-dino-arena\backend
pm2 start server.js --name "ai-dino-backend"

# 启动AI训练服务（可选）
cd ..\ai_trainer
pm2 start ai_websocket_server.py --name "ai-trainer" --interpreter python

# 保存PM2配置
pm2 save
```

#### PM2常用命令

```powershell
pm2 list                    # 查看所有进程
pm2 logs ai-dino-backend    # 查看日志
pm2 restart ai-dino-backend # 重启服务
pm2 stop ai-dino-backend    # 停止服务
pm2 delete ai-dino-backend  # 删除进程
```

### 6. 防火墙配置

#### 开放必要端口

```powershell
# 开放HTTP端口
New-NetFirewallRule -DisplayName "AI Dino Arena HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# 开放HTTPS端口（如果使用SSL）
New-NetFirewallRule -DisplayName "AI Dino Arena HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# 开放后端API端口
New-NetFirewallRule -DisplayName "AI Dino Arena API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### 7. SSL证书配置（可选）

#### 获取SSL证书

1. 从证书颁发机构购买SSL证书
2. 或使用Let's Encrypt免费证书
3. 或使用自签名证书（仅用于测试）

#### 在IIS中配置SSL

1. 打开IIS管理器
2. 选择服务器节点
3. 双击"Server Certificates"
4. 导入SSL证书
5. 在站点绑定中添加HTTPS绑定

### 8. 监控和日志

#### 设置日志记录

创建日志目录：

```powershell
mkdir C:\inetpub\ai-dino-arena\logs
```

修改应用配置以输出日志到文件。

#### 性能监控

使用Windows性能监视器监控：
- CPU使用率
- 内存使用量
- 网络流量
- 磁盘I/O

### 9. 备份策略

#### 自动备份脚本

```powershell
# backup.ps1
$backupPath = "C:\Backups\ai-dino-arena"
$sourcePath = "C:\inetpub\ai-dino-arena"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# 创建备份目录
New-Item -ItemType Directory -Path "$backupPath\$timestamp" -Force

# 复制项目文件
Copy-Item -Path $sourcePath -Destination "$backupPath\$timestamp" -Recurse

# 清理旧备份（保留最近7天）
Get-ChildItem $backupPath | Where-Object {$_.CreationTime -lt (Get-Date).AddDays(-7)} | Remove-Item -Recurse -Force
```

设置定时任务：

```powershell
# 创建定时任务，每天凌晨2点执行备份
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "AI Dino Arena Backup"
```

### 10. 故障排除

#### 常见问题

**问题1：Node.js应用无法启动**
```powershell
# 检查Node.js版本
node --version

# 检查端口占用
netstat -ano | findstr :3001

# 查看PM2日志
pm2 logs ai-dino-backend
```

**问题2：IIS站点无法访问**
```powershell
# 检查IIS服务状态
Get-Service W3SVC

# 重启IIS
iisreset

# 检查应用程序池状态
```

**问题3：WebSocket连接失败**
- 检查防火墙设置
- 确认WebSocket支持已启用
- 查看浏览器控制台错误

#### 日志位置

- IIS日志：`C:\inetpub\logs\LogFiles`
- PM2日志：`%USERPROFILE%\.pm2\logs`
- 应用日志：`C:\inetpub\ai-dino-arena\logs`

### 11. 性能优化

#### IIS优化

```xml
<!-- 在web.config中添加 -->
<system.webServer>
  <staticContent>
    <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
  </staticContent>
  <urlCompression doStaticCompression="true" doDynamicCompression="true" />
</system.webServer>
```

#### Node.js优化

```javascript
// 在server.js中添加
const cluster = require('cluster')
const numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
} else {
  // 启动应用
}
```

### 12. 安全配置

#### 基本安全措施

```powershell
# 禁用不必要的服务
Stop-Service -Name "Telnet" -Force
Set-Service -Name "Telnet" -StartupType Disabled

# 配置Windows更新
# 启用自动更新，但设置维护窗口
```

#### 应用安全

- 使用HTTPS加密传输
- 实施输入验证和输出编码
- 配置CORS策略
- 定期更新依赖包

### 13. 维护计划

#### 定期维护任务

- **每日**：检查应用状态和日志
- **每周**：更新系统补丁
- **每月**：检查磁盘空间和性能
- **每季度**：更新依赖包和安全审计

#### 监控指标

- 应用响应时间
- 错误率
- 资源使用率
- 用户访问量

---

部署完成后，访问 `http://your-server-ip` 即可使用AI Dino Arena应用。


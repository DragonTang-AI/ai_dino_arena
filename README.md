# AI Dino Arena - 智能恐龙游戏网站

## 项目概述

AI Dino Arena 是一个集成了人工智能强化学习的Chrome恐龙游戏复刻版网站。项目提供三种游戏模式：玩家纯玩模式、AI强化学习训练模式和AI演示模式，展示了现代Web技术与机器学习的完美结合。

### 核心特性

- **经典游戏体验**：完整复刻Chrome离线恐龙游戏，包含跳跃、下蹲、障碍物系统
- **AI强化学习**：基于Q-learning算法的CPU训练，实时可视化训练过程
- **三种游戏模式**：
  - 玩家纯玩：传统键盘控制游戏体验
  - AI训练：观看AI学习游戏过程，实时显示训练数据
  - AI演示：展示训练完成的AI自动游戏能力
- **实时通信**：WebSocket实现前后端实时数据交换
- **响应式设计**：支持桌面和移动设备访问

### 技术架构

- **前端**：React 19 + Tailwind CSS + Vite
- **后端**：Node.js + Express + Socket.IO
- **AI训练**：Python + NumPy + Q-learning算法
- **通信协议**：WebSocket + RESTful API
- **部署环境**：Windows Server 2022

## 项目结构

```
ai_dino_arena/
├── frontend/                 # React前端项目
│   └── ai-dino-arena/
│       ├── src/
│       │   ├── components/   # React组件
│       │   ├── hooks/        # 自定义Hook
│       │   └── assets/       # 静态资源
│       ├── index.html
│       └── package.json
├── backend/                  # Node.js后端
│   ├── server.js            # 主服务器文件
│   └── package.json
├── ai_trainer/              # Python AI训练模块
│   ├── dino_ai_trainer.py   # 核心训练逻辑
│   ├── train.py             # 训练脚本
│   └── ai_websocket_server.py # WebSocket服务器
├── assets/                  # 共享资源
│   └── dino_sprite.png      # 游戏素材
└── README.md               # 项目文档
```



## 安装和运行

### 环境要求

- Node.js 20.x 或更高版本
- Python 3.11 或更高版本
- npm 或 pnpm 包管理器
- Windows Server 2022（推荐部署环境）

### 快速开始

#### 1. 克隆项目

```bash
git clone <repository-url>
cd ai_dino_arena
```

#### 2. 安装前端依赖

```bash
cd frontend/ai-dino-arena
npm install
# 或使用 pnpm
pnpm install
```

#### 3. 安装后端依赖

```bash
cd ../../backend
npm install
```

#### 4. 安装Python依赖

```bash
cd ../ai_trainer
pip install numpy
```

#### 5. 启动服务

**启动后端服务器：**
```bash
cd ../backend
npm start
```
服务器将在 http://localhost:3001 启动

**启动前端开发服务器：**
```bash
cd ../frontend/ai-dino-arena
npm run dev
# 或使用 pnpm
pnpm run dev
```
前端将在 http://localhost:5173 启动

**（可选）启动AI训练服务器：**
```bash
cd ../../ai_trainer
python ai_websocket_server.py
```

### 访问应用

打开浏览器访问 http://localhost:5173 即可开始使用AI Dino Arena。

## 游戏说明

### 玩家纯玩模式

- **控制方式**：
  - 空格键：跳跃
  - 下箭头键：下蹲
- **游戏目标**：躲避障碍物，获得最高分数
- **障碍物类型**：
  - 地面仙人掌：需要跳跃躲避
  - 空中翼龙：可跳跃或下蹲躲避
- **游戏机制**：
  - 速度随分数增加而提升
  - 达到一定分数后切换昼夜模式
  - 目标分数5000分（非无限模式）

### AI训练模式

- **算法**：Q-learning强化学习
- **状态空间**：9维特征向量
  - 恐龙位置和速度
  - 跳跃和下蹲状态
  - 最近障碍物信息
  - 游戏速度
- **动作空间**：3种动作（无动作、跳跃、下蹲）
- **奖励机制**：
  - 存活奖励：+1
  - 避开障碍物：+5
  - 碰撞惩罚：-100
  - 分数里程碑：+10
- **训练参数**：
  - 学习率：0.001
  - 探索率：1.0 → 0.01（衰减）
  - 折扣因子：0.95

### AI演示模式

展示训练完成的AI模型自动游戏，观察AI的决策策略和游戏表现。

## API文档

### RESTful API

#### 获取服务器状态
```
GET /api/status
```

#### 获取训练状态
```
GET /api/training/status
```

#### 开始训练
```
POST /api/training/start
```

#### 停止训练
```
POST /api/training/stop
```

#### 获取模型状态
```
GET /api/model/status
```

### WebSocket事件

#### 客户端发送事件

- `ai:getAction` - 请求AI动作
- `game:update` - 更新游戏状态

#### 服务器发送事件

- `training:started` - 训练开始
- `training:stopped` - 训练停止
- `training:update` - 训练状态更新
- `training:log` - 训练日志
- `ai:action` - AI动作响应
- `model:performance` - 模型性能统计

## AI训练详解

### Q-learning算法实现

项目采用表格型Q-learning算法，通过离散化连续状态空间来处理游戏环境。

#### 状态表示

```python
state = [
    dino_y_normalized,      # 恐龙Y位置（归一化）
    dino_velocity_normalized, # 恐龙垂直速度（归一化）
    is_jumping,             # 是否在跳跃（0/1）
    is_ducking,             # 是否在下蹲（0/1）
    obstacle_distance,      # 最近障碍物距离（归一化）
    obstacle_height,        # 障碍物高度（归一化）
    obstacle_type,          # 障碍物类型（0/1）
    obstacle_exists,        # 是否存在障碍物（0/1）
    game_speed             # 游戏速度（归一化）
]
```

#### Q值更新公式

```
Q(s,a) = Q(s,a) + α[r + γ·max(Q(s',a')) - Q(s,a)]
```

其中：
- α = 学习率 (0.001)
- γ = 折扣因子 (0.95)
- r = 即时奖励
- s = 当前状态
- a = 当前动作
- s' = 下一状态

#### 探索策略

采用ε-贪婪策略，探索率从1.0衰减到0.01：

```python
if random.random() < epsilon:
    action = random_action()  # 探索
else:
    action = argmax(Q[state])  # 利用
```

### 训练过程

1. **环境初始化**：重置游戏状态
2. **状态观察**：获取当前游戏状态向量
3. **动作选择**：基于ε-贪婪策略选择动作
4. **环境交互**：执行动作，获得奖励和新状态
5. **Q值更新**：使用Q-learning公式更新Q表
6. **经验存储**：保存状态转移经验
7. **重复训练**：直到游戏结束或达到目标

### 模型保存和加载

训练好的Q表以pickle格式保存，包含：
- Q值表（字典格式）
- 当前探索率
- 训练统计信息
- 历史奖励和分数

## 部署指南

### Windows Server 2022部署

#### 1. 环境准备

```powershell
# 安装Node.js
winget install OpenJS.NodeJS

# 安装Python
winget install Python.Python.3.11

# 安装Git
winget install Git.Git
```

#### 2. 项目部署

```powershell
# 克隆项目
git clone <repository-url>
cd ai_dino_arena

# 安装依赖
cd frontend\ai-dino-arena
npm install

cd ..\..\backend
npm install

cd ..\ai_trainer
pip install numpy
```

#### 3. 生产环境配置

**前端构建：**
```powershell
cd frontend\ai-dino-arena
npm run build
```

**后端生产配置：**
```javascript
// 修改server.js中的端口配置
const PORT = process.env.PORT || 80
```

**IIS配置（可选）：**
- 安装IIS和Node.js模块
- 配置反向代理到Node.js应用
- 设置SSL证书

#### 4. 服务管理

使用PM2进行进程管理：

```powershell
npm install -g pm2

# 启动后端服务
pm2 start backend\server.js --name "ai-dino-backend"

# 启动AI训练服务
pm2 start ai_trainer\ai_websocket_server.py --name "ai-trainer" --interpreter python
```

### 防火墙配置

开放必要端口：
- 80/443：Web服务
- 3001：后端API
- 8765：AI训练WebSocket（可选）

### 备案信息

网站已包含备案信息页脚：
- 备案号：青ICP备20000797号-1
- 链接：指向备案查询页面

## 性能优化

### 前端优化

- 使用Vite进行快速构建和热更新
- Tailwind CSS按需加载样式
- React组件懒加载
- 游戏循环优化，减少不必要的重绘

### 后端优化

- WebSocket连接池管理
- API响应缓存
- 内存使用监控
- 错误处理和日志记录

### AI训练优化

- 状态空间离散化优化
- 经验回放机制
- 批量Q值更新
- 模型定期保存

## 故障排除

### 常见问题

#### 1. 前端无法连接后端

**症状**：WebSocket连接失败，训练状态显示"未连接"

**解决方案**：
- 检查后端服务是否正常运行
- 确认端口3001未被占用
- 检查防火墙设置

#### 2. AI训练无响应

**症状**：点击"开始训练"后无反应

**解决方案**：
- 检查Python环境和依赖
- 查看后端控制台错误信息
- 重启AI训练服务

#### 3. 游戏画面异常

**症状**：恐龙或障碍物显示异常

**解决方案**：
- 检查游戏素材文件是否存在
- 清除浏览器缓存
- 检查Canvas渲染错误

### 日志查看

**后端日志**：
```bash
# 查看PM2日志
pm2 logs ai-dino-backend

# 查看实时日志
pm2 logs --lines 100
```

**前端调试**：
- 打开浏览器开发者工具
- 查看Console面板错误信息
- 检查Network面板API请求状态

## 开发指南

### 代码结构

#### 前端组件

- `App.jsx`：主应用组件，管理游戏模式切换
- `DinoGame.jsx`：游戏核心组件，处理游戏逻辑和渲染
- `useSocket.js`：WebSocket通信Hook

#### 后端模块

- `server.js`：Express服务器和WebSocket处理
- API路由：训练控制、状态查询、模型管理

#### AI训练模块

- `DinoEnvironment`：游戏环境模拟
- `QLearningAgent`：Q-learning智能体
- `DinoTrainer`：训练管理器

### 扩展功能

#### 添加新的AI算法

1. 在`ai_trainer`目录创建新的算法文件
2. 实现标准的智能体接口
3. 修改训练脚本支持算法选择
4. 更新前端界面显示新算法选项

#### 增加游戏难度

1. 修改`DinoEnvironment`中的游戏参数
2. 调整障碍物生成频率和类型
3. 更新奖励机制
4. 重新训练AI模型

#### 多人对战模式

1. 扩展WebSocket支持多客户端
2. 实现房间管理系统
3. 添加实时排行榜
4. 设计对战界面

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 贡献指南

欢迎提交Issue和Pull Request来改进项目。

### 开发环境设置

1. Fork项目仓库
2. 创建功能分支
3. 提交代码更改
4. 创建Pull Request

### 代码规范

- 使用ESLint进行JavaScript代码检查
- 遵循React Hooks最佳实践
- Python代码遵循PEP 8规范
- 提交信息使用约定式提交格式

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues：<repository-url>/issues
- 邮箱：[项目维护者邮箱]

---

© 2025 AI Dino Arena. All rights reserved.
备案号：青ICP备20000797号-1


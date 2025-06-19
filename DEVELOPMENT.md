# AI Dino Arena 开发文档

## 项目架构

### 整体架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React前端     │    │   Node.js后端   │    │  Python AI训练  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ 游戏界面    │ │    │ │ Express API │ │    │ │ Q-learning  │ │
│ │ 菜单系统    │ │◄──►│ │ WebSocket   │ │◄──►│ │ 环境模拟    │ │
│ │ 状态显示    │ │    │ │ 训练管理    │ │    │ │ 模型保存    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   浏览器客户端   │    │   HTTP/WS服务   │    │   训练数据存储   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈详解

#### 前端技术栈

- **React 19**：现代化的用户界面框架
- **Vite**：快速的构建工具和开发服务器
- **Tailwind CSS**：实用优先的CSS框架
- **Lucide React**：现代化的图标库
- **Socket.IO Client**：实时通信客户端

#### 后端技术栈

- **Node.js**：JavaScript运行时环境
- **Express.js**：Web应用框架
- **Socket.IO**：实时双向通信
- **CORS**：跨域资源共享中间件

#### AI训练技术栈

- **Python 3.11**：编程语言
- **NumPy**：数值计算库
- **Pickle**：模型序列化
- **WebSocket**：实时通信协议

## 核心模块详解

### 1. 前端游戏引擎

#### DinoGame组件架构

```javascript
DinoGame
├── 游戏状态管理
│   ├── gameState: 'waiting' | 'playing' | 'gameOver' | 'completed'
│   ├── score: number
│   └── highScore: number
├── 游戏对象
│   ├── Dino类
│   │   ├── 位置和速度
│   │   ├── 跳跃和下蹲逻辑
│   │   └── 碰撞检测
│   ├── Obstacle类
│   │   ├── 仙人掌障碍物
│   │   ├── 翼龙障碍物
│   │   └── 移动和渲染
│   └── Ground类
│       ├── 地面渲染
│       └── 滚动效果
├── 游戏循环
│   ├── 更新逻辑（60 FPS）
│   ├── 渲染逻辑
│   └── 输入处理
└── AI集成
    ├── 状态数据收集
    ├── 动作执行
    └── 性能统计
```

#### 游戏配置常量

```javascript
const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 200,
  GROUND_Y: 150,
  DINO_X: 50,
  GRAVITY: 0.6,
  JUMP_FORCE: -12,
  GAME_SPEED: 6,
  MAX_SPEED: 13,
  ACCELERATION: 0.001,
  MAX_SCORE: 5000
}
```

### 2. 后端API设计

#### RESTful API端点

```javascript
// 服务器状态
GET /api/status
Response: {
  server: "AI Dino Arena Backend",
  version: "1.0.0",
  timestamp: "2025-06-19T02:16:14.004Z"
}

// 训练状态查询
GET /api/training/status
Response: {
  isTraining: boolean,
  episode: number,
  score: number,
  highScore: number,
  learningRate: number,
  epsilon: number,
  logs: string[]
}

// 开始训练
POST /api/training/start
Request: { episodes?: number }
Response: { message: string, status: object }

// 停止训练
POST /api/training/stop
Response: { message: string, status: object }

// 模型状态
GET /api/model/status
Response: {
  isLoaded: boolean,
  modelPath: string,
  performance: {
    averageScore: number,
    maxScore: number,
    gamesPlayed: number
  }
}
```

#### WebSocket事件系统

```javascript
// 客户端 → 服务器
socket.emit('ai:getAction', gameState)
socket.emit('game:update', gameData)

// 服务器 → 客户端
socket.emit('training:started', trainingState)
socket.emit('training:update', trainingState)
socket.emit('training:log', logEntry)
socket.emit('ai:action', action)
socket.emit('model:performance', performance)
```

### 3. AI训练系统

#### 环境模拟器（DinoEnvironment）

```python
class DinoEnvironment:
    def __init__(self):
        # 游戏物理参数
        self.GRAVITY = 0.6
        self.JUMP_FORCE = -12
        self.GAME_SPEED = 6
        
    def reset(self) -> np.ndarray:
        """重置环境，返回初始状态"""
        
    def step(self, action: int) -> Tuple[np.ndarray, float, bool]:
        """执行动作，返回(新状态, 奖励, 是否结束)"""
        
    def get_state(self) -> np.ndarray:
        """获取当前状态向量"""
        
    def check_collision(self) -> bool:
        """检查碰撞"""
```

#### Q-learning智能体

```python
class QLearningAgent:
    def __init__(self, state_size=9, action_size=3):
        self.q_table = {}  # 状态-动作值表
        self.epsilon = 1.0  # 探索率
        self.learning_rate = 0.001
        self.gamma = 0.95  # 折扣因子
        
    def get_action(self, state: np.ndarray) -> int:
        """ε-贪婪策略选择动作"""
        
    def update_q_table(self, state, action, reward, next_state, done):
        """Q-learning更新规则"""
        
    def discretize_state(self, state: np.ndarray) -> tuple:
        """状态离散化"""
```

#### 训练管理器

```python
class DinoTrainer:
    def __init__(self):
        self.env = DinoEnvironment()
        self.agent = QLearningAgent()
        
    def train(self, episodes: int):
        """执行训练循环"""
        for episode in range(episodes):
            state = self.env.reset()
            while not self.env.game_over:
                action = self.agent.get_action(state)
                next_state, reward, done = self.env.step(action)
                self.agent.update_q_table(state, action, reward, next_state, done)
                state = next_state
```

## 数据流设计

### 1. 游戏状态数据流

```
用户输入 → 游戏引擎 → 状态更新 → 渲染输出
    ↓           ↓           ↓           ↓
键盘事件    物理计算    分数更新    Canvas绘制
```

### 2. AI训练数据流

```
环境状态 → AI智能体 → 动作选择 → 环境反馈 → Q值更新
    ↓         ↓         ↓         ↓         ↓
状态向量   ε-贪婪策略  动作执行   奖励计算   学习更新
```

### 3. 实时通信数据流

```
前端游戏 ←→ WebSocket ←→ 后端服务 ←→ AI训练模块
    ↓           ↓           ↓           ↓
游戏状态    实时传输    状态管理    训练控制
```

## 关键算法实现

### 1. 碰撞检测算法

```javascript
function checkCollision(dino, obstacle) {
  const dinoRect = {
    x: dino.x + 5,
    y: dino.y + 5,
    width: dino.width - 10,
    height: (dino.isDucking ? 26 : dino.height) - 10
  }
  
  const obstacleRect = {
    x: obstacle.x + 5,
    y: obstacle.y + 5,
    width: obstacle.width - 10,
    height: obstacle.height - 10
  }
  
  return (dinoRect.x < obstacleRect.x + obstacleRect.width &&
          dinoRect.x + dinoRect.width > obstacleRect.x &&
          dinoRect.y < obstacleRect.y + obstacleRect.height &&
          dinoRect.y + dinoRect.height > obstacleRect.y)
}
```

### 2. 状态空间设计

```python
def get_state(self):
    """9维状态向量"""
    state = np.zeros(9)
    
    # 恐龙状态 (4维)
    state[0] = (self.dino_y - self.ground_y) / 100.0  # Y位置
    state[1] = self.dino_velocity_y / 20.0            # 垂直速度
    state[2] = 1.0 if self.is_jumping else 0.0       # 跳跃状态
    state[3] = 1.0 if self.is_ducking else 0.0       # 下蹲状态
    
    # 障碍物信息 (4维)
    nearest_obstacle = self.get_nearest_obstacle()
    if nearest_obstacle:
        state[4] = min(nearest_obstacle['distance'] / 200.0, 1.0)  # 距离
        state[5] = nearest_obstacle['y'] / self.canvas_height       # 高度
        state[6] = 1.0 if nearest_obstacle['type'] == 'cactus' else 0.0  # 类型
        state[7] = 1.0  # 存在障碍物
    
    # 游戏速度 (1维)
    state[8] = (self.speed - self.game_speed) / (self.max_speed - self.game_speed)
    
    return state
```

### 3. 奖励函数设计

```python
def calculate_reward(self, action, collision):
    """奖励函数"""
    if collision:
        return -100  # 碰撞惩罚
    
    reward = 1  # 基础存活奖励
    
    # 距离奖励
    nearest_obstacle = self.get_nearest_obstacle()
    if nearest_obstacle and nearest_obstacle['distance'] < 50:
        reward += 5  # 成功避开近距离障碍物
    
    # 分数里程碑奖励
    if self.score > 0 and int(self.score) % 100 == 0:
        reward += 10
    
    return reward
```

## 性能优化策略

### 1. 前端优化

#### 游戏循环优化

```javascript
class GameLoop {
  constructor() {
    this.lastTime = 0
    this.accumulator = 0
    this.fixedTimeStep = 1000 / 60  // 60 FPS
  }
  
  update(currentTime) {
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    this.accumulator += deltaTime
    
    // 固定时间步长更新
    while (this.accumulator >= this.fixedTimeStep) {
      this.gameLogic.update(this.fixedTimeStep)
      this.accumulator -= this.fixedTimeStep
    }
    
    // 插值渲染
    const alpha = this.accumulator / this.fixedTimeStep
    this.renderer.render(alpha)
  }
}
```

#### Canvas渲染优化

```javascript
// 使用离屏Canvas预渲染静态元素
const offscreenCanvas = new OffscreenCanvas(800, 200)
const offscreenCtx = offscreenCanvas.getContext('2d')

// 预渲染地面
function prerenderGround() {
  offscreenCtx.fillStyle = '#83a598'
  offscreenCtx.fillRect(0, 150, 800, 50)
}

// 主渲染循环中使用预渲染内容
function render() {
  ctx.drawImage(offscreenCanvas, 0, 0)
  // 渲染动态元素...
}
```

### 2. 后端优化

#### 连接池管理

```javascript
class ConnectionManager {
  constructor() {
    this.connections = new Map()
    this.maxConnections = 1000
  }
  
  addConnection(socket) {
    if (this.connections.size >= this.maxConnections) {
      socket.disconnect()
      return false
    }
    
    this.connections.set(socket.id, {
      socket,
      lastActivity: Date.now()
    })
    return true
  }
  
  cleanupInactiveConnections() {
    const now = Date.now()
    const timeout = 5 * 60 * 1000  // 5分钟超时
    
    for (const [id, conn] of this.connections) {
      if (now - conn.lastActivity > timeout) {
        conn.socket.disconnect()
        this.connections.delete(id)
      }
    }
  }
}
```

### 3. AI训练优化

#### 经验回放机制

```python
from collections import deque
import random

class ExperienceReplay:
    def __init__(self, capacity=10000):
        self.memory = deque(maxlen=capacity)
    
    def push(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))
    
    def sample(self, batch_size):
        return random.sample(self.memory, min(batch_size, len(self.memory)))
    
    def __len__(self):
        return len(self.memory)
```

#### 批量Q值更新

```python
def batch_update(self, batch_size=32):
    """批量更新Q值"""
    if len(self.memory) < batch_size:
        return
    
    batch = self.memory.sample(batch_size)
    
    for state, action, reward, next_state, done in batch:
        discrete_state = self.discretize_state(state)
        discrete_next_state = self.discretize_state(next_state)
        
        if discrete_state not in self.q_table:
            self.q_table[discrete_state] = np.zeros(self.action_size)
        
        if discrete_next_state not in self.q_table:
            self.q_table[discrete_next_state] = np.zeros(self.action_size)
        
        target = reward
        if not done:
            target += self.gamma * np.max(self.q_table[discrete_next_state])
        
        self.q_table[discrete_state][action] += self.learning_rate * (
            target - self.q_table[discrete_state][action]
        )
```

## 测试策略

### 1. 单元测试

#### 前端组件测试

```javascript
// DinoGame.test.js
import { render, screen } from '@testing-library/react'
import DinoGame from './DinoGame'

describe('DinoGame Component', () => {
  test('renders game canvas', () => {
    render(<DinoGame mode="player" />)
    const canvas = screen.getByRole('img')
    expect(canvas).toBeInTheDocument()
  })
  
  test('handles keyboard input', () => {
    const { container } = render(<DinoGame mode="player" />)
    const canvas = container.querySelector('canvas')
    
    fireEvent.keyDown(canvas, { key: ' ' })
    // 验证跳跃逻辑
  })
})
```

#### 后端API测试

```javascript
// server.test.js
const request = require('supertest')
const app = require('./server')

describe('API Endpoints', () => {
  test('GET /api/status', async () => {
    const response = await request(app).get('/api/status')
    expect(response.status).toBe(200)
    expect(response.body.server).toBe('AI Dino Arena Backend')
  })
  
  test('POST /api/training/start', async () => {
    const response = await request(app)
      .post('/api/training/start')
      .send({ episodes: 10 })
    expect(response.status).toBe(200)
  })
})
```

### 2. 集成测试

#### WebSocket通信测试

```javascript
// websocket.test.js
const Client = require('socket.io-client')

describe('WebSocket Communication', () => {
  let clientSocket
  
  beforeAll((done) => {
    clientSocket = new Client('http://localhost:3001')
    clientSocket.on('connect', done)
  })
  
  afterAll(() => {
    clientSocket.close()
  })
  
  test('training status update', (done) => {
    clientSocket.emit('training:start')
    clientSocket.on('training:update', (data) => {
      expect(data.isTraining).toBe(true)
      done()
    })
  })
})
```

### 3. 性能测试

#### 负载测试

```javascript
// load-test.js
const io = require('socket.io-client')

async function loadTest() {
  const connections = []
  const numConnections = 100
  
  for (let i = 0; i < numConnections; i++) {
    const socket = io('http://localhost:3001')
    connections.push(socket)
    
    socket.on('connect', () => {
      console.log(`Connection ${i} established`)
    })
  }
  
  // 模拟并发请求
  setInterval(() => {
    connections.forEach(socket => {
      socket.emit('ai:getAction', { test: true })
    })
  }, 100)
}

loadTest()
```

## 部署和运维

### 1. 容器化部署

#### Dockerfile

```dockerfile
# 前端构建
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/ai-dino-arena/package*.json ./
RUN npm install
COPY frontend/ai-dino-arena/ ./
RUN npm run build

# 后端运行时
FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public

# Python AI训练
FROM python:3.11-alpine AS ai-trainer
WORKDIR /app/ai_trainer
COPY ai_trainer/requirements.txt ./
RUN pip install -r requirements.txt
COPY ai_trainer/ ./

EXPOSE 3001
CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
  
  ai-trainer:
    build:
      context: .
      target: ai-trainer
    ports:
      - "8765:8765"
    volumes:
      - ./models:/app/models
    restart: unless-stopped
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped
```

### 2. 监控和日志

#### 应用监控

```javascript
// monitoring.js
const prometheus = require('prom-client')

// 创建指标
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
})

const activeConnections = new prometheus.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections'
})

// 中间件
function metricsMiddleware(req, res, next) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration)
  })
  
  next()
}

module.exports = { metricsMiddleware, activeConnections }
```

#### 日志系统

```javascript
// logger.js
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

module.exports = logger
```

## 扩展开发指南

### 1. 添加新的AI算法

#### 算法接口定义

```python
from abc import ABC, abstractmethod

class AIAgent(ABC):
    @abstractmethod
    def get_action(self, state: np.ndarray) -> int:
        """根据状态选择动作"""
        pass
    
    @abstractmethod
    def update(self, state, action, reward, next_state, done):
        """更新模型参数"""
        pass
    
    @abstractmethod
    def save_model(self, filepath: str):
        """保存模型"""
        pass
    
    @abstractmethod
    def load_model(self, filepath: str):
        """加载模型"""
        pass
```

#### DQN算法实现示例

```python
import torch
import torch.nn as nn

class DQNAgent(AIAgent):
    def __init__(self, state_size, action_size):
        self.state_size = state_size
        self.action_size = action_size
        self.q_network = self._build_network()
        self.target_network = self._build_network()
        
    def _build_network(self):
        return nn.Sequential(
            nn.Linear(self.state_size, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
            nn.Linear(64, self.action_size)
        )
    
    def get_action(self, state):
        if random.random() < self.epsilon:
            return random.randint(0, self.action_size - 1)
        
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        q_values = self.q_network(state_tensor)
        return q_values.argmax().item()
```

### 2. 多人对战模式

#### 房间管理系统

```javascript
class RoomManager {
  constructor() {
    this.rooms = new Map()
  }
  
  createRoom(roomId, maxPlayers = 4) {
    this.rooms.set(roomId, {
      id: roomId,
      players: new Map(),
      maxPlayers,
      gameState: 'waiting',
      createdAt: Date.now()
    })
  }
  
  joinRoom(roomId, playerId, socket) {
    const room = this.rooms.get(roomId)
    if (!room || room.players.size >= room.maxPlayers) {
      return false
    }
    
    room.players.set(playerId, {
      id: playerId,
      socket,
      score: 0,
      status: 'alive'
    })
    
    return true
  }
  
  broadcastToRoom(roomId, event, data) {
    const room = this.rooms.get(roomId)
    if (!room) return
    
    room.players.forEach(player => {
      player.socket.emit(event, data)
    })
  }
}
```

### 3. 移动端适配

#### 触摸控制

```javascript
class TouchController {
  constructor(canvas) {
    this.canvas = canvas
    this.setupTouchEvents()
  }
  
  setupTouchEvents() {
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))
  }
  
  handleTouchStart(event) {
    event.preventDefault()
    const touch = event.touches[0]
    const rect = this.canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    if (y < this.canvas.height / 2) {
      this.game.dino.jump()  // 上半部分跳跃
    } else {
      this.game.dino.duck()  // 下半部分下蹲
    }
  }
}
```

---

本文档提供了AI Dino Arena项目的完整技术实现细节，为开发者提供深入理解和扩展项目的指导。


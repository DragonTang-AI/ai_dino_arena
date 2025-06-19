const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const { spawn } = require('child_process')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// 中间件
app.use(cors())
app.use(express.json())

// 存储AI训练状态
let trainingState = {
  isTraining: false,
  episode: 0,
  score: 0,
  highScore: 0,
  learningRate: 0.001,
  epsilon: 1.0,
  logs: []
}

// 存储AI模型状态
let aiModel = {
  isLoaded: false,
  modelPath: null,
  performance: {
    averageScore: 0,
    maxScore: 0,
    gamesPlayed: 0
  }
}

// API路由
app.get('/api/status', (req, res) => {
  res.json({
    server: 'AI Dino Arena Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/training/status', (req, res) => {
  res.json(trainingState)
})

app.post('/api/training/start', (req, res) => {
  if (trainingState.isTraining) {
    return res.status(400).json({ error: 'Training already in progress' })
  }

  // 启动AI训练进程
  startTraining()
  res.json({ message: 'Training started', status: trainingState })
})

app.post('/api/training/stop', (req, res) => {
  if (!trainingState.isTraining) {
    return res.status(400).json({ error: 'No training in progress' })
  }

  stopTraining()
  res.json({ message: 'Training stopped', status: trainingState })
})

app.get('/api/model/status', (req, res) => {
  res.json(aiModel)
})

app.post('/api/model/load', (req, res) => {
  const { modelPath } = req.body
  
  if (!modelPath) {
    return res.status(400).json({ error: 'Model path required' })
  }

  // 模拟加载模型
  aiModel.isLoaded = true
  aiModel.modelPath = modelPath
  
  res.json({ message: 'Model loaded successfully', model: aiModel })
})

// AI训练相关函数
let trainingProcess = null

function startTraining() {
  trainingState.isTraining = true
  trainingState.episode = 0
  trainingState.score = 0
  trainingState.logs = []
  
  // 添加初始日志
  addTrainingLog('[INFO] 开始AI训练...')
  addTrainingLog('[INFO] 初始化Q-learning算法...')
  addTrainingLog('[INFO] 设置学习参数...')
  
  // 广播训练开始
  io.emit('training:started', trainingState)
  
  // 模拟训练过程
  simulateTraining()
}

function stopTraining() {
  trainingState.isTraining = false
  
  if (trainingProcess) {
    trainingProcess.kill()
    trainingProcess = null
  }
  
  addTrainingLog('[INFO] 训练已停止')
  io.emit('training:stopped', trainingState)
}

function simulateTraining() {
  if (!trainingState.isTraining) return
  
  // 模拟训练回合
  trainingState.episode++
  
  // 模拟游戏得分（随机但有学习趋势）
  const baseScore = Math.min(trainingState.episode * 2, 500)
  const randomFactor = Math.random() * 100
  trainingState.score = Math.floor(baseScore + randomFactor)
  
  if (trainingState.score > trainingState.highScore) {
    trainingState.highScore = trainingState.score
    addTrainingLog(`[SUCCESS] 新纪录! 得分: ${trainingState.score}`)
  }
  
  // 更新epsilon（探索率递减）
  trainingState.epsilon = Math.max(0.01, trainingState.epsilon * 0.995)
  
  // 添加训练日志
  if (trainingState.episode % 10 === 0) {
    addTrainingLog(`[EPISODE ${trainingState.episode}] 得分: ${trainingState.score}, Epsilon: ${trainingState.epsilon.toFixed(3)}`)
  }
  
  // 广播训练状态更新
  io.emit('training:update', trainingState)
  
  // 继续下一回合
  setTimeout(() => {
    simulateTraining()
  }, 1000 + Math.random() * 2000) // 1-3秒间隔
}

function addTrainingLog(message) {
  const timestamp = new Date().toLocaleTimeString()
  const logEntry = `[${timestamp}] ${message}`
  
  trainingState.logs.push(logEntry)
  
  // 保持最新50条日志
  if (trainingState.logs.length > 50) {
    trainingState.logs.shift()
  }
  
  // 广播新日志
  io.emit('training:log', logEntry)
}

// WebSocket连接处理
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // 发送当前状态
  socket.emit('training:status', trainingState)
  socket.emit('model:status', aiModel)
  
  // 处理AI动作请求
  socket.on('ai:getAction', (gameState) => {
    // 简单的AI决策逻辑
    const action = getAIAction(gameState)
    socket.emit('ai:action', action)
  })
  
  // 处理游戏状态更新
  socket.on('game:update', (gameData) => {
    // 更新AI模型性能统计
    if (gameData.gameOver && gameData.mode === 'demo') {
      aiModel.performance.gamesPlayed++
      aiModel.performance.averageScore = 
        (aiModel.performance.averageScore * (aiModel.performance.gamesPlayed - 1) + gameData.score) / 
        aiModel.performance.gamesPlayed
      
      if (gameData.score > aiModel.performance.maxScore) {
        aiModel.performance.maxScore = gameData.score
      }
      
      io.emit('model:performance', aiModel.performance)
    }
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// AI决策函数
function getAIAction(gameState) {
  const { dino, obstacles, speed } = gameState
  
  if (!obstacles || obstacles.length === 0) {
    return 'none'
  }
  
  // 找到最近的障碍物
  const nearestObstacle = obstacles.find(obstacle => 
    obstacle.x > dino.x && obstacle.x < dino.x + 200
  )
  
  if (!nearestObstacle) {
    return 'none'
  }
  
  // 决策逻辑
  const distance = nearestObstacle.x - dino.x
  const reactionTime = 150 - speed * 5 // 根据速度调整反应时间
  
  if (distance < reactionTime) {
    if (nearestObstacle.type === 'cactus') {
      return 'jump'
    } else if (nearestObstacle.type === 'pterodactyl') {
      // 根据翼龙高度决定跳跃还是下蹲
      if (nearestObstacle.y > 100) {
        return 'duck'
      } else {
        return 'jump'
      }
    }
  }
  
  return 'none'
}

// 启动服务器
const PORT = process.env.PORT || 3001

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Dino Arena Backend running on port ${PORT}`)
  console.log(`WebSocket server ready for connections`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Shutting down server...')
  
  if (trainingState.isTraining) {
    stopTraining()
  }
  
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})


import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Gamepad2, Brain, Play, Trophy, Zap } from 'lucide-react'
import DinoGame from './components/DinoGame.jsx'
import useSocket from './hooks/useSocket.js'
import './App.css'

function App() {
  const [gameMode, setGameMode] = useState('menu')
  const [currentScore, setCurrentScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameState, setGameState] = useState('waiting')
  
  const { 
    connected, 
    trainingState, 
    startTraining, 
    stopTraining, 
    getAIAction, 
    updateGameState 
  } = useSocket()

  const handleScoreUpdate = (score) => {
    setCurrentScore(score)
    if (score > highScore) {
      setHighScore(score)
    }
  }

  const handleGameStateChange = (state) => {
    setGameState(state)
    
    // 向后端发送游戏状态更新
    updateGameState({
      mode: gameMode,
      score: currentScore,
      gameOver: state === 'gameOver',
      completed: state === 'completed'
    })
  }

  const GameMenu = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-4 animate-bounce">
            🦕 AI Dino Arena
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            智能恐龙游戏网站
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            体验经典Chrome恐龙游戏 + AI强化学习训练
          </p>
        </div>

        {/* Game Modes */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Player Mode */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-blue-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-blue-600 dark:text-blue-300" />
              </div>
              <CardTitle className="text-2xl">玩家纯玩</CardTitle>
              <CardDescription>
                经典Chrome恐龙游戏体验
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                使用键盘控制恐龙跳跃和下蹲，躲避障碍物，挑战高分记录
              </p>
              <Button 
                className="w-full" 
                onClick={() => setGameMode('player')}
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                开始游戏
              </Button>
              <div className="mt-4 text-sm text-gray-500">
                <div>空格键 = 跳跃</div>
                <div>↓ 键 = 下蹲</div>
              </div>
            </CardContent>
          </Card>

          {/* AI Training Mode */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-green-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center">
                <Brain className="w-8 h-8 text-green-600 dark:text-green-300" />
              </div>
              <CardTitle className="text-2xl">AI强化学习训练</CardTitle>
              <CardDescription>
                观看AI学习游戏过程
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                使用Q-learning算法训练AI代理，实时观看训练过程和学习进度
              </p>
              <Button 
                className="w-full" 
                onClick={() => {
                  setGameMode('training')
                  startTraining()
                }}
                size="lg"
                variant="outline"
                disabled={!connected}
              >
                <Zap className="w-4 h-4 mr-2" />
                {connected ? '开始训练' : '连接中...'}
              </Button>
              <div className="mt-4 text-sm text-gray-500">
                <div>CPU强化学习</div>
                <div>实时训练日志</div>
              </div>
            </CardContent>
          </Card>

          {/* AI Demo Mode */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-purple-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-purple-600 dark:text-purple-300" />
              </div>
              <CardTitle className="text-2xl">AI演示模式</CardTitle>
              <CardDescription>
                观看训练好的AI游戏
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                展示已训练完成的AI模型自动游戏，观看AI的游戏策略和表现
              </p>
              <Button 
                className="w-full" 
                onClick={() => setGameMode('demo')}
                size="lg"
                variant="secondary"
              >
                <Play className="w-4 h-4 mr-2" />
                观看演示
              </Button>
              <div className="mt-4 text-sm text-gray-500">
                <div>AI自动游戏</div>
                <div>策略展示</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 dark:text-gray-400">
          <p className="mb-2">© 2025 AI Dino Arena. All rights reserved.</p>
          <p>
            <a 
              href="https://beian.miit.gov.cn/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors"
            >
              青ICP备20000797号-1
            </a>
          </p>
        </footer>
      </div>
    </div>
  )

  const GameArea = () => (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-yellow-100 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={() => setGameMode('menu')}
            variant="outline"
            size="sm"
          >
            ← 返回菜单
          </Button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {gameMode === 'player' && '玩家模式'}
            {gameMode === 'training' && 'AI训练模式'}
            {gameMode === 'demo' && 'AI演示模式'}
          </h2>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-300">得分</div>
            <div className="text-xl font-bold">{currentScore}</div>
            <div className="text-xs text-gray-500">最高: {highScore}</div>
          </div>
        </div>

        {/* Game Canvas Area */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <DinoGame 
              mode={gameMode}
              onScoreUpdate={handleScoreUpdate}
              onGameStateChange={handleGameStateChange}
              getAIAction={getAIAction}
            />
          </CardContent>
        </Card>

        {/* Training Info (only for training mode) */}
        {gameMode === 'training' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>训练状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>训练回合:</span>
                    <span className="font-mono">{trainingState.episode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>当前得分:</span>
                    <span className="font-mono">{trainingState.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最高得分:</span>
                    <span className="font-mono">{trainingState.highScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>学习率:</span>
                    <span className="font-mono">{trainingState.learningRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>探索率:</span>
                    <span className="font-mono">{trainingState.epsilon.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>连接状态:</span>
                    <span className={`font-mono ${connected ? 'text-green-600' : 'text-red-600'}`}>
                      {connected ? '已连接' : '未连接'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>训练日志</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-32 overflow-y-auto">
                  {trainingState.logs.length > 0 ? (
                    trainingState.logs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))
                  ) : (
                    <>
                      <div>[INFO] 等待训练开始...</div>
                      <div>[INFO] 后端连接状态: {connected ? '已连接' : '未连接'}</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="App">
      {gameMode === 'menu' ? <GameMenu /> : <GameArea />}
    </div>
  )
}

export default App


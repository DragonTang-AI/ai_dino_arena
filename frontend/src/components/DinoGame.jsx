import { useEffect, useRef, useState, useCallback } from 'react'
import dinoSprite from '../assets/dino_sprite.png'

const DinoGame = ({ mode = 'player', onScoreUpdate, onGameStateChange }) => {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState('waiting') // waiting, playing, gameOver
  const [isNight, setIsNight] = useState(false)

  // 游戏常量
  const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 200,
    GROUND_Y: 150,
    DINO_X: 50,
    DINO_WIDTH: 44,
    DINO_HEIGHT: 47,
    CACTUS_WIDTH: 17,
    CACTUS_HEIGHT: 35,
    PTERODACTYL_WIDTH: 46,
    PTERODACTYL_HEIGHT: 40,
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    DUCK_HEIGHT: 26,
    MIN_OBSTACLE_DISTANCE: 120,
    MAX_OBSTACLE_DISTANCE: 200,
    GAME_SPEED: 6,
    MAX_SPEED: 13,
    ACCELERATION: 0.001,
    NIGHT_MODE_SCORE: 700,
    MAX_SCORE: 5000
  }

  // 游戏对象类
  class GameObject {
    constructor(x, y, width, height) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
    }

    draw(ctx) {
      // 基础绘制方法，子类重写
    }

    update() {
      // 基础更新方法，子类重写
    }

    getCollisionBox() {
      return {
        x: this.x + 5,
        y: this.y + 5,
        width: this.width - 10,
        height: this.height - 10
      }
    }
  }

  class Dino extends GameObject {
    constructor(x, y) {
      super(x, y, GAME_CONFIG.DINO_WIDTH, GAME_CONFIG.DINO_HEIGHT)
      this.velocityY = 0
      this.isJumping = false
      this.isDucking = false
      this.animationFrame = 0
      this.animationTimer = 0
    }

    jump() {
      if (!this.isJumping && !this.isDucking) {
        this.velocityY = GAME_CONFIG.JUMP_FORCE
        this.isJumping = true
      }
    }

    duck() {
      if (!this.isJumping) {
        this.isDucking = true
        this.height = GAME_CONFIG.DUCK_HEIGHT
        this.y = GAME_CONFIG.GROUND_Y - this.height
      }
    }

    stopDuck() {
      this.isDucking = false
      this.height = GAME_CONFIG.DINO_HEIGHT
      this.y = GAME_CONFIG.GROUND_Y - this.height
    }

    update() {
      // 重力和跳跃逻辑
      if (this.isJumping) {
        this.velocityY += GAME_CONFIG.GRAVITY
        this.y += this.velocityY

        if (this.y >= GAME_CONFIG.GROUND_Y - this.height) {
          this.y = GAME_CONFIG.GROUND_Y - this.height
          this.isJumping = false
          this.velocityY = 0
        }
      }

      // 动画帧更新
      this.animationTimer++
      if (this.animationTimer % 6 === 0) {
        this.animationFrame = (this.animationFrame + 1) % 2
      }
    }

    draw(ctx) {
      // 简化的恐龙绘制
      ctx.fillStyle = isNight ? '#fff' : '#535353'
      
      if (this.isDucking) {
        // 下蹲状态
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.fillRect(this.x + 10, this.y - 5, 15, 8) // 头部
      } else {
        // 正常状态
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.fillRect(this.x + 30, this.y - 10, 14, 15) // 头部
        
        // 腿部动画
        if (this.animationFrame === 0) {
          ctx.fillRect(this.x + 15, this.y + this.height, 8, 10)
          ctx.fillRect(this.x + 25, this.y + this.height, 8, 10)
        } else {
          ctx.fillRect(this.x + 12, this.y + this.height, 8, 10)
          ctx.fillRect(this.x + 28, this.y + this.height, 8, 10)
        }
      }
    }
  }

  class Obstacle extends GameObject {
    constructor(x, y, width, height, type) {
      super(x, y, width, height)
      this.type = type // 'cactus' or 'pterodactyl'
      this.animationFrame = 0
      this.animationTimer = 0
    }

    update(speed) {
      this.x -= speed
      
      if (this.type === 'pterodactyl') {
        this.animationTimer++
        if (this.animationTimer % 10 === 0) {
          this.animationFrame = (this.animationFrame + 1) % 2
        }
      }
    }

    draw(ctx) {
      ctx.fillStyle = isNight ? '#fff' : '#535353'
      
      if (this.type === 'cactus') {
        // 仙人掌
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.fillRect(this.x + 5, this.y - 10, 7, 15)
      } else if (this.type === 'pterodactyl') {
        // 翼龙
        ctx.fillRect(this.x, this.y, this.width, this.height)
        
        // 翅膀动画
        if (this.animationFrame === 0) {
          ctx.fillRect(this.x - 5, this.y + 5, 15, 8)
          ctx.fillRect(this.x + 35, this.y + 5, 15, 8)
        } else {
          ctx.fillRect(this.x - 3, this.y + 8, 12, 5)
          ctx.fillRect(this.x + 37, this.y + 8, 12, 5)
        }
      }
    }
  }

  class Cloud extends GameObject {
    constructor(x, y) {
      super(x, y, 46, 14)
    }

    update(speed) {
      this.x -= speed * 0.5
    }

    draw(ctx) {
      ctx.fillStyle = isNight ? '#555' : '#ccc'
      ctx.fillRect(this.x, this.y, this.width, this.height)
      ctx.fillRect(this.x + 10, this.y - 5, 26, 10)
    }
  }

  // 碰撞检测
  const checkCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  }

  // 游戏初始化
  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    const game = {
      dino: new Dino(GAME_CONFIG.DINO_X, GAME_CONFIG.GROUND_Y - GAME_CONFIG.DINO_HEIGHT),
      obstacles: [],
      clouds: [],
      score: 0,
      speed: GAME_CONFIG.GAME_SPEED,
      nextObstacleDistance: GAME_CONFIG.MIN_OBSTACLE_DISTANCE,
      gameState: 'waiting',
      keys: {},
      lastTime: 0,
      cloudTimer: 0
    }

    // 添加初始云朵
    for (let i = 0; i < 3; i++) {
      game.clouds.push(new Cloud(
        Math.random() * GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.CANVAS_WIDTH,
        Math.random() * 50 + 20
      ))
    }

    gameRef.current = game
    return game
  }, [])

  // 游戏循环
  const gameLoop = useCallback((currentTime) => {
    const game = gameRef.current
    if (!game || !canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    const deltaTime = currentTime - game.lastTime
    game.lastTime = currentTime

    // 清空画布
    ctx.fillStyle = isNight ? '#000' : '#f7f7f7'
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)

    // 绘制地面
    ctx.fillStyle = isNight ? '#555' : '#535353'
    ctx.fillRect(0, GAME_CONFIG.GROUND_Y + 10, GAME_CONFIG.CANVAS_WIDTH, 2)

    if (game.gameState === 'waiting') {
      // 等待开始状态
      ctx.fillStyle = isNight ? '#fff' : '#535353'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('按空格键开始游戏', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2)
      
      game.dino.draw(ctx)
      
    } else if (game.gameState === 'playing') {
      // 游戏进行中
      
      // 更新速度
      game.speed = Math.min(GAME_CONFIG.MAX_SPEED, GAME_CONFIG.GAME_SPEED + game.score * GAME_CONFIG.ACCELERATION)
      
      // 更新恐龙
      game.dino.update()
      
      // 处理输入（仅玩家模式）
      if (mode === 'player') {
        if (game.keys['Space'] || game.keys['ArrowUp']) {
          game.dino.jump()
        }
        if (game.keys['ArrowDown']) {
          game.dino.duck()
        } else {
          game.dino.stopDuck()
        }
      }
      
      // 生成障碍物
      game.nextObstacleDistance -= game.speed
      if (game.nextObstacleDistance <= 0) {
        const obstacleType = Math.random() > 0.7 ? 'pterodactyl' : 'cactus'
        const obstacle = obstacleType === 'pterodactyl' 
          ? new Obstacle(
              GAME_CONFIG.CANVAS_WIDTH,
              GAME_CONFIG.GROUND_Y - 80,
              GAME_CONFIG.PTERODACTYL_WIDTH,
              GAME_CONFIG.PTERODACTYL_HEIGHT,
              'pterodactyl'
            )
          : new Obstacle(
              GAME_CONFIG.CANVAS_WIDTH,
              GAME_CONFIG.GROUND_Y - GAME_CONFIG.CACTUS_HEIGHT,
              GAME_CONFIG.CACTUS_WIDTH,
              GAME_CONFIG.CACTUS_HEIGHT,
              'cactus'
            )
        
        game.obstacles.push(obstacle)
        game.nextObstacleDistance = GAME_CONFIG.MIN_OBSTACLE_DISTANCE + 
          Math.random() * (GAME_CONFIG.MAX_OBSTACLE_DISTANCE - GAME_CONFIG.MIN_OBSTACLE_DISTANCE)
      }
      
      // 更新障碍物
      game.obstacles = game.obstacles.filter(obstacle => {
        obstacle.update(game.speed)
        return obstacle.x + obstacle.width > 0
      })
      
      // 生成云朵
      game.cloudTimer += deltaTime
      if (game.cloudTimer > 3000) {
        game.clouds.push(new Cloud(
          GAME_CONFIG.CANVAS_WIDTH,
          Math.random() * 50 + 20
        ))
        game.cloudTimer = 0
      }
      
      // 更新云朵
      game.clouds = game.clouds.filter(cloud => {
        cloud.update(game.speed)
        return cloud.x + cloud.width > 0
      })
      
      // 碰撞检测
      const dinoBox = game.dino.getCollisionBox()
      for (let obstacle of game.obstacles) {
        const obstacleBox = obstacle.getCollisionBox()
        if (checkCollision(dinoBox, obstacleBox)) {
          game.gameState = 'gameOver'
          setGameState('gameOver')
          onGameStateChange && onGameStateChange('gameOver')
          break
        }
      }
      
      // 更新分数
      game.score += 0.1
      if (game.score >= GAME_CONFIG.MAX_SCORE) {
        game.gameState = 'gameOver'
        setGameState('gameOver')
        onGameStateChange && onGameStateChange('completed')
      }
      
      // 夜间模式切换
      if (game.score >= GAME_CONFIG.NIGHT_MODE_SCORE && !isNight) {
        setIsNight(true)
      }
      
      // 绘制云朵
      game.clouds.forEach(cloud => cloud.draw(ctx))
      
      // 绘制恐龙
      game.dino.draw(ctx)
      
      // 绘制障碍物
      game.obstacles.forEach(obstacle => obstacle.draw(ctx))
      
      // 绘制分数
      ctx.fillStyle = isNight ? '#fff' : '#535353'
      ctx.font = '16px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(`HI ${Math.floor(game.score).toString().padStart(5, '0')}`, GAME_CONFIG.CANVAS_WIDTH - 20, 30)
      
      setScore(Math.floor(game.score))
      onScoreUpdate && onScoreUpdate(Math.floor(game.score))
      
    } else if (game.gameState === 'gameOver') {
      // 游戏结束状态
      
      // 绘制云朵
      game.clouds.forEach(cloud => cloud.draw(ctx))
      
      // 绘制恐龙
      game.dino.draw(ctx)
      
      // 绘制障碍物
      game.obstacles.forEach(obstacle => obstacle.draw(ctx))
      
      // 游戏结束文本
      ctx.fillStyle = isNight ? '#fff' : '#535353'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 20)
      ctx.font = '16px Arial'
      ctx.fillText('按空格键重新开始', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 10)
      
      // 绘制分数
      ctx.font = '16px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(`HI ${Math.floor(game.score).toString().padStart(5, '0')}`, GAME_CONFIG.CANVAS_WIDTH - 20, 30)
    }

    requestAnimationFrame(gameLoop)
  }, [mode, isNight, onScoreUpdate, onGameStateChange])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      const game = gameRef.current
      if (!game) return

      game.keys[e.code] = true

      if (e.code === 'Space') {
        e.preventDefault()
        
        if (game.gameState === 'waiting') {
          game.gameState = 'playing'
          setGameState('playing')
          onGameStateChange && onGameStateChange('playing')
        } else if (game.gameState === 'gameOver') {
          // 重新开始游戏
          const newGame = initGame()
          newGame.gameState = 'playing'
          setGameState('playing')
          setScore(0)
          setIsNight(false)
          onGameStateChange && onGameStateChange('playing')
        }
      }
    }

    const handleKeyUp = (e) => {
      const game = gameRef.current
      if (!game) return
      
      game.keys[e.code] = false
    }

    if (mode === 'player') {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      if (mode === 'player') {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
      }
    }
  }, [mode, initGame, onGameStateChange])

// AI控制逻辑
  useEffect(() => {
    if (mode !== 'player') {
      const aiInterval = setInterval(async () => {
        const game = gameRef.current
        if (!game || game.gameState !== 'playing') return

        let action = 'none'
        
        if (getAIAction) {
          // 构建游戏状态数据
          const gameState = {
            dino: {
              x: game.dino.x,
              y: game.dino.y,
              isJumping: game.dino.isJumping,
              isDucking: game.dino.isDucking
            },
            obstacles: game.obstacles.map(obs => ({
              x: obs.x,
              y: obs.y,
              width: obs.width,
              height: obs.height,
              type: obs.type
            })),
            speed: game.speed,
            score: game.score
          }
          
          try {
            action = await getAIAction(gameState)
          } catch (error) {
            console.error('AI action error:', error)
          }
        }
        
        // 如果没有AI动作函数，使用简单的AI逻辑
        if (!getAIAction || action === 'none') {
          const nearestObstacle = game.obstacles.find(obstacle => 
            obstacle.x > game.dino.x && obstacle.x < game.dino.x + 150
          )

          if (nearestObstacle) {
            if (nearestObstacle.type === 'cactus') {
              action = 'jump'
            } else if (nearestObstacle.type === 'pterodactyl' && nearestObstacle.y > GAME_CONFIG.GROUND_Y - 60) {
              action = 'duck'
            } else {
              action = 'jump'
            }
          }
        }
        
        // 执行AI动作
        if (action === 'jump') {
          game.dino.jump()
        } else if (action === 'duck') {
          game.dino.duck()
        } else {
          game.dino.stopDuck()
        }
      }, 100)

      return () => clearInterval(aiInterval)
    }
  }, [mode, getAIAction])

  // 自动开始（非玩家模式）
  useEffect(() => {
    if (mode !== 'player') {
      const timer = setTimeout(() => {
        const game = gameRef.current
        if (game && game.gameState === 'waiting') {
          game.gameState = 'playing'
          setGameState('playing')
          onGameStateChange && onGameStateChange('playing')
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [mode, onGameStateChange])

  // 初始化游戏
  useEffect(() => {
    initGame()
    requestAnimationFrame(gameLoop)
  }, [initGame, gameLoop])

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.CANVAS_WIDTH}
        height={GAME_CONFIG.CANVAS_HEIGHT}
        className="border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}

export default DinoGame


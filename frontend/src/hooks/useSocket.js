import { useEffect, useState } from 'react'
import io from 'socket.io-client'

const useSocket = (serverUrl = 'http://localhost:3001') => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [trainingState, setTrainingState] = useState({
    isTraining: false,
    episode: 0,
    score: 0,
    highScore: 0,
    learningRate: 0.001,
    epsilon: 1.0,
    logs: []
  })

  useEffect(() => {
    const newSocket = io(serverUrl)
    
    newSocket.on('connect', () => {
      console.log('Connected to server')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setConnected(false)
    })

    newSocket.on('training:status', (status) => {
      setTrainingState(status)
    })

    newSocket.on('training:update', (status) => {
      setTrainingState(status)
    })

    newSocket.on('training:log', (logEntry) => {
      setTrainingState(prev => ({
        ...prev,
        logs: [...prev.logs, logEntry].slice(-50) // 保持最新50条
      }))
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [serverUrl])

  const startTraining = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/training/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      console.log('Training started:', result)
    } catch (error) {
      console.error('Failed to start training:', error)
    }
  }

  const stopTraining = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/training/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      console.log('Training stopped:', result)
    } catch (error) {
      console.error('Failed to stop training:', error)
    }
  }

  const getAIAction = (gameState) => {
    return new Promise((resolve) => {
      if (socket && connected) {
        socket.emit('ai:getAction', gameState)
        socket.once('ai:action', (action) => {
          resolve(action)
        })
      } else {
        resolve('none')
      }
    })
  }

  const updateGameState = (gameData) => {
    if (socket && connected) {
      socket.emit('game:update', gameData)
    }
  }

  return {
    socket,
    connected,
    trainingState,
    startTraining,
    stopTraining,
    getAIAction,
    updateGameState
  }
}

export default useSocket


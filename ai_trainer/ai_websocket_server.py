"""
AI Dino Arena - WebSocket集成模块
用于将Python AI训练模块与Node.js后端集成
"""

import asyncio
import websockets
import json
import threading
import time
from dino_ai_trainer import DinoTrainer

class AITrainingServer:
    """AI训练WebSocket服务器"""
    
    def __init__(self, host='localhost', port=8765):
        self.host = host
        self.port = port
        self.trainer = DinoTrainer()
        self.is_training = False
        self.training_thread = None
        self.clients = set()
        
        # 加载已有模型
        if self.trainer.load_model():
            print("成功加载已有AI模型")
    
    async def register_client(self, websocket):
        """注册客户端"""
        self.clients.add(websocket)
        print(f"客户端已连接: {websocket.remote_address}")
        
        # 发送当前状态
        await self.send_status(websocket)
    
    async def unregister_client(self, websocket):
        """注销客户端"""
        self.clients.discard(websocket)
        print(f"客户端已断开: {websocket.remote_address}")
    
    async def send_status(self, websocket=None):
        """发送训练状态"""
        status = {
            'type': 'training_status',
            'data': {
                'is_training': self.is_training,
                'episode': self.trainer.training_stats.get('episode', 0),
                'best_score': self.trainer.training_stats.get('best_score', 0),
                'average_score': self.trainer.training_stats.get('average_score', 0),
                'epsilon': self.trainer.agent.epsilon,
                'learning_rate': self.trainer.agent.learning_rate
            }
        }
        
        message = json.dumps(status)
        
        if websocket:
            await websocket.send(message)
        else:
            # 广播给所有客户端
            if self.clients:
                await asyncio.gather(
                    *[client.send(message) for client in self.clients],
                    return_exceptions=True
                )
    
    async def send_log(self, log_message):
        """发送训练日志"""
        log_data = {
            'type': 'training_log',
            'data': {
                'message': log_message,
                'timestamp': time.time()
            }
        }
        
        message = json.dumps(log_data)
        
        if self.clients:
            await asyncio.gather(
                *[client.send(message) for client in self.clients],
                return_exceptions=True
            )
    
    async def handle_message(self, websocket, message):
        """处理客户端消息"""
        try:
            data = json.loads(message)
            command = data.get('command')
            
            if command == 'start_training':
                await self.start_training(data.get('episodes', 100))
            elif command == 'stop_training':
                await self.stop_training()
            elif command == 'get_action':
                action = await self.get_ai_action(data.get('game_state'))
                response = {
                    'type': 'ai_action',
                    'data': {'action': action}
                }
                await websocket.send(json.dumps(response))
            elif command == 'get_status':
                await self.send_status(websocket)
                
        except json.JSONDecodeError:
            print(f"无效的JSON消息: {message}")
        except Exception as e:
            print(f"处理消息时出错: {e}")
    
    async def start_training(self, episodes=100):
        """开始训练"""
        if self.is_training:
            await self.send_log("训练已在进行中")
            return
        
        self.is_training = True
        await self.send_log(f"开始AI训练，目标回合数: {episodes}")
        await self.send_status()
        
        # 在单独线程中运行训练
        self.training_thread = threading.Thread(
            target=self.run_training,
            args=(episodes,)
        )
        self.training_thread.start()
    
    async def stop_training(self):
        """停止训练"""
        if not self.is_training:
            await self.send_log("当前没有进行训练")
            return
        
        self.is_training = False
        await self.send_log("正在停止训练...")
        
        if self.training_thread and self.training_thread.is_alive():
            self.training_thread.join(timeout=5)
        
        await self.send_log("训练已停止")
        await self.send_status()
    
    def run_training(self, episodes):
        """在单独线程中运行训练"""
        try:
            # 自定义训练循环，支持实时状态更新
            for episode in range(episodes):
                if not self.is_training:
                    break
                
                # 运行一个训练回合
                state = self.trainer.env.reset()
                total_reward = 0
                steps = 0
                
                while not self.trainer.env.game_over and steps < 10000 and self.is_training:
                    action = self.trainer.agent.get_action(state)
                    next_state, reward, done = self.trainer.env.step(action)
                    
                    self.trainer.agent.remember(state, action, reward, next_state, done)
                    self.trainer.agent.update_q_table(state, action, reward, next_state, done)
                    
                    state = next_state
                    total_reward += reward
                    steps += 1
                
                # 更新统计信息
                self.trainer.agent.episode_rewards.append(total_reward)
                self.trainer.agent.episode_scores.append(self.trainer.env.score)
                self.trainer.training_stats['episode'] = episode + 1
                self.trainer.training_stats['best_score'] = max(
                    self.trainer.training_stats.get('best_score', 0),
                    self.trainer.env.score
                )
                
                # 计算平均分数
                recent_scores = self.trainer.agent.episode_scores[-100:]
                self.trainer.training_stats['average_score'] = sum(recent_scores) / len(recent_scores)
                
                # 衰减探索率
                self.trainer.agent.decay_epsilon()
                
                # 发送更新（异步）
                if (episode + 1) % 5 == 0:  # 每5回合发送一次更新
                    asyncio.run_coroutine_threadsafe(
                        self.send_status(),
                        asyncio.get_event_loop()
                    )
                    
                    log_message = f"Episode {episode + 1}/{episodes}, Score: {self.trainer.env.score:.1f}, Epsilon: {self.trainer.agent.epsilon:.3f}"
                    asyncio.run_coroutine_threadsafe(
                        self.send_log(log_message),
                        asyncio.get_event_loop()
                    )
                
                # 定期保存模型
                if (episode + 1) % 50 == 0:
                    self.trainer.save_model()
                    asyncio.run_coroutine_threadsafe(
                        self.send_log(f"模型已保存 (Episode {episode + 1})"),
                        asyncio.get_event_loop()
                    )
            
            # 训练完成
            self.trainer.save_model()
            self.is_training = False
            
            asyncio.run_coroutine_threadsafe(
                self.send_log("训练完成！模型已保存"),
                asyncio.get_event_loop()
            )
            asyncio.run_coroutine_threadsafe(
                self.send_status(),
                asyncio.get_event_loop()
            )
            
        except Exception as e:
            self.is_training = False
            asyncio.run_coroutine_threadsafe(
                self.send_log(f"训练出错: {str(e)}"),
                asyncio.get_event_loop()
            )
    
    async def get_ai_action(self, game_state):
        """获取AI动作"""
        if not game_state:
            return 'none'
        
        try:
            # 这里可以根据游戏状态获取AI动作
            # 暂时返回随机动作作为示例
            import random
            actions = ['none', 'jump', 'duck']
            return random.choice(actions)
        except Exception as e:
            print(f"获取AI动作时出错: {e}")
            return 'none'
    
    async def handle_client(self, websocket, path):
        """处理客户端连接"""
        await self.register_client(websocket)
        
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            print(f"客户端处理出错: {e}")
        finally:
            await self.unregister_client(websocket)
    
    def start_server(self):
        """启动服务器"""
        print(f"AI训练服务器启动在 {self.host}:{self.port}")
        
        start_server = websockets.serve(
            self.handle_client,
            self.host,
            self.port
        )
        
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

if __name__ == "__main__":
    server = AITrainingServer()
    server.start_server()


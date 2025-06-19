import numpy as np
import json
import time
import random
from collections import deque
import pickle
import os

class DinoEnvironment:
    """Chrome Dino游戏环境模拟"""
    
    def __init__(self):
        # 游戏配置
        self.CANVAS_WIDTH = 800
        self.CANVAS_HEIGHT = 200
        self.GROUND_Y = 150
        self.DINO_X = 50
        self.DINO_WIDTH = 44
        self.DINO_HEIGHT = 47
        self.GRAVITY = 0.6
        self.JUMP_FORCE = -12
        self.GAME_SPEED = 6
        self.MAX_SPEED = 13
        self.ACCELERATION = 0.001
        self.MAX_SCORE = 5000
        
        # 游戏状态
        self.reset()
    
    def reset(self):
        """重置游戏环境"""
        self.dino_y = self.GROUND_Y - self.DINO_HEIGHT
        self.dino_velocity_y = 0
        self.is_jumping = False
        self.is_ducking = False
        self.obstacles = []
        self.score = 0
        self.speed = self.GAME_SPEED
        self.next_obstacle_distance = 120
        self.game_over = False
        
        return self.get_state()
    
    def get_state(self):
        """获取当前游戏状态向量"""
        # 状态特征：
        # 1. 恐龙Y位置（归一化）
        # 2. 恐龙垂直速度（归一化）
        # 3. 是否在跳跃
        # 4. 是否在下蹲
        # 5-8. 最近障碍物信息（距离、高度、类型、是否存在）
        # 9. 游戏速度（归一化）
        
        state = np.zeros(9)
        
        # 恐龙状态
        state[0] = (self.dino_y - (self.GROUND_Y - self.DINO_HEIGHT)) / 100.0  # Y位置
        state[1] = self.dino_velocity_y / 20.0  # 垂直速度
        state[2] = 1.0 if self.is_jumping else 0.0
        state[3] = 1.0 if self.is_ducking else 0.0
        
        # 最近障碍物信息
        nearest_obstacle = self.get_nearest_obstacle()
        if nearest_obstacle:
            state[4] = min(nearest_obstacle['distance'] / 200.0, 1.0)  # 距离
            state[5] = nearest_obstacle['y'] / self.CANVAS_HEIGHT  # 高度
            state[6] = 1.0 if nearest_obstacle['type'] == 'cactus' else 0.0  # 类型
            state[7] = 1.0  # 存在障碍物
        else:
            state[4] = 1.0  # 无障碍物时距离设为最大
            state[5] = 0.0
            state[6] = 0.0
            state[7] = 0.0
        
        # 游戏速度
        state[8] = (self.speed - self.GAME_SPEED) / (self.MAX_SPEED - self.GAME_SPEED)
        
        return state
    
    def get_nearest_obstacle(self):
        """获取最近的障碍物"""
        for obstacle in self.obstacles:
            if obstacle['x'] > self.DINO_X:
                return {
                    'distance': obstacle['x'] - self.DINO_X,
                    'y': obstacle['y'],
                    'type': obstacle['type']
                }
        return None
    
    def step(self, action):
        """执行动作并更新环境"""
        # 动作：0=无动作, 1=跳跃, 2=下蹲
        if action == 1 and not self.is_jumping and not self.is_ducking:
            self.dino_velocity_y = self.JUMP_FORCE
            self.is_jumping = True
        elif action == 2 and not self.is_jumping:
            self.is_ducking = True
        elif action == 0:
            self.is_ducking = False
        
        # 更新恐龙物理
        if self.is_jumping:
            self.dino_velocity_y += self.GRAVITY
            self.dino_y += self.dino_velocity_y
            
            if self.dino_y >= self.GROUND_Y - self.DINO_HEIGHT:
                self.dino_y = self.GROUND_Y - self.DINO_HEIGHT
                self.is_jumping = False
                self.dino_velocity_y = 0
        
        # 更新游戏速度
        self.speed = min(self.MAX_SPEED, self.GAME_SPEED + self.score * self.ACCELERATION)
        
        # 生成障碍物
        self.next_obstacle_distance -= self.speed
        if self.next_obstacle_distance <= 0:
            self.spawn_obstacle()
            self.next_obstacle_distance = random.randint(120, 200)
        
        # 更新障碍物位置
        self.obstacles = [obs for obs in self.obstacles if obs['x'] + obs['width'] > 0]
        for obstacle in self.obstacles:
            obstacle['x'] -= self.speed
        
        # 碰撞检测
        collision = self.check_collision()
        
        # 计算奖励
        reward = self.calculate_reward(action, collision)
        
        # 更新分数
        if not collision:
            self.score += 0.1
        
        # 检查游戏结束
        if collision or self.score >= self.MAX_SCORE:
            self.game_over = True
        
        return self.get_state(), reward, self.game_over
    
    def spawn_obstacle(self):
        """生成障碍物"""
        obstacle_type = 'pterodactyl' if random.random() > 0.7 else 'cactus'
        
        if obstacle_type == 'cactus':
            obstacle = {
                'x': self.CANVAS_WIDTH,
                'y': self.GROUND_Y - 35,
                'width': 17,
                'height': 35,
                'type': 'cactus'
            }
        else:
            obstacle = {
                'x': self.CANVAS_WIDTH,
                'y': self.GROUND_Y - 80,
                'width': 46,
                'height': 40,
                'type': 'pterodactyl'
            }
        
        self.obstacles.append(obstacle)
    
    def check_collision(self):
        """检查碰撞"""
        dino_rect = {
            'x': self.DINO_X + 5,
            'y': self.dino_y + 5,
            'width': self.DINO_WIDTH - 10,
            'height': (26 if self.is_ducking else self.DINO_HEIGHT) - 10
        }
        
        for obstacle in self.obstacles:
            obs_rect = {
                'x': obstacle['x'] + 5,
                'y': obstacle['y'] + 5,
                'width': obstacle['width'] - 10,
                'height': obstacle['height'] - 10
            }
            
            if (dino_rect['x'] < obs_rect['x'] + obs_rect['width'] and
                dino_rect['x'] + dino_rect['width'] > obs_rect['x'] and
                dino_rect['y'] < obs_rect['y'] + obs_rect['height'] and
                dino_rect['y'] + dino_rect['height'] > obs_rect['y']):
                return True
        
        return False
    
    def calculate_reward(self, action, collision):
        """计算奖励"""
        if collision:
            return -100  # 碰撞惩罚
        
        reward = 1  # 存活奖励
        
        # 根据距离障碍物的距离给予奖励
        nearest_obstacle = self.get_nearest_obstacle()
        if nearest_obstacle:
            distance = nearest_obstacle['distance']
            if distance < 50:  # 成功避开近距离障碍物
                reward += 5
        
        # 分数奖励
        if self.score > 0 and int(self.score) % 100 == 0:
            reward += 10
        
        return reward


class QLearningAgent:
    """Q-Learning智能体"""
    
    def __init__(self, state_size=9, action_size=3, learning_rate=0.001, 
                 epsilon=1.0, epsilon_decay=0.995, epsilon_min=0.01, gamma=0.95):
        self.state_size = state_size
        self.action_size = action_size
        self.learning_rate = learning_rate
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.gamma = gamma
        
        # Q表（使用字典存储状态-动作值）
        self.q_table = {}
        
        # 经验回放
        self.memory = deque(maxlen=10000)
        
        # 训练统计
        self.episode_rewards = []
        self.episode_scores = []
    
    def discretize_state(self, state):
        """将连续状态离散化"""
        # 将状态值量化为离散区间
        discrete_state = []
        for i, value in enumerate(state):
            if i in [0, 1, 4, 8]:  # 连续值特征
                discrete_value = int(value * 10)  # 分为10个区间
            else:  # 二进制特征
                discrete_value = int(value)
            discrete_state.append(discrete_value)
        
        return tuple(discrete_state)
    
    def get_action(self, state):
        """选择动作（ε-贪婪策略）"""
        discrete_state = self.discretize_state(state)
        
        if random.random() < self.epsilon:
            return random.randint(0, self.action_size - 1)
        
        if discrete_state not in self.q_table:
            self.q_table[discrete_state] = np.zeros(self.action_size)
        
        return np.argmax(self.q_table[discrete_state])
    
    def update_q_table(self, state, action, reward, next_state, done):
        """更新Q表"""
        discrete_state = self.discretize_state(state)
        discrete_next_state = self.discretize_state(next_state)
        
        if discrete_state not in self.q_table:
            self.q_table[discrete_state] = np.zeros(self.action_size)
        
        if discrete_next_state not in self.q_table:
            self.q_table[discrete_next_state] = np.zeros(self.action_size)
        
        # Q-Learning更新公式
        current_q = self.q_table[discrete_state][action]
        
        if done:
            target_q = reward
        else:
            target_q = reward + self.gamma * np.max(self.q_table[discrete_next_state])
        
        # 更新Q值
        self.q_table[discrete_state][action] = current_q + self.learning_rate * (target_q - current_q)
    
    def remember(self, state, action, reward, next_state, done):
        """存储经验"""
        self.memory.append((state, action, reward, next_state, done))
    
    def decay_epsilon(self):
        """衰减探索率"""
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
    
    def save_model(self, filepath):
        """保存模型"""
        model_data = {
            'q_table': dict(self.q_table),
            'epsilon': self.epsilon,
            'episode_rewards': self.episode_rewards,
            'episode_scores': self.episode_scores
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load_model(self, filepath):
        """加载模型"""
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.q_table = model_data.get('q_table', {})
            self.epsilon = model_data.get('epsilon', self.epsilon_min)
            self.episode_rewards = model_data.get('episode_rewards', [])
            self.episode_scores = model_data.get('episode_scores', [])
            
            return True
        return False


class DinoTrainer:
    """Dino AI训练器"""
    
    def __init__(self):
        self.env = DinoEnvironment()
        self.agent = QLearningAgent()
        self.model_path = 'dino_q_model.pkl'
        
        # 训练统计
        self.training_stats = {
            'episode': 0,
            'total_episodes': 0,
            'best_score': 0,
            'average_score': 0,
            'training_time': 0
        }
    
    def train(self, episodes=1000, save_interval=100):
        """训练AI智能体"""
        print(f"开始训练，目标回合数: {episodes}")
        start_time = time.time()
        
        scores = deque(maxlen=100)
        
        for episode in range(episodes):
            state = self.env.reset()
            total_reward = 0
            steps = 0
            
            while not self.env.game_over and steps < 10000:
                action = self.agent.get_action(state)
                next_state, reward, done = self.env.step(action)
                
                self.agent.remember(state, action, reward, next_state, done)
                self.agent.update_q_table(state, action, reward, next_state, done)
                
                state = next_state
                total_reward += reward
                steps += 1
            
            # 记录统计信息
            scores.append(self.env.score)
            self.agent.episode_rewards.append(total_reward)
            self.agent.episode_scores.append(self.env.score)
            
            # 更新训练统计
            self.training_stats['episode'] = episode + 1
            self.training_stats['total_episodes'] = episodes
            self.training_stats['best_score'] = max(self.training_stats['best_score'], self.env.score)
            self.training_stats['average_score'] = np.mean(scores) if scores else 0
            
            # 衰减探索率
            self.agent.decay_epsilon()
            
            # 打印进度
            if (episode + 1) % 10 == 0:
                avg_score = np.mean(scores) if scores else 0
                print(f"Episode {episode + 1}/{episodes}, "
                      f"Score: {self.env.score:.1f}, "
                      f"Avg Score: {avg_score:.1f}, "
                      f"Epsilon: {self.agent.epsilon:.3f}, "
                      f"Reward: {total_reward:.1f}")
            
            # 定期保存模型
            if (episode + 1) % save_interval == 0:
                self.save_model()
                print(f"模型已保存 (Episode {episode + 1})")
        
        # 训练完成
        self.training_stats['training_time'] = time.time() - start_time
        self.save_model()
        
        print(f"训练完成！")
        print(f"总训练时间: {self.training_stats['training_time']:.2f}秒")
        print(f"最高分数: {self.training_stats['best_score']:.1f}")
        print(f"平均分数: {self.training_stats['average_score']:.1f}")
    
    def test(self, episodes=10):
        """测试训练好的模型"""
        if not self.load_model():
            print("未找到训练好的模型")
            return
        
        print(f"开始测试，测试回合数: {episodes}")
        
        # 设置为贪婪策略（不探索）
        original_epsilon = self.agent.epsilon
        self.agent.epsilon = 0
        
        scores = []
        
        for episode in range(episodes):
            state = self.env.reset()
            steps = 0
            
            while not self.env.game_over and steps < 10000:
                action = self.agent.get_action(state)
                state, _, _ = self.env.step(action)
                steps += 1
            
            scores.append(self.env.score)
            print(f"Test Episode {episode + 1}: Score = {self.env.score:.1f}")
        
        # 恢复原始epsilon
        self.agent.epsilon = original_epsilon
        
        print(f"测试完成！")
        print(f"平均分数: {np.mean(scores):.1f}")
        print(f"最高分数: {np.max(scores):.1f}")
        print(f"最低分数: {np.min(scores):.1f}")
        
        return scores
    
    def save_model(self):
        """保存模型"""
        self.agent.save_model(self.model_path)
        
        # 保存训练统计
        stats_path = 'training_stats.json'
        with open(stats_path, 'w') as f:
            json.dump(self.training_stats, f, indent=2)
    
    def load_model(self):
        """加载模型"""
        success = self.agent.load_model(self.model_path)
        
        if success:
            # 加载训练统计
            stats_path = 'training_stats.json'
            if os.path.exists(stats_path):
                with open(stats_path, 'r') as f:
                    self.training_stats.update(json.load(f))
        
        return success
    
    def get_action_for_state(self, game_state):
        """为给定游戏状态获取AI动作"""
        # 将游戏状态转换为环境状态
        state = self.convert_game_state(game_state)
        
        # 使用贪婪策略获取动作
        original_epsilon = self.agent.epsilon
        self.agent.epsilon = 0
        action = self.agent.get_action(state)
        self.agent.epsilon = original_epsilon
        
        # 转换动作格式
        action_map = {0: 'none', 1: 'jump', 2: 'duck'}
        return action_map.get(action, 'none')
    
    def convert_game_state(self, game_state):
        """将前端游戏状态转换为AI环境状态"""
        # 这里需要根据前端传来的游戏状态格式进行转换
        # 暂时返回默认状态
        return np.zeros(9)


if __name__ == "__main__":
    # 创建训练器
    trainer = DinoTrainer()
    
    # 尝试加载已有模型
    if trainer.load_model():
        print("加载已有模型成功")
        print(f"当前最高分: {trainer.training_stats['best_score']}")
        
        # 继续训练或测试
        choice = input("选择操作: (1)继续训练 (2)测试模型 (3)退出: ")
        
        if choice == '1':
            episodes = int(input("输入训练回合数 (默认500): ") or "500")
            trainer.train(episodes)
        elif choice == '2':
            episodes = int(input("输入测试回合数 (默认10): ") or "10")
            trainer.test(episodes)
    else:
        print("未找到已有模型，开始新的训练")
        episodes = int(input("输入训练回合数 (默认1000): ") or "1000")
        trainer.train(episodes)


#!/usr/bin/env python3
"""
AI Dino Arena - 训练脚本
用于训练Chrome Dino游戏的AI智能体
"""

import sys
import os
import argparse
import json
from dino_ai_trainer import DinoTrainer

def main():
    parser = argparse.ArgumentParser(description='AI Dino Arena 训练脚本')
    parser.add_argument('--mode', choices=['train', 'test', 'demo'], default='train',
                       help='运行模式: train(训练), test(测试), demo(演示)')
    parser.add_argument('--episodes', type=int, default=1000,
                       help='训练或测试的回合数')
    parser.add_argument('--load', action='store_true',
                       help='加载已有模型')
    parser.add_argument('--save-interval', type=int, default=100,
                       help='模型保存间隔')
    
    args = parser.parse_args()
    
    # 创建训练器
    trainer = DinoTrainer()
    
    print("=" * 50)
    print("AI Dino Arena - 强化学习训练系统")
    print("=" * 50)
    
    if args.mode == 'train':
        print(f"开始训练模式，目标回合数: {args.episodes}")
        
        if args.load and trainer.load_model():
            print("成功加载已有模型，继续训练...")
            print(f"当前最高分: {trainer.training_stats['best_score']}")
        else:
            print("开始新的训练...")
        
        trainer.train(episodes=args.episodes, save_interval=args.save_interval)
        
    elif args.mode == 'test':
        print(f"开始测试模式，测试回合数: {args.episodes}")
        
        if not trainer.load_model():
            print("错误: 未找到训练好的模型文件")
            sys.exit(1)
        
        scores = trainer.test(episodes=args.episodes)
        
        # 保存测试结果
        test_results = {
            'episodes': args.episodes,
            'scores': scores,
            'average_score': sum(scores) / len(scores),
            'max_score': max(scores),
            'min_score': min(scores)
        }
        
        with open('test_results.json', 'w') as f:
            json.dump(test_results, f, indent=2)
        
        print("测试结果已保存到 test_results.json")
        
    elif args.mode == 'demo':
        print("演示模式 - 展示AI游戏过程")
        
        if not trainer.load_model():
            print("错误: 未找到训练好的模型文件")
            sys.exit(1)
        
        # 演示模式：运行一局游戏并显示详细过程
        print("开始AI演示...")
        
        state = trainer.env.reset()
        step = 0
        
        print(f"初始状态: 恐龙位置Y={trainer.env.dino_y}")
        
        while not trainer.env.game_over and step < 5000:
            action = trainer.agent.get_action(state)
            action_names = ['无动作', '跳跃', '下蹲']
            
            next_state, reward, done = trainer.env.step(action)
            
            if step % 50 == 0 or action != 0:  # 每50步或有动作时打印
                print(f"步骤 {step}: 动作={action_names[action]}, "
                      f"分数={trainer.env.score:.1f}, "
                      f"速度={trainer.env.speed:.1f}, "
                      f"障碍物数量={len(trainer.env.obstacles)}")
            
            state = next_state
            step += 1
        
        print(f"演示结束！最终分数: {trainer.env.score:.1f}")

if __name__ == "__main__":
    main()


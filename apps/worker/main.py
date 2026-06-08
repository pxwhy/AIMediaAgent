"""
实现逻辑：
1. 提供后台 worker 的进程入口。
2. MVP 阶段先输出模块心跳，后续接入队列消费采集、生成和发布任务。
3. 保持 worker 与 API 分离，避免耗时任务阻塞 H5 管理端。
"""

import time


def run() -> None:
    print("AIMediaAgent worker started")
    while True:
        print("worker heartbeat")
        time.sleep(30)


if __name__ == "__main__":
    run()


"""
实现逻辑：
1. 提供发布模块样例，表达发布器输入输出边界。
2. 后续头条号、百家号、微信公众号发布器都实现同类接口。
3. 发布模块不负责生成内容，只消费已经审核通过的发布任务。
"""

from dataclasses import dataclass

from packages.shared.contracts import PublishTaskContract


@dataclass
class PublishResultContract:
    success: bool
    platform_url: str = ""
    error_message: str = ""


def publish_sample(task: PublishTaskContract) -> PublishResultContract:
    return PublishResultContract(
        success=False,
        error_message=f"{task.platform} publisher is not implemented yet",
    )


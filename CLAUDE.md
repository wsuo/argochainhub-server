请你每次新开发接口后，都需要在项目根目录下的 docs 文件夹下新增或者追加接口测试文档，这份文档我会提供给前端开发人员和测试人员。并且所有的开发任务都要有一个进度追踪文档，也是在 docs 目录下，每次执行完任务都要去更新进度文档。每次完成一个功能模块或者修改了一个bug，并且测试通过以后，立即使用中文提交代码。

如果接口出现后端内部错误，不要只给前端返回 ‘Internal server error’，要说明具体原因，中文展示友好的错误原因。

如果在业务开发的过程中，遇到新的枚举值，请你首先检查数据库的字典管理中有没有定义，如果没有，需要定义新的字典，并为其增加字典值，必须和项目中定义的枚举值保持一致，同时需要在完成任务后说明新增的字典。

# 数据库配置
DB_HOST=100.72.60.117
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=argochainhub

# 邮件配置
MAIL_HOST=smtp.qq.com
MAIL_PORT=587
MAIL_USERNAME=wangsuoo@qq.com
MAIL_PASSWORD=bvfzzmxobkdniiic

# 服务信息
服务运行在本地，3050端口。

# 获取Token
/api/v1/auth/admin/login
{
  "username": "superadmin",
  "password": "Admin123!"
}

临时token: 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTc1MzUwODQ2MiwiZXhwIjoxNzU0MTEzMjYyfQ.H1hL94u3QFSTeV5ko2ixbcUF9OxC8TngQTIAze_60IA

# 问题排查
如果遇到一次解决不了的问题，出现第二次，就需要增加调试信息，然后让我提供给你日志，你再来分析处理，不要急于修改问题，要活得足够多的信息后再决定如何解决。
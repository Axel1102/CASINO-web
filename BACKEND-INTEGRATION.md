# CASINO 前后端运行说明

后端源码已迁入 `backend/`，来源是 [BigBenlau/lab_backend @ 445d688](https://github.com/BigBenlau/lab_backend/tree/445d688aef7175fe3478ca3c3f104a6ca4ec0e5f)。不再嵌套前端子模块。现有页面继续使用相同的 HTML 布局、CSS、Logo 和交互。

## 用新数据库运行

从仓库根目录开始，使用 Python 3.14。以下命令创建全新的测试目录，不修改现有数据库。

```sh
python3.14 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.lock
casino_run=$(mktemp -d)
export LAB_STORAGE="$casino_run/storage"
backend/.venv/bin/python scripts/export-backend-csv.py --backend backend --output "$casino_run/batch"
cd backend
.venv/bin/python -m lab_backend.cli init
.venv/bin/python -m lab_backend.cli import-csv "$casino_run/batch"
# 确认预览条数，再写入这份新库：
.venv/bin/python -m lab_backend.cli import-csv "$casino_run/batch" --apply
.venv/bin/python -m uvicorn serve_site:create_app --factory --host 127.0.0.1 --port 4173 --no-proxy-headers --no-access-log
```

打开 <http://127.0.0.1:4173/lab.html#home>。从现有公开快照可导入 4 张合照、12 位成员和 52 篇论文。转换器保留稳定 ID、署名顺序、现有论文列表顺序和两位校友日期。CSV 只新增，已有 ID 会跳过；后续编辑在管理端完成，不反复导入。数据库、CSV、管理员凭据和 TLS 文件不提交到 Git。

## 页面读什么

| 页面 | 同源请求 | 返回 |
| --- | --- | --- |
| Home、News 相册 | `GET /api/home` | 合照、入库倒序前三篇论文、论文总数 |
| Members | `GET /api/people` | 成员数组，前端保留两组和姓氏排序 |
| 成员详情 | `GET /api/people/{id}` | `{person, publications}`，作者通过 `personId` 关联 |
| Publications 和论文详情 | `GET /api/publications` | 完整论文数组，沿用年份/类型过滤与 12 条分页；站内详情按 ID 查找 |

服务把四个 GET 映射到 FastAPI 的 `/api/v1/public/...`，不向浏览器暴露管理路由。成员状态由 `memberships[].isCurrent` 转为前端的 `state`，`alumniSince` 保留 YYYY-MM 或 YYYY-MM-DD，照片读取 URL 和 metadata。PI 的首页与论文链接仍指向原来的个人主页。Logo、固定介绍、招募和新闻文字继续由前端维护；整合服务通过 `/data/site.json` 仅提供这些前端配置，不向浏览器提供原始快照。API 失败时显示重试，不回退到旧内容。

`contracts/public-api.d.ts` 由后端 OpenAPI 生成；`contracts/models.ts` 仍是静态快照类型。后端升级为契约 7.1.0、SQLite 10，新增可空校友日期字段。不自动修改 SQLite 9 或恢复旧备份；已有旧库请保留原件，用对应旧版导出内容，在新库中按新模板预览和导入。

## 管理端和发布

本机管理端沿用 [backend/docs/OPERATIONS.md](backend/docs/OPERATIONS.md) 的步骤。用相同 `LAB_STORAGE` 创建首位管理员，再单独运行 `lab_backend.application:admin_app`。公网只发布整合站点的公开入口；管理入口独立部署，保留原有认证与网络隔离。线上部署需要可运行 Python/FastAPI 的主机和持久磁盘；已有的 Sites 静态预览仍读快照，不运行 SQLite，也不连接本机数据库。

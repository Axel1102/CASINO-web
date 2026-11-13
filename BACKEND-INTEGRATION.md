# CASINO 前后端对接

核对基线：[lab_backend `445d688`](https://github.com/BigBenlau/lab_backend/tree/445d688aef7175fe3478ca3c3f104a6ca4ec0e5f)，公开契约 **7.0.0**。后端实际接口见 [PUBLIC_API.md](https://github.com/BigBenlau/lab_backend/blob/445d688aef7175fe3478ca3c3f104a6ca4ec0e5f/docs/PUBLIC_API.md)；本仓库的 `contracts/models.ts` 是当前静态 JSON 的类型，不能直接用来解析后端响应。

## 网站从哪里读

现在 `dist/lab.js` 启动时读取 `dist/data/lab.json`，页面共享同一份数据。接后端后，照片、成员、论文由后台维护并从 SQLite 读取；Logo、介绍、招募、Contact 和 News 仍由前端维护。当前 Sites 预览仍使用静态 JSON。

正式站的前端与公开 API 应使用同一域名：前端服务器提供 `dist/`，并按后端的 [Nginx 代理样例](https://github.com/BigBenlau/lab_backend/blob/445d688aef7175fe3478ca3c3f104a6ca4ec0e5f/deploy/frontend-proxy.example.conf)，把下面四个路径转到 Docker 内网的公开 API。浏览器不直接访问容器地址，不发送 Cookie 或 token，也不访问管理接口。现有静态 Sites 预览没有这层代理，不能直接使用容器地址。

| 页面 | 浏览器读取 | 返回值与用途 |
| --- | --- | --- |
| 首页 | `GET /api/home` | `{assets, recentPublications, counts}`：合照、最近 3 篇论文摘要、论文总数。 |
| Members | `GET /api/people` | 直接返回成员数组，按姓、名、ID 排序；再分 Members / Alumni 两组。 |
| 个人页 | `GET /api/people/{id}` | `{person, publications}`：完整档案和该成员的论文，来自同一次数据库读取。 |
| 论文列表、站内论文详情 | `GET /api/publications` | 直接返回完整论文数组；以 ID 找详情，前端继续负责筛选与分页。没有单篇接口。 |

上述代理路径分别对应后端 `/api/v1/public/home`、`/api/v1/public/people`、`/api/v1/public/people/{id}` 和 `/api/v1/public/publications`。成功响应直接是对象或数组，不包 `data` / `items`。正式接线时按页面发请求，用 `cache: 'no-store'`、`credentials: 'omit'` 和请求超时；检查 HTTP 状态及 JSON 类型。空数组表示成功但没有数据；网络错误、代理错误或非 JSON 应显示重试，不能悄悄换回过时的静态数据。

## 字段怎么接

| 当前前端 | 后端 7.0.0 | 接线时的处理 |
| --- | --- | --- |
| `name`、`familyName`、`preferredName` | `name` 由 `givenName + familyName` 生成，另有 `englishName` | 英文名非空且不重复时可显示在括号里。保留成员 ID 和按姓排序，不从展示名反推姓氏。 |
| `state`、`alumniSince` | 只有 `memberships[].isCurrent` | 有当前角色是 Member，否则是 Alumni。**校友日期没有对应字段。** 正式切换前，建议后端增加可空 `alumniSince`（`YYYY-MM` 或 `YYYY-MM-DD`），并同步管理表单、CSV、公开列表与详情；两个现有日期继续保存在前端 JSON。 |
| `portraitAssetId`、合照 ID 列表 | 成员内嵌 `portrait: {url, metadata}`；首页直接返回合照 `assets` | 直接读取 URL 和 `metadata.alt/caption/credit`。同源图片仍由前端部署；后端不上传或托管文件。 |
| `authors[].personId` | 同名字段 | 保留署名顺序；组外作者用 `null`。个人页直接用接口返回的论文，不按姓名匹配。 |
| `pageUrl`、PDF | `id`、`pdfPath`、`sourceUrl` | 用 ID 生成 `#publications/{id}`；有 `pdfPath` 才显示下载。不要把旧站论文目录的 `sourceUrl` 当作单篇论文链接。若未来要直接跳出版商页面，再约定独立字段。 |
| PI 的个人主页 | `links` 仅在成员详情中返回 | 目录和署名目前直接链接到 Kanye 的个人主页。接线时保留前端已核对的 PI 链接配置，或与后端约定列表也返回个人主页字段。 |

后端按入库倒序给论文和首页摘要；现有前端论文排序默认按发表年份。切换时应明确：默认保留后端入库顺序，年份排序只在用户显式选择时应用。后端保存即公开，没有前端快照使用的 `publishState`；不把草稿或演示记录导入。

## 从现有 JSON 准备数据

在前端仓库根目录运行。下面的 `backend_dir` 指已按后端说明安装依赖的检出目录；`batch` 必须是一个尚不存在的目录。

```sh
backend_dir=/absolute/path/to/lab_backend
batch=/absolute/path/to/new-casino-csv-batch
"$backend_dir/.venv/bin/python" scripts/export-backend-csv.py \
  --backend "$backend_dir" --output "$batch"
```

工具复用后端的模型验证和 CSV 编码，生成 `assets.csv`、`people.csv`、`publications.csv`。当前快照输出 4 张合照、12 位成员和 52 篇论文。导出保留 ID、作者关联和既有论文列表顺序；v7 CSV 不包含结构化的 `alumniSince`，不能用 CSV 导入替代补齐字段。仅导出当前公开内容；工具不创建或修改数据库。

在后端仓库根目录，先给**全新测试库**设置独立的 `LAB_STORAGE`，执行：

```sh
export LAB_STORAGE=/absolute/path/to/new-test-storage
.venv/bin/python -m lab_backend.cli init
.venv/bin/python -m lab_backend.cli import-csv "$batch"
# 检查预览后，仅对这份测试库执行：
.venv/bin/python -m lab_backend.cli import-csv "$batch" --apply
```

导入是新增，现有 ID 会跳过，不是覆盖同步。正式环境由维护者确认库版本、备份和离线导入窗口；不要把 CSV、SQLite、管理员账号或密钥提交到前端仓库。后端仓库的 `public_frontend` 子模块仍固定在 `a70eb62`，前端 `main` 推送不会自动更新它；由后端维护者在确认目标前端提交后更新引用。

本次已用全新临时库完成导入预览、正式写入临时库和四个公开 GET 的程序内请求。核对了数据条数、首页前三篇、合照顺序、成员排序及 Guan 的 6 篇关联论文；没有测试线上代理或切换网站数据源。

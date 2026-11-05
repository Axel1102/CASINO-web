# CASINO 数据与接口约定 v1

字段名与网站内容使用英文。此方案适用于现有 Home、Research、Member、Publications、News、Contact 页面，后端框架和数据库可自行选择。

交付：`models.ts` 是完整字段定义；`example.ts` 是经过类型检查的示例源文件；`example.json` 可直接供后端或 Mock 服务使用。示例成员、论文、活动与招聘均为演示数据，状态为 draft。当前网站已改为读取 `dist/data/lab.json`，其中是从旧站迁移的公开内容，图片通过 `assets[].url` 的本地路径读取。

## 1. 核心实体

| 实体 | 用途 | 关键关系 |
| --- | --- | --- |
| Person | 成员档案、角色历史、简介、链接、去向 | 多个 ResearchArea；论文通过 authors.personId 关联 |
| Publication | 论文、作者、会议／期刊、链接、引用 | 有序 authors；多个 ResearchArea |
| ResearchArea | 研究方向及详情页 | 从 Person / Publication 反查相关内容 |
| NewsItem | 新闻、活动、组内生活、获奖 | 可关联成员、论文和照片；活动额外记录时间与地点 |
| Opportunity | 招聘／合作入口、要求与材料清单 | 关联研究方向；链接至申请渠道或公开邮箱 |
| Asset | Logo、头像、合照、论文图片、PDF | 其他实体通过 assetId 引用 |
| SiteSettings | 组名、机构、介绍、联系信息、首页照片与精选论文 | 单例；照片与精选论文数组顺序即显示顺序 |

```text
Person ← Publication.authors[].personId
  │                │
  └── ResearchArea ┘

NewsItem ──→ Person / Publication / Asset
Opportunity ──→ ResearchArea
SiteSettings ──→ Asset / Publication
```

### People

前端类定义在 `dist/models.js`：每条 `people` 记录创建一个 `Member` 实例，每条 `publications` 记录创建一个 `Paper` 实例。JSON/API 继续使用 `people` / `publications` 集合名，与现有 Person / Publication 字段契约兼容。`member.getPapers(papers)` 通过 `authors[].personId` 返回该成员的全部论文，按年份降序显示在个人主页；不复制维护第二份论文列表。

- `memberships` 保留角色历史。例如先 RA 后 PhD，只更新履历，不新增一个人。
- 有任一 `isCurrent: true` 即 Current；所有履历都是 false 即 Alumni。Alumni 不是 role。
- 当前成员按当前履历的 role 筛选；Alumni 按历史 role 筛选。多角色成员在列表中只出现一次。
- 起止日期未知填 null，不编造日期；当前履历的 `endedOn` 必须为 null。已离组成员可以保留未知离组日期。
- `alumniDestination` 保存离组后的去向；`publicEmail` 只存已同意公开的邮箱。

### Publications

- `pageUrl` 必填，是点击论文标题打开的页面：可为外部 `https://...`，或站内 `#publications/{id}`。现有迁移记录使用真实可打开的站内详情页，待核对出版社／项目链接后替换；它不同于 PDF 下载链接。

- `authors` 数组顺序就是论文署名顺序。`name` 保存发表时的署名；`personId` 可为空，支持外部合作者。
- `type` 表示 conference / journal 等；`venue.name` 是完整会议或期刊名称，`shortName` 是 CHI、CSCW 等简称。
- `publicationStatus` 表示论文进度；`publishState` 表示是否在网站公开，两者独立。例如已接收论文可以在网站发布。
- `year` 用于列表分组；不知道完整发表日期时 `publicationDate` 填 null。
- DOI 存裸标识符；前端用 `https://doi.org/` 拼接。一个 DOI 对应一条记录，大小写不敏感去重。
- `pdfAssetId` 用于本地管理的 PDF，`pdfUrl` 用于外部 PDF；两者最多填写一个。未提供链接时隐藏相应按钮。
- `bibtex` 保存核对过的引用；为空时隐藏引用导出，避免用不完整元数据生成错误引用。
- 原站未提供论文进度或作者贡献标记时，`publicationStatus`、`isCorresponding`、`equalContribution` 为 null。
- `featured` 用于论文页的精选标记；首页展示哪些论文及其顺序由 `SiteSettings.featuredPublicationIds` 决定。

## 2. 通用字段与校验

`pageUrl` 是下述链接规则的特例：额外允许已存在的站内 `#publications/{id}`。页面已移除全部搜索框；下文 API 的 q 参数为后端预留，并不对应当前页面搜索功能。

`siteSettings.logoAssetId` 指向左上角纯图形 Logo；`wordmarkAssetId` 指向首页标题和页脚的文字版 Logo；`heroPhotoAssetIds` 为首页堆叠相册的有序图片 ID 列表。图片路径来自 `assets[].url`，当前为从旧站下载的四张原始照片。Member 目录不显示研究兴趣；个人主页保留兴趣并直接列出论文。

`id` 为服务端生成的不可变 ID（建议 UUID），示例使用可读 ID。`slug` 是可读 URL 标识，在每个实体集合内唯一，只用小写英文、数字及连字符。外键始终引用 id，不引用 slug。修改 slug 时为原地址维护跳转。

所有类型中列出的字段必须返回；未知单值用 null，空列表用 `[]`，避免混用空字符串、null 和缺失字段。`ApiError.fields` 例外，为可选的逐字段错误。TypeScript 类型用于开发检查；服务端仍需运行时校验。

服务端至少执行：

- 标题／姓名非空；ID、slug 唯一；关系 ID 必须存在；同一关系数组内 ID 不重复。
- `authors` 至少一人；每个作者 name 非空；同一非空 personId 在一篇论文内不重复。作者可以同名，不能按名字去重。
- `memberships` 至少一项；已知结束日期不得早于开始日期；同一当前 role 不重复。
- `year` 为四位整数 1000–9999；已知 `publicationDate` 的年份与 year 一致；日期须为真实日历日期。
- `createdAt`、`updatedAt`、`publishedAt` 由服务器维护。时间戳带时区，存储时规范为 UTC；活动用 IANA `timeZone` 决定展示时区。
- event 类新闻必须有 event；其他类别 event 为 null。活动结束时间不早于开始时间。
- 内容链接仅接受 http/https（生产环境用 https）；拒绝 javascript/data 等协议。Asset.url 还接受 `./assets/...` 或 `/assets/...` 本地路径，不允许 `..`。相对路径相对于网站页面，而非 JSON 文件。`publicEmail` 单独校验邮箱格式。
- Asset 图片宽高为正整数或 null；PDF 宽高为 null。可见图片须有准确 alt。
- `publishState=published` 时必须有 publishedAt；`isDemo=true` 永不进入生产公开接口。
- open 招聘至少有 contactEmail 或 applicationUrl；deadlineAt 为空表示未设截止时间。过期后公开接口将 availability 返回 closed，保留详情。
- Markdown 渲染禁用原始 HTML，并过滤链接协议；SVG 上传需清理 script、事件属性和外链。成员照片及合照发布前确认授权。

公开可见条件：`publishState=published AND isDemo=false AND publishedAt <= now`。草稿、归档、未来发布和演示记录在详情接口也返回 404。公开关联只返回同样可见的记录：论文保留作者署名，隐藏成员的 personId 返回 null；其他隐藏关系 ID 从数组移除。发布时要求图片／PDF 已上传且可公开，素材 URL 仅通过公开记录或公开设置解析。

## 3. Public API

基础路径 `/api/v1`，JSON 字段采用 camelCase。只读接口无需登录；管理接口独立鉴权。

| GET 路径 | 筛选参数（除通用分页外） | 返回 data |
| --- | --- | --- |
| `/site` | 无 | SiteSettings |
| `/people` | q, membership=current\|alumni, role, researchAreaId | Person[] |
| `/people/{id}` | 无 | Person |
| `/research-areas` | 无 | ResearchArea[] |
| `/research-areas/{id}` | 无 | ResearchArea |
| `/publications` | q, year, type, researchAreaId, personId, featured, sort | Publication[] |
| `/publications/{id}` | 无 | Publication |
| `/publications/facets` | 无 | `{years: number[], types: PublicationType[], researchAreas: {id, title}[]}` |
| `/news` | q, category | NewsItem[] |
| `/news/{id}` | 无 | NewsItem |
| `/opportunities` | kind, availability | Opportunity[] |
| `/opportunities/{id}` | 无 | Opportunity |
| `/assets?ids=asset-a,asset-b` | ids 必填，最多 100 个 | Asset[]（无分页；只返回可由公开内容引用的素材） |

所有内容列表额外接受 `slug` 精确筛选，供可读页面地址解析；返回 0 或 1 条。静态路由 `/publications/facets` 必须在 `/{id}` 路由前匹配。facets 从全部公开论文生成，与当前筛选无关，years 降序；素材缺失／不可公开的 ID 被省略。

列表默认 `page=1&pageSize=20`，page 为正整数，pageSize 为 1–100。空结果返回 200 和空 data；totalPages 为 0，超出最后一页也返回空 data。`meta.total` 是筛选后、分页前的数量。请求值非法返回 400，不静默忽略；q 去首尾空格后最长 200 字符，空 q 视为未填写。ID／枚举筛选每个只接收单值，不接受逗号列表（assets 的 ids 除外）。

不同筛选条件之间用 AND；q 对规定字段做大小写不敏感的子串 OR 匹配：People 的 name / preferredName / interests；Publications 的 title / authors.name / venue.name / venue.shortName / keywords；News 的 title / summary。`featured` 仅接受 true / false。

默认排序：People / ResearchArea / Opportunity 按 sortOrder 升序、id 升序；News 按 pinned 降序、date 降序、id 升序。Publications 的 sort 为 `newest`（默认）或 `oldest`，依次按 year 与 publicationDate 同方向排序，未知日期排该年最后，id 升序打破平局。

列表响应（`ListResponse<T>`）：

```json
{"data": [], "meta": {"page": 1, "pageSize": 20, "total": 0, "totalPages": 0}}
```

详情、site、facets 和 assets 响应统一为 `{"data": ...}`（`ItemResponse<T>`），没有分页 meta。

错误响应（`ApiError`）：

```json
{"error": {"code": "INVALID_QUERY", "message": "pageSize must be between 1 and 100", "fields": {"pageSize": "Out of range"}}}
```

错误码：400 INVALID_QUERY，401 UNAUTHORIZED，403 FORBIDDEN，404 NOT_FOUND，409 CONFLICT，422 VALIDATION_ERROR。不要在错误中返回数据库堆栈或内部路径。

## 4. 数据库存储建议

以下是逻辑表划分，可用 PostgreSQL、MySQL 或等价 ORM 实现。这里不绑定具体 SQL 方言。

| 表 | 关键约束 |
| --- | --- |
| people, publications, research_areas, news, opportunities, assets | id 主键；内容表 slug 唯一；非空 DOI 建大小写归一化唯一索引 |
| person_memberships | person_id 外键；role, is_current, started_on, ended_on |
| publication_authors | publication_id 外键、position 联合主键；person_id 可空；name 必填；position 从 0 开始；保存 affiliation 与贡献标记 |
| person_research_areas, publication_research_areas, opportunity_research_areas | 两端外键联合唯一 |
| news_people, news_publications | 两端外键联合唯一 |
| news_gallery | news_id + position 主键，asset_id 外键 |
| site_settings | 单例；首页照片与精选论文可存有序 JSON ID 数组，并在事务中校验引用 |

tags、questions、interests、links、awards、requirements、applicationChecklist 可存 JSON 数组；event 与 venue 可存结构化 JSON 或平铺列。正文使用文本列。给年份、类型、publishState、公开时间、关系外键加索引。

新增／更新一篇论文时，论文和作者列表在同一事务中写入；重排 authors 时同步 position。默认用 archived 下线内容，不硬删除。硬删除 Person 时先将 publication_authors.person_id 置空，保留署名快照；删除其他被引用内容／素材返回 409，先解除关系。

## 5. 后台与现有前端对接

后台可对应提供 `/api/v1/admin/{collection}` 的 GET / POST 和 `/{id}` 的 GET / PATCH；普通公开 API 不接受写入。PATCH 未提供的字段保持不变，数组字段整组替换，显式 null 仅用于类型允许为空的字段。POST 由后端生成 id、审计时间，默认 draft。发布操作必须经过上述校验。管理员身份和照片／PDF 上传实现由后端项目决定，不把私钥或管理 token 放入静态站。

现有 `dist/lab.js` 的映射：

| 当前数据 | 新契约 |
| --- | --- |
| members | people；role 改为 memberships；topic 改为 interests / researchAreaIds；url 改为 links |
| papers | publications；authors 从字符串改为有序对象数组；当前 venue 的 Conference / Journal 移到 type |
| topics | researchAreas；description 改为 summary；详情内容用 bodyMarkdown |
| news | news；photo 改为 coverAssetId / galleryAssetIds；date 使用真实日期 |
| 页面中硬编码的申请内容 | opportunities |
| Logo、组名与首页照片 | siteSettings + assets |

现已接入静态 JSON、浏览器端筛选／分页、详情与素材解析；REST API 仍是未来后端的约定。JSON 内容先转义再渲染，正文支持段落、换行和 `- ` 列表，其他 Markdown 语法显示为文本。People→论文用 personId 筛选；论文暂未补造原站没有的研究方向标签，填写 researchAreaIds 后自动出现相关筛选。管理员导出包含草稿的完整数据集需要鉴权。

SiteSettings 新增可选字段 aboutMarkdown（组介绍）、recruitmentMarkdown（招生公共说明）、publicationArchiveUrl（历史论文归档）。Content 可选 sourceUrl 记录来源。静态部署中的 lab.json 是公开文件，只放正式公开内容；草稿／私有资料不能仅靠前端过滤保护。

验收：一个人从 RA 转 PhD 不重复建档；离组后历史署名仍正确；外部作者可显示；多研究方向能筛选同一论文；未知日期不造假；草稿／演示数据不外泄；搜索与分页总数一致；无 DOI/PDF/BibTeX 的记录隐藏按钮；组合条件无结果时显示空状态；详情深链接与返回导航正常。

## 6. 本地检查

```sh
npx --yes --package typescript tsc --noEmit --strict --target es2022 --module nodenext --allowImportingTsExtensions contracts/models.ts contracts/example.ts
node contracts/check.mjs
```

第二条使用 Node 24 的 TypeScript 类型擦除能力，检查示例关系与关键不变量，并从 example.ts 重新生成 example.json。它是交付物自检，不替代后端请求校验。

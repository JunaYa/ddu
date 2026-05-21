# Spec 05: 分享、导出与集成

## 目标

让用户可以把截图和录屏可靠地输出到剪贴板、文件系统、文档、聊天工具、云服务和自定义工作流。分享模块应本地优先，可扩展，不强制绑定账号。

## 范围

包含：

- 剪贴板和拖放。
- 文件导出和格式配置。
- 打印、PDF、文档插入。
- 内置上传器和自定义上传器。
- 分享链接的权限、过期、撤回和审计。

不包含：

- 历史库 UI，见 [Spec 03](./03-history-workflow.md)。
- 云端服务端实现细节，只定义客户端能力和接口。

## 用户故事

- 作为开发者，我可以复制图片并粘贴到 Slack、GitHub、Linear、Notion。
- 作为技术写作者，我可以导出 PNG、PDF 或 Markdown 图片链接。
- 作为高级用户，我可以上传到自己的 S3/R2/MinIO。
- 作为团队管理员，我可以禁用公共图床，只允许私有上传目的地。
- 作为用户，我可以撤回已上传的分享链接。

## 功能需求

### SHR-001 剪贴板

支持复制：

- 位图图片。
- PNG 文件引用。
- 文件路径。
- Markdown 图片语法。
- HTML img 标签。
- OCR 纯文本。
- 上传后的 URL。

复制动作必须有明确反馈。大图复制失败时，允许降级为复制文件路径。

### SHR-002 拖放

- 捕获后浮层支持拖放到 Finder/Explorer/文件管理器。
- 支持拖放到浏览器、IM、邮件、设计工具。
- 拖放时应使用临时文件，并在动作完成后按保留策略清理。
- Snap/Flatpak 等沙箱环境下如拖放受限，需要提示用户调整临时目录或权限。

### SHR-003 文件导出

图片格式：

- PNG：默认，适合 UI 和文字。
- JPG：适合照片类截图，可设置质量。
- WebP：适合体积优化。
- PDF：适合文档归档。
- 项目格式：保存可编辑图层。

视频格式：

- MP4：默认。
- GIF：短动图。
- WebM：后续增强。

导出设置：

- 文件命名模板。
- 默认目录。
- 覆盖策略。
- 色彩空间。
- 是否保留元数据。

### SHR-004 上传器

MVP 上传器：

- 本地目录。
- S3 兼容存储，包含 AWS S3、Cloudflare R2、MinIO。
- WebDAV。
- FTP/SFTP。
- 自定义脚本。

增强上传器：

- Imgur。
- Google Drive。
- OneDrive。
- Dropbox。
- 团队云空间。
- Jira、Linear、GitHub issue 附件。

### SHR-005 自定义上传器接口

自定义上传器必须支持：

- 请求方法、URL、Header、Body 模板。
- 环境变量和密钥引用。
- 响应 JSONPath 提取 URL。
- 上传前脚本和上传后脚本。
- 失败重试策略。
- dry run 测试。

密钥必须存入系统安全存储，不得明文写入配置文件。

### SHR-006 分享链接治理

如果使用内置云或支持的私有云，链接应支持：

- 复制公开 URL。
- 设置过期时间。
- 设置密码。
- 撤回。
- 查看上传时间和文件大小。
- 可选访问统计。
- 删除远程文件。

默认链接策略应保守：个人空间不公开列目录，团队空间遵循项目权限。

### SHR-007 文档和外部应用

支持：

- 复制到邮件。
- 打开系统分享面板。
- 打印。
- 发送到外部编辑器。
- 导出一组选中历史项为 PDF。
- 根据截图和备注生成简易 Markdown 报告。

## 数据模型

```ts
interface ExportJob {
  id: string;
  historyItemId: string;
  format: "png" | "jpg" | "webp" | "pdf" | "mp4" | "gif" | "project";
  destination: ExportDestination;
  options: ExportOptions;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
}

interface UploadTarget {
  id: string;
  type: "s3" | "webdav" | "ftp" | "sftp" | "imgur" | "customScript" | "teamCloud";
  name: string;
  enabled: boolean;
  credentialsRef?: string;
  config: Record<string, unknown>;
}

interface ShareLink {
  id: string;
  uploadTargetId: string;
  url: string;
  expiresAt?: string;
  passwordProtected: boolean;
  revokedAt?: string;
}
```

## 安全要求

- 上传前执行隐私扫描状态检查。
- 密钥保存在系统 Keychain、Credential Manager、Secret Service 或等价安全存储。
- 自定义脚本默认关闭，需要用户显式启用。
- 自定义脚本执行时显示风险提示，并提供每个脚本的允许目录和环境变量白名单。
- 企业策略可禁用公共图床、自定义脚本、AI 和个人云。

## 验收标准

- 用户能把截图复制到常见 IM、浏览器、文档工具。
- PNG/JPG/WebP/PDF 导出与预览一致。
- S3 兼容上传可完成并复制 URL。
- 上传失败不会丢本地文件。
- 撤回链接后，本地历史项显示已撤回状态。
- 禁用公共上传后，相关入口不可用且说明原因。

## 测试建议

- 剪贴板测试：Slack、Teams、浏览器表单、GitHub issue、Notion、邮件。
- 上传测试：S3/R2/MinIO、WebDAV、SFTP、自定义脚本成功与失败。
- 安全测试：密钥读取、脚本权限、上传前敏感信息拦截、离线重试。
- 文件测试：长图、大图、透明背景、HDR/SDR、中文路径、权限不足目录。


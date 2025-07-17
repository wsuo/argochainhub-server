# 火山引擎TOS上传功能说明文档

本文档详细说明了项目中火山引擎对象存储（TOS）上传功能的实现细节，包括其使用的SDK版本、本地配置、核心实现及完整的调用流程。

## 1. SDK 版本

项目集成了火山引擎官方提供的Node.js SDK。

- **SDK包名**: `@volcengine/tos-sdk`
- **版本号**: `^2.7.4` (具体版本记录在 `package.json` 文件中)

## 2. 本地配置

所有与TOS相关的配置都通过环境变量进行管理，以确保安全性与灵活性。配置文件 `src/config/tos.config.ts` 负责读取这些环境变量，并将其注册到NestJS的 `ConfigModule` 中。

### 环境变量

在 `.env` 文件中需要配置以下变量：

```env
# 火山引擎TOS对象存储配置
VOLC_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
VOLC_ACCESS_KEY_SECRET=YOUR_ACCESS_KEY_SECRET
TOS_REGION=cn-beijing
TOS_ENDPOINT=https://tos-s3-cn-beijing.volces.com
TOS_BUCKET=your_bucket_name
TOS_REQUEST_TIMEOUT=60000
TOS_CDN_DOMAIN= # (可选) 如果配置了CDN，请填写CDN加速域名
```

- `VOLC_ACCESS_KEY_ID` / `VOLC_ACCESS_KEY_SECRET`: 火山引擎的访问密钥。
- `TOS_REGION`: 存储桶所在的地域。
- `TOS_ENDPOINT`: TOS服务的访问端点。
- `TOS_BUCKET`: 存储桶的名称。
- `TOS_REQUEST_TIMEOUT`: 请求超时时间（毫秒）。
- `TOS_CDN_DOMAIN`: （可选）用于生成访问URL的CDN域名。

## 3. 核心服务实现 (`src/storage/tos.service.ts`)

`TosService` 是与火山引擎TOS SDK直接交互的核心服务，它封装了所有底层的API调用。

### 3.1. 客户端初始化

在 `TosService` 的构造函数中，它从 `ConfigService` 获取配置，并初始化 `TosClient` 实例。

```typescript
// src/storage/tos.service.ts

this.tosClient = new TosClient({
  accessKeyId: this.config.accessKeyId,
  accessKeySecret: this.config.accessKeySecret,
  region: this.config.region,
  endpoint: this.config.endpoint,
  requestTimeout: this.config.requestTimeout,
});
```

### 3.2. 核心上传方法

`TosService` 提供了两种上传文件的方法：

#### a) `uploadFileFromPath` (推荐)

这是项目中最主要的上传方式，它直接从服务器的临时文件路径上传文件到TOS。这种方式性能更高，内存占用更少，并且支持进度回调。

- **SDK接口**: `this.tosClient.putObjectFromFile()`
- **功能**:
    - 从指定文件路径读取并上传。
    - 支持通过 `dataTransferStatusChange` 回调监控上传进度（已封���为 `onProgress`）。
    - 支持添加自定义元数据 (`meta`)。

```typescript
// src/storage/tos.service.ts

const response = await this.tosClient.putObjectFromFile({
  bucket: this.config.bucket,
  key: key,
  filePath: filePath,
  contentType: contentType,
  meta: metadata,
  dataTransferStatusChange: (event) => {
    // ... 进度回调逻辑
  },
});
```

#### b) `uploadFile`

此方法用于从内存中的 `Buffer` 直接上传文件。适用于文件较小或文件内容已经在内存中的场景。

- **SDK接口**: `this.tosClient.putObject()`
- **功能**:
    - 将 `Buffer` 作为文件体上传。
    - 支持添加自定义元数据 (`meta`)。

```typescript
// src/storage/tos.service.ts

const response = await this.tosClient.putObject({
  bucket: this.config.bucket,
  key: key,
  body: buffer,
  contentType: contentType,
  meta: metadata,
});
```

### 3.3. 错误处理

服务内建了标准的错误处理机制，能够区分客户端错误 (`TosClientError`) 和服务端错误 (`TosServerError`)，并记录详细的错误日志。

## 4. 调用流程

整个上传过程遵循一个清晰的分层架构，从接收请求到最终上传完成，涉及以下几个关键步骤：

1.  **Controller层 (`src/uploads/uploads.controller.ts`)**
    - `POST /uploads` 端点接收 `multipart/form-data` 格式的请求。
    - `@UseInterceptors(FileInterceptor('file'))`：NestJS使用 `multer` 中间件来处理文件流。文件被接收并自动保存到服务器的一个临时目录中。

2.  **业务服务层 (`src/uploads/uploads.service.ts`)**
    - `uploads.controller.ts` 调用 `uploadsService.uploadFile` 方法。
    - 此服务负责处理业务逻辑，例如验证文件、准备元数据等。
    - 它调用 `storageService.uploadFileFromPath`，将临时文件的路径和其他信息传递下去。

3.  **存储抽象层 (`src/storage/storage.service.ts`)**
    - `storage.service.ts` 提供了一个存储功能的抽象，它不关心底层的具体实现是TOS还是其他云服务。
    - 它调用 `tosService.generateFileName` 生成一个唯一的存储键（Key）。
    - 调用 `tosService.uploadFileFromPath` 来执行上传。
    - **关键操作**：在 `finally` 代码块中，它负责**删除服务器上的临时文件**，确保不会有残留文件占用磁盘空间。

4.  **TOS服务层 (`src/storage/tos.service.ts`)**
    - `storage.service.ts` 调用 `tosService.uploadFileFromPath`。
    - `TosService` 执行最终的 `this.tosClient.putObjectFromFile()` 调用，将文件从临时目录上传到火山引擎TOS。
    - 上传成功后，返回包含 `key`, `url`, `etag` 等信息的 `UploadResult` 对象。

5.  **数据持久化**
    - `uploads.service.ts` 接收到 `UploadResult` 后，将文件的元数据（如 `storageKey`, `url`, `mimetype` 等）保存到数据库的 `attachment` 表中。

## 5. 文件命名规则

为了防止文件重名和方便管理，系统采用 `tosService.generateFileName` 方法生成统一格式的文件名（即存储键 `Key`）。

- **格式**: `type/userId/timestamp-random.ext`
- **示例**: `product_image/12/1678886400000-123.jpg`
    - `type`: 文件类型 (e.g., `product_image`)
    - `userId`: 上传用户的ID
    - `timestamp`: 当前时间戳
    - `random`: 一个三位数的随机数
    - `ext`: 原始文件的扩展名

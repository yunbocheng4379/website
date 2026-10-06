# CETAEON / 鲸序官网

这是 CETAEON（鲸序）的 AI 产品生态官网，提供品牌展示和产品入口。

## 技术栈

- React 18
- TypeScript
- Vite 5
- Tailwind CSS 3
- Docker + Nginx

## 快速开始

环境要求：Node.js 22 或兼容版本、npm。

~~~bash
npm install
npm run dev
~~~

开发服务器默认监听 4379 端口，访问 <http://localhost:4379/>。

常用命令：

~~~bash
npm run build
npm run lint
npm run check:deployment
npm run preview
~~~

## 产品地址配置

首页包含“笔记生花”和鲸落“生”两个产品入口。地址逻辑位于 src/noteAppUrl.ts：

| 环境变量 | 用途 | 默认值 |
| --- | --- | --- |
| NOTE_APP_PORT | 笔记生花端口 | 3015 |
| NOTE_APP_URL | 笔记生花完整地址 | 空 |
| WHALE_FALL_APP_PORT | 鲸落“生”端口 | 8009 |
| WHALE_FALL_APP_URL | 鲸落“生”完整地址 | 空 |

完整地址优先；未设置时会根据当前访问主机自动生成：

~~~text
笔记生花：当前协议://当前主机:3015/
鲸落“生”：当前协议://当前主机:8009/site
~~~

生产服务器可在 .env 中设置：

~~~dotenv
APP_PORT=80
NOTE_APP_URL=http://47.99.136.241:3015/
WHALE_FALL_APP_URL=http://47.99.136.241:8009/site
~~~

.env 和 .env.local 不应提交到 Git。

## Docker

本地 Docker Desktop：

~~~bash
cp .env.example .env
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:8080/health
~~~

默认访问 <http://127.0.0.1:8080/>。

服务器首次部署、更新、回滚和网络排障请阅读 DEPLOYMENT.md。当前生产服务器：

~~~text
公网 IP：47.99.136.241
部署目录：/opt/website
生产分支：main
官网：http://47.99.136.241/
~~~

服务器更新：

~~~bash
cd /opt/website
git checkout main
git pull --ff-only origin main
docker compose up -d --build --remove-orphans
docker compose ps
curl --fail http://127.0.0.1/health
~~~

## 项目结构

~~~text
src/App.tsx             首页布局和导航
src/index.css           全局样式和动画
src/noteAppUrl.ts       产品地址解析
public/cetaeon-icon.svg 浏览器图标
Dockerfile              构建和 Nginx 运行镜像
docker-compose.yml      Compose 配置
nginx.conf              SPA 路由和健康检查
DEPLOYMENT.md           完整部署说明
~~~

## 分支和仓库

- main：生产部署分支。
- dev：开发测试分支。

GitHub：<https://github.com/yunbocheng4379/website>

~~~bash
git clone -b main git@github.com:yunbocheng4379/website.git
~~~

## 安全提示

- 不要提交服务器密码、SSH 私钥、.env 或其他密钥。
- 生产环境只开放实际需要的端口。
- 修改地址或端口后必须重新构建 Docker 镜像。

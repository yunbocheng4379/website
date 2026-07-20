# Docker 服务器部署指南

本项目是 React + TypeScript + Vite 前端。Docker 会先使用 Node.js 构建静态文件，再使用 Nginx 提供生产服务。以下示例假设：

- 项目在服务器上的目录是 `/opt/prompt`
- 当前网站通过服务器的 `8080` 端口访问
- “笔记生花”应用运行在同一服务器的 `3015` 端口
- 服务器系统是 Ubuntu 22.04、24.04 或 26.04

## 1. 准备服务器端口

默认需要允许客户端访问以下 TCP 端口：

- `8080`：当前网站
- `3015`：“笔记生花”应用；只有该服务确实运行在此端口时才开放

还应保留 SSH 使用的端口，通常是 `22`。如果服务器来自阿里云、腾讯云、华为云或其他云厂商，需要同时修改云平台安全组；仅修改服务器内部防火墙通常不够。

Docker 发布的端口可能绕过部分 UFW 规则。生产环境应同时使用云安全组，并根据 [Docker 防火墙官方说明](https://docs.docker.com/engine/network/packet-filtering-firewalls/) 配置 `DOCKER-USER` 链。

## 2. 安装 Docker Engine 和 Compose

如果服务器已经安装 Docker Engine 和 Compose V2，可以直接检查：

```bash
docker --version
docker compose version
```

如果尚未安装，Ubuntu 可使用 Docker 官方软件源：

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

其他系统请使用对应的 [Docker Engine 官方安装说明](https://docs.docker.com/engine/install/)。不要在生产服务器上使用官方标注为仅适合测试和开发的便捷安装脚本。

本文后续命令省略了 `sudo`。如果当前用户没有访问 Docker 的权限，请在每条 `docker` 命令前添加 `sudo`。将用户加入 `docker` 组相当于授予主机上的高权限，应先评估安全风险。

## 3. 上传项目

先在服务器上准备目录：

```bash
sudo mkdir -p /opt/prompt
sudo chown "$USER":"$USER" /opt/prompt
```

从本地电脑上传项目时，不需要上传 `node_modules` 和 `dist`。可以使用 Git、SFTP、SCP 或 rsync。例如在本地项目目录的上一级执行：

```bash
rsync -av --exclude node_modules --exclude dist prompt/ 用户名@服务器IP:/opt/prompt/
```

上传后，服务器目录至少应包含：

```text
/opt/prompt/
├── src/
├── package.json
├── package-lock.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

## 4. 配置部署参数

登录服务器并进入项目目录：

```bash
cd /opt/prompt
cp .env.example .env
nano .env
```

默认配置如下：

```dotenv
APP_PORT=8080
NOTE_APP_PORT=3015
NOTE_APP_URL=
IMAGE_TAG=latest
```

参数含义：

- `APP_PORT`：当前网站在服务器上开放的端口。
- `NOTE_APP_PORT`：“笔记生花”应用所在端口。
- `NOTE_APP_URL`：可选的完整地址。留空时，页面会自动使用“当前服务器主机名 + `NOTE_APP_PORT`”。
- `IMAGE_TAG`：镜像版本标签。正式环境建议使用日期或版本号，例如 `20260720-1`，便于回滚。

例如，用户访问 `http://203.0.113.10:8080/` 时，留空的 `NOTE_APP_URL` 会让目标链接自动变为 `http://203.0.113.10:3015/`。

如果目标应用使用独立域名或 HTTPS，应直接设置完整地址：

```dotenv
NOTE_APP_URL=https://notes.example.com/
```

`VITE_*` 配置会在构建镜像时写入前端资源，因此修改 `.env` 后必须重新执行带 `--build` 的启动命令。

## 5. 构建并启动

先检查 Compose 配置，再构建并后台启动：

```bash
cd /opt/prompt
docker compose config
docker compose up -d --build
```

首次构建需要从 Docker Hub 下载 Node.js 和 Nginx 基础镜像，耗时取决于服务器网络。

查看容器状态和日志：

```bash
docker compose ps
docker compose logs --tail=100 web
```

正常情况下，`docker compose ps` 会显示服务为 `healthy`。启动后的前几秒可能暂时显示 `health: starting`。

## 6. 在服务器内验证

检查健康接口：

```bash
curl --fail http://127.0.0.1:8080/health
```

正常输出为：

```text
ok
```

再检查首页响应：

```bash
curl --fail --head http://127.0.0.1:8080/
```

应看到 `HTTP/1.1 200 OK`。如果修改了 `APP_PORT`，请同步替换以上命令中的 `8080`。

最后从自己的电脑访问：

```text
http://服务器公网IP:8080/
```

点击“笔记生花”或“See Our Work”，确认浏览器打开同一服务器的 `3015` 端口，而不是 `localhost`。

## 7. 日常管理

查看状态：

```bash
docker compose ps
```

持续查看日志：

```bash
docker compose logs -f --tail=100 web
```

重启服务：

```bash
docker compose restart web
```

停止并保留容器：

```bash
docker compose stop
```

重新启动已停止的容器：

```bash
docker compose start
```

停止并移除容器和 Compose 网络：

```bash
docker compose down
```

`docker compose down` 不会删除已经构建的镜像。不要随意使用带 `-v` 的删除命令或全局 `docker system prune`，以免影响服务器上的其他项目。

## 8. 更新版本

将新代码上传到 `/opt/prompt`，确认 `.env` 未被覆盖，然后执行：

```bash
cd /opt/prompt
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:8080/health
```

生产环境建议每次发布前修改 `.env` 中的镜像标签：

```dotenv
IMAGE_TAG=20260720-2
```

这样旧镜像会被保留，出现问题时可以把 `IMAGE_TAG` 改回旧值，然后执行：

```bash
docker compose up -d --no-build
```

只有确认新版本稳定后，才考虑手动删除不再需要的旧镜像。

## 9. 域名和 HTTPS

当前容器只提供 HTTP。需要域名和 HTTPS 时，可在宿主机或单独的网关容器中使用 Nginx、Caddy 或云负载均衡，将域名反向代理到 `127.0.0.1:8080`。

如果主站已经使用 HTTPS，浏览器生成的关联地址也会使用 HTTPS。此时 `3015` 服务必须支持 HTTPS；否则应为关联应用配置 HTTPS 域名，并通过 `NOTE_APP_URL=https://notes.example.com/` 显式覆盖，然后重新构建。

## 10. 常见问题

### `8080` 端口已被占用

修改 `.env`：

```dotenv
APP_PORT=8081
```

然后重新启动，并在安全组、访问地址和健康检查命令中使用新端口。

### 容器不断重启或显示 `unhealthy`

```bash
docker compose ps
docker compose logs --tail=200 web
docker inspect --format '{{json .State.Health}}' "$(docker compose ps -q web)"
```

最后一条命令会自动取得当前 Compose 服务对应的容器 ID。

### 镜像拉取超时

先确认服务器可以访问 `registry-1.docker.io` 和 `auth.docker.io`，然后重试：

```bash
docker compose build --pull
```

如果服务器网络受限，请按云服务商或团队运维规范配置可信的 Docker Registry 镜像源，不要使用来源不明的公共镜像站。

### 页面能打开，但 `3015` 链接打不开

检查关联应用是否正在监听服务器的 `3015` 端口，并确认云安全组和防火墙允许访问。也可以将 `NOTE_APP_URL` 改为已经可访问的完整地址，再重新构建当前项目。

### 页面没有显示背景视频或字体

背景视频和字体来自外部站点，并未打包进 Docker 镜像。请检查浏览器开发者工具中的网络请求，以及服务器或客户端网络是否能够访问这些外部资源。

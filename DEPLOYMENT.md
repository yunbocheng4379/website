# Docker 服务器部署说明

本项目是 React + TypeScript + Vite 前端。Docker 使用 Node.js 构建静态文件，再由 Nginx 提供生产服务。

本文档分为两部分：

1. 新服务器上的首次部署。
2. 代码更新后的重新部署。

以下命令以 Ubuntu 22.04、24.04 或 26.04 为例，并约定：

- GitHub 仓库：`https://github.com/yunbocheng4379/website`
- 生产分支：`main`
- 服务器部署目录：`/opt/website`
- 当前网站端口：`8080`
- “笔记生花”应用端口：`3015`

> `dev` 分支用于开发测试，生产服务器应部署 `main` 分支。

## 一、首次部署

### 1. 登录服务器

```bash
ssh 用户名@服务器公网IP
```

### 2. 安装 Git、Docker Engine 和 Compose

安装基础工具：

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
```

添加 Docker 官方软件源并安装 Docker Engine：

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
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
```

检查安装：

```bash
sudo docker --version
sudo docker compose version
sudo docker run --rm hello-world
```

其他 Linux 发行版请参考 [Docker Engine 官方安装文档](https://docs.docker.com/engine/install/)。

本文后续命令省略了 `sudo`。如果当前用户没有 Docker 权限，请在每条 `docker` 命令前添加 `sudo`。

### 3. 检查服务器访问 Docker Hub 的网络

项目首次构建需要以下镜像：

```bash
docker pull docker/dockerfile:1
docker pull node:22-alpine
docker pull nginx:1.28-alpine
```

三个镜像都成功拉取后再继续部署。

如果出现 `auth.docker.io timeout` 或 `i/o timeout`，说明服务器无法正常访问 Docker Hub。需要在服务器上配置可用代理或可信的 Registry 镜像加速器。

本地 Mac 上的代理地址不能直接用于服务器，例如：

```text
127.0.0.1:7897
```

服务器中的 `127.0.0.1` 指向服务器自身，而不是本地电脑。服务器必须使用它能够直接访问的代理地址。Docker Registry Mirror 的配置方法可参考 [Docker 官方镜像缓存文档](https://docs.docker.com/docker-hub/image-library/mirror/)。

### 4. 准备部署目录

```bash
sudo mkdir -p /opt/website
sudo chown "$USER":"$USER" /opt/website
```

### 5. 克隆生产代码

如果仓库允许通过 HTTPS 拉取：

```bash
git clone -b main https://github.com/yunbocheng4379/website.git /opt/website
```

如果仓库是私有仓库，并且服务器已经配置 GitHub SSH Key：

```bash
git clone -b main git@github.com:yunbocheng4379/website.git /opt/website
```

进入项目并确认分支：

```bash
cd /opt/website
git branch --show-current
git log -1 --oneline
```

`git branch --show-current` 应输出：

```text
main
```

### 6. 创建部署配置

```bash
cd /opt/website
cp .env.example .env
nano .env
```

默认配置：

```dotenv
APP_PORT=8080
NOTE_APP_PORT=3015
NOTE_APP_URL=
WHALE_FALL_APP_PORT=8009
WHALE_FALL_APP_URL=
IMAGE_TAG=latest
```

参数说明：

- `APP_PORT`：当前网站在服务器上开放的端口。
- `NOTE_APP_PORT`：“笔记生花”服务所在端口。
- `NOTE_APP_URL`：可选的完整访问地址。留空时自动使用当前服务器主机名和 `NOTE_APP_PORT`。
- `WHALE_FALL_APP_PORT`：“鲸落‘生’”服务所在端口。
- `WHALE_FALL_APP_URL`：可选的完整访问地址。留空时自动使用当前服务器主机名、`WHALE_FALL_APP_PORT` 和 `/site`。
- `IMAGE_TAG`：构建镜像的标签；生产环境也可以使用日期或版本号。

例如用户访问：

```text
http://203.0.113.10:8080/
```

当 `NOTE_APP_URL` 留空时，页面中的相关链接会自动指向：

```text
http://203.0.113.10:3015/
```

当 `WHALE_FALL_APP_URL` 留空时，“鲸落‘生’”链接会自动指向：

```text
http://203.0.113.10:8009/site
```

如果“笔记生花”使用独立域名或 HTTPS，应设置完整地址：

```dotenv
NOTE_APP_URL=https://notes.example.com/
```

生产服务器也可以显式设置“鲸落‘生’”完整地址，确保前端始终跳转到服务器 IP：

```dotenv
WHALE_FALL_APP_URL=http://47.99.136.241:8009/site
```

这些配置会在构建镜像时写入前端文件。修改 `.env` 后，必须重新构建镜像才能生效。

### 7. 检查 Compose 配置

```bash
cd /opt/website
docker compose config
```

如果该命令没有报错，再继续构建。

### 8. 首次构建并启动

```bash
docker compose up -d --build
```

首次构建会安装 npm 依赖并生成前端生产文件，耗时取决于服务器网络。

查看状态：

```bash
docker compose ps
```

容器刚启动时可能短暂显示 `health: starting`，正常情况下随后会变成 `healthy`。

查看日志：

```bash
docker compose logs --tail=100 web
```

### 9. 在服务器内部验证

检查健康接口：

```bash
curl --fail http://127.0.0.1:8080/health
```

正常输出：

```text
ok
```

检查首页：

```bash
curl --head http://127.0.0.1:8080/
```

应返回：

```text
HTTP/1.1 200 OK
```

如果修改了 `APP_PORT`，需要同步修改验证命令中的 `8080`。

### 10. 配置安全组和防火墙

在云服务器安全组中按实际需要开放：

- TCP `22`：SSH 管理端口。
- TCP `8080`：当前网站。
- TCP `3015`：“笔记生花”服务；只有该服务需要被公网直接访问时才开放。

如果服务器使用 UFW：

```bash
sudo ufw allow 8080/tcp
sudo ufw allow 3015/tcp
sudo ufw status
```

Docker 发布的端口可能绕过部分 UFW 规则，云服务器应同时使用安全组限制访问范围。详细说明见 [Docker 防火墙文档](https://docs.docker.com/engine/network/packet-filtering-firewalls/)。

### 11. 从浏览器访问

```text
http://服务器公网IP:8080/
```

同时测试“笔记生花”服务：

```text
http://服务器公网IP:3015/
```

确认页面中的“笔记生花”和“See Our Work”链接使用服务器地址，而不是 `localhost`。

## 二、代码更新后的重新部署

更新时不需要先运行 `docker compose down`。直接重新构建并启动，Compose 会替换旧容器，从而减少停机时间。

### 1. 进入项目目录

```bash
cd /opt/website
```

### 2. 检查服务器上是否存在未提交修改

```bash
git status
```

正常情况下应显示工作区干净。如果存在人为修改，不要直接拉取代码，应先确认这些修改是否需要保留。

### 3. 拉取最新生产代码

```bash
git checkout main
git fetch origin
git pull --ff-only origin main
```

确认最新提交：

```bash
git log -1 --oneline
```

使用 `--ff-only` 可以避免在生产服务器上意外产生合并提交。

### 4. 检查环境配置

确认 `.env` 仍然存在：

```bash
ls -la .env
sed -n '1,120p' .env
```

`.env` 已加入 `.gitignore`，正常情况下拉取代码不会覆盖它。

### 5. 重新构建并部署

```bash
docker compose config
docker compose up -d --build --remove-orphans
```

该命令会：

1. 使用最新代码重新构建前端。
2. 生成新的 Nginx 运行镜像。
3. 替换旧容器。
4. 清理当前 Compose 项目中已经不再使用的孤立容器。

### 6. 验证新版本

```bash
docker compose ps
docker compose logs --tail=100 web
curl --fail http://127.0.0.1:8080/health
curl --head http://127.0.0.1:8080/
```

确认：

- 容器状态为 `healthy`。
- 健康接口返回 `ok`。
- 首页返回 HTTP 200。
- 浏览器中的页面内容已经更新。

### 7. 日常更新快捷命令

确认服务器工作区没有本地修改后，可以依次执行：

```bash
cd /opt/website
git checkout main
git pull --ff-only origin main
docker compose up -d --build --remove-orphans
docker compose ps
curl --fail http://127.0.0.1:8080/health
```

## 三、部署失败时回滚

查看最近提交：

```bash
cd /opt/website
git log --oneline -5
```

选择上一个正常提交，并重新构建：

```bash
git checkout 上一个正常提交ID
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:8080/health
```

问题修复后回到生产分支：

```bash
git checkout main
git pull --ff-only origin main
docker compose up -d --build
```

## 四、常用运维命令

查看容器状态：

```bash
docker compose ps
```

查看实时日志：

```bash
docker compose logs -f --tail=100 web
```

重启服务：

```bash
docker compose restart web
```

停止服务：

```bash
docker compose stop
```

启动已停止的服务：

```bash
docker compose start
```

停止并移除容器和当前 Compose 网络：

```bash
docker compose down
```

`docker compose down` 不会删除构建好的镜像。

清理本项目构建留下的悬空镜像：

```bash
docker image prune -f
```

不要随意执行 `docker system prune -a`，它可能删除服务器上其他项目使用的镜像。

## 五、域名和 HTTPS

当前容器直接提供 HTTP 服务。需要域名和 HTTPS 时，可以在宿主机或单独的网关容器中使用 Nginx、Caddy 或云负载均衡，将域名反向代理到：

```text
http://127.0.0.1:8080
```

如果主站使用 HTTPS，“笔记生花”也应提供 HTTPS 地址。可以在 `.env` 中设置：

```dotenv
NOTE_APP_URL=https://notes.example.com/
```

修改后重新构建：

```bash
docker compose up -d --build
```

## 六、常见故障排查

### 1. Docker Hub 拉取超时

分别测试：

```bash
docker pull docker/dockerfile:1
docker pull node:22-alpine
docker pull nginx:1.28-alpine
```

如果仍然出现 `auth.docker.io timeout`，检查服务器的代理或可信镜像加速配置。

### 2. `8080` 端口已被占用

修改 `.env`：

```dotenv
APP_PORT=8081
```

然后重新部署：

```bash
docker compose up -d --build
```

安全组、访问地址和健康检查命令也需要使用新端口。

### 3. 容器不是 `healthy`

```bash
docker compose ps
docker compose logs --tail=200 web
docker inspect --format '{{json .State.Health}}' "$(docker compose ps -q web)"
```

### 4. 页面能打开，但 `3015` 链接无法访问

检查“笔记生花”服务是否监听服务器的 `3015` 端口，并确认云安全组和防火墙允许访问。也可以设置完整的 `NOTE_APP_URL` 后重新构建。

### 5. 背景视频或字体没有显示

背景视频和字体来自外部站点，没有打包进 Docker 镜像。请检查客户端网络和浏览器开发者工具中的网络请求。

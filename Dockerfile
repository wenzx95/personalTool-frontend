# 多阶段构建
# 阶段1: 构建
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
# 使用淘宝 npm 镜像源加速
RUN npm config set registry https://registry.npmmirror.com && \
    npm install
# 添加 BUILD_TIME 参数，每次构建时传入不同值来破坏缓存
ARG BUILD_TIME=unknown
COPY . .
# 显示构建时间并构建
RUN echo "Build time: $BUILD_TIME" && npm run build:no-check

# 阶段2: 运行
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


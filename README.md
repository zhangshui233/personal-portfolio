# 技术美术作品集网站

一个简洁、现代、有科技感的技术美术（Technical Artist）个人作品集网站。

## 目录结构

```
ta-portfolio/
│
├── index.html           # 网站主页（Hero + 精选作品 + 技能栏）
├── projects.html        # 作品集项目展示页（支持分类筛选）
├── about.html           # 关于我 / 个人简介页
├── README.md            # 项目说明文档
│
├── css/
│   └── style.css        # 主样式表（响应式，深色科技风）
│
├── js/
│   └── main.js          # 主脚本（Three.js 场景 + 交互逻辑）
│
├── images/
│   ├── profile.jpg      # 个人头像（替换为你自己的照片）
│   ├── favicon.ico      # 网站图标
│   └── projects/        # 项目截图
│       ├── project1.jpg
│       ├── project2.jpg
│       └── ...
│
├── assets/
│   ├── models/          # Three.js 用的 3D 模型（.gltf / .glb）
│   │   └── scene.glb
│   └── fonts/           # 自定义字体文件
│
└── libs/                # 本地第三方库（可选，默认使用 CDN）
    └── three.js
```

## 快速开始

直接用浏览器打开 `index.html` 即可预览。

如需本地开发服务器（解决 CORS 问题，加载本地 3D 模型时需要）：

```bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx serve .
```

然后访问 `http://localhost:8080`。

## 自定义内容

### 替换个人信息
- `about.html` — 修改姓名、简介、工作经历
- `images/profile.jpg` — 替换为你的头像
- 所有页面的页脚 — 更新社交链接

### 添加项目
在 `projects.html` 的 `#projects-container` 中复制一个 `<article class="card card--large">` 块，修改内容和 `data-category` 属性（可选值：`shader` / `tool` / `vfx` / `pipeline`）。

### 扩展 Three.js 场景
在 `js/main.js` 的 `initHeroScene()` 函数中：
- 替换粒子几何体为自定义 shader 或 GLTF 模型
- 加载 `assets/models/scene.glb` 使用 `THREE.GLTFLoader`
- 添加后处理效果（Bloom、SSAO 等）

## 技术栈

- 纯 HTML / CSS / JavaScript，无框架依赖
- [Three.js r128](https://threejs.org/) — Hero 区域 3D 场景
- CSS 自定义属性（Design Tokens）
- CSS Grid + Flexbox 响应式布局
- IntersectionObserver API — 技能条滚动动画

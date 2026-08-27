这是一份可以直接交付给 AI 或开发人员执行的 **`TECH_SPEC.md`（技术架构与工程实现规范文档）**。文档基于 **React + Vite + TypeScript + Tailwind CSS + Framer Motion** 技术栈，结合了 **Liquid Glass 视觉规范** 与 **Cloudflare Pages 部署要求**。

---

# 🛠️ TECH_SPEC.md: 技术架构与工程实现规范

## 1. 工程基础与环境要求

* **工程骨架**：基于 `Vite 6.x` 构建的纯客户端静态单页应用 (SPA)。
* **运行时语言**：`TypeScript 5.x`（严格模式 `strict: true`）。
* **UI 框架**：`React 19.x`。
* **样式引擎**：`Tailwind CSS 3.x` + 原生 CSS Variables + PostCSS。
* **动效引擎**：`Framer Motion (motion/react)`。
* **构建产物**：纯静态前端资源目录 (`dist/`)，无任何服务端代码依赖。

---

## 2. 依赖清单与配置文件

### 2.1 依赖清单 (`package.json`)

```json
{
  "name": "life-time-bill",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "framer-motion": "^12.4.7",
    "hls.js": "^1.5.20",
    "html-to-image": "^1.11.11",
    "lucide-react": "^1.16.0",
    "react": "^19.0.0",
    "react-countup": "^6.5.3",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.2"
  },
  "devDependencies": {
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.2.0"
  }
}

```

### 2.2 Tailwind 配置文件 (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Instrument Serif'", "serif"],
        body: ["'Barlow'", "sans-serif"],
      },
      colors: {
        background: "#000000",
        foreground: "#FFFFFF",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

```

---

## 3. 全局样式与 Liquid Glass 实现 (`src/index.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600&family=Instrument+Serif:ital@1&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
}

body {
  background-color: #000000;
  color: #FFFFFF;
  font-family: 'Barlow', sans-serif;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}

/* 核心液态玻璃 Liquid Glass 组件 */
@layer components {
  .liquid-glass {
    background: rgba(255, 255, 255, 0.015);
    background-blend-mode: luminosity;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12);
    position: relative;
    overflow: hidden;
  }

  .liquid-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.4px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0.15) 20%,
      rgba(255, 255, 255, 0.00) 40%,
      rgba(255, 255, 255, 0.00) 60%,
      rgba(255, 255, 255, 0.15) 80%,
      rgba(255, 255, 255, 0.45) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .liquid-glass-strong {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(50px);
    -webkit-backdrop-filter: blur(50px);
    box-shadow: 4px 4px 24px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.25);
    position: relative;
    overflow: hidden;
  }

  .liquid-glass-strong::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.4px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(255, 255, 255, 0.2) 25%,
      rgba(255, 255, 255, 0.00) 50%,
      rgba(255, 255, 255, 0.2) 75%,
      rgba(255, 255, 255, 0.6) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

```

---

## 4. 核心组件架构与设计

```text
src/
├── components/
│   ├── BlurText.tsx          # 逐字毛玻璃模糊聚焦动效 (React Bits 风格)
│   ├── HeroSection.tsx       # 100dvh 全屏视频背景、艺术标题与预设快捷键
│   ├── FormSection.tsx       # 交互控制台 (画像/工时/大小休/节假日抽屉)
│   ├── ResultSection.tsx     # 结果看板 (CountUp 核心大字与三种粒度并列)
│   └── PosterModal.tsx       # 9:16 玻璃海报渲染与图片下载模态框
├── lib/
│   ├── algorithm.ts          # 严格导入 ALGORITHM.md 纯函数
│   ├── constants.ts          # 预设模板与节假日基准数据
│   └── urlState.ts           # URL SearchParams 双向绑定与解析
├── types/
│   └── index.ts              # 表单状态与结果数据类型定义
├── App.tsx                   # 状态中枢与整页拼装
└── main.tsx

```

### 4.1 BlurText 组件规范 (`src/components/BlurText.tsx`)

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const BlurText: React.FC<BlurTextProps> = ({ text, className = '', delay = 0 }) => {
  const words = text.split(' ');

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{
            duration: 0.6,
            delay: delay + index * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block mr-[0.25em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

```

### 4.2 视频背景播放策略 (`src/components/HeroSection.tsx`)

* 使用 HTML5 原生 `<video>` 配合 HLS.js 自动推流：
* 属性强制包含：`autoPlay`, `loop`, `muted`, `playsInline`。
* 桌面与移动端统一使用 `100dvh` 高度，顶部与底部叠加 200px 线性黑向渐变遮罩。

---

## 5. 状态同步与持久化方案 (`src/lib/urlState.ts`)

1. **首次加载**：
* 页面挂载时解析 `window.location.search`。若包含参数则还原为初始状态，否则加载默认打工人配置。


2. **动态同步**：
* 表单任意字段更新时，使用防抖（150ms）调用 `window.history.replaceState(null, '', '?' + params.toString())`，实时更新地址栏，确保用户一键复制链接分享给他人后打开即为相同计算状态。



---

## 6. 海报导出实现规范 (`src/components/PosterModal.tsx`)

* 采用 `html-to-image` 的 `toPng` 纯客户端渲染。
* **DOM 约束**：海报渲染容器设置固定比例 `aspect-[9/16]`，宽度 `400px`，内含 Liquid Glass 玻璃卡片、核心工作/自由账单大字、条形码视觉占位与品牌域名标识。
* 渲染时配置参数：`pixelRatio: 2`（输出 2 倍高清视网膜图），生成 Blob 后通过 `<a download="life-time-bill.png">` 自动触发浏览器下载。

---

## 7. Cloudflare Pages 部署配置

### 7.1 构建配置参数

在 Cloudflare Dashboard 连接 GitHub 仓库时设置：

* **Framework preset**: `Vite`
* **Build command**: `npm run build`
* **Build output directory**: `dist`
* **Node.js Version**: `20.x` 或以上 (环境变量添加 `NODE_VERSION=20`)

### 7.2 单页应用路由兜底 (`public/_redirects`)

在 `public/` 目录下放置 `_redirects` 文件，防止刷新 404：

```text
/*    /index.html   200

```
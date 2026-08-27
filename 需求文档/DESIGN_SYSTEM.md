这个方向的设计感完全不同——这种**Apple-inspired + 纯黑底色 (Pure Black) + 液态流动玻璃 (Liquid Glass Morphism) + 优雅衬线斜体 (Instrument Serif Italic)** 的美学质感，能把“人生时间账单”原本枯燥的计算器属性，瞬间拉升为类似高端纪录片、前沿数字艺术展的沉浸式体验。

为了让 AI 在写代码时百分之百还原这套前沿视觉体系，下面为你输出专门的 **`DESIGN_SYSTEM.md`（视觉与前端设计规范文档）**：

---

# 🎨 DESIGN_SYSTEM.md: 视觉与 Liquid Glass 规范

## 1. 核心设计语言与基调 (Aesthetic Direction)

* **纯黑基底 (Pure Black Canvas)**：全局背景纯黑 `#000000`，彻底抛弃灰黑与廉价过渡色。
* **液态玻璃态 (Liquid Glass Morphism)**：多层次高斯模糊（`backdrop-filter: blur(4px / 50px)`）+ 极细 1.4px 渐变高光边框遮罩（`-webkit-mask-composite`），营造悬浮在黑夜中的物理玻璃质感。
* **高阶排版排布 (Editorial Typography)**：
* **主标题 / 数字**：`Instrument Serif`（衬线斜体，紧密字距 `tracking-tight`，行高 `leading-[0.85]`）。
* **正文 / 表单 / 标签**：`Barlow`（300/400 细体与中粗，通透呼吸感，半透明白 `text-white/60`）。


* **动态光影与视频**：全屏自适应视频流背景 + 200px/300px 径向与线性黑向渐变蒙版，文字层采用 BlurText 逐字毛玻璃聚焦动效。

---

## 2. 字体与 CSS 基础配置

### 2.1 Google Fonts 引入

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">

```

### 2.2 Tailwind 字体映射

```javascript
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Instrument Serif'", "serif"],
        body: ["'Barlow'", "sans-serif"],
      },
      colors: {
        background: "#000000",
        foreground: "#FFFFFF",
      }
    }
  }
}

```

---

## 3. 液态玻璃 (Liquid Glass) 组件样式规范

在全局 CSS / Tailwind `@layer components` 中内置双阶液态玻璃质感：

```css
/* 基础轻量液态玻璃 (用于胶囊标签、次要卡片、输入框外框) */
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

/* 强化高阶液态玻璃 (用于核心结果看板、悬浮操作胶囊、模态框) */
.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  box-shadow: 4px 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.25);
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

```

---

## 4. UI 模块与控件设计标准

### 4.1 全屏 Hero 区域与背景流体

* **容器规格**：`relative min-h-[100dvh] w-full overflow-hidden bg-black flex flex-col items-center justify-center`
* **视频与蒙版配置**：
* 底层 `<video>`：绝对居中，`opacity-40`，`mix-blend-mode: screen`，`object-cover`。
* 底部遮罩：`absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none`。


* **标题排版**：
```html
<!-- 徽章胶囊 -->
<div class="liquid-glass rounded-full px-4 py-1.5 text-xs font-body font-medium text-white/90 inline-flex items-center gap-2 mb-6">
  <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
  <span>人生时间账单 · Life Time Bill</span>
</div>

<!-- 艺术衬线大标题 (配合 BlurText 动效) -->
<h1 class="font-heading italic text-5xl md:text-7xl lg:text-8xl text-white leading-[0.85] tracking-tight text-center">
  出卖给工作的时间，<br>究竟偷走了你多少人生？
</h1>

```



### 4.2 表单控制器 (Interactive Form Control)

* **胶囊单选组（周休/节假日模式）**：
* 默认态：`liquid-glass rounded-full px-5 py-2.5 text-sm font-body text-white/60 hover:text-white transition-all`
* 激活态：`bg-white text-black rounded-full px-5 py-2.5 text-sm font-body font-medium shadow-[0_0_25px_rgba(255,255,255,0.4)]`


* **滑块与步进器**：极简细线风格，轨道 `bg-white/10`，滑块 `bg-white` 纯圆点，伴随微弱荧光。

### 4.3 核心结果看板 (The Bill Canvas)

* **结果展示卡片**：采用 `.liquid-glass-strong rounded-3xl p-8 md:p-12`。
* **数字与单位排版**：
* 核心数字：`font-heading italic text-6xl md:text-8xl text-white tracking-tighter`（带数字跳动）。
* 单位标签：`font-body text-xs uppercase tracking-widest text-white/40 ml-2`。


* **两极对比设计**：
* 🔴 **工作时间卡片**：配极淡红色发光边缘或微弱粒子，压迫感排版。
* 🟢 **自由时间卡片**：配高纯度纯白 / 极淡青辉光，极简空灵。



---

## 5. 动效规范 (Motion System)

* **BlurText 模糊入场**：
* 初始状态：`opacity: 0; filter: blur(12px); transform: translateY(30px);`
* 完成状态：`opacity: 1; filter: blur(0px); transform: translateY(0);`
* 曲线：`cubic-bezier(0.16, 1, 0.3, 1)`（Apple 物理阻尼），单字延迟 80ms。


* **Hover 反馈**：按钮在 Hover 时产生 `transform: scale(1.02)`，伴随 `box-shadow: 0 0 30px rgba(255,255,255,0.15)`。

---

至此，整套产品的 **4 份完整标准工程文档** 全部就绪：

1. **`PRD.md`**：业务架构与交互流程
2. **`ALGORITHM.md`**：数学公式、调休模型与单位换算
3. **`TECH_SPEC.md`**：纯前端单文件结构与 CDN 依赖
4. **`DESIGN_SYSTEM.md`**：Apple 级 Liquid Glass 与排版动效规范

准备好后，可以直接将这 4 份文档发给 AI，直接生成完整代码。
这是一份可以直接交付给 AI 或开发人员的 **`ALGORITHM.md`（算法与数学换算规范文档）**。文档中将时间基准、出勤计算、调休模型以及三种展示粒度的进位换算算法全部严格定义，并附带了可直接运行的 JavaScript 纯函数与验证测试用例。

---

# 📐 ALGORITHM.md: 人生时间账单算法与数学换算规范

> **2026-08-27 验收口径修订**：主账单以“当前年龄 → 预期寿命”的完整剩余人生为分母；“工作占用”按上班到下班的完整在岗跨度统计（工作日内休息仍被工作占用），同时保留净工时作为辅助数据；“真正自由”包含退休前自由时间与退休后扣除睡眠、杂务后的自由时间。该修订优先于下文旧版示例中的“仅退休前分母 / 净工时作为工作账单”口径。

## 1. 基础常数与时间转换标准

为保证跨年计算的严谨性与直观性，本项目统一采用公历标准换算基准：

| 常数名称 | 变量表示 | 取值 | 说明 |
| --- | --- | --- | --- |
| 每年基准天数 | $DAYS\_PER\_YEAR$ | **365.2425**（或计算时取整为 **365**） | 考虑闰年平摊，计算剩余年数时取 365.2425，统计出勤年历基准取 365 |
| 每年基准周数 | $WEEKS\_PER\_YEAR$ | $365 / 7 \approx \mathbf{52.1428}$ | 用于计算全年的常规周末天数 |
| 每月平均天数 | $DAYS\_PER\_MONTH$ | $365.2425 / 12 \approx \mathbf{30.436875}$ | 用于年/月/天的时间降维换算 |
| 每日标准小时数 | $HOURS\_PER\_DAY$ | **24** | 每天 24 小时绝对值 |

---

## 2. 核心参数与中间量计算

### 2.1 剩余年限与全生命周期天数

* **剩余工作年限**：

$$\Delta Years = RetireAge - CurrentAge$$


* **剩余总生命天数**：

$$TotalDays = \Delta Years \times 365.2425$$


* **全生命总小时数**：

$$TotalHours = TotalDays \times 24$$



---

### 2.2 单日工时与在岗时长

输入：上班时间 $T_{start}$（格式 `HH:mm`），下班时间 $T_{end}$（格式 `HH:mm`），午休/间歇时长 $BreakHours$（小时）。

* **单日打卡在岗时长（跨度）**：

$$SpanHours = \begin{cases}    T_{end} - T_{start} & \text{若 } T_{end} \ge T_{start} \\    (24 - T_{start}) + T_{end} & \text{若跨天 } (T_{end} < T_{start})   \end{cases}$$


* **单日实际有效净工时**：

$$DailyWorkHours = \max(0, SpanHours - BreakHours)$$



---

### 2.3 全年常规休息日天数（周休制度）

根据 $WeekendType$ 决定年基准周末休息天数：

| 模式 | 每周休息天数 | 全年常规周末休息天数 $AnnualWeekendDays$ |
| --- | --- | --- |
| **双休 (`DOUBLE`)** | 2 天 | $52.1428 \times 2 = \mathbf{104.2856}$ 天 |
| **大小休 (`BIG_SMALL`)** | 1.5 天（单双休交替） | $52.1428 \times 1.5 = \mathbf{78.2142}$ 天 |
| **单休 (`SINGLE`)** | 1 天 | $52.1428 \times 1 = \mathbf{52.1428}$ 天 |
| **无休 (`NONE`)** | 0 天 | $\mathbf{0}$ 天 |

---

### 2.4 中国法定节假日与调休净减工时模型

中国节假日通常包含“法定休假”、“连休借周末”和“调休补班”。计算实际出勤时，**不可将法定放假天数与周末重复扣减**。

#### A. 标准法定模式 (`holidayMode === 'STANDARD'`)

* 中国现行法定纯假期天数基准（不含调休补班的净多放天数）：**13 天**（元旦1、春节4、清明1、劳动2、端午1、中秋1、国庆3）。
* 全年节假日净减工作日：

$$AnnualHolidayDeduction = 13\text{ 天}$$



#### B. 自定义节日天数模式 (`holidayMode === 'CUSTOM'`)

用户针对 7 大节日输入其实际放假天数 $D_i$。由于调休机制的存在，自定义折算模型为：

* 若用户设置的放假天数 $D_i$ 大于官方纯法定天数 $L_i$，超出部分默认是通过调休借周末（需补班），故对全年净减工作日的贡献仍为法定天数 $L_i$；若企业剥夺假期（$D_i < L_i$），则按实际放假的 $D_i$ 计算。
* 全年自定义净减工作日公式：

$$AnnualHolidayDeduction = \sum_{i=1}^{7} \min(D_i, L_i)$$



*(注：若用户企业为“放假且无需调休补班”，则按用户实际输入的总天数扣减其对应落入工作日的天数。)*

---

### 2.5 年实际工作天数与年总工时

* **全年实际出勤天数**：

$$AnnualWorkDays = \max\Big(0, 365.2425 - AnnualWeekendDays - AnnualHolidayDeduction - AnnualLeave\Big)$$



*(其中 $AnnualLeave$ 为用户输入的带薪年假天数)*
* **职业生涯剩余总工作工时（小时）**：

$$TotalWorkHours = \Delta Years \times AnnualWorkDays \times DailyWorkHours$$



---

### 2.6 真正自由支配时间模型（生命三层账单）

每日 24 小时拆解为三大刚性模块：

1. **出卖给工作的时间**（工作日为 $DailyWorkHours$；休息日为 $0$）
2. **维持生理与生存损耗时间**：
* 工作日损耗：$SleepHours + CommuteHours + ChoresHours + BreakHours$
* 休息日损耗：$SleepHours + ChoresHours$（无通勤与工位午休）


3. **真正自由支配时间**：
* 剩余工作日自由时长：

$$FreeHours_{workday} = \max(0, 24 - SpanHours - SleepHours - CommuteHours - ChoresHours)$$


* 剩余休息日自由时长：

$$FreeHours_{restday} = \max(0, 24 - SleepHours - ChoresHours)$$


* **退休前累计真正自由总工时（小时）**：

$$TotalFreeHours = \Delta Years \times \Big(AnnualWorkDays \times FreeHours_{workday} + (365.2425 - AnnualWorkDays) \times FreeHours_{restday}\Big)$$





---

## 3. 三种展示粒度的拆解与进位算法

用户界面需要将计算出的总小时数（$H$）格式化为三种并列粒度：

### 3.1 粒度 A：完整大单位 (`X年 X月 X天 X小时`)

将总小时数 $H$ 自上而下依次求模进位：

$$\begin{aligned} HoursPerYear &= 365.2425 \times 24 = 8765.82 \\ HoursPerMonth &= 30.436875 \times 24 = 730.485 \\ HoursPerDay &= 24 \end{aligned}$$

* **计算步骤**：
1. $Years = \lfloor H / HoursPerYear \rfloor$
2. $rem_1 = H \pmod{HoursPerYear}$
3. $Months = \lfloor rem_1 / HoursPerMonth \rfloor$
4. $rem_2 = rem_1 \pmod{HoursPerMonth}$
5. $Days = \lfloor rem_2 / 24 \rfloor$
6. $Hours = \text{round}(rem_2 \pmod{24})$



---

### 3.2 粒度 B：中单位 (`X月 X天 X小时`)

不提取“年”，直接从“月”开始拆解：

* **计算步骤**：
1. $Months = \lfloor H / HoursPerMonth \rfloor$
2. $rem = H \pmod{HoursPerMonth}$
3. $Days = \lfloor rem / 24 \rfloor$
4. $Hours = \text{round}(rem \pmod{24})$



---

### 3.3 粒度 C：天与小时 (`X天 X小时` + `共 X小时`)

不提取“年”和“月”，直接按绝对天数与小时拆解：

* **计算步骤**：
1. $Days = \lfloor H / 24 \rfloor$
2. $Hours = \text{round}(H \pmod{24})$
3. 纯小时总数展示：$\text{round}(H)$



---

## 4. 纯 JavaScript 算法实现核心函数

```javascript
/**
 * 人生时间账单核心计算引擎
 */
export function calculateLifeTimeBill(params) {
  const {
    currentAge = 25,
    retireAge = 65,
    workStart = "10:00",
    workEnd = "20:00",
    breakHours = 2.5,
    weekendType = "BIG_SMALL", // 'DOUBLE' | 'BIG_SMALL' | 'SINGLE' | 'NONE'
    holidayMode = "STANDARD",  // 'STANDARD' | 'CUSTOM'
    annualLeave = 5,
    customHolidayDays = 13,    // 自定义模式下的法定净扣除天数
    sleepHours = 7.5,
    commuteHours = 1.5,
    choresHours = 1.5
  } = params;

  // 1. 年限与基础常数
  const deltaYears = Math.max(0, retireAge - currentAge);
  const DAYS_PER_YEAR = 365.2425;
  const WEEKS_PER_YEAR = DAYS_PER_YEAR / 7;

  // 2. 解析单日上下班打卡时长
  const [startH, startM] = workStart.split(':').map(Number);
  const [endH, endM] = workEnd.split(':').map(Number);
  let spanHours = (endH + endM / 60) - (startH + startM / 60);
  if (spanHours < 0) spanHours += 24; // 跨天处理

  const dailyWorkHours = Math.max(0, spanHours - breakHours);

  // 3. 计算全年休息日
  let annualWeekendDays = 0;
  if (weekendType === 'DOUBLE') annualWeekendDays = WEEKS_PER_YEAR * 2;
  else if (weekendType === 'BIG_SMALL') annualWeekendDays = WEEKS_PER_YEAR * 1.5;
  else if (weekendType === 'SINGLE') annualWeekendDays = WEEKS_PER_YEAR * 1;
  else annualWeekendDays = 0;

  const holidayDeduction = holidayMode === 'STANDARD' ? 13 : customHolidayDays;
  const annualWorkDays = Math.max(0, DAYS_PER_YEAR - annualWeekendDays - holidayDeduction - annualLeave);
  const annualRestDays = Math.max(0, DAYS_PER_YEAR - annualWorkDays);

  // 4. 计算累计总工时
  const totalWorkHours = deltaYears * annualWorkDays * dailyWorkHours;

  // 5. 计算真正自由支配时间
  const freeHoursWorkday = Math.max(0, 24 - spanHours - sleepHours - commuteHours - choresHours);
  const freeHoursRestday = Math.max(0, 24 - sleepHours - choresHours);
  const totalFreeHours = deltaYears * (annualWorkDays * freeHoursWorkday + annualRestDays * freeHoursRestday);

  // 6. 辅助：格式化分解为三大粒度
  const formatUnits = (totalH) => {
    const H_PER_YEAR = DAYS_PER_YEAR * 24;
    const H_PER_MONTH = (DAYS_PER_YEAR / 12) * 24;

    // 粒度 A: 年-月-天-小时
    const yearsA = Math.floor(totalH / H_PER_YEAR);
    const remA1 = totalH % H_PER_YEAR;
    const monthsA = Math.floor(remA1 / H_PER_MONTH);
    const remA2 = remA1 % H_PER_MONTH;
    const daysA = Math.floor(remA2 / 24);
    const hoursA = Math.round(remA2 % 24);

    // 粒度 B: 月-天-小时
    const monthsB = Math.floor(totalH / H_PER_MONTH);
    const remB = totalH % H_PER_MONTH;
    const daysB = Math.floor(remB / 24);
    const hoursB = Math.round(remB % 24);

    // 粒度 C: 天-小时
    const daysC = Math.floor(totalH / 24);
    const hoursC = Math.round(totalH % 24);

    return {
      totalHoursExact: Math.round(totalH),
      formatA: `${yearsA}年${monthsA}个月${daysA}天${hoursA}小时`,
      formatB: `${monthsB}个月${daysB}天${hoursB}小时`,
      formatC: `${daysC}天${hoursC}小时`,
      raw: {
        granularityA: { years: yearsA, months: monthsA, days: daysA, hours: hoursA },
        granularityB: { months: monthsB, days: daysB, hours: hoursB },
        granularityC: { days: daysC, hours: hoursC, totalHours: Math.round(totalH) }
      }
    };
  };

  return {
    deltaYears,
    annualWorkDays: Math.round(annualWorkDays),
    workBill: formatUnits(totalWorkHours),
    freeBill: formatUnits(totalFreeHours),
    workPercentage: ((totalWorkHours / (deltaYears * 24 * DAYS_PER_YEAR)) * 100).toFixed(1),
    freePercentage: ((totalFreeHours / (deltaYears * 24 * DAYS_PER_YEAR)) * 100).toFixed(1)
  };
}

```

---

## 5. 算法标准验证用例 (Test Cases)

### 测试用例：用户典型大小休打工场景

* **输入数据**：
* `currentAge`: 25, `retireAge`: 65 ($\Delta Years = 40$)
* `workStart`: "10:00", `workEnd`: "20:00" ($SpanHours = 10$ 小时)
* `breakHours`: 2.5 ($DailyWorkHours = 7.5$ 小时)
* `weekendType`: `"BIG_SMALL"` ($AnnualWeekendDays \approx 78.21$ 天)
* `holidayMode`: `"STANDARD"` (扣减 13 天), `annualLeave`: 5 天
* `sleepHours`: 7.5, `commuteHours`: 1.5, `choresHours`: 1.5


* **单项计算验证**：
1. **年工作天数**：$365.2425 - 78.2142 - 13 - 5 = \mathbf{269.0283}\text{ 天}$
2. **总工时**：$40 \times 269.0283 \times 7.5 = \mathbf{80,708.5}\text{ 小时}$
3. **粒度 A 换算**：
* 年数：$\lfloor 80708.5 / 8765.82 \rfloor = \mathbf{9}\text{ 年}$
* 余量 1：$80708.5 - 78892.38 = 1816.12$ 小时
* 月数：$\lfloor 1816.12 / 730.485 \rfloor = \mathbf{2}\text{ 个月}$
* 余量 2：$1816.12 - 1460.97 = 355.15$ 小时
* 天数：$\lfloor 355.15 / 24 \rfloor = \mathbf{14}\text{ 天}$
* 小时：$\text{round}(355.15 \pmod{24}) = \mathbf{19}\text{ 小时}$


4. **预期输出文案**：
* 粒度 A：`9年2个月14天19小时`
* 粒度 B：`110个月14天19小时`
* 粒度 C：`3362天21小时`（共 `80,709` 小时）

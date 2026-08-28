export const FAQ_ITEMS = [
  {
    question: '余生账单可以计算什么？',
    answer: '它会根据当前年龄、预期寿命、退休年龄、上下班时间、周休制度、假期、通勤、睡眠和家务，估算剩余人生中的工作占用、生存损耗和真正自由时间。',
  },
  {
    question: '工作时间是怎么计算的？',
    answer: '工作账单按上班到下班的完整在岗跨度计算，再结合双休、大小休、单休或无休、法定节假日和年假，估算退休前累计被工作占用的时间。',
  },
  {
    question: '真正自由时间包含哪些？',
    answer: '退休前自由时间会扣除在岗、睡眠、通勤和家务；退休后自由时间会扣除睡眠和家务。两部分相加，得到从现在到预期寿命的自由时间总计。',
  },
  {
    question: '可以对比 996、单休和双休吗？',
    answer: '可以。网站提供 996 打工人、大小休打工人、标准打工人、双休、三休、北漂通勤和自由职业等场景，可以在同一人生坐标下对比工作占比。',
  },
  {
    question: '账单数据和留言保存在哪里？',
    answer: '账单计算参数保存在当前浏览器中。匿名留言提交后会公开展示并保存在服务端，前台不展示系统生成的匿名用户名。',
  },
] as const

export function SeoContent() {
  return (
    <section className="seo-section section" id="faq" aria-labelledby="seo-title">
      <header className="seo-heading">
        <span className="section-badge liquid-glass">计算说明</span>
        <div>
          <h2 id="seo-title">关于余生账单</h2>
          <p>一个用来对比 996、单休、大小休与双休作息的人生时间计算器。</p>
        </div>
      </header>

      <div className="seo-facts">
        <article className="liquid-glass">
          <span>01 / 计算范围</span>
          <h3>从现在，算到预期寿命</h3>
          <p>工作占用统计到退休；自由时间同时包含退休前和退休后，分母是剩余人生的全部时间。</p>
        </article>
        <article className="liquid-glass">
          <span>02 / 工作制度</span>
          <h3>对比 996、单休和双休</h3>
          <p>把上下班、周休、节假日、年假和通勤放在同一套口径下，查看作息变化对整段人生的影响。</p>
        </article>
        <article className="liquid-glass">
          <span>03 / 使用边界</span>
          <h3>这是时间规划估算</h3>
          <p>结果依赖你输入的预期寿命和作息，适合理解时间量级与比例，不是对实际寿命或未来工作的预测。</p>
        </article>
      </div>

      <div className="seo-faq">
        <span className="seo-faq-label">常见问题 / FAQ</span>
        {FAQ_ITEMS.map((item) => (
          <details key={item.question}>
            <summary>{item.question}<span aria-hidden="true">+</span></summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

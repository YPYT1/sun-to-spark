import type { PublicMessage } from './messages'

const MESSAGE_OUTBOX_KEY = 'life-time-bill-message-outbox'
const MESSAGE_CACHE_KEY = 'life-time-bill-message-cache'

export interface PendingMessage {
  requestId: string
  body: string
}

export function readMessageOutbox(): PendingMessage[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(MESSAGE_OUTBOX_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is PendingMessage => (
      typeof item?.requestId === 'string' && typeof item?.body === 'string'
    )) : []
  } catch {
    return []
  }
}

export function writeMessageOutbox(messages: PendingMessage[]) {
  window.localStorage.setItem(MESSAGE_OUTBOX_KEY, JSON.stringify(messages))
}

export function readMessageCache(): PublicMessage[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(MESSAGE_CACHE_KEY) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function writeMessageCache(messages: PublicMessage[]) {
  window.localStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify(messages))
}

const bodies = [
  '今天难得六点半走出公司，天还亮着。路边买了杯豆浆，突然想起上次这样回家已经是夏天。',
  '工资条里那几百块加班费终于补上了。不是钱多，是那句“算了吧”没再压着我。',
  '降薪之后日子确实紧了，但周六能睡到自然醒，晚饭不用对着电脑吃，这笔账我暂时觉得值。',
  '新人把第一个项目交完，群里没人催她加班。她说原来工作可以有结束的时刻，我听完挺开心。',
  '凌晨一点的外卖盒堆在桌边，体检报告却提醒我胆囊有问题。那句“再扛一阵”突然变得很贵。',
  '裁员通知发在下午四点，权限五分钟后没了。项目还在跑，名字已经从通讯录里消失。',
  '休息日最累的不是家务，是手机每响一次都以为领导找我。后来我把通知关了，心还是过了半天才静下来。',
  '入职时说双休，第三周开始周六“自愿支持”。工位上的人没少，周末的地铁却越来越挤。',
  '刷卡下班那一下最像真正活着。电梯里大家都不说话，但每个人都在笑。',
  '“很快改完”通常意味着今晚别走。最麻烦的是改完一版还有下一版，最后没人记得最初要解决什么。',
  '两个小时的会只留下一个动作项：下次再约时间。真正需要拍板的人没来，留下的人继续加班。',
  '周报里写“持续优化”，其实是把上周临时需求留下的坑补一遍。表格写得越漂亮，越像没发生过。',
  '现在发工资我会顺手把工资条和考勤存下来。以前觉得多余，后来发现记忆没有截图可靠。',
  '面试时问下班时间，对方说“看项目”。我追问最近一个月几点走，房间里突然安静了。',
  '作品集我放在自己的硬盘和网盘里，公司的电脑只当工作台。做过的东西，至少要知道自己做过。',
  '每周二和周四晚上不回工作消息，刚开始被说不积极。三个月后大家发现，事情也没有因此停摆。',
  '口头说的年终奖，最后变成“看公司经营”。合同里没写的数字，最好都当成没有。',
  '免费试岗三天还要交押金，这种地方不用再证明自己。转身走人，比解释为什么不合适省力。',
  '离职证明拖了两周，新公司催得比旧公司还急。材料要在离开前一项项拿齐，真的别嫌麻烦。',
  '底薪拆成五六项绩效，看着总包很漂亮。发了三个月工资后才发现，稳定拿到的只有那一项。',
  '房贷扣款日快到了，辞职两个字卡在喉咙里。不是不想走，是还没攒够让自己喘气的时间。',
  '三十五岁投简历，已读不回成了常态。偶尔收到拒信，至少知道不是简历掉进了黑洞。',
  '家里有人住院，请两天假要解释四遍。那一刻才明白，年假不是奖励，是生活出事时的缓冲。',
  '白天改需求，晚上背题。还没考上，也没离开，但每天留一小时给自己的感觉，终于不像原地打转。',
] as const

export const OFFLINE_MESSAGES: PublicMessage[] = bodies.map((body, index) => ({
  id: `seed-${String(index + 1).padStart(2, '0')}`,
  body,
  likes: 0,
  colorSeed: index % 18,
  createdAt: new Date(Date.UTC(2026, 7, 5 + index, 8, 0)).toISOString(),
}))

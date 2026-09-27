import type { Word, JLPTLevel } from '../types'

// 起步开源分级词表（示例数据，可按级别导入完整红宝书词库覆盖）。
// 字段：假名、汉字写法、词性、中文释义、例句、罗马音。
export const STARTER_WORDS: Word[] = [
  // N5
  { id: 'n5-1', level: 'N5', kana: 'わたし', kanji: '私', romaji: 'watashi', pos: '代', meaning: '我', example: '私は学生です。', exampleCn: '我是学生。' },
  { id: 'n5-2', level: 'N5', kana: 'がっこう', kanji: '学校', romaji: 'gakkou', pos: '名', meaning: '学校', example: '学校へ行きます。', exampleCn: '去学校。' },
  { id: 'n5-3', level: 'N5', kana: 'たべる', kanji: '食べる', romaji: 'taberu', pos: '動', meaning: '吃', example: '朝ご飯を食べます。', exampleCn: '吃早饭。' },
  { id: 'n5-4', level: 'N5', kana: 'みず', kanji: '水', romaji: 'mizu', pos: '名', meaning: '水', example: '水を飲みます。', exampleCn: '喝水。' },
  { id: 'n5-5', level: 'N5', kana: 'いち', kanji: '一', romaji: 'ichi', pos: '数', meaning: '一', example: '一つください。', exampleCn: '请给我一个。' },
  { id: 'n5-6', level: 'N5', kana: 'にほん', kanji: '日本', romaji: 'nihon', pos: '名', meaning: '日本', example: '日本へ来ました。', exampleCn: '来到了日本。' },
  { id: 'n5-7', level: 'N5', kana: 'おおきい', kanji: '大きい', romaji: 'ookii', pos: '形', meaning: '大的', example: '大きい犬です。', exampleCn: '是只大狗。' },
  { id: 'n5-8', level: 'N5', kana: 'ちいさい', kanji: '小さい', romaji: 'chiisai', pos: '形', meaning: '小的', example: '小さい猫です。', exampleCn: '是只小猫。' },
  { id: 'n5-9', level: 'N5', kana: 'べんきょう', kanji: '勉強', romaji: 'benkyou', pos: '名', meaning: '学习', example: '日本語を勉強します。', exampleCn: '学习日语。' },
  { id: 'n5-10', level: 'N5', kana: 'ともだち', kanji: '友達', romaji: 'tomodachi', pos: '名', meaning: '朋友', example: '友達と遊びます。', exampleCn: '和朋友玩。' },
  // N4
  { id: 'n4-1', level: 'N4', kana: 'しけん', kanji: '試験', romaji: 'shiken', pos: '名', meaning: '考试', example: '明日は試験です。', exampleCn: '明天考试。' },
  { id: 'n4-2', level: 'N4', kana: 'びょういん', kanji: '病院', romaji: 'byouin', pos: '名', meaning: '医院', example: '病院へ行きました。', exampleCn: '去了医院。' },
  { id: 'n4-3', level: 'N4', kana: 'おしえる', kanji: '教える', romaji: 'oshieru', pos: '動', meaning: '教', example: '日本語を教えます。', exampleCn: '教日语。' },
  { id: 'n4-4', level: 'N4', kana: 'つかれる', kanji: '疲れる', romaji: 'tsukareru', pos: '動', meaning: '累', example: '今日は疲れました。', exampleCn: '今天累了。' },
  { id: 'n4-5', level: 'N4', kana: 'しずか', kanji: '静か', romaji: 'shizuka', pos: '形', meaning: '安静', example: '静かな部屋です。', exampleCn: '安静的房间。' },
  { id: 'n4-6', level: 'N4', kana: 'けいざい', kanji: '経済', romaji: 'keizai', pos: '名', meaning: '经济', example: '経済を学びます。', exampleCn: '学习经济。' },
  { id: 'n4-7', level: 'N4', kana: 'けっこん', kanji: '結婚', romaji: 'kekkon', pos: '名', meaning: '结婚', example: '結婚しました。', exampleCn: '结婚了。' },
  { id: 'n4-8', level: 'N4', kana: 'じゅんび', kanji: '準備', romaji: 'junbi', pos: '名', meaning: '准备', example: '準備ができました。', exampleCn: '准备好了。' },
  { id: 'n4-9', level: 'N4', kana: 'ひっこす', kanji: '引っ越す', romaji: 'hikkosu', pos: '動', meaning: '搬家', example: '来月引っ越します。', exampleCn: '下个月搬家。' },
  { id: 'n4-10', level: 'N4', kana: 'ゆうめい', kanji: '有名', romaji: 'yuumei', pos: '形', meaning: '有名', example: '有名な人です。', exampleCn: '是有名的人。' },
  // N3
  { id: 'n3-1', level: 'N3', kana: 'かいはつ', kanji: '開発', romaji: 'kaihatsu', pos: '名', meaning: '开发', example: 'アプリを開発する。', exampleCn: '开发应用。' },
  { id: 'n3-2', level: 'N3', kana: 'きょうそう', kanji: '競争', romaji: 'kyousou', pos: '名', meaning: '竞争', example: '競争が激しい。', exampleCn: '竞争激烈。' },
  { id: 'n3-3', level: 'N3', kana: 'そだてる', kanji: '育てる', romaji: 'sodateru', pos: '動', meaning: '培育', example: '花を育てます。', exampleCn: '培育花。' },
  { id: 'n3-4', level: 'N3', kana: 'へらす', kanji: '減らす', romaji: 'herasu', pos: '動', meaning: '减少', example: 'ゴミを減らす。', exampleCn: '减少垃圾。' },
  { id: 'n3-5', level: 'N3', kana: 'きろく', kanji: '記録', romaji: 'kiroku', pos: '名', meaning: '记录', example: '記録を残す。', exampleCn: '留下记录。' },
  { id: 'n3-6', level: 'N3', kana: 'ゆたか', kanji: '豊か', romaji: 'yutaka', pos: '形', meaning: '丰富', example: '豊かな自然。', exampleCn: '丰富的自然。' },
  { id: 'n3-7', level: 'N3', kana: 'たいさく', kanji: '対策', romaji: 'taisaku', pos: '名', meaning: '对策', example: '対策を考える。', exampleCn: '考虑对策。' },
  { id: 'n3-8', level: 'N3', kana: 'そんけい', kanji: '尊敬', romaji: 'sonkei', pos: '名', meaning: '尊敬', example: '先生を尊敬する。', exampleCn: '尊敬老师。' },
  { id: 'n3-9', level: 'N3', kana: 'すいせん', kanji: '推薦', romaji: 'suisen', pos: '名', meaning: '推荐', example: '推薦してもらう。', exampleCn: '得到推荐。' },
  { id: 'n3-10', level: 'N3', kana: 'えいきょう', kanji: '影響', romaji: 'eikyou', pos: '名', meaning: '影响', example: '影響を受ける。', exampleCn: '受到影响。' },
  // N2
  { id: 'n2-1', level: 'N2', kana: 'しょうとつ', kanji: '衝突', romaji: 'shoutotsu', pos: '名', meaning: '冲突、碰撞', example: '車が衝突した。', exampleCn: '车相撞了。' },
  { id: 'n2-2', level: 'N2', kana: 'ゆうせん', kanji: '優先', romaji: 'yuusen', pos: '名', meaning: '优先', example: '安全を優先する。', exampleCn: '优先考虑安全。' },
  { id: 'n2-3', level: 'N2', kana: 'きょうちょう', kanji: '強調', romaji: 'kyouchou', pos: '名', meaning: '强调', example: '重要性を強調する。', exampleCn: '强调重要性。' },
  { id: 'n2-4', level: 'N2', kana: 'いこう', kanji: '以降', romaji: 'ikou', pos: '名', meaning: '以后', example: '来週以降に決める。', exampleCn: '下周以后再定。' },
  { id: 'n2-5', level: 'N2', kana: 'しんちょう', kanji: '慎重', romaji: 'shinchou', pos: '形', meaning: '慎重', example: '慎重に判断する。', exampleCn: '慎重地判断。' },
  { id: 'n2-6', level: 'N2', kana: 'じゅうなん', kanji: '柔軟', romaji: 'juunan', pos: '形', meaning: '灵活', example: '柔軟に対応する。', exampleCn: '灵活应对。' },
  { id: 'n2-7', level: 'N2', kana: 'せいかく', kanji: '正確', romaji: 'seikaku', pos: '形', meaning: '准确', example: '正確な情報。', exampleCn: '准确的信息。' },
  { id: 'n2-8', level: 'N2', kana: 'かくじつ', kanji: '確実', romaji: 'kakujitsu', pos: '形', meaning: '确实', example: '確実な方法。', exampleCn: '确实的方法。' },
  { id: 'n2-9', level: 'N2', kana: 'ととのえる', kanji: '整える', romaji: 'totonoeru', pos: '動', meaning: '整理、调整', example: '環境を整える。', exampleCn: '整顿环境。' },
  { id: 'n2-10', level: 'N2', kana: 'こばむ', kanji: '拒む', romaji: 'kobamu', pos: '動', meaning: '拒绝', example: '要求を拒む。', exampleCn: '拒绝要求。' },
  // N1
  { id: 'n1-1', level: 'N1', kana: 'しんこう', kanji: '振興', romaji: 'shinkou', pos: '名', meaning: '振兴', example: '産業を振興する。', exampleCn: '振兴产业。' },
  { id: 'n1-2', level: 'N1', kana: 'そがい', kanji: '阻害', romaji: 'sogai', pos: '名', meaning: '阻碍', example: '発展を阻害する。', exampleCn: '阻碍发展。' },
  { id: 'n1-3', level: 'N1', kana: 'けいき', kanji: '契機', romaji: 'keiki', pos: '名', meaning: '契机', example: 'これを契機に変わる。', exampleCn: '以此为契機改变。' },
  { id: 'n1-4', level: 'N1', kana: 'こうてい', kanji: '肯定', romaji: 'koutei', pos: '名', meaning: '肯定', example: '意見を肯定する。', exampleCn: '肯定意见。' },
  { id: 'n1-5', level: 'N1', kana: 'ひてい', kanji: '否定', romaji: 'hitei', pos: '名', meaning: '否定', example: '考えを否定する。', exampleCn: '否定想法。' },
  { id: 'n1-6', level: 'N1', kana: 'けんとう', kanji: '検討', romaji: 'kentou', pos: '名', meaning: '研讨', example: '案を検討する。', exampleCn: '研讨方案。' },
  { id: 'n1-7', level: 'N1', kana: 'しさ', kanji: '示唆', romaji: 'shisa', pos: '名', meaning: '暗示', example: '問題点を示唆する。', exampleCn: '暗示问题所在。' },
  { id: 'n1-8', level: 'N1', kana: 'すいしん', kanji: '推進', romaji: 'suishin', pos: '名', meaning: '推进', example: '計画を推進する。', exampleCn: '推进计划。' },
  { id: 'n1-9', level: 'N1', kana: 'かんよ', kanji: '関与', romaji: 'kanyo', pos: '名', meaning: '参与', example: '事件に関与する。', exampleCn: '参与事件。' },
  { id: 'n1-10', level: 'N1', kana: 'せいび', kanji: '整備', romaji: 'seibi', pos: '名', meaning: '完善', example: '道路を整備する。', exampleCn: '完善道路。' },
]

export const WORDS_BY_LEVEL: Record<JLPTLevel, Word[]> = {
  N5: STARTER_WORDS.filter(w => w.level === 'N5'),
  N4: STARTER_WORDS.filter(w => w.level === 'N4'),
  N3: STARTER_WORDS.filter(w => w.level === 'N3'),
  N2: STARTER_WORDS.filter(w => w.level === 'N2'),
  N1: STARTER_WORDS.filter(w => w.level === 'N1'),
}

// 归一化工具：去除特殊符号，统一假名与罗马音，供拼写判定使用。

const KATA_TO_HIRA: Record<string, string> = {
  ァ: 'ぁ', ィ: 'ぃ', ゥ: 'ぅ', ェ: 'ぇ', ォ: 'ぉ',
  ア: 'あ', イ: 'い', ウ: 'う', エ: 'え', オ: 'お',
  カ: 'か', キ: 'き', ク: 'く', ケ: 'け', コ: 'こ',
  サ: 'さ', シ: 'し', ス: 'す', セ: 'せ', ソ: 'そ',
  タ: 'た', チ: 'ち', ツ: 'つ', テ: 'て', ト: 'と',
  ナ: 'な', ニ: 'に', ヌ: 'ぬ', ネ: 'ね', ノ: 'の',
  ハ: 'は', ヒ: 'ひ', フ: 'ふ', ヘ: 'へ', ホ: 'ほ',
  マ: 'ま', ミ: 'み', ム: 'む', メ: 'め', モ: 'も',
  ヤ: 'や', ユ: 'ゆ', ヨ: 'よ',
  ラ: 'ら', リ: 'り', ル: 'る', レ: 'れ', ロ: 'ろ',
  ワ: 'わ', ヰ: 'ゐ', ヱ: 'ゑ', ヲ: 'を', ン: 'ん',
  ガ: 'が', ギ: 'ぎ', グ: 'ぐ', ゲ: 'げ', ゴ: 'ご',
  ザ: 'ざ', ジ: 'じ', ズ: 'ず', ゼ: 'ぜ', ゾ: 'ぞ',
  ダ: 'だ', ヂ: 'ぢ', ヅ: 'づ', デ: 'で', ド: 'ど',
  バ: 'ば', ビ: 'び', ブ: 'ぶ', ベ: 'べ', ボ: 'ぼ',
  パ: 'ぱ', ピ: 'ぴ', プ: 'ぷ', ペ: 'ぺ', ポ: 'ぽ',
  ヴ: 'ゔ', ヷ: 'わ', ヸ: 'ゐ', ヹ: 'ゑ', ヺ: 'を',
  ャ: 'ゃ', ュ: 'ゅ', ョ: 'ょ', ッ: 'っ', ヮ: 'ゎ',
}

const HALFWIDTH_KATA_TO_HIRA: Record<string, string> = {
  'ｱ': 'あ', 'ｲ': 'い', 'ｳ': 'う', 'ｴ': 'え', 'ｵ': 'お',
  'ｶ': 'か', 'ｷ': 'き', 'ｸ': 'く', 'ｹ': 'け', 'ｺ': 'こ',
  'ｻ': 'さ', 'ｼ': 'し', 'ｽ': 'す', 'ｾ': 'せ', 'ｿ': 'そ',
  'ﾀ': 'た', 'ﾁ': 'ち', 'ﾂ': 'つ', 'ﾃ': 'て', 'ﾄ': 'と',
  'ﾅ': 'な', 'ﾆ': 'に', 'ﾇ': 'ぬ', 'ﾈ': 'ね', 'ﾉ': 'の',
  'ﾊ': 'は', 'ﾋ': 'ひ', 'ﾌ': 'ふ', 'ﾍ': 'へ', 'ﾎ': 'ほ',
  'ﾏ': 'ま', 'ﾐ': 'み', 'ﾑ': 'む', 'ﾒ': 'め', 'ﾓ': 'も',
  'ﾔ': 'や', 'ﾕ': 'ゆ', 'ﾖ': 'よ',
  'ﾗ': 'ら', 'ﾘ': 'り', 'ﾙ': 'る', 'ﾚ': 'れ', 'ﾛ': 'ろ',
  'ﾜ': 'わ', 'ｦ': 'を', 'ﾝ': 'ん',
  'ｶﾞ': 'が', 'ｷﾞ': 'ぎ', 'ｸﾞ': 'ぐ', 'ｹﾞ': 'げ', 'ｺﾞ': 'ご',
  'ｻﾞ': 'ざ', 'ｼﾞ': 'じ', 'ｽﾞ': 'ず', 'ｾﾞ': 'ぜ', 'ｿﾞ': 'ぞ',
  'ﾀﾞ': 'だ', 'ﾁﾞ': 'ぢ', 'ﾂﾞ': 'づ', 'ﾃﾞ': 'で', 'ﾄﾞ': 'ど',
  'ﾊﾞ': 'ば', 'ﾋﾞ': 'び', 'ﾌﾞ': 'ぶ', 'ﾍﾞ': 'べ', 'ﾎﾞ': 'ぼ',
  'ﾊﾟ': 'ぱ', 'ﾋﾟ': 'ぴ', 'ﾌﾟ': 'ぷ', 'ﾍﾟ': 'ぺ', 'ﾎﾟ': 'ぽ',
  'ｯ': 'っ', 'ｬ': 'ゃ', 'ｭ': 'ゅ', 'ｮ': 'ょ', 'ｰ': 'ー',
}

const FULLWIDTH_ASCII: Record<string, string> = {
  '　': ' ', '！': '!', '＂': '"', '＃': '#', '＄': '$', '％': '%',
  '＆': '&', '＇': "'", '（': '(', '）': ')', '＊': '*', '＋': '+',
  '，': ',', '－': '-', '．': '.', '／': '/', '０': '0', '１': '1',
  '２': '2', '３': '3', '４': '4', '５': '5', '６': '6', '７': '7',
  '８': '8', '９': '9', '：': ':', '；': ';', '＜': '<', '＝': '=',
  '＞': '>', '？': '?', '＠': '@', 'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C',
  'Ｄ': 'D', 'Ｅ': 'E', 'Ｆ': 'F', 'Ｇ': 'G', 'Ｈ': 'H', 'Ｉ': 'I',
  'Ｊ': 'J', 'Ｋ': 'K', 'Ｌ': 'L', 'Ｍ': 'M', 'Ｎ': 'N', 'Ｏ': 'O',
  'Ｐ': 'P', 'Ｑ': 'Q', 'Ｒ': 'R', 'Ｓ': 'S', 'Ｔ': 'T', 'Ｕ': 'U',
  'Ｖ': 'V', 'Ｗ': 'W', 'Ｘ': 'X', 'Ｙ': 'Y', 'Ｚ': 'Z',
  'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f',
  'ｇ': 'g', 'ｈ': 'h', 'ｉ': 'i', 'ｊ': 'j', 'ｋ': 'k', 'ｌ': 'l',
  'ｍ': 'm', 'ｎ': 'n', 'ｏ': 'o', 'ｐ': 'p', 'ｑ': 'q', 'ｒ': 'r',
  'ｓ': 's', 'ｔ': 't', 'ｕ': 'u', 'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x',
  'ｙ': 'y', 'ｚ': 'z', '［': '[', '］': ']', '｛': '{', '｝': '}',
}

function normalizeFullWidth(input: string): string {
  let out = ''
  for (const ch of input) {
    out += FULLWIDTH_ASCII[ch] ?? ch
  }
  return out
}

function halfwidthKataToHira(input: string): string {
  // 优先匹配带浊点的双字符，再匹配单字符
  let out = ''
  let i = 0
  while (i < input.length) {
    const pair = input.slice(i, i + 2)
    if (HALFWIDTH_KATA_TO_HIRA[pair]) {
      out += HALFWIDTH_KATA_TO_HIRA[pair]
      i += 2
    } else if (HALFWIDTH_KATA_TO_HIRA[input[i]]) {
      out += HALFWIDTH_KATA_TO_HIRA[input[i]]
      i += 1
    } else {
      out += input[i]
      i += 1
    }
  }
  return out
}

function kataToHira(input: string): string {
  let out = ''
  for (const ch of input) {
    out += KATA_TO_HIRA[ch] ?? ch
  }
  return out
}

function isKeepChar(ch: string): boolean {
  const code = ch.codePointAt(0)!
  const isHira = code >= 0x3041 && code <= 0x3096
  const isKata = code >= 0x30a1 && code <= 0x30fa
  const isKataExt = ch === 'ー'
  const isKanji = code >= 0x4e00 && code <= 0x9fff
  const isLatin = /[a-zA-Z0-9]/.test(ch)
  return isHira || isKata || isKataExt || isKanji || isLatin
}

/** 归一化答案为「假名或字母数字」的规范形式，去除标点、空格、括号等特殊符号 */
export function normalizeKana(input: string): string {
  const nfkc = input.normalize('NFKC')
  const fullWidth = normalizeFullWidth(nfkc)
  const halfKata = halfwidthKataToHira(fullWidth)
  const hira = kataToHira(halfKata)
  let out = ''
  for (const ch of hira) {
    if (isKeepChar(ch)) out += ch
  }
  return out
}

/** 罗马音归一化：仅保留字母并小写 */
export function normalizeRomaji(input: string): string {
  const nfkc = input.normalize('NFKC')
  const fullWidth = normalizeFullWidth(nfkc)
  return fullWidth.toLowerCase().replace(/[^a-z]/g, '')
}

/** 罗马音长音变体归一：ō/ou/oo/u 等归并 */
export function canonicalRomaji(input: string): string {
  let s = normalizeRomaji(input)
  s = s.replace(/oo/g, 'o')
  s = s.replace(/ou/g, 'o')
  s = s.replace(/uu/g, 'u')
  s = s.replace(/ii/g, 'i')
  s = s.replace(/ee/g, 'e')
  s = s.replace(/aa/g, 'a')
  return s
}

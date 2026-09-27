# 不背日语

参照「不背单词」交互的日语单词记忆 App，内置 N1–N5 完整红宝书分级词库（9573 词），采用「学习 / 复习」双板块，可打包为安卓 APK，并支持启动后联网检测新版本、下载 APK 调起系统安装覆盖旧版。

## 技术栈

- Vite + React + TypeScript（前端）
- Capacitor 5（安卓容器）
- 数据本地存储（localStorage），离线可用
- 自研「和纸 × 墨色 × 朱印」视觉体系（frontend-design skill）

## 快速开始（Web 预览）

```bash
npm install
npm run dev
```

生产构建：`npm run build`，产物在 `dist/`。

## 打包安卓 APK

本机需安装 Android Studio（含 Android SDK）与 JDK 17。

```bash
npm install
npm run cap:add:android      # 生成 android/ 工程（首次）
npm run cap:sync            # 构建 web 并同步到 android/
cd android && ./gradlew assembleDebug   # 生成 app-debug.apk
```

### 接入自更新插件

Capacitor 原生插件已就绪，需把 `native/` 下的文件合并进生成的安卓工程：

1. 将 `native/UpdaterPlugin.java` 放到 `android/app/src/main/java/com/bubei/riyu/UpdaterPlugin.java`。
2. 在 `android/app/src/main/AndroidManifest.xml` 中追加 `native/AndroidManifest-extra.xml` 声明的权限与 `FileProvider`。
3. 将 `native/file_paths.xml` 放到 `android/app/src/main/res/xml/file_paths.xml`。
4. 在 `MainActivity.java` 中调用 `registerPlugin(UpdaterPlugin.class);`（Capacitor 自动扫描模式下可省略）。

## 整包 APK 自更新

更新清单结构见 `public/update.json.example`，发布到任意静态地址（推荐 GitHub Releases）：

```json
{
  "version": "0.2.0",
  "versionCode": 2,
  "apkUrl": "https://example.com/releases/bubei-riyu-0.2.0.apk",
  "sha256": "<APK 的 SHA-256 小写十六进制>",
  "notes": "本次更新说明"
}
```

在 App「设置 → 应用更新」中把「更新源地址」指向该目录（`https://.../update.json` 或所在目录均可）。检测到新版本后，App 会下载 APK、校验 sha256，再调起系统安装器完成覆盖安装。

> 注意：Android 8+ 出于安全限制，无法完全静默覆盖安装；用户需点确认，并在首次开启「允许安装未知应用」。

## 词库导入

内置由《红宝书》去重版 xlsx（假名 / 汉字 / 级别）结合词典自动补齐释义的完整词表（`src/data/wordbank-full.ts`，共 9573 词：N5=1000、N4=1121、N3=2071、N2=2328、N1=3053）。可在「设置 → 词库」导入自定义 JSON / CSV 覆盖。

> 释义来源：词性/罗马音由 JMdict 补齐；中文释义由「小学館日中辞典」词库（SGKK3.zip，Yomitan 格式）匹配填充，覆盖 9040/9573 词；其余为「～以外」「～kg」等无固定中文的接尾/计数词，保留英文兜底。重建命令见 `scripts/build_zh_from_rikuchu.py`。

CSV 表头支持：`level / kanji / kana / romaji / pos / meaning / example / exampleCn`（也兼容中文别名，如「级别 / 假名 / 汉字 / 释义 / 例句」）。

JSON 结构：

```json
[
  { "level": "N5", "kana": "がっこう", "kanji": "学校", "romaji": "gakkou", "pos": "名", "meaning": "学校", "example": "学校へ行きます。", "exampleCn": "去学校。" }
]
```

缺省 `romaji` 时会由假名自动推算。

## 学习 / 复习流程

- **学习**：按当前级别随机抽 10 个词，每个词依次经过三关——① 看词从四个中文意思里选对（干扰项取同级易混词）；② 看词 + 提示回忆，选「认识 / 不认识」；③ 无提示直接回忆，选「认识 / 不认识」。10 词学完后可「开始拼写」或直接小结。
- **复习**：已学词进入复习池。直接看词选「认识 / 不认识」；选「不认识」的词先排到后面看别的词，再依次做「有提示 → 无提示」两轮复查，通过则记会，未通过留待下次复习。

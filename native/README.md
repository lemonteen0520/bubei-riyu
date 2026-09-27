# 原生插件接入说明

以下文件在 `npm run cap:add:android` 生成的 `android/` 工程中手动合并：

- `UpdaterPlugin.java` → `android/app/src/main/java/com/bubei/riyu/UpdaterPlugin.java`
- `MainActivity.java` → 替换 `android/app/src/main/java/com/bubei/riyu/MainActivity.java`
- `file_paths.xml` → `android/app/src/main/res/xml/file_paths.xml`
- `AndroidManifest-extra.xml` → 将其中的权限与 `<provider>` 合并进 `android/app/src/main/AndroidManifest.xml`

合并后执行 `npm run cap:sync && cd android && ./gradlew assembleDebug` 即可产出 APK。

package com.bubei.riyu;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

/**
 * 整包 APK 自更新：下载已由 Web 侧完成，本插件负责将临时 APK 落盘并调起系统安装器。
 */
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {

  @PluginMethod
  public void install(PluginCall call) {
    String url = call.getString("url", "");
    if (url == null || url.isEmpty()) {
      call.reject("缺少 APK 下载地址");
      return;
    }

    try {
      Context context = getContext();
      File file = new File(context.getCacheDir(), "update.apk");
      downloadTo(url, file);

      Uri apkUri = FileProvider.getUriForFile(
        context,
        context.getPackageName() + ".fileprovider",
        file
      );

      Intent intent = new Intent(Intent.ACTION_VIEW);
      intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

      try {
        context.startActivity(intent);
        JSObject ret = new JSObject();
        ret.put("value", true);
        call.resolve(ret);
      } catch (ActivityNotFoundException e) {
        // 没有可用的安装器（通常是未开启“允许安装未知应用”）
        call.reject("未找到可用的安装器，请在系统设置中允许安装未知应用。", e);
      }
    } catch (Exception e) {
      call.reject("更新包下载或写入失败：" + e.getMessage(), e);
    }
  }

  private void downloadTo(String url, File out) throws Exception {
    HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
    conn.setConnectTimeout(30000);
    conn.setReadTimeout(120000);
    conn.setRequestMethod("GET");
    conn.setInstanceFollowRedirects(true);
    conn.connect();

    int code = conn.getResponseCode();
    if (code < 200 || code >= 300) {
      conn.disconnect();
      throw new Exception("HTTP " + code);
    }

    try (InputStream in = conn.getInputStream();
         FileOutputStream fos = new FileOutputStream(out)) {
      byte[] buf = new byte[8192];
      int n;
      while ((n = in.read(buf)) != -1) {
        fos.write(buf, 0, n);
      }
    } finally {
      conn.disconnect();
    }
  }
}

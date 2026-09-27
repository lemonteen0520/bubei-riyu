package com.bubei.riyu;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // 在 super.onCreate 前注册自更新插件
    registerPlugin(UpdaterPlugin.class);
    super.onCreate(savedInstanceState);
  }
}

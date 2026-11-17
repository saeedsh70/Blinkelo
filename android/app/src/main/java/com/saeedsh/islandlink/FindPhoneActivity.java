package com.saeedsh.islandlink;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Full screen "I'm here" page shown while the phone rings for Find my phone. */
public class FindPhoneActivity extends Activity {
    private static FindPhoneActivity open;

    static void finishIfOpen() {
        final FindPhoneActivity a = open;
        if (a != null) Util.main(new Runnable() { public void run() { a.finish(); } });
    }

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        open = this;
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        String pc = getIntent().getStringExtra("pc");
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.BLACK);
        int pad = Util.dp(this, 28);
        root.setPadding(pad, pad, pad, pad);

        TextView emoji = new TextView(this);
        emoji.setText("📱");
        emoji.setTextSize(72);
        emoji.setGravity(Gravity.CENTER);
        root.addView(emoji);

        TextView title = new TextView(this);
        title.setText(Strings.t(this, "find_title"));
        title.setTextColor(Color.WHITE);
        title.setTextSize(28);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, Util.dp(this, 18), 0, Util.dp(this, 6));
        root.addView(title);

        TextView sub = new TextView(this);
        sub.setText(Strings.t(this, "find_text", "pc", pc == null ? "PC" : pc));
        sub.setTextColor(Color.parseColor("#99FFFFFF"));
        sub.setTextSize(16);
        sub.setGravity(Gravity.CENTER);
        root.addView(sub);

        Button found = new Button(this);
        found.setText(Strings.t(this, "act_found"));
        found.setAllCaps(false);
        found.setTextSize(20);
        found.setTextColor(Color.WHITE);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#0A84FF"));
        bg.setCornerRadius(Util.dp(this, 40));
        found.setBackground(bg);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(Util.dp(this, 240), Util.dp(this, 72));
        lp.topMargin = Util.dp(this, 48);
        found.setLayoutParams(lp);
        found.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                FindPhone.stop(FindPhoneActivity.this);
                finish();
            }
        });
        root.addView(found);
        setContentView(root);
    }

    @Override protected void onDestroy() {
        if (open == this) open = null;
        super.onDestroy();
    }
}

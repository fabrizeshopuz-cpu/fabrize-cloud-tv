package uz.fabrize.tv;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.VideoView;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;

public class MainActivity extends Activity {
    private static final String SERVER_BASE = "https://fabrize-cloud-tv.onrender.com";
    private static final String PREFS_NAME = "fabrize-tv";
    private static final String KEY_DEVICE_CODE = "deviceCode";
    private static final String KEY_LAST_UPDATE_PROMPT = "lastUpdatePrompt";
    private static final long SYNC_INTERVAL_MS = 30000L;
    private static final int RELAUNCH_REQUEST_CODE = 4421;
    private static final int WORK_START_REQUEST_CODE = 4422;
    private static final int WORK_END_REQUEST_CODE = 4423;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ArrayList<MediaItem> playlist = new ArrayList<>();
    private int currentIndex = 0;
    private boolean destroyed = false;
    private boolean paired = false;
    private boolean openingInstaller = false;
    private boolean scheduleClosed = false;

    private String deviceCode;
    private String weatherText = "Ob-havo: --";
    private String connectionText = "OFFLINE";
    private String workSchedule = "00:00-23:59";
    private int screenRotation = 0;
    private File mediaDir;
    private File apkDir;
    private File cacheFile;
    private ImageView imageView;
    private VideoView videoView;
    private TextView emptyText;
    private TextView clockText;
    private TextView statusText;
    private TextView titleText;
    private TextView playlistText;
    private LinearLayout pairingView;
    private TextView pairingCodeText;
    private TextView pairingInfoText;
    private ImageView logoView;
    private MediaPlayer audioPlayer;

    private final Runnable nextRunnable = new Runnable() {
        @Override
        public void run() {
            playNext();
        }
    };

    private final Runnable syncRunnable = new Runnable() {
        @Override
        public void run() {
            syncFromServer();
            if (!destroyed) handler.postDelayed(this, SYNC_INTERVAL_MS);
        }
    };

    private final Runnable clockRunnable = new Runnable() {
        @Override
        public void run() {
            updateClock();
            if (!destroyed) handler.postDelayed(this, 1000L);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (android.os.Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }

        deviceCode = loadOrCreateDeviceCode();
        mediaDir = new File(getFilesDir(), "media");
        if (!mediaDir.exists()) mediaDir.mkdirs();
        apkDir = new File(getFilesDir(), "apks");
        if (!apkDir.exists()) apkDir.mkdirs();
        cacheFile = new File(getFilesDir(), "playlist-cache-" + deviceCode.replace("-", "") + ".json");

        buildUi();
        if (loadCachedPlaylist()) {
            paired = true;
            hidePairing();
            playCurrent();
        } else {
            showPairing("Admin panelda yangi lokatsiya ochib, shu serial kodni kiriting.");
        }
        syncRunnable.run();
        clockRunnable.run();
    }

    @Override
    protected void onResume() {
        super.onResume();
        openingInstaller = false;
        cancelRelaunch();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (!openingInstaller) scheduleRelaunch();
    }

    @Override
    protected void onDestroy() {
        destroyed = true;
        handler.removeCallbacksAndMessages(null);
        stopPlayers();
        super.onDestroy();
    }

    private void buildUi() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(5, 6, 6));
        root.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );

        videoView = new VideoView(this);
        videoView.setVisibility(View.GONE);
        root.addView(videoView, fullFrameParams());

        imageView = new ImageView(this);
        imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        imageView.setVisibility(View.GONE);
        root.addView(imageView, fullFrameParams());

        emptyText = new TextView(this);
        emptyText.setText("FABRIZE TV\nKontent kutilyapti");
        emptyText.setGravity(Gravity.CENTER);
        emptyText.setTextColor(Color.rgb(245, 210, 123));
        emptyText.setTextSize(30);
        emptyText.setTypeface(Typeface.DEFAULT_BOLD);
        emptyText.setVisibility(View.GONE);
        root.addView(emptyText, fullFrameParams());

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(24, 10, 24, 10);
        header.setBackgroundColor(Color.argb(160, 0, 0, 0));

        TextView brand = new TextView(this);
        brand.setText("FABRIZE TV");
        brand.setTextColor(Color.rgb(245, 210, 123));
        brand.setTextSize(24);
        brand.setTypeface(Typeface.DEFAULT_BOLD);
        brand.setSingleLine(true);
        header.addView(brand, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        clockText = new TextView(this);
        clockText.setTextColor(Color.WHITE);
        clockText.setTextSize(20);
        clockText.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        header.addView(clockText, new LinearLayout.LayoutParams(260, LinearLayout.LayoutParams.WRAP_CONTENT));
        root.addView(header, topParams(72));
        header.setVisibility(View.GONE);

        titleText = new TextView(this);
        titleText.setTextColor(Color.WHITE);
        titleText.setTextSize(16);
        titleText.setTypeface(Typeface.DEFAULT_BOLD);
        titleText.setSingleLine(true);
        titleText.setPadding(24, 8, 24, 8);
        titleText.setBackgroundColor(Color.argb(150, 0, 0, 0));
        root.addView(titleText, bottomParams(108, 46));
        titleText.setVisibility(View.GONE);

        playlistText = new TextView(this);
        playlistText.setTextColor(Color.rgb(245, 210, 123));
        playlistText.setTextSize(13);
        playlistText.setSingleLine(true);
        playlistText.setPadding(24, 6, 24, 6);
        playlistText.setBackgroundColor(Color.argb(165, 0, 0, 0));
        root.addView(playlistText, bottomParams(58, 34));
        playlistText.setVisibility(View.GONE);

        statusText = new TextView(this);
        statusText.setTextColor(Color.WHITE);
        statusText.setTextSize(18);
        statusText.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        statusText.setSingleLine(false);
        statusText.setPadding(18, 10, 18, 10);
        statusText.setBackground(makeCornerPanel());
        FrameLayout.LayoutParams statusParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.RIGHT | Gravity.TOP
        );
        statusParams.setMargins(0, 22, 24, 0);
        root.addView(statusText, statusParams);

        logoView = new ImageView(this);
        logoView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logoView.setVisibility(View.GONE);
        FrameLayout.LayoutParams logoParams = new FrameLayout.LayoutParams(180, 90, Gravity.LEFT | Gravity.TOP);
        logoParams.setMargins(24, 22, 0, 0);
        root.addView(logoView, logoParams);

        pairingView = new LinearLayout(this);
        pairingView.setOrientation(LinearLayout.VERTICAL);
        pairingView.setGravity(Gravity.CENTER);
        pairingView.setPadding(60, 50, 60, 50);
        pairingView.setBackgroundColor(Color.rgb(5, 6, 6));

        TextView pairingTitle = new TextView(this);
        pairingTitle.setText("TV NI ADMIN PANELGA ULASH");
        pairingTitle.setTextColor(Color.WHITE);
        pairingTitle.setTextSize(28);
        pairingTitle.setTypeface(Typeface.DEFAULT_BOLD);
        pairingTitle.setGravity(Gravity.CENTER);
        pairingView.addView(pairingTitle, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        TextView pairingLabel = new TextView(this);
        pairingLabel.setText("TV SERIAL KODI");
        pairingLabel.setTextColor(Color.rgb(197, 139, 46));
        pairingLabel.setTextSize(18);
        pairingLabel.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams labelParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        labelParams.setMargins(0, 42, 0, 10);
        pairingView.addView(pairingLabel, labelParams);

        pairingCodeText = new TextView(this);
        pairingCodeText.setText(deviceCode);
        pairingCodeText.setTextColor(Color.rgb(245, 210, 123));
        pairingCodeText.setTextSize(54);
        pairingCodeText.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        pairingCodeText.setGravity(Gravity.CENTER);
        pairingCodeText.setPadding(36, 18, 36, 18);
        pairingCodeText.setBackground(makeCodePanel());
        pairingView.addView(pairingCodeText, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        pairingInfoText = new TextView(this);
        pairingInfoText.setTextColor(Color.WHITE);
        pairingInfoText.setTextSize(20);
        pairingInfoText.setGravity(Gravity.CENTER);
        pairingInfoText.setLineSpacing(4, 1);
        LinearLayout.LayoutParams infoParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        infoParams.setMargins(0, 34, 0, 0);
        pairingView.addView(pairingInfoText, infoParams);

        root.addView(pairingView, fullFrameParams());
        setContentView(root);
    }

    private FrameLayout.LayoutParams fullFrameParams() {
        return new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
    }

    private FrameLayout.LayoutParams topParams(int height) {
        return new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, height, Gravity.TOP);
    }

    private FrameLayout.LayoutParams bottomParams(int bottom, int height) {
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, height, Gravity.BOTTOM);
        params.setMargins(0, 0, 0, bottom);
        return params;
    }

    private GradientDrawable makePill(int color) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(999);
        return drawable;
    }

    private GradientDrawable makeCodePanel() {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(Color.rgb(18, 18, 15));
        drawable.setStroke(3, Color.rgb(197, 139, 46));
        drawable.setCornerRadius(22);
        return drawable;
    }

    private GradientDrawable makeCornerPanel() {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(Color.argb(120, 0, 0, 0));
        drawable.setCornerRadius(18);
        return drawable;
    }

    private void updateClock() {
        SimpleDateFormat format = new SimpleDateFormat("HH:mm\n dd.MM.yyyy", Locale.US);
        String text = format.format(new Date()) + "\n" + connectionText + "\n" + weatherText;
        clockText.setText(text);
        statusText.setText(text);
        if (paired && !isInsideWorkSchedule()) {
            showClosedScreen();
        } else if (paired && scheduleClosed) {
            scheduleClosed = false;
            playCurrent();
        }
    }

    private String loadOrCreateDeviceCode() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String saved = formatDeviceCode(preferences.getString(KEY_DEVICE_CODE, ""));
        if (saved.length() == 9) return saved;

        String created = createDeviceCode();
        preferences.edit().putString(KEY_DEVICE_CODE, created).apply();
        return created;
    }

    private String createDeviceCode() {
        String raw = UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.US).substring(0, 8);
        return raw.substring(0, 4) + "-" + raw.substring(4);
    }

    private String formatDeviceCode(String value) {
        String raw = String.valueOf(value == null ? "" : value).toUpperCase(Locale.US).replaceAll("[^A-Z0-9]", "");
        if (raw.length() < 8) return "";
        raw = raw.substring(0, 8);
        return raw.substring(0, 4) + "-" + raw.substring(4);
    }

    private void syncFromServer() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String json = readUrl(SERVER_BASE + "/api/tv-code/" + deviceCode + "/playlist?appVersion=" + URLEncoder.encode(BuildConfig.VERSION_NAME, "UTF-8"));
                    connectionText = "ONLINE";
                    JSONObject payload = new JSONObject(json);
                    if (!payload.optBoolean("paired", false)) {
                        final String message = payload.optString("message", "Bu TV hali lokatsiyaga ulanmagan.");
                        handler.post(new Runnable() {
                            @Override
                            public void run() {
                                showPairing(message + "\nKod admin panelga kiritilgandan keyin kontent avtomatik yuklanadi.");
                            }
                        });
                        return;
                    }

                    JSONObject deviceJson = payload.optJSONObject("device");
                    JSONObject weatherJson = payload.optJSONObject("weather");
                    applyDeviceConfig(deviceJson, weatherJson);
                    handleUpdateIfNeeded(deviceJson);
                    JSONArray media = payload.optJSONArray("media");
                    ArrayList<MediaItem> synced = new ArrayList<>();
                    JSONArray cacheMedia = new JSONArray();

                    if (media != null) {
                        for (int i = 0; i < media.length(); i++) {
                            MediaItem item = MediaItem.fromJson(media.getJSONObject(i));
                            if (!item.isCacheable()) continue;
                            downloadIfNeeded(item);
                            if (item.localPath != null) {
                                synced.add(item);
                                cacheMedia.put(item.toJson());
                            }
                        }
                    }

                    JSONObject cache = new JSONObject();
                    cache.put("code", deviceCode);
                    cache.put("savedAt", System.currentTimeMillis());
                    cache.put("media", cacheMedia);
                    writeText(cacheFile, cache.toString());

                    handler.post(new Runnable() {
                        @Override
                        public void run() {
                            paired = true;
                            hidePairing();
                            replacePlaylist(synced);
                            updateClock();
                        }
                    });
                } catch (Exception error) {
                    connectionText = "OFFLINE";
                    handler.post(new Runnable() {
                        @Override
                        public void run() {
                            boolean hasCache = !playlist.isEmpty() || loadCachedPlaylist();
                            if (hasCache) {
                                paired = true;
                                hidePairing();
                                statusText.setText("OFFLINE\n" + weatherText);
                                if (emptyText.getVisibility() == View.VISIBLE) playCurrent();
                            } else {
                                showPairing("Serverga ulanib bo'lmadi. Admin panel va Wi-Fi tarmog'ini tekshiring.");
                            }
                        }
                    });
                }
            }
        }).start();
    }

    private void replacePlaylist(ArrayList<MediaItem> items) {
        String before = idsOf(playlist);
        String after = idsOf(items);
        playlist.clear();
        playlist.addAll(items);
        renderStrip();
        if (!before.equals(after) || playlist.isEmpty()) {
            currentIndex = 0;
            playCurrent();
        }
    }

    private String idsOf(ArrayList<MediaItem> items) {
        StringBuilder builder = new StringBuilder();
        for (MediaItem item : items) builder.append(item.id).append(",");
        return builder.toString();
    }

    private boolean loadCachedPlaylist() {
        try {
            if (!cacheFile.exists()) return false;
            JSONObject cache = new JSONObject(readText(cacheFile));
            JSONArray media = cache.optJSONArray("media");
            playlist.clear();
            if (media != null) {
                for (int i = 0; i < media.length(); i++) {
                    MediaItem item = MediaItem.fromJson(media.getJSONObject(i));
                    if (item.localPath != null && new File(item.localPath).exists()) playlist.add(item);
                }
            }
            renderStrip();
            statusText.setText("Offline cache - " + playlist.size() + " kontent");
            return !playlist.isEmpty();
        } catch (Exception ignored) {
            playlist.clear();
            return false;
        }
    }

    private void playCurrent() {
        handler.removeCallbacks(nextRunnable);
        stopPlayers();

        if (!isInsideWorkSchedule()) {
            showClosedScreen();
            return;
        }

        if (playlist.isEmpty()) {
            emptyText.setText("FABRIZE TV\nKontent yuklanmagan");
            emptyText.setVisibility(View.VISIBLE);
            titleText.setText("Kontent yuklanganda TV avtomatik yangilanadi.");
            playlistText.setText("");
            return;
        }

        hidePairing();
        scheduleClosed = false;
        statusText.setVisibility(View.VISIBLE);
        emptyText.setVisibility(View.GONE);
        MediaItem item = playlist.get(currentIndex % playlist.size());
        titleText.setText(item.type + " - " + item.name);
        renderStrip();
        reportNowPlaying(item);

        File file = new File(item.localPath);
        if (!file.exists()) {
            playNext();
            return;
        }

        if ("Video".equalsIgnoreCase(item.type) || item.mime.startsWith("video/")) {
            videoView.setVisibility(View.VISIBLE);
            videoView.setRotation(screenRotation);
            videoView.setVideoURI(Uri.fromFile(file));
            videoView.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    playNext();
                }
            });
            videoView.setOnErrorListener(new MediaPlayer.OnErrorListener() {
                @Override
                public boolean onError(MediaPlayer mp, int what, int extra) {
                    playNext();
                    return true;
                }
            });
            videoView.start();
            return;
        }

        if ("MP3".equalsIgnoreCase(item.type) || item.mime.startsWith("audio/")) {
            emptyText.setText("FABRIZE TV\n" + item.name);
            emptyText.setVisibility(View.VISIBLE);
            playAudio(file);
            return;
        }

        imageView.setVisibility(View.VISIBLE);
        imageView.setRotation(screenRotation);
        imageView.setImageURI(Uri.fromFile(file));
        handler.postDelayed(nextRunnable, item.durationMs());
    }

    private void showClosedScreen() {
        if (scheduleClosed) return;
        scheduleClosed = true;
        handler.removeCallbacks(nextRunnable);
        stopPlayers();
        emptyText.setText("");
        emptyText.setVisibility(View.GONE);
        titleText.setText("");
        playlistText.setText("");
        statusText.setVisibility(View.GONE);
        logoView.setVisibility(View.GONE);
    }

    private boolean isInsideWorkSchedule() {
        String[] parts = String.valueOf(workSchedule == null ? "00:00-23:59" : workSchedule).split("-");
        if (parts.length != 2) return true;
        int start = minutesOfDay(parts[0], 0);
        int end = minutesOfDay(parts[1], 1439);
        Calendar calendar = Calendar.getInstance();
        int now = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE);
        if (start == end) return true;
        if (start < end) return now >= start && now < end;
        return now >= start || now < end;
    }

    private int minutesOfDay(String value, int fallback) {
        try {
            String[] parts = String.valueOf(value).split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private void scheduleWorkAlarms() {
        String[] parts = String.valueOf(workSchedule == null ? "00:00-23:59" : workSchedule).split("-");
        if (parts.length != 2) return;
        setScheduleAlarm(WORK_START_REQUEST_CODE, nextWallClock(parts[0], true));
        setScheduleAlarm(WORK_END_REQUEST_CODE, nextWallClock(parts[1], false));
    }

    private long nextWallClock(String value, boolean start) {
        int minutes = minutesOfDay(value, start ? 0 : 1439);
        Calendar target = Calendar.getInstance();
        target.set(Calendar.HOUR_OF_DAY, minutes / 60);
        target.set(Calendar.MINUTE, minutes % 60);
        target.set(Calendar.SECOND, 0);
        target.set(Calendar.MILLISECOND, 0);
        if (target.getTimeInMillis() <= System.currentTimeMillis()) {
            target.add(Calendar.DAY_OF_MONTH, 1);
        }
        return target.getTimeInMillis();
    }

    private void setScheduleAlarm(int requestCode, long whenMillis) {
        try {
            AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            PendingIntent pendingIntent = relaunchIntent(requestCode);
            if (android.os.Build.VERSION.SDK_INT >= 23) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, whenMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, whenMillis, pendingIntent);
            }
        } catch (Exception ignored) {
            try {
                AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
                alarmManager.set(AlarmManager.RTC_WAKEUP, whenMillis, relaunchIntent(requestCode));
            } catch (Exception ignoredAgain) {
            }
        }
    }

    private void playAudio(File file) {
        try {
            audioPlayer = new MediaPlayer();
            audioPlayer.setDataSource(file.getAbsolutePath());
            audioPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    playNext();
                }
            });
            audioPlayer.prepare();
            audioPlayer.start();
        } catch (Exception ignored) {
            playNext();
        }
    }

    private void playNext() {
        if (playlist.isEmpty()) return;
        currentIndex = (currentIndex + 1) % playlist.size();
        playCurrent();
    }

    private void reportNowPlaying(MediaItem item) {
        final MediaItem currentItem = item;
        final int index = currentIndex;
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    JSONObject body = new JSONObject();
                    body.put("code", deviceCode);
                    body.put("mediaId", currentItem.id);
                    body.put("mediaName", currentItem.name);
                    body.put("mediaType", currentItem.type);
                    body.put("index", index);
                    body.put("appVersion", BuildConfig.VERSION_NAME);
                    postJson(SERVER_BASE + "/api/tv-now-playing", body.toString());
                } catch (Exception ignored) {
                }
            }
        }).start();
    }

    private void showPairing(String message) {
        paired = false;
        handler.removeCallbacks(nextRunnable);
        stopPlayers();
        emptyText.setVisibility(View.GONE);
        titleText.setText("");
        playlistText.setText("");
        pairingCodeText.setText(deviceCode);
        pairingInfoText.setText(message + "\nAdmin panel -> Qurilmalar / TVlar -> Yangi lokatsiya.");
        pairingView.setVisibility(View.VISIBLE);
        statusText.setText("Ulanmagan - " + deviceCode);
    }

    private void hidePairing() {
        if (pairingView != null) pairingView.setVisibility(View.GONE);
    }

    private void stopPlayers() {
        imageView.setVisibility(View.GONE);
        videoView.setVisibility(View.GONE);
        try {
            videoView.stopPlayback();
        } catch (Exception ignored) {
        }
        if (audioPlayer != null) {
            try {
                audioPlayer.stop();
                audioPlayer.release();
            } catch (Exception ignored) {
            }
            audioPlayer = null;
        }
    }

    private void renderStrip() {
        if (playlist.isEmpty()) {
            playlistText.setText("");
            return;
        }
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < playlist.size(); i++) {
            MediaItem item = playlist.get(i);
            if (i > 0) builder.append("   |   ");
            builder.append(i == currentIndex ? "> " : "");
            builder.append(item.type).append(": ").append(shortName(item.name));
        }
        playlistText.setText(builder.toString());
    }

    private String shortName(String value) {
        String text = String.valueOf(value == null || value.length() == 0 ? "Kontent" : value);
        return text.length() > 22 ? text.substring(0, 22) + "..." : text;
    }

    private void applyDeviceConfig(JSONObject deviceJson, JSONObject weatherJson) {
        if (weatherJson != null) {
            String city = weatherJson.optString("city", "");
            String description = weatherJson.optString("description", "Ob-havo");
            if (weatherJson.isNull("temperature")) {
                weatherText = city.length() > 0 ? city + ": " + description : description;
            } else {
                weatherText = city + ": " + weatherJson.optInt("temperature") + "°C, " + description;
            }
        }
        if (deviceJson == null) return;

        workSchedule = deviceJson.optString("workSchedule", workSchedule);
        scheduleWorkAlarms();
        screenRotation = normalizeRotation(deviceJson.optInt("rotation", 0));
        applyRotation();
        applyVolume(deviceJson.optInt("volume", 75));
        applyLogo(deviceJson);
    }

    private void applyVolume(int percent) {
        try {
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            int max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int value = Math.max(0, Math.min(max, Math.round(max * Math.max(0, Math.min(100, percent)) / 100f)));
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, value, 0);
        } catch (Exception ignored) {
        }
    }

    private void applyRotation() {
        if (imageView != null) imageView.setRotation(screenRotation);
        if (videoView != null) videoView.setRotation(screenRotation);
    }

    private int normalizeRotation(int value) {
        if (value == 90 || value == 180 || value == 270) return value;
        return 0;
    }

    private void applyLogo(JSONObject deviceJson) {
        boolean showLogo = deviceJson.optBoolean("showLogo", false);
        String logoUrl = deviceJson.optString("logoUrl", "");
        if (!showLogo || logoUrl.length() == 0) {
            handler.post(new Runnable() {
                @Override
                public void run() {
                    logoView.setVisibility(View.GONE);
                }
            });
            return;
        }

        try {
            File target = new File(mediaDir, "logo-" + deviceCode.replace("-", "") + ".img");
            String source = logoUrl.startsWith("http") ? logoUrl : SERVER_BASE + "/" + logoUrl;
            if (!target.exists() || target.length() == 0) downloadToFile(source, target);
            handler.post(new Runnable() {
                @Override
                public void run() {
                    logoView.setImageURI(Uri.fromFile(target));
                    logoView.setVisibility(View.VISIBLE);
                }
            });
        } catch (Exception ignored) {
        }
    }

    private void handleUpdateIfNeeded(JSONObject deviceJson) {
        if (deviceJson == null) return;
        JSONObject latestApk = deviceJson.optJSONObject("latestApk");
        if (latestApk == null) return;

        String latestVersion = latestApk.optString("version", "");
        if (!isNewerVersion(latestVersion, BuildConfig.VERSION_NAME)) return;

        JSONObject command = deviceJson.optJSONObject("pendingCommand");
        long commandId = command == null ? 0 : command.optLong("id", 0);
        long apkId = latestApk.optLong("id", 0);
        String promptKey = (commandId > 0 ? commandId : apkId) + "-" + latestVersion;
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        if (promptKey.equals(preferences.getString(KEY_LAST_UPDATE_PROMPT, ""))) return;

        try {
            File apkFile = downloadApk(latestApk);
            preferences.edit().putString(KEY_LAST_UPDATE_PROMPT, promptKey).apply();
            notifyUpdateStatus(commandId, "APK yuklandi, o'rnatish oynasi ochildi");
            handler.post(new Runnable() {
                @Override
                public void run() {
                    statusText.setText("APK update - " + latestVersion);
                    openInstallScreen(apkFile);
                }
            });
        } catch (Exception error) {
            notifyUpdateStatus(commandId, "APK update xatosi: " + error.getMessage());
        }
    }

    private File downloadApk(JSONObject latestApk) throws Exception {
        long apkId = latestApk.optLong("id", System.currentTimeMillis());
        String url = latestApk.optString("url", "");
        File target = new File(apkDir, apkId + ".apk");
        if (target.exists() && target.length() > 0) return target;

        String source = url.startsWith("http") ? url : SERVER_BASE + "/" + url;
        downloadToFile(source, target);
        return target;
    }

    private void openInstallScreen(File apkFile) {
        try {
            Uri uri = FileProvider.getUriForFile(this, BuildConfig.APPLICATION_ID + ".fileprovider", apkFile);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            openingInstaller = true;
            startActivity(intent);
        } catch (Exception error) {
            notifyUpdateStatus(0, "O'rnatish oynasini ochib bo'lmadi: " + error.getMessage());
        }
    }

    private void scheduleRelaunch() {
        try {
            AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            PendingIntent pendingIntent = relaunchIntent(RELAUNCH_REQUEST_CODE);
            alarmManager.set(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 60_000L, pendingIntent);
        } catch (Exception ignored) {
        }
    }

    private void cancelRelaunch() {
        try {
            AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            alarmManager.cancel(relaunchIntent(RELAUNCH_REQUEST_CODE));
        } catch (Exception ignored) {
        }
    }

    private PendingIntent relaunchIntent(int requestCode) {
        Intent intent = new Intent(this, RestartReceiver.class);
        intent.putExtra("requestCode", requestCode);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(this, requestCode, intent, flags);
    }

    private boolean isNewerVersion(String latest, String current) {
        if (latest == null || latest.length() == 0) return false;
        String[] left = latest.split("\\.");
        String[] right = String.valueOf(current == null ? "" : current).split("\\.");
        int length = Math.max(left.length, right.length);
        for (int i = 0; i < length; i++) {
            int a = i < left.length ? safeNumber(left[i]) : 0;
            int b = i < right.length ? safeNumber(right[i]) : 0;
            if (a > b) return true;
            if (a < b) return false;
        }
        return false;
    }

    private int safeNumber(String value) {
        try {
            return Integer.parseInt(String.valueOf(value).replaceAll("[^0-9]", ""));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private void notifyUpdateStatus(long commandId, String status) {
        try {
            JSONObject body = new JSONObject();
            body.put("code", deviceCode);
            body.put("commandId", commandId);
            body.put("command", "update");
            body.put("status", status);
            body.put("appVersion", BuildConfig.VERSION_NAME);
            postJson(SERVER_BASE + "/api/device-command-status", body.toString());
        } catch (Exception ignored) {
        }
    }

    private void downloadIfNeeded(MediaItem item) throws Exception {
        String ext = item.extension();
        File target = new File(mediaDir, item.id + ext);
        if (target.exists() && target.length() > 0) {
            item.localPath = target.getAbsolutePath();
            return;
        }

        String source = item.url.startsWith("http") ? item.url : SERVER_BASE + "/" + item.url;
        downloadToFile(source, target);
        item.localPath = target.getAbsolutePath();
    }

    private void downloadToFile(String source, File target) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(source).openConnection();
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(60000);
        connection.connect();
        if (connection.getResponseCode() < 200 || connection.getResponseCode() >= 300) {
            throw new Exception("Download failed: " + connection.getResponseCode());
        }

        File temp = new File(target.getParentFile(), target.getName() + ".download");
        try (InputStream input = new BufferedInputStream(connection.getInputStream());
             FileOutputStream output = new FileOutputStream(temp)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
        } finally {
            connection.disconnect();
        }

        if (target.exists()) target.delete();
        if (!temp.renameTo(target)) throw new Exception("Cache save failed");
    }

    private String readUrl(String value) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(value).openConnection();
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(12000);
        connection.connect();
        if (connection.getResponseCode() < 200 || connection.getResponseCode() >= 300) {
            throw new Exception("Server error: " + connection.getResponseCode());
        }

        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) builder.append(line);
        } finally {
            connection.disconnect();
        }
        return builder.toString();
    }

    private void postJson(String value, String json) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(value).openConnection();
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(12000);
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        connection.getOutputStream().write(json.getBytes("UTF-8"));
        connection.connect();
        try {
            connection.getInputStream().close();
        } finally {
            connection.disconnect();
        }
    }

    private String readText(File file) throws Exception {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) builder.append(line);
        }
        return builder.toString();
    }

    private void writeText(File file, String text) throws Exception {
        try (FileWriter writer = new FileWriter(file, false)) {
            writer.write(text);
        }
    }

    private static class MediaItem {
        long id;
        String name;
        String type;
        String mime;
        String url;
        String duration;
        String localPath;

        static MediaItem fromJson(JSONObject json) {
            MediaItem item = new MediaItem();
            item.id = json.optLong("id");
            item.name = json.optString("name", "Kontent");
            item.type = json.optString("type", "Rasm");
            item.mime = json.optString("mime", "");
            item.url = json.optString("url", "");
            item.duration = json.optString("duration", "00:00:05");
            item.localPath = json.optString("localPath", null);
            return item;
        }

        JSONObject toJson() throws Exception {
            JSONObject json = new JSONObject();
            json.put("id", id);
            json.put("name", name);
            json.put("type", type);
            json.put("mime", mime);
            json.put("url", url);
            json.put("duration", duration);
            json.put("localPath", localPath);
            return json;
        }

        boolean isCacheable() {
            return "Video".equalsIgnoreCase(type)
                || "Rasm".equalsIgnoreCase(type)
                || "MP3".equalsIgnoreCase(type)
                || mime.startsWith("video/")
                || mime.startsWith("image/")
                || mime.startsWith("audio/");
        }

        String extension() {
            String clean = url.split("\\?")[0].toLowerCase(Locale.US);
            int dot = clean.lastIndexOf('.');
            if (dot >= 0 && dot < clean.length() - 1) return clean.substring(dot);
            if (mime.startsWith("video/")) return ".mp4";
            if (mime.startsWith("audio/")) return ".mp3";
            if (mime.contains("png")) return ".png";
            if (mime.contains("webp")) return ".webp";
            return ".jpg";
        }

        long durationMs() {
            try {
                String[] parts = duration.split(":");
                long seconds = 5;
                if (parts.length == 3) {
                    seconds = Long.parseLong(parts[0]) * 3600 + Long.parseLong(parts[1]) * 60 + Long.parseLong(parts[2]);
                } else if (parts.length == 2) {
                    seconds = Long.parseLong(parts[0]) * 60 + Long.parseLong(parts[1]);
                }
                return Math.max(3000L, seconds * 1000L);
            } catch (Exception ignored) {
                return 5000L;
            }
        }
    }
}

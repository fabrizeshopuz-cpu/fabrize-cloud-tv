package uz.castmap.connectedplayer;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.PixelCopy;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.AspectRatioFrameLayout;
import androidx.media3.ui.PlayerView;
import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String PREFS = "castmap-player";
    private static final String KEY_CODE = "device_code";
    private static final String KEY_LAST_PAYLOAD = "last_payload";
    private static final String KEY_LANGUAGE = "player_language";
    private static final String KEY_LAST_COMMAND_ID = "last_command_id";
    private static final String KEY_LAST_UPDATE_VERSION = "last_update_version";
    private static final String APP_VERSION = "1.2.3";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ArrayList<MediaItem> playlist = new ArrayList<>();
    private FrameLayout root;
    private FrameLayout contentLayer;
    private TextView overlay;
    private String deviceCode;
    private int currentIndex = 0;
    private boolean paired = false;
    private boolean stoppedBySchedule = false;
    private JSONObject currentDevice;
    private JSONObject weather;
    private String language = "uz";
    private long centerDownAt = 0L;
    private ExoPlayer activeVideoPlayer;

    private final Runnable pollRunnable = new Runnable() {
        @Override public void run() {
            pollServer();
            handler.postDelayed(this, 10_000);
        }
    };

    private final Runnable clockRunnable = new Runnable() {
        @Override public void run() {
            updateOverlay();
            handler.postDelayed(this, 1_000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUi();

        deviceCode = loadOrCreateDeviceCode();
        language = loadLanguage();
        buildRoot();
        showSplashScreen();
        handler.postDelayed(() -> {
            showPairingScreen(t("pairMessage"));
            handler.post(clockRunnable);
            handler.post(pollRunnable);
        }, 1800);
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUi();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        releaseActiveVideoPlayer();
        executor.shutdownNow();
        super.onDestroy();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_UP
                && (event.getKeyCode() == KeyEvent.KEYCODE_MENU
                || event.getKeyCode() == KeyEvent.KEYCODE_LANGUAGE_SWITCH)) {
            cycleLanguage();
            return true;
        }
        if (event.getKeyCode() == KeyEvent.KEYCODE_DPAD_CENTER || event.getKeyCode() == KeyEvent.KEYCODE_ENTER) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                centerDownAt = System.currentTimeMillis();
            }
            if (event.getAction() == KeyEvent.ACTION_UP) {
                long held = System.currentTimeMillis() - centerDownAt;
                centerDownAt = 0;
                if (held > 5000) {
                    showPairingScreen(t("stableCode"));
                    return true;
                }
            }
        }
        return super.dispatchKeyEvent(event);
    }

    private void buildRoot() {
        root = new FrameLayout(this);
        root.setBackgroundColor(0xFF000000);
        contentLayer = new FrameLayout(this);
        overlay = new TextView(this);
        overlay.setTextColor(0xFFEED27A);
        overlay.setTextSize(14);
        overlay.setGravity(Gravity.RIGHT);
        overlay.setPadding(14, 10, 14, 10);
        overlay.setBackground(rounded(0xB3000000, 14, 0x22D4AF37));
        overlay.setVisibility(View.GONE);

        FrameLayout.LayoutParams contentParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        );
        FrameLayout.LayoutParams overlayParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.RIGHT
        );
        overlayParams.setMargins(0, 18, 18, 0);

        root.addView(contentLayer, contentParams);
        root.addView(overlay, overlayParams);
        setContentView(root);
    }

    private void showSplashScreen() {
        overlay.setVisibility(View.GONE);
        releaseActiveVideoPlayer();
        contentLayer.removeAllViews();
        contentLayer.setRotation(0f);

        LinearLayout screen = new LinearLayout(this);
        screen.setOrientation(LinearLayout.VERTICAL);
        screen.setGravity(Gravity.CENTER);
        screen.setPadding(dp(60), dp(42), dp(60), dp(42));
        screen.setBackground(new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[]{0xFF030303, 0xFF0A0A0A, 0xFF171107}
        ));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.castmap_logo);
        logo.setAdjustViewBounds(true);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(dp(420), dp(210));
        logoParams.setMargins(0, 0, 0, dp(24));
        screen.addView(logo, logoParams);

        TextView title = text("CASTMAP PLAYER", 34, 0xFFF5F5F5, true);
        title.setLetterSpacing(0.08f);
        screen.addView(title);

        TextView tagline = text("CONTROL EVERY SCREEN", 15, 0xFFD4AF37, true);
        tagline.setLetterSpacing(0.22f);
        LinearLayout.LayoutParams taglineParams = new LinearLayout.LayoutParams(wrap(), wrap());
        taglineParams.setMargins(0, dp(10), 0, dp(28));
        screen.addView(tagline, taglineParams);

        TextView loading = text(t("loading"), 17, 0xFFA1A1AA, false);
        screen.addView(loading);

        contentLayer.addView(screen, match());
    }

    private void showPairingScreen(String message) {
        releaseActiveVideoPlayer();
        contentLayer.removeAllViews();
        contentLayer.setRotation(0f);
        overlay.setVisibility(View.GONE);
        stoppedBySchedule = false;

        LinearLayout screen = new LinearLayout(this);
        screen.setOrientation(LinearLayout.VERTICAL);
        screen.setGravity(Gravity.CENTER);
        screen.setPadding(dp(56), dp(34), dp(56), dp(34));
        screen.setBackground(new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[]{0xFF020202, 0xFF0A0A0A, 0xFF191103}
        ));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.castmap_logo);
        logo.setAdjustViewBounds(true);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(dp(270), dp(120));
        logoParams.setMargins(0, 0, 0, dp(12));
        screen.addView(logo, logoParams);

        TextView title = text(t("pairTitle"), 34, 0xFFF5F5F5, true);
        screen.addView(title);

        TextView subtitle = text(t("pairSubtitle"), 18, 0xFFA1A1AA, false);
        LinearLayout.LayoutParams subtitleParams = new LinearLayout.LayoutParams(wrap(), wrap());
        subtitleParams.setMargins(0, dp(8), 0, dp(22));
        screen.addView(subtitle, subtitleParams);

        LinearLayout middle = new LinearLayout(this);
        middle.setOrientation(LinearLayout.HORIZONTAL);
        middle.setGravity(Gravity.CENTER);

        TextView qr = text("QR", 34, 0xFFD4AF37, true);
        qr.setGravity(Gravity.CENTER);
        qr.setBackground(rounded(0xFF111111, 18, 0x88D4AF37));
        LinearLayout.LayoutParams qrParams = new LinearLayout.LayoutParams(dp(132), dp(132));
        qrParams.setMargins(0, 0, dp(22), 0);
        middle.addView(qr, qrParams);

        TextView code = text(deviceCode, 58, 0xFFD4AF37, true);
        code.setGravity(Gravity.CENTER);
        code.setLetterSpacing(0.08f);
        code.setBackground(rounded(0xFF0F0F0F, 18, 0xFFD4AF37));
        LinearLayout.LayoutParams codeParams = new LinearLayout.LayoutParams(dp(430), dp(132));
        middle.addView(code, codeParams);
        screen.addView(middle);

        TextView status = text(t("waiting"), 18, 0xFFD4AF37, true);
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(wrap(), wrap());
        statusParams.setMargins(0, dp(22), 0, dp(8));
        screen.addView(status, statusParams);

        TextView info = text(message + "\n\n" + t("deviceCode") + ": " + deviceCode
                + "   |   " + t("app") + ": " + APP_VERSION
                + "   |   " + t("server") + ": " + BuildConfig.SERVER_BASE_URL
                + "   |   " + t("language") + ": " + languageLabel(), 15, 0xFFC7C7C7, false);
        info.setGravity(Gravity.CENTER);
        info.setLineSpacing(dp(4), 1);
        info.setPadding(dp(22), dp(16), dp(22), dp(16));
        info.setBackground(rounded(0x77111111, 18, 0x22FFFFFF));
        LinearLayout.LayoutParams infoParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, wrap());
        infoParams.setMargins(dp(80), dp(18), dp(80), 0);
        screen.addView(info, infoParams);

        TextView languageHint = text("UZ  |  RU  |  EN    " + t("languageHint"), 14, 0xFFD4AF37, true);
        LinearLayout.LayoutParams languageParams = new LinearLayout.LayoutParams(wrap(), wrap());
        languageParams.setMargins(0, dp(14), 0, 0);
        screen.addView(languageHint, languageParams);

        contentLayer.addView(screen, match());
    }

    private void pollServer() {
        executor.execute(() -> {
            try {
                String url = BuildConfig.SERVER_BASE_URL + "/api/v2/player/playlist/" + URLEncoder.encode(deviceCode, "UTF-8")
                        + "?appVersion=" + URLEncoder.encode(APP_VERSION, "UTF-8");
                String text = httpGet(url);
                getPrefs().edit().putString(KEY_LAST_PAYLOAD, text).apply();
                handlePayload(new JSONObject(text), true);
            } catch (Exception v2Error) {
                try {
                    String oldUrl = BuildConfig.SERVER_BASE_URL + "/api/tv-code/" + URLEncoder.encode(deviceCode, "UTF-8")
                            + "?appVersion=" + URLEncoder.encode(APP_VERSION, "UTF-8");
                    String text = httpGet(oldUrl);
                    getPrefs().edit().putString(KEY_LAST_PAYLOAD, text).apply();
                    handlePayload(new JSONObject(text), true);
                } catch (Exception oldApiError) {
                    try {
                        String cached = getPrefs().getString(KEY_LAST_PAYLOAD, "");
                        if (!cached.isEmpty()) handlePayload(new JSONObject(cached), false);
                        else runOnUiThread(() -> showPairingScreen(t("noInternet")));
                    } catch (Exception ignored) {
                        runOnUiThread(() -> showPairingScreen(t("noCache")));
                    }
                }
            }
        });
    }

    private void handlePayload(JSONObject payload, boolean online) throws Exception {
        paired = payload.optBoolean("paired", payload.has("device"));
        if (!paired) {
            String message = payload.optString("message", t("unpaired"));
            runOnUiThread(() -> showPairingScreen(message));
            return;
        }

        currentDevice = payload.optJSONObject("device");
        weather = payload.optJSONObject("weather");
        JSONArray media = payload.optJSONArray("media");
        if (media == null) media = payload.optJSONArray("items");
        applyDeviceSettings(currentDevice);
        applyPendingCommand(currentDevice);
        applyAutomaticUpdate(currentDevice);

        ArrayList<MediaItem> next = new ArrayList<>();
        if (media != null) {
            for (int i = 0; i < media.length(); i++) {
                JSONObject item = media.optJSONObject(i);
                if (item != null) next.add(MediaItem.from(item));
            }
        }

        cacheMedia(next);

        runOnUiThread(() -> {
            updateOverlay();
            if (!isInsideWorkSchedule(currentDevice)) {
                stoppedBySchedule = true;
                showBlackScreen(t("workEnded"));
                return;
            }
            stoppedBySchedule = false;
            boolean changed = replacePlaylist(next);
            if (playlist.isEmpty()) {
                showBlackScreen(t("noContent"));
            } else if (changed || contentLayer.getChildCount() == 0 || !paired) {
                currentIndex = 0;
                playCurrent();
            }
        });
    }

    private boolean replacePlaylist(ArrayList<MediaItem> next) {
        String oldIds = idsOf(playlist);
        String newIds = idsOf(next);
        playlist.clear();
        playlist.addAll(next);
        return !oldIds.equals(newIds);
    }

    private String idsOf(ArrayList<MediaItem> items) {
        StringBuilder builder = new StringBuilder();
        for (MediaItem item : items) builder.append(item.id).append(":").append(item.url).append("|");
        return builder.toString();
    }

    private void playCurrent() {
        if (playlist.isEmpty() || stoppedBySchedule) return;
        if (currentIndex >= playlist.size()) currentIndex = 0;
        MediaItem item = playlist.get(currentIndex);
        reportNowPlaying(item);

        releaseActiveVideoPlayer();
        contentLayer.removeAllViews();
        contentLayer.setRotation(rotationFromDevice());

        if (item.isVideo()) playVideo(item);
        else if (item.isImage()) playImage(item);
        else if (item.isAudio()) playAudio(item);
        else playWeb(item);
    }

    private void playVideo(MediaItem item) {
        String playablePath = resolvePlayablePath(item);
        PlayerView playerView = new PlayerView(this);
        playerView.setBackgroundColor(0xFF000000);
        playerView.setUseController(false);
        playerView.setResizeMode(AspectRatioFrameLayout.RESIZE_MODE_FIT);

        ExoPlayer player = new ExoPlayer.Builder(this).build();
        activeVideoPlayer = player;
        playerView.setPlayer(player);
        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                if (playbackState == Player.STATE_READY) {
                    reportPlayerLog("info", item, "Video ready: " + playablePath);
                } else if (playbackState == Player.STATE_ENDED) {
                    nextMedia();
                }
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                reportPlayerLog("error", item, "Video error " + error.getErrorCodeName() + ": " + error.getMessage());
                nextMedia();
            }
        });
        contentLayer.addView(playerView, match());
        androidx.media3.common.MediaItem.Builder mediaBuilder = new androidx.media3.common.MediaItem.Builder()
                .setUri(Uri.parse(playablePath));
        String media3MimeType = item.media3MimeType();
        if (!media3MimeType.isEmpty()) mediaBuilder.setMimeType(media3MimeType);
        player.setMediaItem(mediaBuilder.build());
        player.prepare();
        player.play();
    }

    private void playImage(MediaItem item) {
        ImageView image = new ImageView(this);
        image.setScaleType(ImageView.ScaleType.FIT_CENTER);
        image.setBackgroundColor(0xFF000000);
        Bitmap bitmap = BitmapFactory.decodeFile(resolvePlayablePath(item));
        if (bitmap != null) image.setImageBitmap(bitmap);
        contentLayer.addView(image, match());
        handler.postDelayed(this::nextMedia, Math.max(5_000, item.durationMs));
    }

    private void playAudio(MediaItem item) {
        showBlackScreen(item.name);
        MediaPlayer player = new MediaPlayer();
        try {
            player.setDataSource(resolvePlayablePath(item));
            player.setOnCompletionListener(mp -> {
                mp.release();
                nextMedia();
            });
            player.prepare();
            player.start();
        } catch (Exception e) {
            player.release();
            nextMedia();
        }
    }

    private void playWeb(MediaItem item) {
        WebView webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.loadUrl(item.url);
        contentLayer.addView(webView, match());
        handler.postDelayed(this::nextMedia, Math.max(15_000, item.durationMs));
    }

    private void nextMedia() {
        if (playlist.isEmpty()) return;
        currentIndex = (currentIndex + 1) % playlist.size();
        playCurrent();
    }

    private void showBlackScreen(String text) {
        releaseActiveVideoPlayer();
        contentLayer.removeAllViews();
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextColor(0x44FFFFFF);
        view.setTextSize(20);
        view.setGravity(Gravity.CENTER);
        view.setBackgroundColor(0xFF000000);
        contentLayer.addView(view, match());
    }

    private void updateOverlay() {
        if (!paired) {
            overlay.setVisibility(View.GONE);
            return;
        }
        overlay.setVisibility(View.VISIBLE);
        String time = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
        String date = new SimpleDateFormat("dd.MM.yyyy", Locale.getDefault()).format(new Date());
        String internet = isOnline() ? t("online") : t("offline");
        String weatherText = "";
        if (weather != null) {
            String city = weather.optString("city", "");
            String temp = weather.isNull("temperature") ? "" : weather.optInt("temperature") + " C";
            String desc = weather.optString("description", "");
            weatherText = "\n" + city + " " + temp + " " + desc;
        }
        overlay.setText(time + "\n" + date + "\n" + internet + weatherText);
    }

    private void applyDeviceSettings(JSONObject device) {
        if (device == null) return;
        int volume = Math.max(0, Math.min(100, device.optInt("volume", 75)));
        AudioManager audio = (AudioManager) getSystemService(AUDIO_SERVICE);
        if (audio != null) {
            int max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            audio.setStreamVolume(AudioManager.STREAM_MUSIC, Math.round(max * (volume / 100f)), 0);
        }
    }

    private float rotationFromDevice() {
        if (currentDevice == null) return 0f;
        int rotation = currentDevice.optInt("rotation", 0);
        return (rotation == 90 || rotation == 180 || rotation == 270) ? rotation : 0;
    }

    private boolean isInsideWorkSchedule(JSONObject device) {
        if (device == null) return true;
        String schedule = device.optString("workSchedule", "00:00-23:59");
        String[] parts = schedule.split("-");
        if (parts.length != 2) return true;
        int now = minutes(new SimpleDateFormat("HH:mm", Locale.US).format(new Date()));
        int start = minutes(parts[0]);
        int end = minutes(parts[1]);
        if (start < 0 || end < 0) return true;
        if (start <= end) return now >= start && now <= end;
        return now >= start || now <= end;
    }

    private int minutes(String value) {
        try {
            String[] parts = value.trim().split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception e) {
            return -1;
        }
    }

    private void applyPendingCommand(JSONObject device) {
        if (device == null) return;
        JSONObject command = device.optJSONObject("pendingCommand");
        if (command == null) return;
        String type = command.optString("command", "");
        String commandId = command.optString("id", "0");
        if (commandId.length() > 0 && commandId.equals(getPrefs().getString(KEY_LAST_COMMAND_ID, ""))) return;
        getPrefs().edit().putString(KEY_LAST_COMMAND_ID, commandId).apply();
        if ("refresh".equals(type)) {
            postCommandStatus(commandId, type, "Refresh bajarildi");
        } else if ("restart".equals(type)) {
            postCommandStatus(commandId, type, "Restart bajarilmoqda");
            runOnUiThread(this::recreate);
        } else if ("update".equals(type)) {
            JSONObject apk = device.optJSONObject("latestApk");
            if (apk != null) downloadApk(apk, commandId);
        } else if ("screenshot".equals(type)) {
            captureAndUploadScreenshot(commandId);
        }
    }

    private void captureAndUploadScreenshot(String commandId) {
        runOnUiThread(() -> {
            try {
                if (root == null || root.getWidth() <= 0 || root.getHeight() <= 0) {
                    postCommandStatus(commandId, "screenshot", "Screenshot xatosi: ekran tayyor emas");
                    return;
                }

                int width = root.getWidth();
                int height = root.getHeight();
                float scale = Math.min(1f, 960f / Math.max(width, height));
                int outputWidth = Math.max(1, Math.round(width * scale));
                int outputHeight = Math.max(1, Math.round(height * scale));
                Bitmap bitmap = Bitmap.createBitmap(outputWidth, outputHeight, Bitmap.Config.ARGB_8888);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    int[] location = new int[2];
                    root.getLocationInWindow(location);
                    Rect source = new Rect(location[0], location[1], location[0] + width, location[1] + height);
                    PixelCopy.request(getWindow(), source, bitmap, result -> {
                        if (result == PixelCopy.SUCCESS) {
                            uploadScreenshotBitmap(bitmap, commandId);
                        } else {
                            bitmap.recycle();
                            captureWithCanvas(commandId, width, height, outputWidth, outputHeight);
                        }
                    }, handler);
                } else {
                    captureWithCanvas(commandId, width, height, outputWidth, outputHeight);
                }
            } catch (Exception e) {
                postCommandStatus(commandId, "screenshot", "Screenshot xatosi: " + e.getMessage());
            }
        });
    }

    private void captureWithCanvas(String commandId, int width, int height, int outputWidth, int outputHeight) {
        try {
            Bitmap bitmap = Bitmap.createBitmap(outputWidth, outputHeight, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            canvas.scale(outputWidth / (float) width, outputHeight / (float) height);
            root.draw(canvas);
            uploadScreenshotBitmap(bitmap, commandId);
        } catch (Exception e) {
            postCommandStatus(commandId, "screenshot", "Screenshot xatosi: " + e.getMessage());
        }
    }

    private void uploadScreenshotBitmap(Bitmap bitmap, String commandId) {
        executor.execute(() -> {
            try {
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.JPEG, 72, output);
                bitmap.recycle();
                String imageBase64 = Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);

                JSONObject body = new JSONObject();
                body.put("code", deviceCode);
                body.put("deviceId", currentDevice == null ? deviceCode : currentDevice.optString("id", currentDevice.optString("deviceId", deviceCode)));
                body.put("commandId", commandId);
                body.put("mime", "image/jpeg");
                body.put("imageBase64", imageBase64);
                body.put("appVersion", APP_VERSION);
                httpPost(BuildConfig.SERVER_BASE_URL + "/api/player/screenshot", body.toString());
            } catch (Exception e) {
                postCommandStatus(commandId, "screenshot", "Screenshot xatosi: " + e.getMessage());
            }
        });
    }

    private void applyAutomaticUpdate(JSONObject device) {
        if (device == null) return;
        JSONObject apk = device.optJSONObject("latestApk");
        if (apk == null) return;
        String version = apk.optString("version", "");
        if (!isNewerVersion(version, APP_VERSION)) return;
        String lastAttempt = getPrefs().getString(KEY_LAST_UPDATE_VERSION, "");
        if (version.equals(lastAttempt)) return;
        getPrefs().edit().putString(KEY_LAST_UPDATE_VERSION, version).apply();
        downloadApk(apk, "auto-" + version);
    }

    private boolean isNewerVersion(String candidate, String current) {
        int[] next = versionParts(candidate);
        int[] installed = versionParts(current);
        for (int i = 0; i < Math.max(next.length, installed.length); i++) {
            int nextPart = i < next.length ? next[i] : 0;
            int installedPart = i < installed.length ? installed[i] : 0;
            if (nextPart > installedPart) return true;
            if (nextPart < installedPart) return false;
        }
        return false;
    }

    private int[] versionParts(String value) {
        String cleaned = String.valueOf(value).replaceFirst("^[vV]", "");
        String[] rawParts = cleaned.split("\\.");
        int[] parts = new int[rawParts.length];
        for (int i = 0; i < rawParts.length; i++) {
            try {
                parts[i] = Integer.parseInt(rawParts[i].replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {
                parts[i] = 0;
            }
        }
        return parts;
    }

    private void downloadApk(JSONObject apk, String commandId) {
        executor.execute(() -> {
            try {
                String apkUrl = absoluteUrl(apk.optString("url", ""));
                String name = apk.optString("name", "castmap-player.apk");
                File target = new File(getExternalFilesDir(null), name);
                downloadToFile(apkUrl, target);
                postCommandStatus(commandId, "update", "APK yuklandi: " + target.getAbsolutePath());
                runOnUiThread(() -> promptApkInstall(target, commandId));
            } catch (Exception e) {
                postCommandStatus(commandId, "update", "APK yuklash xatosi: " + e.getMessage());
            }
        });
    }

    private void promptApkInstall(File apkFile, String commandId) {
        try {
            Uri uri = FileProvider.getUriForFile(this, BuildConfig.APPLICATION_ID + ".fileprovider", apkFile);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);
            postCommandStatus(commandId, "update", "APK o'rnatish oynasi ochildi");
        } catch (Exception e) {
            postCommandStatus(commandId, "update", "APK o'rnatish oynasi ochilmadi: " + e.getMessage());
        }
    }

    private void cacheMedia(ArrayList<MediaItem> items) {
        for (MediaItem item : items) {
            if (!item.cacheable || item.isStream) continue;
            if (!item.isVideo() && !item.isImage() && !item.isAudio()) continue;
            try {
                File file = cacheFileFor(item);
                item.localPath = file.getAbsolutePath();
                if (!file.exists() || file.length() == 0) downloadToFile(item.url, file);
            } catch (Exception ignored) {
            }
        }
    }

    private String resolvePlayablePath(MediaItem item) {
        if (item.isStream || !item.cacheable) return item.url;
        if (item.localPath != null && new File(item.localPath).exists()) return item.localPath;
        File file = cacheFileFor(item);
        return file.exists() ? file.getAbsolutePath() : item.url;
    }

    private File cacheFileFor(MediaItem item) {
        String safe = item.id + "-" + item.name.replaceAll("[^a-zA-Z0-9._-]", "_");
        return new File(getCacheDir(), safe);
    }

    private void reportNowPlaying(MediaItem item) {
        executor.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("code", deviceCode);
                body.put("deviceId", currentDevice == null ? 0 : currentDevice.optInt("id"));
                body.put("mediaId", item.id);
                body.put("mediaName", item.name);
                body.put("mediaType", item.type);
                body.put("index", currentIndex);
                body.put("appVersion", APP_VERSION);
                httpPost(BuildConfig.SERVER_BASE_URL + "/api/tv-now-playing", body.toString());

                JSONObject heartbeat = new JSONObject();
                heartbeat.put("deviceId", currentDevice == null ? deviceCode : currentDevice.optString("deviceId", deviceCode));
                heartbeat.put("deviceCode", deviceCode);
                heartbeat.put("status", "online");
                heartbeat.put("currentMediaId", item.id);
                heartbeat.put("appVersion", APP_VERSION);
                httpPost(BuildConfig.SERVER_BASE_URL + "/api/v2/player/heartbeat", heartbeat.toString());
            } catch (Exception ignored) {
            }
        });
    }

    private void reportPlayerLog(String level, MediaItem item, String message) {
        executor.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("code", deviceCode);
                body.put("deviceId", currentDevice == null ? "" : currentDevice.optString("deviceId", ""));
                body.put("mediaId", item.id);
                body.put("mediaName", item.name);
                body.put("mediaType", item.type);
                body.put("level", level);
                body.put("message", message);
                body.put("appVersion", APP_VERSION);
                httpPost(BuildConfig.SERVER_BASE_URL + "/api/player/logs", body.toString());
            } catch (Exception ignored) {
            }
        });
    }

    private void releaseActiveVideoPlayer() {
        if (activeVideoPlayer == null) return;
        activeVideoPlayer.release();
        activeVideoPlayer = null;
    }

    private void postCommandStatus(String commandId, String command, String status) {
        try {
            JSONObject body = new JSONObject();
            body.put("code", deviceCode);
            body.put("deviceId", currentDevice == null ? 0 : currentDevice.optInt("id"));
            body.put("commandId", commandId);
            body.put("command", command);
            body.put("status", status);
            body.put("appVersion", APP_VERSION);
            httpPost(BuildConfig.SERVER_BASE_URL + "/api/device-command-status", body.toString());
        } catch (Exception ignored) {
        }
    }

    private String httpGet(String address) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(address).openConnection();
        connection.setConnectTimeout(8_000);
        connection.setReadTimeout(12_000);
        connection.setRequestMethod("GET");
        try (InputStream input = new BufferedInputStream(connection.getInputStream())) {
            return readAll(input);
        } finally {
            connection.disconnect();
        }
    }

    private String httpPost(String address, String json) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(address).openConnection();
        connection.setConnectTimeout(8_000);
        connection.setReadTimeout(12_000);
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        connection.setDoOutput(true);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(json.getBytes("UTF-8"));
        }
        try (InputStream input = new BufferedInputStream(connection.getInputStream())) {
            return readAll(input);
        } finally {
            connection.disconnect();
        }
    }

    private void downloadToFile(String address, File target) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(address).openConnection();
        connection.setConnectTimeout(10_000);
        connection.setReadTimeout(60_000);
        File parent = target.getParentFile();
        if (parent != null) parent.mkdirs();
        try (InputStream input = new BufferedInputStream(connection.getInputStream());
             OutputStream output = new BufferedOutputStream(new FileOutputStream(target))) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) >= 0) output.write(buffer, 0, read);
        } finally {
            connection.disconnect();
        }
    }

    private String readAll(InputStream input) throws Exception {
        byte[] buffer = new byte[16 * 1024];
        StringBuilder builder = new StringBuilder();
        int read;
        while ((read = input.read(buffer)) >= 0) {
            builder.append(new String(buffer, 0, read, "UTF-8"));
        }
        return builder.toString();
    }

    private boolean isOnline() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (manager == null) return false;
        NetworkCapabilities caps = manager.getNetworkCapabilities(manager.getActiveNetwork());
        return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private String loadOrCreateDeviceCode() {
        SharedPreferences prefs = getPrefs();
        String existing = prefs.getString(KEY_CODE, "");
        if (existing != null && existing.length() == 9) return existing;
        String raw = randomCode();
        String code = raw.substring(0, 4) + "-" + raw.substring(4);
        prefs.edit().putString(KEY_CODE, code).apply();
        return code;
    }

    private String randomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 8; i++) builder.append(chars.charAt(random.nextInt(chars.length())));
        return builder.toString();
    }

    private SharedPreferences getPrefs() {
        return getSharedPreferences(PREFS, MODE_PRIVATE);
    }

    private String loadLanguage() {
        String saved = getPrefs().getString(KEY_LANGUAGE, "uz");
        if ("ru".equals(saved) || "en".equals(saved)) return saved;
        return "uz";
    }

    private void cycleLanguage() {
        if ("uz".equals(language)) language = "ru";
        else if ("ru".equals(language)) language = "en";
        else language = "uz";
        getPrefs().edit().putString(KEY_LANGUAGE, language).apply();
        updateOverlay();
        if (!paired || contentLayer.getChildCount() == 0) showPairingScreen(t("pairMessage"));
    }

    private String languageLabel() {
        if ("ru".equals(language)) return "RU";
        if ("en".equals(language)) return "EN";
        return "UZ";
    }

    private String ruText(String key) {
        switch (key) {
            case "loading": return "\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f...";
            case "pairMessage": return "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043b\u043e\u043a\u0430\u0446\u0438\u044e \u0432 \u0430\u0434\u043c\u0438\u043d-\u043f\u0430\u043d\u0435\u043b\u0438 \u0441 \u044d\u0442\u0438\u043c \u043a\u043e\u0434\u043e\u043c.";
            case "stableCode": return "\u041a\u043e\u0434 \u0443\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432\u0430 \u043d\u0435 \u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f. \u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u044d\u0442\u043e\u0442 \u043a\u043e\u0434 \u0432 \u0430\u0434\u043c\u0438\u043d-\u043f\u0430\u043d\u0435\u043b\u0438.";
            case "pairTitle": return "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u0443\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432\u0430";
            case "pairSubtitle": return "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u044d\u0442\u043e\u0442 \u043a\u043e\u0434 \u0432 \u043b\u043e\u043a\u0430\u0446\u0438\u0438 \u0430\u0434\u043c\u0438\u043d-\u043f\u0430\u043d\u0435\u043b\u0438";
            case "waiting": return "\u041e\u0436\u0438\u0434\u0430\u043d\u0438\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f...";
            case "deviceCode": return "\u041a\u043e\u0434 \u0443\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432\u0430";
            case "app": return "\u041f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435";
            case "server": return "\u0421\u0435\u0440\u0432\u0435\u0440";
            case "language": return "\u042f\u0437\u044b\u043a";
            case "languageHint": return "MENU: \u0441\u043c\u0435\u043d\u0438\u0442\u044c \u044f\u0437\u044b\u043a";
            case "noInternet": return "\u041d\u0435\u0442 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442\u0430. \u041e\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044f \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u043a \u0430\u0434\u043c\u0438\u043d-\u043f\u0430\u043d\u0435\u043b\u0438.";
            case "noCache": return "\u041d\u0435\u0442 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442\u0430. \u041a\u044d\u0448 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.";
            case "unpaired": return "\u042d\u0442\u043e\u0442 \u043a\u043e\u0434 \u0435\u0449\u0435 \u043d\u0435 \u043f\u0440\u0438\u0432\u044f\u0437\u0430\u043d \u043a \u043b\u043e\u043a\u0430\u0446\u0438\u0438 \u0432 \u0430\u0434\u043c\u0438\u043d-\u043f\u0430\u043d\u0435\u043b\u0438.";
            case "workEnded": return "\u0420\u0430\u0431\u043e\u0447\u0435\u0435 \u0432\u0440\u0435\u043c\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e";
            case "noContent": return "\u041a\u043e\u043d\u0442\u0435\u043d\u0442 \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442";
            case "online": return "\u041e\u043d\u043b\u0430\u0439\u043d";
            case "offline": return "\u041e\u0444\u043b\u0430\u0439\u043d";
        }
        return key;
    }

    private String t(String key) {
        if ("ru".equals(language)) return ruText(key);
        if ("ru".equals(language)) {
            switch (key) {
                case "loading": return "Подготовка подключения...";
                case "pairMessage": return "Создайте локацию в админ-панели с этим кодом.";
                case "stableCode": return "Код устройства не меняется. Используйте этот код в админ-панели.";
                case "pairTitle": return "Подключение устройства";
                case "pairSubtitle": return "Введите этот код в локации админ-панели";
                case "waiting": return "Ожидание подключения...";
                case "deviceCode": return "Код устройства";
                case "app": return "Приложение";
                case "server": return "Сервер";
                case "language": return "Язык";
                case "languageHint": return "MENU: сменить язык";
                case "noInternet": return "Нет интернета. Ожидается подключение к админ-панели.";
                case "noCache": return "Нет интернета. Кэш не найден.";
                case "unpaired": return "Этот код еще не привязан к локации в админ-панели.";
                case "workEnded": return "Рабочее время завершено";
                case "noContent": return "Контент отсутствует";
                case "online": return "Онлайн";
                case "offline": return "Офлайн";
            }
        } else if ("en".equals(language)) {
            switch (key) {
                case "loading": return "Preparing connection...";
                case "pairMessage": return "Create a location in the admin panel with this code.";
                case "stableCode": return "Device code is stable. Use this code in the admin panel.";
                case "pairTitle": return "Connect device";
                case "pairSubtitle": return "Enter this code in the admin panel location";
                case "waiting": return "Waiting for connection...";
                case "deviceCode": return "Device code";
                case "app": return "App";
                case "server": return "Server";
                case "language": return "Language";
                case "languageHint": return "MENU: change language";
                case "noInternet": return "No internet. Waiting for admin panel connection.";
                case "noCache": return "No internet. Cached content not found.";
                case "unpaired": return "This code is not linked to an admin panel location yet.";
                case "workEnded": return "Work time ended";
                case "noContent": return "No content";
                case "online": return "Online";
                case "offline": return "Offline";
            }
        }
        switch (key) {
            case "loading": return "Ulanish tayyorlanmoqda...";
            case "pairMessage": return "Admin panelda shu kod bilan lokatsiya yarating.";
            case "stableCode": return "Qurilma kodi. Kod o'zgarmaydi, admin panelda shu kod ishlatiladi.";
            case "pairTitle": return "Qurilmani ulash";
            case "pairSubtitle": return "Admin panelda ushbu kodni lokatsiyaga kiriting";
            case "waiting": return "Ulanishni kutmoqda...";
            case "deviceCode": return "Qurilma kodi";
            case "app": return "Ilova";
            case "server": return "Server";
            case "language": return "Til";
            case "languageHint": return "MENU: tilni almashtirish";
            case "noInternet": return "Internet yo'q. Admin panelga ulanish kutilmoqda.";
            case "noCache": return "Internet yo'q. Cache kontent topilmadi.";
            case "unpaired": return "Bu kod hali admin panelda lokatsiyaga ulanmagan.";
            case "workEnded": return "Ish vaqti tugagan";
            case "noContent": return "Kontent mavjud emas";
            case "online": return "Online";
            case "offline": return "Offline";
        }
        return key;
    }

    private String absoluteUrl(String url) {
        if (url == null || url.isEmpty()) return "";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        String base = BuildConfig.SERVER_BASE_URL.replaceAll("/$", "");
        return base + "/" + url.replaceAll("^/+", "");
    }

    private FrameLayout.LayoutParams match() {
        return new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
    }

    private TextView text(String value, int sp, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sp);
        view.setTextColor(color);
        view.setGravity(Gravity.CENTER);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }

    private GradientDrawable rounded(int color, int radiusDp, int strokeColor) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radiusDp));
        if (strokeColor != 0) drawable.setStroke(Math.max(1, dp(1)), strokeColor);
        return drawable;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private int wrap() {
        return ViewGroup.LayoutParams.WRAP_CONTENT;
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    private static class MediaItem {
        String id;
        String name;
        String type;
        String mime;
        String url;
        String localPath;
        boolean isStream;
        boolean cacheable = true;
        String streamType;
        long durationMs;

        static MediaItem from(JSONObject json) {
            MediaItem item = new MediaItem();
            item.id = String.valueOf(json.opt("id"));
            item.name = json.optString("name", json.optString("title", "Kontent"));
            item.type = json.optString("type", "");
            item.mime = json.optString("mime", "");
            item.url = json.optString("url", "");
            item.isStream = json.optBoolean("isStream", false);
            item.streamType = json.optString("streamType", "");
            item.cacheable = json.has("cacheable") ? json.optBoolean("cacheable", true) : !item.isStream;
            item.durationMs = json.has("durationMs")
                    ? Math.max(5_000, json.optLong("durationMs", 10_000))
                    : parseDuration(json.optString("duration", "00:00:10"));
            item.detectStreamType();
            if (!isAbsoluteMediaUrl(item.url)) item.url = new MainActivityUrlHelper().absolute(item.url);
            return item;
        }

        boolean isVideo() {
            String lowerUrl = url == null ? "" : url.toLowerCase(Locale.US);
            String lowerMime = mime == null ? "" : mime.toLowerCase(Locale.US);
            return "Video".equalsIgnoreCase(type)
                    || "VIDEO".equalsIgnoreCase(type)
                    || isStream
                    || lowerMime.startsWith("video/")
                    || lowerMime.contains("mpegurl")
                    || lowerMime.contains("dash")
                    || lowerUrl.contains(".m3u8")
                    || lowerUrl.contains(".mpd")
                    || lowerUrl.startsWith("rtsp://");
        }

        boolean isImage() {
            return "Rasm".equalsIgnoreCase(type) || "IMAGE".equalsIgnoreCase(type) || mime.startsWith("image/");
        }

        boolean isAudio() {
            return "MP3".equalsIgnoreCase(type) || mime.startsWith("audio/");
        }

        String media3MimeType() {
            if ("hls".equals(streamType)) return "application/x-mpegURL";
            if ("dash".equals(streamType)) return "application/dash+xml";
            String lowerMime = mime == null ? "" : mime.toLowerCase(Locale.US);
            if (lowerMime.contains("mpegurl")) return "application/x-mpegURL";
            if (lowerMime.contains("dash")) return "application/dash+xml";
            return "";
        }

        void detectStreamType() {
            String lower = url == null ? "" : url.toLowerCase(Locale.US);
            String lowerMime = mime == null ? "" : mime.toLowerCase(Locale.US);
            if (lower.startsWith("rtsp://")) {
                streamType = "rtsp";
                isStream = true;
            } else if (lower.contains(".m3u8") || lowerMime.contains("mpegurl")) {
                streamType = "hls";
                isStream = true;
            } else if (lower.contains(".mpd") || lowerMime.contains("dash")) {
                streamType = "dash";
                isStream = true;
            }
            if (isStream) cacheable = false;
        }

        static boolean isAbsoluteMediaUrl(String value) {
            if (value == null) return false;
            String lower = value.toLowerCase(Locale.US);
            return lower.startsWith("http://")
                    || lower.startsWith("https://")
                    || lower.startsWith("rtsp://")
                    || lower.startsWith("//");
        }

        static long parseDuration(String value) {
            try {
                String[] parts = value.split(":");
                if (parts.length == 3) {
                    return ((Long.parseLong(parts[0]) * 3600) + (Long.parseLong(parts[1]) * 60) + Long.parseLong(parts[2])) * 1000;
                }
                if (parts.length == 2) {
                    return ((Long.parseLong(parts[0]) * 60) + Long.parseLong(parts[1])) * 1000;
                }
            } catch (Exception ignored) {
            }
            return 10_000;
        }
    }

    private static class MainActivityUrlHelper {
        String absolute(String url) {
            if (url == null || url.isEmpty()) return "";
            if (url.startsWith("http://") || url.startsWith("https://")) return url;
            return BuildConfig.SERVER_BASE_URL.replaceAll("/$", "") + "/" + url.replaceAll("^/+", "");
        }
    }
}

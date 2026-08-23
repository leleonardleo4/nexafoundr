import { config as loadEnv } from "dotenv";

loadEnv();

type LaunchMode = "web_app" | "login_url";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function getLaunchMode(): LaunchMode {
  const mode = readEnv("TELEGRAM_LAUNCH_MODE")?.toLowerCase();

  if (mode === "login_url") {
    return "login_url";
  }

  return "web_app";
}

async function main() {
  const botToken = readEnv("TELEGRAM_BOT_TOKEN");
  const chatId = readEnv("TELEGRAM_CHAT_ID");
  const launchUrl = readEnv("TELEGRAM_LAUNCH_URL") ?? readEnv("NEXT_PUBLIC_APP_URL");
  const launchMode = getLaunchMode();

  if (!botToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN in your environment.");
  }

  if (!chatId) {
    throw new Error("Missing TELEGRAM_CHAT_ID in your environment.");
  }

  if (!launchUrl) {
    throw new Error("Missing TELEGRAM_LAUNCH_URL or NEXT_PUBLIC_APP_URL in your environment.");
  }

  if (launchMode === "login_url") {
    throw new Error(
      "TELEGRAM_LAUNCH_MODE=login_url is not supported for Telegram sign-in here. Use web_app so the page opens inside Telegram and Privy can read initData.",
    );
  }

  if (/^http:\/\//i.test(launchUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(launchUrl)) {
    throw new Error(
      "TELEGRAM_LAUNCH_URL must be HTTPS for Telegram Web Apps unless you are testing on localhost.",
    );
  }

  const messageText =
    "Open NexaFoundr from Telegram to continue with login or signup.";

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: "Open NexaFoundr",
          web_app: {
            url: launchUrl,
          },
        },
      ],
    ],
  };

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: messageText,
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Telegram API error ${response.status}: ${errorBody}`);
  }

  const payload = (await response.json()) as {
    ok?: boolean;
    result?: { message_id?: number };
  };

  console.log(
    `Sent Telegram launch message${payload.result?.message_id ? ` #${payload.result.message_id}` : ""} to chat ${chatId}.`,
  );
  console.log(`Mode: ${launchMode}`);
  console.log(`URL: ${launchUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

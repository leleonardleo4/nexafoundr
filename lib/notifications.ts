type VerificationNotificationInput = {
  founderEmail: string;
  founderName: string;
  startupName: string;
  status: "VERIFIED" | "REJECTED";
};

export async function notifyFounderVerificationStatus({
  founderEmail,
  founderName,
  startupName,
  status,
}: VerificationNotificationInput) {
  const message =
    status === "VERIFIED"
      ? `${startupName} has been approved and is now visible to investors.`
      : `${startupName} was rejected during verification review.`;

  if (process.env.FOUNDER_NOTIFICATION_WEBHOOK_URL) {
    await fetch(process.env.FOUNDER_NOTIFICATION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: founderEmail,
        founderName,
        startupName,
        status,
        message,
      }),
    });
    return;
  }

  console.info("[Founder verification notification]", {
    to: founderEmail,
    founderName,
    startupName,
    status,
    message,
  });
}

"use client";

import * as React from "react";
import { CheckCheck, Loader2, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { sendMessage } from "@/app/actions/messaging";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

type ConversationMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
  };
};

type ConversationRoomProps = {
  conversationId: string;
  conversationStatus: "PENDING" | "ACTIVE" | "CLOSED";
  currentUserId: string;
  title: string;
  description: string;
  messages: ConversationMessage[];
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(toDate(value));
}

function formatDayLabel(value: Date | string) {
  const date = toDate(value);
  const today = new Date();
  const yesterday = new Date();

  today.setHours(0, 0, 0, 0);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  if (current.getTime() === today.getTime()) {
    return "Today";
  }

  if (current.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusTone(status: ConversationRoomProps["conversationStatus"]) {
  switch (status) {
    case "ACTIVE":
      return "border-[color:var(--primary)] bg-[color:var(--surface-strong)] text-[color:var(--primary)]";
    case "PENDING":
      return "border-[color:var(--accent)] bg-[color:var(--surface-strong)] text-[color:var(--accent)]";
    case "CLOSED":
      return "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-foreground)]";
    default:
      return "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-foreground)]";
  }
}

function groupMessages(messages: ConversationMessage[]) {
  const grouped = new Map<string, ConversationMessage[]>();

  for (const message of messages) {
    const date = toDate(message.createdAt);
    const key = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

    const existing = grouped.get(key) ?? [];
    existing.push(message);
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries()).map(([key, items]) => ({
    key,
    label: formatDayLabel(items[0].createdAt),
    messages: items,
  }));
}

export function ConversationRoom({
  conversationId,
  conversationStatus,
  currentUserId,
  title,
  description,
  messages,
}: ConversationRoomProps) {
  const router = useRouter();
  const [draft, setDraft] = React.useState("");
  const [isSending, startTransition] = React.useTransition();
  const endRef = React.useRef<HTMLDivElement | null>(null);

  const canSend = conversationStatus === "ACTIVE";
  const groupedMessages = React.useMemo(() => groupMessages(messages), [messages]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDraft = draft.trim();

    if (!trimmedDraft || !canSend) {
      return;
    }

    startTransition(() => {
      sendMessage(conversationId, trimmedDraft)
        .then(() => {
          setDraft("");
          router.refresh();
        })
        .catch((error) => {
          toast({
            title: "Message not sent",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        });
    });
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    const trimmedDraft = draft.trim();

    if (!trimmedDraft || !canSend || isSending) {
      return;
    }

    startTransition(() => {
      sendMessage(conversationId, trimmedDraft)
        .then(() => {
          setDraft("");
          router.refresh();
        })
        .catch((error) => {
          toast({
            title: "Message not sent",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        });
    });
  }

  return (
    <Card className="overflow-hidden border-[color:var(--border)] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.1),_transparent_38%),linear-gradient(180deg,_rgba(255,248,255,0.98),_rgba(244,239,255,0.98))] shadow-xl">
      <div className="flex h-full min-h-[72vh] flex-col">
        <CardHeader className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardDescription>Encrypted conversation</CardDescription>
                <Badge className={getStatusTone(conversationStatus)}>{conversationStatus}</Badge>
              </div>
              <CardTitle className="text-2xl leading-tight sm:text-3xl">{title}</CardTitle>
              <p className="max-w-2xl text-sm leading-6 text-[color:var(--muted-foreground)]">
                {description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[18rem]">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Thread
                </div>
                <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
                  {messages.length} message{messages.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Safety
                </div>
                <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
                  {canSend ? "Live chat enabled" : "Waiting for approval"}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col px-3 py-4 sm:px-4 sm:py-5">
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2 sm:px-2">
            <div className="space-y-6">
              {groupedMessages.length > 0 ? (
                groupedMessages.map((group) => (
                  <div key={group.key} className="space-y-4">
                    <div className="flex items-center justify-center">
                      <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-medium text-[color:var(--muted-foreground)] shadow-sm">
                        {group.label}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {group.messages.map((message) => {
                        const isCurrentUser = message.senderId === currentUserId;

                        return (
                          <article
                            key={message.id}
                            className={[
                              "flex items-end gap-2",
                              isCurrentUser ? "justify-end" : "justify-start",
                            ].join(" ")}
                          >
                            {!isCurrentUser ? (
                              <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-strong)] text-xs font-semibold text-[color:var(--foreground)]">
                                {message.sender.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>
                            ) : null}

                            <div
                              className={[
                                "max-w-[88%] rounded-[1.35rem] px-4 py-3 shadow-sm sm:max-w-[74%]",
                                isCurrentUser
                                  ? "rounded-br-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                                  : "rounded-bl-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)]",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-medium">
                                  {isCurrentUser ? "You" : message.sender.name}
                                </p>
                                <p
                                  className={[
                                  "text-[11px]",
                                  isCurrentUser
                                      ? "text-[color:var(--primary-foreground)]/80"
                                      : "text-[color:var(--muted-foreground)]",
                                  ].join(" ")}
                                >
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                                {message.content}
                              </p>

                              {isCurrentUser ? (
                                <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-[color:var(--primary-foreground)]/80">
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  <span>Sent</span>
                                </div>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full min-h-[18rem] items-center justify-center rounded-[1.75rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-8 text-center">
                  <div className="max-w-sm space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-strong)] text-[color:var(--primary)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-[color:var(--foreground)]">
                      No messages yet
                    </p>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Once the founder approves the request, the conversation will open
                      like a live chat thread.
                    </p>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <form
            className="sticky bottom-0 z-20 mt-4 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3 shadow-lg backdrop-blur sm:p-4"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-3">
              <label
                className="sr-only text-sm font-medium text-[color:var(--foreground)]"
                htmlFor="conversation-message"
              >
                Write a message
              </label>

              <textarea
                id="conversation-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                disabled={!canSend || isSending}
                rows={3}
                placeholder={
                  canSend
                    ? "Type a message... use Shift + Enter for a new line"
                    : "This conversation is not active yet."
                }
                className="min-h-[84px] w-full resize-none rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--muted-foreground)] focus:border-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[color:var(--muted-foreground)]">
                  {canSend
                    ? "Messages are delivered only after the request is active."
                    : "Read-only until the founder accepts the conversation request."}
                </p>

                <Button
                  type="submit"
                  disabled={!canSend || isSending || !draft.trim()}
                  className="gap-2 rounded-full px-5"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </div>
    </Card>
  );
}

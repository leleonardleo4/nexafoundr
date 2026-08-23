"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { updateProfileSettings } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import type { DashboardSessionUser } from "@/lib/dashboard-session";
import { getDisplayEmail } from "@/lib/utils";

type ProfileSettingsFormProps = {
  user: DashboardSessionUser;
};

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(user.name);
  const [avatarPreview, setAvatarPreview] = React.useState(user.profileImage ?? user.image ?? "");
  const [isPending, startTransition] = React.useTransition();
  const avatarObjectUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }
    };
  }, []);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }

      setAvatarPreview(user.profileImage ?? user.image ?? "");
      return;
    }

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(nextFile);
    avatarObjectUrlRef.current = previewUrl;
    setAvatarPreview(previewUrl);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      updateProfileSettings(formData)
        .then(() => {
          toast({
            title: "Profile updated",
            description: "Your display name and avatar were saved successfully.",
          });
          router.refresh();
        })
        .catch((error) => {
          toast({
            title: "Could not update profile",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        });
    });
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] shadow-sm">
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt={user.name}
              width={96}
              height={96}
              unoptimized
              style={{ height: "auto", width: "100%" }}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-[color:var(--foreground)]">
              {initials}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <label
            htmlFor="avatar"
            className="text-sm font-medium text-[color:var(--foreground)]"
          >
            Avatar
          </label>
          <Input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleAvatarChange}
            className="h-11"
          />
          <p className="text-xs text-[color:var(--muted-foreground)]">
            PNG, JPG, JPEG, or WebP. This image will appear across your dashboard.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-[color:var(--foreground)]">
          Display name
        </label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your display name"
          className="h-11"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
            Email
          </p>
          <p className="mt-2 break-all text-sm font-medium text-[color:var(--foreground)]">
            {getDisplayEmail(user.email)}
          </p>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
            Role
          </p>
          <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
            {user.role.toLowerCase()}
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}

import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error("Usage: npx tsx scripts/promote-admin.ts user@example.com");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error(`No user found with email: ${email}`);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: "ADMIN",
    },
    select: {
      name: true,
      email: true,
      role: true,
    },
  });

  console.log(
    `Promoted ${updatedUser.name} <${updatedUser.email}> from ${user.role} to ${updatedUser.role}.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });

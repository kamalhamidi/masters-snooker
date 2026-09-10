import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "password123";

const accounts: Array<{
  email: string;
  name: string;
  role: Role;
  employeePosition?: string;
  player: {
    bio?: string;
    trustBadge?: boolean;
    points?: number;
    xp?: number;
    level?: number;
  };
}> = [
  {
    email: "chef@masters.club",
    name: "Kamal Masters",
    role: "CHEF",
    employeePosition: "Club Owner",
    player: {
      bio: "Club owner — still plays a mean safety game.",
      trustBadge: true,
      points: 1180,
      xp: 850,
      level: 3,
    },
  },
  {
    email: "sara@masters.club",
    name: "Sara Adel",
    role: "EMPLOYEE",
    employeePosition: "Floor Manager",
    player: {
      bio: "Club staff & player.",
      points: 1020,
      xp: 320,
      level: 2,
    },
  },
  {
    email: "ronnie@demo.club",
    name: "Ronnie Osman",
    role: "PLAYER",
    player: {
      bio: "Club veteran. Highest break: 147 (in my dreams).",
      trustBadge: true,
    },
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const account of accounts) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true },
    });

    if (existing) {
      console.log(`Skipped existing account: ${account.email}`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: account.role,
        player: { create: account.player },
        ...(account.employeePosition
          ? { employee: { create: { position: account.employeePosition } } }
          : {}),
      },
    });
    console.log(`Created demo account: ${account.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

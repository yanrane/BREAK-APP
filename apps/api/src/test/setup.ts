import { execSync } from 'child_process';
import { beforeAll, beforeEach } from 'vitest';
import prisma from '../lib/prisma';

beforeAll(() => {
  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
});

beforeEach(async () => {
  // Clean state before each test — handles cleanup even if previous test failed
  await prisma.refreshToken.deleteMany();
  await prisma.userMission.deleteMany();
  await prisma.usageLog.deleteMany();
  await prisma.gameScore.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
});

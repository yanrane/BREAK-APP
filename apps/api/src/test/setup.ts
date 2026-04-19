import { execSync } from 'child_process';
import { afterEach } from 'vitest';

beforeAll(() => {
  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
});

afterEach(async () => {
  const { default: prisma } = await import('../lib/prisma');
  await prisma.refreshToken.deleteMany();
  await prisma.userMission.deleteMany();
  await prisma.usageLog.deleteMany();
  await prisma.gameScore.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
});

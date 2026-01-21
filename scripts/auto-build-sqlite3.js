/**
 * better-sqlite3 자동 빌드 스크립트
 * 서버 시작 시 또는 postinstall에서 실행
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// better-sqlite3 빌드 파일 확인
const possiblePaths = [
  join(projectRoot, 'node_modules', '.pnpm', 'better-sqlite3@12.6.2', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
  join(projectRoot, 'node_modules', '.pnpm', 'better-sqlite3@12.6.2', 'node_modules', 'better-sqlite3', 'build', 'better_sqlite3.node'),
  join(projectRoot, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
  join(projectRoot, 'node_modules', 'better-sqlite3', 'build', 'better_sqlite3.node'),
];

const isBuilt = possiblePaths.some(path => existsSync(path));

if (isBuilt) {
  console.log('✓ better-sqlite3가 이미 빌드되어 있습니다.');
  process.exit(0);
}

console.log('\n==========================================');
console.log('🔨 better-sqlite3 자동 빌드 시도');
console.log('==========================================\n');

try {
  // pnpm을 사용하는 경우
  console.log('better-sqlite3 빌드 중...');
  
  // 방법 1: pnpm rebuild 시도
  try {
    execSync('pnpm rebuild better-sqlite3', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, PNPM_HOME: process.env.PNPM_HOME || '' }
    });
    console.log('\n✓ better-sqlite3 빌드 완료!');
    process.exit(0);
  } catch (rebuildError) {
    console.warn('\n⚠️  pnpm rebuild 실패, 다른 방법 시도...');
  }

  // 방법 2: npm rebuild 시도 (pnpm이 npm을 사용하는 경우)
  try {
    execSync('npm rebuild better-sqlite3', {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log('\n✓ better-sqlite3 빌드 완료!');
    process.exit(0);
  } catch (npmError) {
    console.warn('\n⚠️  npm rebuild 실패...');
  }

  // 방법 3: node-gyp 직접 호출
  const betterSqlite3Path = join(
    projectRoot,
    'node_modules',
    '.pnpm',
    'better-sqlite3@12.6.2',
    'node_modules',
    'better-sqlite3'
  );

  if (existsSync(join(betterSqlite3Path, 'binding.gyp'))) {
    try {
      console.log('node-gyp로 직접 빌드 시도...');
      execSync('node-gyp rebuild', {
        cwd: betterSqlite3Path,
        stdio: 'inherit'
      });
      console.log('\n✓ better-sqlite3 빌드 완료!');
      process.exit(0);
    } catch (gypError) {
      console.warn('\n⚠️  node-gyp 빌드 실패...');
    }
  }

  // 모든 방법 실패
  console.error('\n❌ 자동 빌드에 실패했습니다.');
  console.error('\n수동 빌드 방법:');
  console.error('1. pnpm approve-builds better-sqlite3');
  console.error('   (대화형 메뉴에서 better-sqlite3 선택 후 Enter)');
  console.error('2. pnpm install better-sqlite3 --force');
  console.error('\n또는 Visual Studio Build Tools가 필요할 수 있습니다.');
  console.error('==========================================\n');
  process.exit(1);

} catch (error) {
  console.error('\n❌ 빌드 중 오류 발생:', error.message);
  console.error('\n수동 빌드 방법:');
  console.error('1. pnpm approve-builds better-sqlite3');
  console.error('2. pnpm install better-sqlite3 --force');
  process.exit(1);
}

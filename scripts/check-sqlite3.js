/**
 * better-sqlite3 빌드 확인 및 안내 스크립트
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

if (!isBuilt) {
  console.log('\n==========================================');
  console.log('⚠️  better-sqlite3가 빌드되지 않았습니다!');
  console.log('==========================================\n');
  console.log('해결 방법:\n');
  console.log('1. 터미널에서 다음 명령어 실행:');
  console.log('   pnpm approve-builds better-sqlite3');
  console.log('   (대화형 메뉴에서 better-sqlite3 선택 후 Enter)\n');
  console.log('2. 그 다음:');
  console.log('   pnpm install better-sqlite3 --force\n');
  console.log('3. Visual Studio Build Tools가 필요할 수 있습니다.');
  console.log('   https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022');
  console.log('   (설치 시 "Desktop development with C++" 워크로드 선택)\n');
  console.log('==========================================\n');
  process.exit(1);
} else {
  console.log('✓ better-sqlite3가 정상적으로 빌드되어 있습니다.');
}

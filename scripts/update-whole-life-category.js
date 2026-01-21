/**
 * Whole Life 샘플의 카테고리를 "종신보험"으로 업데이트하는 스크립트
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'database', 'samples.db');

try {
  const db = new Database(dbPath);
  
  // Whole Life 샘플 찾기
  const wholeLifeSample = db
    .prepare('SELECT id, name, filename, category FROM samples WHERE name = ? OR filename LIKE ?')
    .get('Whole Life', '%Whole Life%');
  
  if (!wholeLifeSample) {
    console.log('❌ Whole Life 샘플을 찾을 수 없습니다.');
    console.log('현재 DB에 있는 샘플 목록:');
    const allSamples = db.prepare('SELECT id, name, filename, category FROM samples').all();
    allSamples.forEach(s => {
      console.log(`  - ID: ${s.id}, Name: ${s.name}, Filename: ${s.filename}, Category: ${s.category || '(없음)'}`);
    });
    process.exit(1);
  }
  
  console.log('✓ Whole Life 샘플을 찾았습니다:');
  console.log(`  - ID: ${wholeLifeSample.id}`);
  console.log(`  - Name: ${wholeLifeSample.name}`);
  console.log(`  - Filename: ${wholeLifeSample.filename}`);
  console.log(`  - Current Category: ${wholeLifeSample.category || '(없음)'}`);
  
  // 카테고리를 "종신보험"으로 업데이트
  const updateResult = db
    .prepare('UPDATE samples SET category = ? WHERE id = ?')
    .run('종신보험', wholeLifeSample.id);
  
  if (updateResult.changes > 0) {
    console.log('\n✓ 카테고리가 "종신보험"으로 업데이트되었습니다!');
    
    // 업데이트 확인
    const updated = db
      .prepare('SELECT id, name, filename, category FROM samples WHERE id = ?')
      .get(wholeLifeSample.id);
    
    console.log('\n업데이트된 정보:');
    console.log(`  - ID: ${updated.id}`);
    console.log(`  - Name: ${updated.name}`);
    console.log(`  - Filename: ${updated.filename}`);
    console.log(`  - Category: ${updated.category}`);
  } else {
    console.log('\n⚠️  업데이트된 행이 없습니다.');
  }
  
  db.close();
  process.exit(0);
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error('\n해결 방법:');
  console.error('1. better-sqlite3가 제대로 빌드되었는지 확인하세요.');
  console.error('2. 데이터베이스 파일이 존재하는지 확인하세요:', dbPath);
  console.error('3. 서버가 실행 중이면 서버를 중지하고 다시 시도하세요.');
  process.exit(1);
}

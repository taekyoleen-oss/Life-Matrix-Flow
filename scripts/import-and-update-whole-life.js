/**
 * Whole Life.lifx 파일을 DB에 import하고 카테고리를 "종신보험"으로 설정하는 스크립트
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'database', 'samples.db');
const sampleFilePath = path.join(projectRoot, 'samples', 'Whole Life.lifx');

try {
  // DB 연결
  const db = new Database(dbPath);
  
  // 샘플 파일 읽기
  if (!fs.existsSync(sampleFilePath)) {
    console.error(`❌ 샘플 파일을 찾을 수 없습니다: ${sampleFilePath}`);
    process.exit(1);
  }
  
  const fileContent = JSON.parse(fs.readFileSync(sampleFilePath, 'utf8'));
  const filename = 'Whole Life.lifx';
  const name = fileContent.name || fileContent.productName || 'Whole Life';
  const category = fileContent.category || '종신보험';
  
  console.log('✓ 샘플 파일을 읽었습니다:');
  console.log(`  - Filename: ${filename}`);
  console.log(`  - Name: ${name}`);
  console.log(`  - Category: ${category}`);
  
  // 기존 샘플 확인
  const existing = db
    .prepare('SELECT id, name, filename, category FROM samples WHERE filename = ? OR name = ?')
    .get(filename, name);
  
  if (existing) {
    console.log('\n✓ 기존 샘플을 찾았습니다:');
    console.log(`  - ID: ${existing.id}`);
    console.log(`  - Name: ${existing.name}`);
    console.log(`  - Filename: ${existing.filename}`);
    console.log(`  - Current Category: ${existing.category || '(없음)'}`);
    
    // 카테고리 업데이트
    const updateResult = db
      .prepare('UPDATE samples SET category = ?, file_content = ? WHERE id = ?')
      .run('종신보험', JSON.stringify(fileContent), existing.id);
    
    if (updateResult.changes > 0) {
      console.log('\n✓ 카테고리가 "종신보험"으로 업데이트되었습니다!');
      
      // 업데이트 확인
      const updated = db
        .prepare('SELECT id, name, filename, category FROM samples WHERE id = ?')
        .get(existing.id);
      
      console.log('\n업데이트된 정보:');
      console.log(`  - ID: ${updated.id}`);
      console.log(`  - Name: ${updated.name}`);
      console.log(`  - Filename: ${updated.filename}`);
      console.log(`  - Category: ${updated.category}`);
    } else {
      console.log('\n⚠️  업데이트된 행이 없습니다.');
    }
  } else {
    console.log('\n새 샘플을 DB에 추가합니다...');
    
    // 새 샘플 추가
    const result = db
      .prepare(`
        INSERT INTO samples (filename, name, input_data, description, category, file_content)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        filename,
        name,
        '',
        '',
        '종신보험',
        JSON.stringify(fileContent)
      );
    
    console.log(`\n✓ 샘플이 DB에 추가되었습니다! (ID: ${result.lastInsertRowid})`);
    
    // 추가 확인
    const added = db
      .prepare('SELECT id, name, filename, category FROM samples WHERE id = ?')
      .get(result.lastInsertRowid);
    
    console.log('\n추가된 정보:');
    console.log(`  - ID: ${added.id}`);
    console.log(`  - Name: ${added.name}`);
    console.log(`  - Filename: ${added.filename}`);
    console.log(`  - Category: ${added.category}`);
  }
  
  db.close();
  console.log('\n✓ 완료되었습니다!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error('\n해결 방법:');
  console.error('1. better-sqlite3가 제대로 빌드되었는지 확인하세요.');
  console.error('2. 데이터베이스 파일이 존재하는지 확인하세요:', dbPath);
  console.error('3. 서버가 실행 중이면 서버를 중지하고 다시 시도하세요.');
  console.error('4. 샘플 파일이 존재하는지 확인하세요:', sampleFilePath);
  process.exit(1);
}

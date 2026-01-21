/**
 * SQLite 데이터베이스 초기화 및 관리 모듈
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// better-sqlite3 로드 시도
let Database;
let db = null;
let dbAvailable = false;

// 빌드 파일 확인 함수
function checkBuildFile(projectRoot) {
  const possiblePaths = [
    path.join(projectRoot, 'node_modules', '.pnpm', 'better-sqlite3@12.6.2', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
    path.join(projectRoot, 'node_modules', '.pnpm', 'better-sqlite3@12.6.2', 'node_modules', 'better-sqlite3', 'build', 'better_sqlite3.node'),
    path.join(projectRoot, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
    path.join(projectRoot, 'node_modules', 'better-sqlite3', 'build', 'better_sqlite3.node'),
  ];
  return possiblePaths.some(p => fs.existsSync(p));
}

// 자동 빌드 시도 함수
function tryAutoBuild(projectRoot) {
  try {
    console.log('🔨 better-sqlite3 자동 빌드 시도 중...');
    
    // pnpm rebuild 시도
    try {
      execSync('pnpm rebuild better-sqlite3', {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 60000 // 60초 타임아웃
      });
      if (checkBuildFile(projectRoot)) {
        console.log('✓ better-sqlite3 자동 빌드 성공!');
        return true;
      }
    } catch (e) {
      // 무시하고 다음 방법 시도
    }

    // npm rebuild 시도
    try {
      execSync('npm rebuild better-sqlite3', {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 60000
      });
      if (checkBuildFile(projectRoot)) {
        console.log('✓ better-sqlite3 자동 빌드 성공!');
        return true;
      }
    } catch (e) {
      // 무시
    }

    return false;
  } catch (error) {
    return false;
  }
}

try {
  Database = (await import("better-sqlite3")).default;
  dbAvailable = true;
} catch (importError) {
  console.warn("==========================================");
  console.warn("⚠️  better-sqlite3 모듈을 로드할 수 없습니다!");
  console.warn("==========================================");
  console.warn("오류:", importError.message);
  console.warn("");
  
  // 자동 빌드 시도
  const projectRoot = path.join(__dirname, "..", "..");
  if (!checkBuildFile(projectRoot)) {
    console.warn("자동 빌드를 시도합니다...");
    const buildSuccess = tryAutoBuild(projectRoot);
    
    if (buildSuccess) {
      // 빌드 성공 시 다시 import 시도
      try {
        Database = (await import("better-sqlite3")).default;
        dbAvailable = true;
        console.log("✓ better-sqlite3 로드 성공!");
      } catch (retryError) {
        console.warn("빌드 후에도 로드 실패:", retryError.message);
        dbAvailable = false;
      }
    } else {
      console.warn("자동 빌드 실패. 수동 빌드가 필요합니다.");
      console.warn("해결 방법:");
      console.warn("1. 터미널에서 실행: pnpm approve-builds better-sqlite3");
      console.warn("   (대화형 메뉴에서 better-sqlite3 선택 후 Enter)");
      console.warn("");
      console.warn("2. 그 다음: pnpm install better-sqlite3 --force");
      console.warn("");
      console.warn("3. Visual Studio Build Tools가 필요할 수 있습니다.");
      dbAvailable = false;
    }
  } else {
    console.warn("빌드 파일은 존재하지만 로드에 실패했습니다.");
    dbAvailable = false;
  }
  
  if (!dbAvailable) {
    console.warn("==========================================");
    console.warn("⚠️  DB 기능이 비활성화됩니다. Samples는 samples.json에서만 로드됩니다.");
  }
}

// 데이터베이스 디렉토리 생성
const dbDir = path.join(__dirname, "..", "..", "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "samples.db");

if (dbAvailable && Database) {
  try {
    db = new Database(dbPath);
    
    // WAL 모드 활성화 (성능 향상)
    db.pragma("journal_mode = WAL");

    // 테이블 생성
    db.exec(`
      CREATE TABLE IF NOT EXISTS samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        input_data TEXT,
        description TEXT,
        category TEXT,
        file_content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_samples_name ON samples(name);
      CREATE INDEX IF NOT EXISTS idx_samples_filename ON samples(filename);
      CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples(created_at);
    `);

    // category 컬럼이 없으면 추가 (기존 DB 마이그레이션)
    try {
      // 컬럼 존재 여부 확인
      const tableInfo = db.prepare(`PRAGMA table_info(samples)`).all();
      const hasCategory = tableInfo.some((col) => col.name === "category");

      if (!hasCategory) {
        db.exec(`ALTER TABLE samples ADD COLUMN category TEXT DEFAULT '기타'`);
        // 기존 샘플들의 category를 '기타'로 업데이트
        db.exec(`UPDATE samples SET category = '기타' WHERE category IS NULL`);
        // 인덱스 생성
        db.exec(
          `CREATE INDEX IF NOT EXISTS idx_samples_category ON samples(category)`
        );
        console.log("Category column added to existing database");
      } else {
        // 카테고리 컬럼이 이미 존재하는 경우, NULL이거나 빈 문자열인 샘플들을 업데이트
        const updateResult = db
          .prepare(
            `UPDATE samples SET category = '기타' WHERE category IS NULL OR category = ''`
          )
          .run();
        if (updateResult.changes > 0) {
          console.log(
            `Updated ${updateResult.changes} samples with default category '기타'`
          );
        }
      }
    } catch (error) {
      console.warn("Error checking/adding category column:", error.message);
    }

    // updated_at 자동 업데이트 트리거
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_samples_timestamp 
      AFTER UPDATE ON samples
      BEGIN
        UPDATE samples SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    console.log(`✓ Database initialized at: ${dbPath}`);
  } catch (error) {
    console.error("==========================================");
    console.error("데이터베이스 초기화 실패!");
    console.error("==========================================");
    console.error("오류:", error.message);
    console.error("경로:", dbPath);
    console.error("");
    
    // bindings 파일 관련 에러인 경우 자동 빌드 시도
    if (error.message && error.message.includes("bindings")) {
      console.error("better-sqlite3 모듈이 빌드되지 않았습니다!");
      console.error("");
      console.error("자동 빌드를 시도합니다...");
      
      const projectRoot = path.join(__dirname, "..", "..");
      if (!checkBuildFile(projectRoot)) {
        const buildSuccess = tryAutoBuild(projectRoot);
        
        if (buildSuccess) {
          // 빌드 성공 시 다시 시도
          try {
            db = new Database(dbPath);
            db.pragma("journal_mode = WAL");
            
            // 테이블 생성
            db.exec(`
              CREATE TABLE IF NOT EXISTS samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                input_data TEXT,
                description TEXT,
                category TEXT,
                file_content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );

              CREATE INDEX IF NOT EXISTS idx_samples_name ON samples(name);
              CREATE INDEX IF NOT EXISTS idx_samples_filename ON samples(filename);
              CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples(created_at);
            `);

            // category 컬럼 마이그레이션
            try {
              const tableInfo = db.prepare(`PRAGMA table_info(samples)`).all();
              const hasCategory = tableInfo.some((col) => col.name === "category");

              if (!hasCategory) {
                db.exec(`ALTER TABLE samples ADD COLUMN category TEXT DEFAULT '기타'`);
                db.exec(`UPDATE samples SET category = '기타' WHERE category IS NULL`);
                db.exec(`CREATE INDEX IF NOT EXISTS idx_samples_category ON samples(category)`);
                console.log("Category column added to existing database");
              } else {
                const updateResult = db
                  .prepare(`UPDATE samples SET category = '기타' WHERE category IS NULL OR category = ''`)
                  .run();
                if (updateResult.changes > 0) {
                  console.log(`Updated ${updateResult.changes} samples with default category '기타'`);
                }
              }
            } catch (migError) {
              console.warn("Error checking/adding category column:", migError.message);
            }

            // updated_at 트리거
            db.exec(`
              CREATE TRIGGER IF NOT EXISTS update_samples_timestamp 
              AFTER UPDATE ON samples
              BEGIN
                UPDATE samples SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
              END;
            `);

            console.log(`✓ Database initialized at: ${dbPath}`);
            dbAvailable = true;
            // 성공했으므로 계속 진행
          } catch (retryError) {
            console.error("자동 빌드 후에도 초기화 실패:", retryError.message);
            db = null;
            dbAvailable = false;
          }
        } else {
          console.error("자동 빌드 실패. 수동 빌드가 필요합니다.");
          console.error("해결 방법:");
          console.error("1. 터미널에서 실행: pnpm approve-builds better-sqlite3");
          console.error("   (대화형 메뉴에서 better-sqlite3 선택 후 Enter)");
          console.error("");
          console.error("2. 그 다음: pnpm install better-sqlite3 --force");
          console.error("");
          console.error("3. Visual Studio Build Tools가 필요할 수 있습니다.");
          db = null;
          dbAvailable = false;
        }
      } else {
        console.error("빌드 파일은 존재하지만 초기화에 실패했습니다.");
        db = null;
        dbAvailable = false;
      }
    } else {
      // 다른 종류의 에러
      db = null;
      dbAvailable = false;
    }
    
    if (!dbAvailable) {
      console.error("==========================================");
      console.warn("⚠️  DB 기능이 비활성화됩니다. Samples는 samples.json에서만 로드됩니다.");
    }
  }
}

// DB가 없으면 더미 객체 생성
if (!db) {
  db = {
    prepare: (query) => ({
      all: () => [],
      get: () => null,
      run: (...args) => ({ lastInsertRowid: 0, changes: 0 }),
    }),
    exec: () => {},
  };
}

export default db;
export { dbAvailable };

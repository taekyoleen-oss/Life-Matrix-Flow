/**
 * Whole Life.lifx 파일 수정 스크립트
 * - 카테고리를 "종신보험"으로 설정
 * - 연결 구조 검증 및 수정
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const filePath = path.join(projectRoot, 'samples', 'Whole Life.lifx');

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 카테고리 설정
data.category = '종신보험';
data.productName = 'Whole Life';
data.name = 'Whole Life';

// 연결 검증 및 정리
const moduleMap = new Map(data.modules.map(m => [m.id, m]));
const validConnections = [];

data.connections.forEach(c => {
  const fromMod = moduleMap.get(c.from.moduleId);
  const toMod = moduleMap.get(c.to.moduleId);
  
  if (!fromMod || !toMod) {
    console.warn(`Skipping connection ${c.id}: module not found`);
    return;
  }
  
  const fromPort = fromMod.outputs?.find(o => o.name === c.from.portName);
  const toPort = toMod.inputs?.find(i => i.name === c.to.portName);
  
  if (!fromPort || !toPort) {
    console.warn(`Skipping connection ${c.id}: port not found`);
    return;
  }
  
  validConnections.push(c);
});

data.connections = validConnections;

// 파일 저장
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('✓ Whole Life.lifx 파일 수정 완료');
console.log(`  - Modules: ${data.modules.length}`);
console.log(`  - Valid Connections: ${data.connections.length}`);
console.log(`  - Category: ${data.category}`);
console.log(`  - Product Name: ${data.productName}`);

// 연결 체인 확인
const chain = [
  'load-1',
  'select-rates-1',
  'select-data-1',
  'rate-modifier-1',
  'survivors-1',
  'claims-1',
  'nx-mx-calculator-1',
  'premium-component-1',
  'additional-name-1',
  'net-premium-calculator-1',
  'gross-premium-calculator-1',
  'reserve-calculator-1'
];

console.log('\n연결 체인 확인:');
let allConnected = true;
for (let i = 0; i < chain.length - 1; i++) {
  const fromId = chain[i];
  const toId = chain[i + 1];
  const conn = data.connections.find(
    c => c.from.moduleId === fromId && c.to.moduleId === toId
  );
  const status = conn ? '✓' : '✗';
  console.log(`  ${status} ${fromId} -> ${toId}`);
  if (!conn) allConnected = false;
}

if (allConnected) {
  console.log('\n✓ 모든 주요 모듈이 올바르게 연결되어 있습니다!');
} else {
  console.log('\n⚠️  일부 연결이 누락되었습니다.');
}

# 지급준비금 산출 모듈 설계 문서

## 개요

지급준비금(Claims Reserve) 산출을 위한 모듈 설계입니다. 입력 데이터는 사고일자, 보험금지급일자, 보험금, 최종 준비금을 포함합니다.

## 입력 데이터 구조

```
- 사고일자 (Accident Date)
- 보험금지급일자 (Payment Date)  
- 보험금 (Claim Amount)
- 최종 준비금 (Ultimate Reserve)
```

## 필요한 모듈 및 과정

### 1. 데이터 준비 모듈

#### 1.1 LoadClaimsData (손해 데이터 로드)
- **기능**: 사고일자, 지급일자, 보험금, 최종 준비금 데이터를 CSV 파일에서 로드
- **입력**: CSV 파일
- **출력**: 원시 손해 데이터 (DataPreview)
- **필수 컬럼**: AccidentDate, PaymentDate, ClaimAmount, UltimateReserve

#### 1.2 PrepareTriangularData (삼각형 데이터 준비)
- **기능**: 손해 데이터를 사고년도(Accident Year) × 발전년도(Development Year) 삼각형 형태로 변환
- **입력**: LoadClaimsData 출력
- **출력**: 삼각형 데이터 (TriangularData)
- **처리 내용**:
  - 사고년도 추출 (AccidentDate에서)
  - 발전년도 계산 (PaymentDate - AccidentDate)
  - 누적 손해(Cumulative Loss) 또는 증분 손해(Incremental Loss) 계산
  - 삼각형 매트릭스 생성

#### 1.3 CalculateDevelopmentFactors (발전계수 계산)
- **기능**: 손해발전계수(Loss Development Factors, LDF) 계산
- **입력**: PrepareTriangularData 출력
- **출력**: 발전계수 데이터 (DevelopmentFactors)
- **계산 방법**:
  - Chain Ladder: 각 발전년도의 평균 비율
  - Weighted Average: 가중평균 방법
  - Regression: 회귀분석 방법

---

### 2. CLM (Chain Ladder Method) 모듈

#### 2.1 CLMCalculator (체인래더법 계산)
- **기능**: Chain Ladder Method를 사용하여 지급준비금 계산
- **입력**: 
  - PrepareTriangularData 출력
  - CalculateDevelopmentFactors 출력
- **출력**: CLM 결과 (CLMResult)
- **계산 과정**:
  1. 발전계수(LDF) 계산
  2. 최종 손해(Ultimate Loss) 예측
  3. 지급준비금 = 최종 손해 - 지급된 손해
- **파라미터**:
  - 발전계수 계산 방법 (평균, 가중평균, 회귀)
  - 최종 발전계수 선택 방법

#### 2.2 CLMResultDisplay (CLM 결과 표시)
- **기능**: CLM 계산 결과를 삼각형 형태로 표시
- **입력**: CLMCalculator 출력
- **출력**: 결과 테이블 (DataPreview)

---

### 3. ILDM (Incremental Loss Development Method) 모듈

#### 3.1 ILDMCalculator (증분손실발전법 계산)
- **기능**: Incremental Loss Development Method를 사용하여 지급준비금 계산
- **입력**: PrepareTriangularData 출력 (증분 손해 데이터)
- **출력**: ILDM 결과 (ILDMResult)
- **계산 과정**:
  1. 증분 손해(Incremental Loss) 데이터 준비
  2. 증분 손해 발전 패턴 분석
  3. 미래 증분 손해 예측
  4. 지급준비금 = 예측된 미래 증분 손해 합계
- **차이점**: CLM은 누적 손해를 사용하지만, ILDM은 증분 손해를 직접 사용

---

### 4. PLDM (Paid Loss Development Method) 모듈

#### 4.1 PLDMCalculator (지급손실발전법 계산)
- **기능**: Paid Loss Development Method를 사용하여 지급준비금 계산
- **입력**: PrepareTriangularData 출력 (지급 손해 데이터)
- **출력**: PLDM 결과 (PLDMResult)
- **계산 과정**:
  1. 지급 손해(Paid Loss) 데이터 준비
  2. 지급 손해 발전 패턴 분석
  3. 미래 지급 손해 예측
  4. 지급준비금 = 예측된 미래 지급 손해 합계
- **특징**: 실제 지급된 금액만을 기준으로 계산

---

### 5. B-F 방법 (Bornhuetter-Ferguson Method) 모듈

#### 5.1 BFCalculator (Bornhuetter-Ferguson 계산)
- **기능**: Bornhuetter-Ferguson Method를 사용하여 지급준비금 계산
- **입력**: 
  - PrepareTriangularData 출력
  - CalculateDevelopmentFactors 출력
  - 사전 예상 손해율(A Priori Loss Ratio) 또는 사전 예상 손해(A Priori Loss)
- **출력**: BF 결과 (BFResult)
- **계산 과정**:
  1. Chain Ladder로 최종 손해 예측 (CL)
  2. 사전 예상 손해율 × 보험료 = 사전 예상 손해 (AP)
  3. BF 최종 손해 = Z × CL + (1-Z) × AP
     - Z = 지급률 (Paid Ratio) 또는 신뢰도 가중치
  4. 지급준비금 = BF 최종 손해 - 지급된 손해
- **파라미터**:
  - 사전 예상 손해율 또는 사전 예상 손해
  - 신뢰도 가중치(Z) 계산 방법

---

### 6. Mack Method 모듈

#### 6.1 MackMethodCalculator (Mack 방법 계산)
- **기능**: Mack Method를 사용하여 지급준비금과 예측 오차 계산
- **입력**: 
  - PrepareTriangularData 출력
  - CalculateDevelopmentFactors 출력
- **출력**: Mack 결과 (MackResult)
- **계산 과정**:
  1. Chain Ladder 방법으로 최종 손해 예측
  2. Mack 공식을 사용하여 예측 오차(Mean Square Error) 계산
  3. 표준 오차(Standard Error) 및 신뢰구간 계산
  4. 지급준비금 = Chain Ladder 지급준비금
  5. 예측 오차 = Mack 공식에 의한 MSE
- **특징**: 
  - 통계적 신뢰구간 제공
  - 예측 오차의 정량적 측정

#### 6.2 MackResultDisplay (Mack 결과 표시)
- **기능**: Mack Method 결과를 신뢰구간과 함께 표시
- **입력**: MackMethodCalculator 출력
- **출력**: 결과 테이블 (DataPreview)

---

### 7. 몬테카를로 방법 (Monte Carlo Method) 모듈

#### 7.1 MonteCarloSimulation (몬테카를로 시뮬레이션)
- **기능**: 몬테카를로 시뮬레이션을 사용하여 지급준비금 분포 예측
- **입력**: 
  - PrepareTriangularData 출력
  - 발전계수 분포 파라미터
- **출력**: 몬테카를로 결과 (MonteCarloResult)
- **계산 과정**:
  1. 발전계수의 확률 분포 추정 (정규분포, 로그정규분포 등)
  2. N회 시뮬레이션 실행 (기본 10,000회)
  3. 각 시뮬레이션에서 Chain Ladder 계산
  4. 지급준비금 분포 생성
  5. 통계량 계산 (평균, 중앙값, 표준편차, 분위수)
- **파라미터**:
  - 시뮬레이션 횟수
  - 발전계수 분포 타입
  - 분포 파라미터

#### 7.2 MonteCarloResultDisplay (몬테카를로 결과 표시)
- **기능**: 몬테카를로 시뮬레이션 결과를 히스토그램과 통계량으로 표시
- **입력**: MonteCarloSimulation 출력
- **출력**: 결과 차트 및 통계 (DataPreview)

---

## 모듈 연결 흐름

```
LoadClaimsData
    ↓
PrepareTriangularData
    ↓
    ├─→ CalculateDevelopmentFactors
    │       ↓
    │   CLMCalculator ─→ CLMResultDisplay
    │       ↓
    │   BFCalculator ─→ BFResultDisplay
    │       ↓
    │   MackMethodCalculator ─→ MackResultDisplay
    │
    ├─→ ILDMCalculator ─→ ILDMResultDisplay
    │
    ├─→ PLDMCalculator ─→ PLDMResultDisplay
    │
    └─→ MonteCarloSimulation ─→ MonteCarloResultDisplay
```

## 추가 고려사항

### 데이터 검증 모듈
- **ValidateClaimsData**: 입력 데이터의 유효성 검증
  - 사고일자 < 지급일자 확인
  - 음수 보험금 확인
  - 필수 컬럼 존재 확인

### 결과 비교 모듈
- **CompareReserveMethods**: 여러 방법의 결과를 비교
  - 각 방법의 지급준비금 비교
  - 차이 분석
  - 통계적 비교

### 보고서 생성 모듈
- **GenerateReserveReport**: 지급준비금 산출 보고서 생성
  - 각 방법별 결과 요약
  - 삼각형 데이터 표시
  - 통계량 및 차트 포함

## 데이터 타입 정의

```typescript
interface TriangularData {
  type: "TriangularData";
  accidentYears: number[];
  developmentYears: number[];
  cumulativeLoss: number[][];  // 누적 손해
  incrementalLoss: number[][];  // 증분 손해
  paidLoss: number[][];         // 지급 손해
}

interface DevelopmentFactors {
  type: "DevelopmentFactors";
  factors: number[];  // 각 발전년도의 발전계수
  method: "average" | "weighted" | "regression";
}

interface CLMResult {
  type: "CLMResult";
  ultimateLoss: number[][];
  reserve: number[];
  totalReserve: number;
}

interface BFResult {
  type: "BFResult";
  ultimateLoss: number[][];
  reserve: number[];
  totalReserve: number;
  aPrioriLoss: number[];
  credibility: number[];
}

interface MackResult {
  type: "MackResult";
  ultimateLoss: number[][];
  reserve: number[];
  totalReserve: number;
  standardError: number[];
  confidenceInterval: { lower: number; upper: number }[];
}

interface MonteCarloResult {
  type: "MonteCarloResult";
  reserveDistribution: number[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    percentiles: { [key: number]: number };  // 5%, 25%, 75%, 95% 등
  };
}
```

## 구현 우선순위

1. **1단계**: 기본 데이터 준비 모듈
   - LoadClaimsData
   - PrepareTriangularData
   - CalculateDevelopmentFactors

2. **2단계**: 기본 방법 구현
   - CLMCalculator
   - ILDMCalculator
   - PLDMCalculator

3. **3단계**: 고급 방법 구현
   - BFCalculator
   - MackMethodCalculator

4. **4단계**: 시뮬레이션 방법
   - MonteCarloSimulation

5. **5단계**: 결과 비교 및 보고서
   - CompareReserveMethods
   - GenerateReserveReport



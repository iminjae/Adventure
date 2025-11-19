// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title GameCore
 * @notice 출석/조각구매/합성/탐험/업그레이드를 모두 관리하는 게임 로직 컨트랙트(A안).
 * @dev    - 자산 컨트랙트(ATT, FRG, ADV)와 분리되어 있음.
 *         - 보상(ATT 민팅), 조각(민트/소각), NFT(민트/소각/잠금)을 이 컨트랙트가 트리거한다.
 *         - RNG는 블록 엔트로피 + 호출자 + 내부 nonce 기반 의사난수(포트폴리오/개발망용).
 */

import "@openzeppelin/contracts@4.9.6/access/AccessControl.sol";
import "@openzeppelin/contracts@4.9.6/security/Pausable.sol";
import "@openzeppelin/contracts@4.9.6/security/ReentrancyGuard.sol";

import "./AttendToken.sol";
import "./Fragment1155.sol";
import "./AdventureNFT.sol";

contract GameCore is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN = DEFAULT_ADMIN_ROLE;

    // 외부 자산
    AttendToken  public immutable ATT;   // ERC20 보상 토큰
    Fragment1155 public immutable FRG;   // ERC1155 조각
    AdventureNFT public immutable ADV;   // ERC721 등급 NFT

    // 구매 대금이 들어갈 트레저리
    address public treasury;

    // 기능별 on/off 토글 (운영 중 필요시 특정 기능만 잠시 중단 가능)
    bool public featDaily = true;
    bool public featBuyFragments = true;
    bool public featCraftFromFragments = true;
    bool public featExpedition = true;
    bool public featUpgrade = true;

    /* ---------------- 출석 파라미터 ---------------- */

    // 한국시간 기준(UTC+9)
    uint256 private constant KST_OFFSET = 9 hours;
    // 출석 보상량(ATT, 18dec)
    uint256 public dailyAmount = 10 ether;
    // 마지막 수령일(KST dayIndex)
    mapping(address => uint64) public lastClaimDay;

    /* ---------------- 조각/합성 파라미터 ---------------- */

    uint256 public constant FRAGMENT_ID = 1; // A안에선 조각 ID를 1로 고정
    uint256 public fragmentPriceATT = 5 ether;          // 조각 1개 가격(ATT)
    uint256 public fragmentsToCraft = 5;                // 합성 시 소모할 조각 수
    uint16  public craftSuccessBps = 6000;              // 합성 성공확률 60% (10000=100%)

    /* ---------------- 탐험 파라미터 ---------------- */

    struct ExpeditionConf {
        uint32 secondsNeeded;     // 소요 시간(초)
        uint32 rewardMin;         // 보상 ATT 최소 (정수, 1e18 곱해 지급)
        uint32 rewardMax;         // 보상 ATT 최대
        uint16 fragmentDropBps;   // 조각 드랍 확률 (10000=100%)
    }
    mapping(uint8 => ExpeditionConf) public expeditionOf; // grade => 설정

    struct ExpeditionState {
        bool   active;        // 탐험 중 여부
        uint32 endTime;       // 종료 타임스탬프
        uint8  gradeAtStart;  // 시작 당시 등급(탐험 중 등급 변경과 독립)
        address owner;        // 시작한 주인(소유자)
    }
    mapping(uint256 => ExpeditionState) public expd; // tokenId => 상태

    /* ---------------- 업그레이드 파라미터 ---------------- */

    // 동일 등급 N장 → 상위 등급 도전
    mapping(uint8 => uint8)  public upgradeNeedCount;   // grade => 필요 수량
    mapping(uint8 => uint16) public upgradeSuccessBps;  // grade => 성공확률bps

    /* ---------------- 의사난수 ---------------- */

    uint256 private _randNonce; // 호출별 nonce

    /* ---------------- 프로모(면접자 코드) ---------------- */

    // 켜고/끄기 (운영)
    bool public featPromo = true;

    // 코드 검증: keccak256(bytes(code)) == promoCodeHash 일치해야 지급
    bytes32 private promoCodeHash;

    // 지급 금액(기본: 50 ATT). 18 decimals 기준
    uint256 public promoRewardATT = 50 ether;

    /* ---------------- 이벤트 ---------------- */

    event TreasurySet(address treasury);
    event FeatureToggles(bool daily, bool buy, bool craft, bool exp, bool upg);

    event DailyClaim(address indexed user, uint256 amount, uint64 dayIndex);
    event FragmentsBought(address indexed user, uint256 count, uint256 paidATT);
    event CraftAttempt(address indexed user, bool success, uint8 mintedGrade);
    event ExpeditionStarted(address indexed user, uint256 indexed tokenId, uint32 endTime, uint8 grade);
    event ExpeditionClaimed(address indexed user, uint256 indexed tokenId, uint256 attReward, bool fragDrop);
    event UpgradeAttempt(address indexed user, uint8 fromGrade, bool success, uint8 newGrade);
    event PromoConfigSet(bytes32 codeHash, uint256 rewardATT, bool enabled);
    event PromoRedeemed(address indexed user, uint256 amountATT);

    /* ---------------- 생성자 ---------------- */

    constructor(address att, address frg, address adv, address _treasury) {
        _grantRole(ADMIN, msg.sender);
        ATT = AttendToken(att);
        FRG = Fragment1155(frg);
        ADV = AdventureNFT(adv);
        treasury = _treasury;

        // 기본 탐험 설정(등급: 시간/보상범위/드랍확률)
        expeditionOf[1] = ExpeditionConf(30 minutes, 1, 3, 300);   // 3%
        expeditionOf[2] = ExpeditionConf(60 minutes, 3, 6, 500);   // 5%
        expeditionOf[3] = ExpeditionConf(120 minutes, 6, 12, 700); // 7%
        expeditionOf[4] = ExpeditionConf(180 minutes, 12, 24, 900);// 9%

        // 업그레이드(동일 등급 N장 → 상위)
        upgradeNeedCount[1] = 3; upgradeSuccessBps[1] = 4500; // 45%
        upgradeNeedCount[2] = 3; upgradeSuccessBps[2] = 3500; // 35%
        upgradeNeedCount[3] = 3; upgradeSuccessBps[3] = 2500; // 25%
    }

    /* ---------------- Admin ---------------- */

    function setTreasury(address t) external onlyRole(ADMIN) {
        treasury = t;
        emit TreasurySet(t);
    }

    function setFeatureToggles(
        bool _daily, bool _buy, bool _craft, bool _exp, bool _up
    ) external onlyRole(ADMIN) {
        featDaily = _daily; featBuyFragments = _buy; featCraftFromFragments = _craft;
        featExpedition = _exp; featUpgrade = _up;
        emit FeatureToggles(_daily, _buy, _craft, _exp, _up);
    }

    function setDailyAmount(uint256 v) external onlyRole(ADMIN) { dailyAmount = v; }
    function setFragmentPriceATT(uint256 v) external onlyRole(ADMIN) { fragmentPriceATT = v; }

    function setCrafting(uint256 need, uint16 bps) external onlyRole(ADMIN) {
        require(bps <= 10000, "bps");
        fragmentsToCraft = need;
        craftSuccessBps = bps;
    }

    function setExpeditionConf(uint8 grade, ExpeditionConf calldata c) external onlyRole(ADMIN) {
        expeditionOf[grade] = c;
    }

    function setUpgradeConf(uint8 grade, uint8 need, uint16 bps) external onlyRole(ADMIN) {
        require(bps <= 10000, "bps");
        upgradeNeedCount[grade] = need;
        upgradeSuccessBps[grade] = bps;
    }

    function pause() external onlyRole(ADMIN) { _pause(); }
    function unpause() external onlyRole(ADMIN) { _unpause(); }

    /* ---------------- Utils ---------------- */

    // 한국시간 기준 day index(하루 1회 체크용)
    /// @dev KST 09:00(=UTC 00:00) 기준으로 dayIndex가 바뀐다.
    ///      즉, UTC 자정마다 새로운 dayIndex가 시작됨.
    function _dayIndexKST(uint256 ts) internal pure returns (uint64) {
        // KST 09:00 == UTC 00:00 → UTC 자정 경계 사용
        return uint64(ts / 1 days);
    }

    // 의사난수: blockhash(n-1)와 prevrandao를 섞고, 호출자+nonce를 추가
    function _rand(address seedUser) internal returns (uint256 r) {
        unchecked {
            _randNonce++;
            bytes32 entropy = keccak256(
                abi.encodePacked(blockhash(block.number - 1), block.prevrandao)
            );
            r = uint256(keccak256(abi.encodePacked(
                entropy, block.timestamp, seedUser, _randNonce
            )));
        }
    }

    function _randBps(address seedUser) internal returns (uint256) {
        return _rand(seedUser) % 10000; // 0~9999
    }

    function _randRange(address seedUser, uint256 minV, uint256 maxV) internal returns (uint256) {
        if (maxV <= minV) return minV;
        uint256 span = maxV - minV + 1;
        return minV + (_rand(seedUser) % span);
    }

    /* ---------------- 1) 출석 ---------------- */

    /// @notice 한국시간 기준으로 하루 1회 ATT 지급
    function claimDaily() external whenNotPaused nonReentrant {
        require(featDaily, "daily off");
        uint64 today = _dayIndexKST(block.timestamp);
        require(lastClaimDay[msg.sender] < today, "already claimed");

        lastClaimDay[msg.sender] = today;
        ATT.mint(msg.sender, dailyAmount);
        emit DailyClaim(msg.sender, dailyAmount, today);
    }

    /* ---------------- 2) 조각 구매 ---------------- */

    /// @notice ATT로 조각 구매 (실지불 → 조각 민팅)
    function buyFragments(uint256 count) external whenNotPaused nonReentrant {
        require(featBuyFragments, "buy off");
        require(count > 0, "count=0");
        require(treasury != address(0), "treasury=0");

        uint256 pay = fragmentPriceATT * count;
        require(ATT.allowance(msg.sender, address(this)) >= pay, "approve ATT");

        // 실지불: 유저 → 트레저리
        ATT.transferFrom(msg.sender, treasury, pay);

        // 조각 지급
        FRG.mint(msg.sender, FRAGMENT_ID, count);
        emit FragmentsBought(msg.sender, count, pay);
    }

    /* ---------------- 3) 조각 → 등급1 합성 ---------------- */

    /// @notice 조각을 소각하고 확률 성공 시 1등급 NFT를 민팅
    function craftFromFragments() external whenNotPaused nonReentrant {
        require(featCraftFromFragments, "craft off");

        // 실패해도 소각되는 구조
        FRG.burnFrom(msg.sender, FRAGMENT_ID, fragmentsToCraft);

        bool success = _randBps(msg.sender) < craftSuccessBps;
        if (success) {
            ADV.mintWithGrade(msg.sender, 1);
            emit CraftAttempt(msg.sender, true, 1);
        } else {
            emit CraftAttempt(msg.sender, false, 0);
        }
    }

    /* ---------------- 4) 탐험 ---------------- */

    /// @notice 탐험 시작(전송 잠금 ON)
    function startExpedition(uint256 tokenId) external whenNotPaused nonReentrant {
        require(featExpedition, "exp off");
        require(ADV.ownerOf(tokenId) == msg.sender, "not owner");
        require(!expd[tokenId].active, "already active");

        uint8 g = ADV.gradeOf(tokenId);
        ExpeditionConf memory c = expeditionOf[g];
        require(c.secondsNeeded > 0, "no conf");

        expd[tokenId] = ExpeditionState({
            active: true,
            endTime: uint32(block.timestamp + c.secondsNeeded),
            gradeAtStart: g,
            owner: msg.sender
        });

        // 전송 잠금
        ADV.setLocked(tokenId, true);

        emit ExpeditionStarted(msg.sender, tokenId, uint32(block.timestamp + c.secondsNeeded), g);
    }

    /// @notice 탐험 보상 수령(전송 잠금 OFF)
    function claimExpedition(uint256 tokenId) external whenNotPaused nonReentrant {
        require(featExpedition, "exp off");
        ExpeditionState memory s = expd[tokenId];
        require(s.active, "not active");
        require(s.owner == msg.sender, "not owner");
        require(block.timestamp >= s.endTime, "not ended");

        // 언락 & 상태 삭제
        ADV.setLocked(tokenId, false);
        delete expd[tokenId];

        ExpeditionConf memory c = expeditionOf[s.gradeAtStart];

        // 등급별 보상 (정수 * 1e18)
        uint256 reward = _randRange(msg.sender, c.rewardMin, c.rewardMax) * 1e18;
        ATT.mint(msg.sender, reward);

        // 낮은 확률로 조각 드랍
        bool drop = (_randBps(msg.sender) < c.fragmentDropBps);
        if (drop) {
            FRG.mint(msg.sender, FRAGMENT_ID, 1);
        }

        emit ExpeditionClaimed(msg.sender, tokenId, reward, drop);
    }

    /* ---------------- 5) 업그레이드 ---------------- */

    /// @notice 동일 등급 N개 소각 → 확률 성공 시 상위 1개 민팅
    function upgradeGrade(uint256[] calldata tokenIds) external whenNotPaused nonReentrant {
        require(featUpgrade, "up off");
        require(tokenIds.length > 0, "empty");

        uint8 g = ADV.gradeOf(tokenIds[0]);
        require(g > 0, "grade0");

        uint8 need = upgradeNeedCount[g];
        require(need > 0 && tokenIds.length == need, "need mismatch");

        // 소유/등급 검증
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ADV.ownerOf(tokenIds[i]) == msg.sender, "not owner");
            require(ADV.gradeOf(tokenIds[i]) == g, "mixed grade");
        }

        // 모두 소각
        for (uint256 i = 0; i < tokenIds.length; i++) {
            ADV.burnFrom(msg.sender, tokenIds[i]);
        }

        bool success = _randBps(msg.sender) < upgradeSuccessBps[g];
        if (success) {
            uint8 newG = g + 1;
            ADV.mintWithGrade(msg.sender, newG);
            emit UpgradeAttempt(msg.sender, g, true, newG);
        } else {
            emit UpgradeAttempt(msg.sender, g, false, 0);
        }
    }

    /// @notice 탐험 상세 상태 조회
    /// @return active     탐험 중 여부
    /// @return owner      시작한 소유자
    /// @return grade      시작 시 등급
    /// @return secondsNeeded 설정된 전체 소요 시간(초)
    /// @return endTime    종료 예정 시각(Unix)
    /// @return elapsed    경과 시간(초, active일 때만 의미)
    /// @return remaining  남은 시간(초, 0이면 종료됨)
    /// @return claimable  시간상 청구 가능 여부(소유자 검증은 아님)
    function getExpeditionStatus(uint256 tokenId)
        external
        view
        returns (
            bool active,
            address owner,
            uint8 grade,
            uint32 secondsNeeded,
            uint32 endTime,
            uint32 elapsed,
            uint32 remaining,
            bool claimable
        )
    {
        ExpeditionState memory s = expd[tokenId];
        active = s.active;
        owner = s.owner;
        grade = s.gradeAtStart;

        ExpeditionConf memory c = expeditionOf[grade];
        secondsNeeded = c.secondsNeeded;
        endTime = s.endTime;

        if (!active) {
            return (false, owner, grade, secondsNeeded, endTime, 0, 0, false);
        }

        uint256 nowTs = block.timestamp;
        if (nowTs >= endTime) {
            // 종료됨
            return (true, owner, grade, secondsNeeded, endTime, secondsNeeded, 0, true);
        } else {
            uint32 rem = uint32(endTime - nowTs);
            uint32 el = uint32(secondsNeeded - rem);
            return (true, owner, grade, secondsNeeded, endTime, el, rem, false);
        }
    }

    /// @notice 출석 가능 여부 + 다음 리셋 시각 + 남은 시간(초)
    /// @dev  리셋은 KST 09:00(=UTC 00:00) 기준으로 일괄 적용됨(전 유저 동일).
    /// @return claimable 지금 슬롯(금일)에서 아직 수령 전이면 true
    /// @return nextClaimAt 다음 리셋(UTC 자정) UNIX 타임스탬프
    /// @return remaining   남은 초. claimable이면 0
    function getDailyStatus(address user)
        external
        view
        returns (bool claimable, uint32 nextClaimAt, uint32 remaining)
    {
        uint256 nowTs = block.timestamp;

        // 오늘(dayIndex) 산출: KST 09:00 = UTC 00:00 경계
        uint64 today = _dayIndexKST(nowTs);
        bool can = lastClaimDay[user] < today;

        // 다음 리셋 시각: 다음 UTC 자정 = ((now/86400)+1)*86400
        uint256 nextAt256 = ((nowTs / 1 days) + 1) * 1 days;

        uint32 nextAt = uint32(nextAt256); // 2106년까지 안전
        uint32 rem = can ? 0 : (nextAt > nowTs ? uint32(nextAt - nowTs) : 0);

        return (can, nextAt, rem);
    }

    /// @notice 면접자 프로모 코드 설정/보상/토글
    /// @param codeHash keccak256(bytes(원하는코드)) 결과
    /// @param rewardATT 지급할 ATT 수량(18 decimals)
    /// @param enabled true면 기능 on
    function setPromoConfig(bytes32 codeHash, uint256 rewardATT, bool enabled)
        external
        onlyRole(ADMIN)
    {
        promoCodeHash = codeHash;
        promoRewardATT = rewardATT;
        featPromo = enabled;
        emit PromoConfigSet(codeHash, rewardATT, enabled);
    }

    /// @notice 면접자용 코드 입력 → 일치 시 ATT 지급 (제한 없음)
    function redeemPromo(string calldata code) external whenNotPaused nonReentrant {
        require(featPromo, "promo off");
        require(promoCodeHash != bytes32(0), "no code");
        bytes32 digest = keccak256(bytes(code));
        require(digest == promoCodeHash, "invalid code");

        ATT.mint(msg.sender, promoRewardATT);
        emit PromoRedeemed(msg.sender, promoRewardATT);
    }
    
}
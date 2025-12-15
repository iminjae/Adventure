// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AttendToken (ATT)
 * @notice 게임 내 보상/결제에 쓰는 ERC20 토큰.
 * @dev  - 가스 토큰이 아님(네이티브 코인과 분리).
 *       - 총발행량은 배포 시 0에서 시작하며, MINTER_ROLE 보유자(예: GameCore)가 필요 시 민팅.
 *       - ERC20Pausable을 상속해 pause 상태에서 전송/민팅/소각이 모두 막힘.
 *
 * @custom:dependencies OpenZeppelin 4.9.6 (ERC20Pausable, AccessControl)
 * @custom:decimals    기본 18
 * @custom:roles
 *   - DEFAULT_ADMIN_ROLE: pause/unpause, 롤 부여/회수
 *   - MINTER_ROLE       : mint 권한(게임 로직 컨트랙트에만 부여 권장)
 *
 * @custom:usage 배포 후 권한 설정 예시
 *   1) token = new AttendToken("ATTEND", "ATT");
 *   2) token.grantRole(MINTER_ROLE, <GameCore 주소>);
 *   3) (이벤트/사건 시) token.pause();  // 전송/민팅 차단
 *      문제 해결 후  token.unpause();
 *
 * @custom:security
 *   - MINTER_ROLE은 멀티시그 또는 검증된 로직 컨트랙트에만 부여.
 *   - pause 기능으로 이상 징후 발생 시 즉시 전송/민팅 중단 가능.
 *
 * @custom:future
 *   - 가스 없는 승인 UX가 필요하면 ERC20Permit(EIP-2612)로 확장 권장.
 */

import "@openzeppelin/contracts@4.9.6/access/AccessControl.sol";
import "@openzeppelin/contracts@4.9.6/token/ERC20/extensions/ERC20Pausable.sol";

contract AttendToken is ERC20Pausable, AccessControl {
    /// @notice 민팅 권한 역할 식별자
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @param name_   토큰 이름(예: "ATTEND")
     * @param symbol_ 토큰 심볼(예: "ATT")
     *
     * @dev 배포자는 DEFAULT_ADMIN_ROLE을 부여받음.
     *      초기 발행(초기 물량)은 없음(= totalSupply 0에서 시작).
     */
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice 토큰 전송/민팅/소각을 전부 일시중지.
     * @dev 관리자만 호출 가능. (approve/allowance는 OZ 기본 동작상 허용)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice 일시중지 해제.
     * @dev 관리자만 호출 가능.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice 토큰 민팅(보상/운영 용도)
     * @param to     수령자
     * @param amount 발행량(18dec 기준)
     * @dev MINTER_ROLE 보유자만 호출 가능.
     *      pause 상태에서는 ERC20Pausable 내부에서 자동 revert.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // 참고:
    // - ERC20Pausable이 이미 전송/민팅/소각 경로를 막아주므로
    //   _beforeTokenTransfer/_update 등을 별도로 오버라이드할 필요 없음.
    // - burn 기능이 필요하면 OpenZeppelin ERC20Burnable을 추가 상속해 메소드 노출 가능.
}
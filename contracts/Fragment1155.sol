// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Fragment1155
 * @notice 게임 '조각'을 발행/소각하는 ERC1155 컨트랙트.
 * @dev   - ERC1155Supply로 ID별 총발행량 추적
 *        - AccessControl로 MINTER/BURNER 권한 분리 (보통 GameCore에만 부여)
 *        - setURI로 EIP-1155 표준 URI 템플릿 설정 (예: ipfs://.../{id}.json)
 *
 * @custom:roles
 *   - DEFAULT_ADMIN_ROLE: URI 변경, 역할 부여/회수
 *   - MINTER_ROLE       : mint 권한 (GameCore)
 *   - BURNER_ROLE       : burnFrom 권한 (GameCore)
 *
 * @custom:notes
 *   - burnFrom은 권한만 확인하고 내부 _burn을 호출하므로, 유저 승인 없이도 소각 가능.
 *     (반드시 신뢰 가능한 로직 컨트랙트에만 BURNER_ROLE을 부여할 것)
 */

import "@openzeppelin/contracts@4.9.6/access/AccessControl.sol";
import "@openzeppelin/contracts@4.9.6/token/ERC1155/extensions/ERC1155Supply.sol";

contract Fragment1155 is ERC1155Supply, AccessControl {
    /// @notice 조각 민팅 권한
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    /// @notice 조각 소각 권한
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /**
     * @param baseURI_ EIP-1155 URI 템플릿 (예: ipfs://CID/fragments/{id}.json)
     */
    constructor(string memory baseURI_) ERC1155(baseURI_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice 메타데이터 URI 템플릿 변경
     * @dev    관리자 전용. `{id}`는 64자리 소문자 hex로 치환됨.
     */
    function setURI(string memory newuri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
    }

    /**
     * @notice 조각 민팅
     * @param to     수령자
     * @param id     토큰 ID (A안에서는 보통 1 고정)
     * @param amount 수량
     * @dev    MINTER_ROLE 필요. TransferSingle 이벤트 발생.
     */
    function mint(address to, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, "");
    }

    /**
     * @notice 조각 소각(권한자만)
     * @param from   소각될 보유자 주소
     * @param id     토큰 ID
     * @param amount 수량
     * @dev    BURNER_ROLE 필요. 내부 _burn은 승인 검사 없이 잔액만 확인.
     *        유저가 GameCore 함수를 호출할 때만 burn이 실행되도록 로직에서 제어하십시오.
     */
    function burnFrom(address from, uint256 id, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, id, amount);
    }

    /**
     * @dev ERC165 지원 인터페이스 선언(다중 상속 충돌 해결)
     */
    function supportsInterface(bytes4 iid)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(iid);
    }
}
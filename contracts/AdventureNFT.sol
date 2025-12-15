// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AdventureNFT
 * @notice 탐험/합성 시스템에서 사용하는 등급형 ERC721.
 *         - gradeOf[tokenId]: 등급(1,2,3,4...)
 *         - locked[tokenId] : 탐험 중 전송 금지 플래그
 *
 * @dev OpenZeppelin 4.9.6 기준 구현.
 *      전송 직전 훅 `_beforeTokenTransfer` 에서 locked 검사로 전송을 차단합니다.
 *      (mint/burn 경로는 locked 검사 제외)
 *
 * @custom:roles
 *  - DEFAULT_ADMIN_ROLE : baseURI/locker 설정, 역할 부여/회수
 *  - MINTER_ROLE        : mintWithGrade 권한(보통 GameCore)
 *  - BURNER_ROLE        : burnFrom 권한(보통 GameCore)
 *
 * @custom:usage
 *  1) 배포 후 setLocker(GameCore)
 *  2) grantRole(MINTER_ROLE, GameCore), grantRole(BURNER_ROLE, GameCore)
 *  3) GameCore가 탐험 시작/종료 시 setLocked(tokenId, true/false) 호출
 */

import "@openzeppelin/contracts@4.9.6/access/AccessControl.sol";
import "@openzeppelin/contracts@4.9.6/token/ERC721/extensions/ERC721Enumerable.sol";

contract AdventureNFT is ERC721Enumerable, AccessControl {
    /// @notice 등급 NFT 민팅 권한
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    /// @notice 등급 NFT 소각 권한
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    string  private _baseTokenURI;   // 메타데이터 기본 경로
    uint256 private _nextId = 1;     // 다음 민팅 ID (1부터 시작)

    /// @notice 토큰 등급 저장소
    mapping(uint256 => uint8) public gradeOf;
    /// @notice 전송 잠금 플래그(탐험 중 true)
    mapping(uint256 => bool)  public locked;
    /// @notice 잠금 변경을 호출할 수 있는 전용 주체(= GameCore)
    address public locker;

    event BaseURISet(string uri);
    event LockerSet(address locker);
    event Locked(uint256 indexed tokenId, bool locked);

    /**
     * @param name_   ERC721 이름 (예: "Adventure")
     * @param symbol_ 심볼       (예: "ADV")
     * @param baseURI_ 메타데이터 기본 경로(예: "https://.../adv/")
     */
    constructor(string memory name_, string memory symbol_, string memory baseURI_)
        ERC721(name_, symbol_)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _baseTokenURI = baseURI_;
        emit BaseURISet(baseURI_);
    }

    /**
     * @notice baseURI 변경 (관리자 전용)
     */
    function setBaseURI(string memory newBase) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBase;
        emit BaseURISet(newBase);
    }

    /// @dev ERC721의 tokenURI 구성에 쓰이는 base 경로를 제공
    function _baseURI() internal view override returns (string memory) { return _baseTokenURI; }

    /**
     * @notice 잠금 변경 호출자(= GameCore) 설정
     * @dev    최초 1회 설정 후 바꾸지 않는 것을 권장. 변경 시 이벤트로 추적 가능.
     */
    function setLocker(address l) external onlyRole(DEFAULT_ADMIN_ROLE) {
        locker = l;
        emit LockerSet(l);
    }

    /// @dev locker만 호출 가능
    modifier onlyLocker() { require(msg.sender == locker, "not locker"); _; }

    /**
     * @notice 토큰의 전송 잠금 on/off (탐험 시작/종료 시 GameCore가 호출)
     */
    function setLocked(uint256 tokenId, bool v) external onlyLocker {
        locked[tokenId] = v;
        emit Locked(tokenId, v);
    }

    /**
     * @notice 등급을 부여하며 민팅
     * @param to    수령자
     * @param grade 등급(0 금지)
     * @return 새로 민팅된 tokenId
     * @dev MINTER_ROLE 보유자만 호출 가능(보통 GameCore).
     */
    function mintWithGrade(address to, uint8 grade) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(grade > 0, "grade=0");
        uint256 id = _nextId++;
        _safeMint(to, id);
        gradeOf[id] = grade;
        return id;
    }

    /**
     * @notice 특정 소유자의 토큰을 소각
     * @param owner   소유자 주소(검증)
     * @param tokenId 소각할 토큰
     * @dev BURNER_ROLE 보유자만 호출 가능(보통 GameCore).
     *     잠금 여부와 관계없이 소각 허용(업그레이드 시나리오 고려).
     *     잠금 중 소각을 금지하려면 `require(!locked[tokenId])` 추가 가능.
     */
    function burnFrom(address owner, uint256 tokenId) external onlyRole(BURNER_ROLE) {
        require(ownerOf(tokenId) == owner, "not owner");
        _burn(tokenId);
        delete gradeOf[tokenId];
        delete locked[tokenId];
    }

    /**
     * @dev 전송/민트/소각 전에 호출되는 훅.
     *      from!=0 && to!=0 (순수 전송)일 때만 잠금 체크를 수행한다.
     *      mint(from=0) / burn(to=0) 경로는 전송이 아니므로 잠금 검사 제외.
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721Enumerable)
    {
        if (from != address(0) && to != address(0)) {
            require(!locked[tokenId], "locked");
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 iid)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(iid);
    }
}
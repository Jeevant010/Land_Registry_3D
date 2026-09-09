// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SoulboundLandRegistry
 * @dev A blockchain-based land registry where properties are NFTs.
 * Tokens are "Soulbound" and can only be transferred by the Government (Owner).
 */
contract SoulboundLandRegistry is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Events for transparency and frontend tracking
    event LandMinted(uint256 indexed tokenId, address indexed owner, string uri);
    event LandTransferred(uint256 indexed tokenId, address from, address to);

    constructor(address initialOwner) 
        ERC721("National Land Registry", "LAND") 
        Ownable(initialOwner) 
    {}

    /**
     * @notice Mints a new land record as an NFT.
     * @param citizen The wallet address of the property owner.
     * @param metadataURI The Pinata CID (ipfs://...) containing the JSON metadata.
     */
    function mintLandRecord(address citizen, string memory metadataURI) 
        external 
        onlyOwner 
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(citizen, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit LandMinted(tokenId, citizen, metadataURI);
    }

    /**
     * @notice Allows the Government to transfer land ownership from one person to another.
     * @dev This is the ONLY way land can change hands in this system.
     */
    function transferLand(address from, address to, uint256 tokenId) 
        external 
        onlyOwner 
    {
        _transfer(from, to, tokenId);
        
        emit LandTransferred(tokenId, from, to);
    }

    /**
     * @dev Overrides the standard ERC721 _update function to enforce Soulbound logic.
     * Prevents citizens from transferring the NFT themselves.
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        virtual 
        override 
        returns (address) 
    {
        address from = _ownerOf(tokenId);

        // Allow minting (from address 0)
        // For any other transfer, ensure the caller is the Government (owner())
        if (from != address(0) && msg.sender != owner()) {
            revert("SOULBOUND_ERROR: Property transfers require Government authorization.");
        }

        return super._update(to, tokenId, auth);
    }

    // HELPER FUNCTIONS

    /**
     * @notice Returns the total number of properties registered.
     */
    function getTotalProperties() public view returns (uint256) {
        return _nextTokenId;
    }
}
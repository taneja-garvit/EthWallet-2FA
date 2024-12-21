const Ethereum = {
    hex: '0x1',
    name: 'Ethereum',
    rpcUrl: '',
    ticker: "ETH"
};
const Sepolia = {
    hex: '0xaa36a7',
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://site1.moralis-nodes.com/sepolia/f4de5384d4b94d3687cc9354300b9b82',
    ticker: "ETH"
};

const MumbaiTestnet = {
    hex: '0x13881',
    name: 'Mumbai Testnet',
    rpcUrl: '',
    ticker: "MATIC"
};

export const CHAINS_CONFIG = {
    "0xaa36a7": Sepolia,
    "0x1": Ethereum,
    "0x13881": MumbaiTestnet,
};
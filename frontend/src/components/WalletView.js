import React, { useEffect, useState } from "react";
import {
  Divider,
  Tooltip,
  List,
  Avatar,
  Spin,
  Tabs,
  Input,
  Button,
  Modal,
  message,
} from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import logo from "../noImg.png";
import axios from "axios";
import { CHAINS_CONFIG } from "../chains";
import { ethers } from "ethers";

function WalletView({
  wallet,
  setWallet,
  seedPhrase,
  setSeedPhrase,
  selectedChain,
}) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(null);
  const [nfts, setNfts] = useState(null);
  const [balance, setBalance] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [amountToSend, setAmountToSend] = useState(null);
  const [sendToAddress, setSendToAddress] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [hash, setHash] = useState(null);
  const [secret2FA, setSecret2FA] = useState(null);
const [is2FAEnabled, setIs2FAEnabled] = useState(false);
const [verificationCode, setVerificationCode] = useState('');
const [show2FAModal, setShow2FAModal] = useState(false);
const [qrCodeUrl, setQrCodeUrl] = useState(null);

async function setup2FA() {
  try {
    const response = await axios.post('http://localhost:3001/setup2fa', {
      userAddress: wallet
    });
    
    setSecret2FA(response.data.secret);
    setQrCodeUrl(response.data.qrCodeUrl);
    setIs2FAEnabled(true);
    message.success('2FA has been set up successfully!');
  } catch (error) {
    message.error('Failed to setup 2FA');
  }
}

async function verify2FA(code) {
  try {
    const response = await axios.post('http://localhost:3001/verify2fa', {
      token: code,
      secret: secret2FA
    });
    
    return response.data.verified;
  } catch (error) {
    message.error('Failed to verify 2FA code');
    return false;
  }
}


  const items = [
    
    {
      key: "1",
      label: `Transfer`,
      children: (
        <>
          <h3>Native Balance </h3>
          <h1>
            {balance.toFixed(2)} {CHAINS_CONFIG[selectedChain].ticker}
          </h1>
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> To:</p>
            <Input
              value={sendToAddress}
              onChange={(e) => setSendToAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> Amount:</p>
            <Input
              value={amountToSend}
              onChange={(e) => setAmountToSend(e.target.value)}
              placeholder="Native tokens you wish to send..."
            />
          </div>
          <Button
            style={{ width: "100%", marginTop: "20px", marginBottom: "20px" }}
            type="primary"
            onClick={() => sendTransaction(sendToAddress, amountToSend)}
          >
            Send Tokens
          </Button>
          {processing && (
            <>
              <Spin />
              {hash && (
                <Tooltip title={hash}>
                  <p>Hover For Tx Hash</p>
                </Tooltip>
              )}
            </>
          )}
          <Modal
            title="2FA Verification Required"
            open={show2FAModal}
            onOk={handle2FAAndTransaction}
            onCancel={() => {
              setShow2FAModal(false);
              setVerificationCode('');
            }}
          >
            <Input
              placeholder="Enter 2FA code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          </Modal>
        </>
      ),
    },
    {
      key: "2",
      label: "Setup 2FA",
      children: (
        <div className="setup2fa">
          <h3>Two-Factor Authentication Setup</h3>
          {!is2FAEnabled ? (
            <Button 
              type="primary" 
              onClick={setup2FA}
              style={{ marginBottom: "20px" }}
            >
              Enable 2FA
            </Button>
          ) : (
            <div className="qrcode-container">
              <p>Scan this QR code with your authenticator app:</p>
              {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" />}
              <p>Or enter this code manually:</p>
              <Input.TextArea 
                value={secret2FA} 
                readOnly 
                rows={2}
                style={{ marginBottom: "20px" }}
              />
              <p>⚠️ Store your backup code safely! You'll need it if you lose access to your authenticator app.</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  async function sendTransaction(to, amount) {
    if (is2FAEnabled) {
      setShow2FAModal(true);
      return; // Stop here and wait for 2FA verification
    }
    await processTransaction(to, amount);
  }
  // Add new function to handle the actual transaction
async function processTransaction(to, amount) {
  const chain = CHAINS_CONFIG[selectedChain];
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const privateKey = ethers.Wallet.fromPhrase(seedPhrase).privateKey;
  const wallet = new ethers.Wallet(privateKey, provider);

  const tx = {
    to: to,
    value: ethers.parseEther(amount.toString()),
  };

  setProcessing(true);
  try {
    const transaction = await wallet.sendTransaction(tx);
    setHash(transaction.hash);
    const receipt = await transaction.wait();

    setHash(null);
    setProcessing(false);
    setAmountToSend(null);
    setSendToAddress(null);

    if (receipt.status === 1) {
      getAccountTokens();
      message.success('Transaction successful!');
    } else {
      message.error('Transaction failed');
    }
  } catch (err) {
    message.error('Transaction failed');
    setHash(null);
    setProcessing(false);
    setAmountToSend(null);
    setSendToAddress(null);
  }
}

async function handle2FAAndTransaction() {
  const isVerified = await verify2FA(verificationCode);
  
  if (isVerified) {
    setShow2FAModal(false);
    setVerificationCode('');
    // Now call processTransaction with the stored values
    await processTransaction(sendToAddress, amountToSend);
  } else {
    message.error('Invalid 2FA code');
  }
}

  async function getAccountTokens() {
    setFetching(true);

    const res = await axios.get(`http://localhost:3001/getTokens`, {
      params: {
        userAddress: wallet,
        chain: selectedChain,
      },
    });

    const response = res.data;

    if (response.tokens.length > 0) {
      setTokens(response.tokens);
    }

    if (response.nfts.length > 0) {
      setNfts(response.nfts);
    }

    setBalance(response.balance);

    setFetching(false);
  }

  function logout() {
    setSeedPhrase(null);
    setWallet(null);
    setNfts(null);
    setTokens(null);
    setBalance(0);
    navigate("/");
  }

  useEffect(() => {
    if (!wallet || !selectedChain) return;
    setNfts(null);
    setTokens(null);
    setBalance(0);
    getAccountTokens();
  }, []);

  useEffect(() => {
    if (!wallet) return;
    setNfts(null);
    setTokens(null);
    setBalance(0);
    getAccountTokens();
  }, [selectedChain]);

  return (
    <>
      <div className="content">
        <div className="logoutButton" onClick={logout}>
          <LogoutOutlined />
        </div>
        <div className="walletName">Wallet</div>
        <Tooltip title={wallet}>
          <div>
            {wallet.slice(0, 4)}...{wallet.slice(38)}
          </div>
        </Tooltip>
        <Divider />
        {fetching ? (
          <Spin />
        ) : (
          <Tabs defaultActiveKey="1" items={items} className="walletView" />
        )}
      </div>
    </>
  );
}

export default WalletView;

const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

app.use(cors());
app.use(express.json());

app.get("/getTokens", async (req, res) => {

  const { userAddress, chain } = req.query;

  const tokens = await Moralis.EvmApi.token.getWalletTokenBalances({
    chain: chain,
    address: userAddress,
  });

  const nfts = await Moralis.EvmApi.nft.getWalletNFTs({
    chain: chain,
    address: userAddress,
    mediaItems: true,
  });

  const myNfts = nfts.raw.result.map((e, i) => {
    if (e?.media?.media_collection?.high?.url && !e.possible_spam && (e?.media?.category !== "video") ) {
      return e["media"]["media_collection"]["high"]["url"];
    }
  })

  const balance = await Moralis.EvmApi.balance.getNativeBalance({
    chain: chain,
    address: userAddress
  });

  const jsonResponse = {
    tokens: tokens.raw,
    nfts: myNfts,
    balance: balance.raw.balance / (10 ** 18)
  }


  return res.status(200).json(jsonResponse);
});
app.post("/setup2fa", async (req, res) => {
  const { userAddress } = req.body;
  
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `ETH Wallet (${userAddress})`
  });
  
  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  
  // In a real app, you would store this secret in a database associated with the user
  // For demo purposes, we'll send it back to the client (not secure for production!)
  return res.status(200).json({
    secret: secret.base32,
    qrCodeUrl
  });
});

app.post("/verify2fa", (req, res) => {
  const { token, secret } = req.body;
  
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token
  });
  
  return res.status(200).json({ verified });
});
Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls`);
  });
});

/**
 * NftController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

//Generate Wallets
const X_ISSUER_WALLET_ADDRESS = 'rJyPTvnT7CRqjPkcRNfMTVqF3AXRzfvDvh';
const X_ISSUER_SEED = 'shLawLq2hnRDb7w9wDxNf78eThnHK';

const X_BRAND_WALLET_ADDRESS = 'rBWsGjmSAZZnosg4SXYFGZwBc7vbKhvBCB';
const X_BRAND_SEED = 'ssdTMcr8vWb2WvofMKv6JCNQRfDNz';

const X_USER_WALLET_ADDRESS = 'rE2YDfKDNfKJ1opqc7Ku1ni4QFvVmfjR6';
const X_USER_SEED = 'safzK7zwtQ9fZut7CpW5hEwWXXqjZ';

const CURRENCY = "4D5920415745534F4D45204E465420F09F8E8991";

const X_url = 'wss://s.altnet.rippletest.net:51233';

const { XrplClient } = require('xrpl-client');
const bigInt = require("big-integer");

const xrpClient = new XrplClient(X_url);

const lib = require('xrpl-accountlib');


let txList = [{
    "TransactionType": "AccountSet",
    "Account": X_ISSUER_WALLET_ADDRESS,
    "SetFlag": 8
}, {
    "TransactionType": "TrustSet",
    "Account": "rReceivingHotWallet...",
    "Flags": 131072,
    "LimitAmount": {
        "currency": CURRENCY,
        "issuer": X_ISSUER_WALLET_ADDRESS,
        "value": "1000000000000000e-96"
    }
},
{
    "TransactionType": "Payment",
    "Account": X_ISSUER_WALLET_ADDRESS,
    "Destination": "rReceivingHotWallet...",
    "Amount": {
        "currency": CURRENCY,
        "issuer": X_ISSUER_WALLET_ADDRESS,
        "value": "1000000000000000e-96"
    }
}, {
    "TransactionType": "SetRegularKey",
    "Account": X_ISSUER_WALLET_ADDRESS,
    "Fee": "12",
    "RegularKey": "rrrrrrrrrrrrrrrrrrrrBZbvji"
}, {
    "TransactionType": "AccountSet",
    "Account": X_ISSUER_WALLET_ADDRESS,
    "Fee": "12",
    "SetFlag": 4
}, {
    "TransactionType": "TrustSet",
    "Account": "rFriendToReceiveNFT...",
    "Flags": 131072,
    "LimitAmount": {
        "currency": "4D5920415745534F4D45204E465420F09F8E8921",
        "issuer": X_ISSUER_WALLET_ADDRESS,
        "value": "1000000000000000e-96"
    }
}, {
    "TransactionType": "Payment",
    "Account": "rReceivingHotWallet...",
    "Destination": "rFriendToReceiveNFT...",
    "Amount": {
        "currency": "4D5920415745534F4D45204E465420F09F8E8921",
        "issuer": X_ISSUER_WALLET_ADDRESS,
        "value": "1000000000000000e-96"
    }
}]


const _getaccountinfo = async (X_WALLET_ADDRESS) => {
    try {
        const resp = await xrpClient.send({ 'command': 'account_info', 'account': X_WALLET_ADDRESS, 'ledger': 'validated' });
        return resp;

    } catch (e) {
        return e;

    }

}

const _getfee = async () => {
    try {
        const resp = await xrpClient.send({ 'command': 'fee' });
        return resp;

    } catch (e) {
        return e;

    }

}

const _sendTx = async (_o) => {
    try {
        const resp = await xrpClient.send(_o);
        return resp;

    } catch (e) {
        return e;

    }

}

const _getAccountInfoAndFee = async (X_WALLET_ADDRESS) => {

    const x_acountinfo = await _getaccountinfo(X_WALLET_ADDRESS);
    const x_fee = await _getfee();
    const fee = (parseFloat(x_fee.drops.base_fee) * 1000000).toFixed(0) + "";

    return { accountInfo: x_acountinfo, feeInfo: x_fee, feeValue: fee }

}

const _signTx = async (_o) => {
    return lib.sign(_o.tx, _o.xaccount);

}

const _getXAccount = async (X_WALLET_SEED) => {
    return lib.derive.familySeed(X_WALLET_SEED);

}

const _requestRes = async (_xresp, res) => {

    if (_xresp.error) {
        return res.serverError(_xresp);
    } else {
        return res.ok(_xresp);
    }
}


const createTrustReceiverAndIssuer = async (_o) => {
    //Create trust-line brand wallet <-> issuer wallet

    const txInfo = await _getAccountInfoAndFee(_o.X_BRAND_WALLET_ADDRESS);

    txList[1].Sequence = txInfo.accountInfo.account_data.Sequence;
    txList[1].Fee = txInfo.feeValue;
    txList[1].Account = _o.X_BRAND_WALLET_ADDRESS;

    const xaccount = await _getXAccount(_o.X_BRAND_SEED);

    const txObj = await _signTx({ tx: txList[1], xaccount: xaccount });

    const xresp = await _sendTx({ command: 'submit', "tx_blob": txObj.signedTransaction });

    return xresp;

}


const issueNFToken = async (_o) => {
    //Issue NFToken send to brand wallet

    const txInfo = await _getAccountInfoAndFee(_o.X_ISSUER_WALLET_ADDRESS);
    const xaccount = await _getXAccount(_o.X_ISSUER_SEED);

    txList[2].Sequence = txInfo.accountInfo.account_data.Sequence;
    txList[2].Destination = _o.X_BRAND_WALLET_ADDRESS;
    txList[2].Fee = txInfo.feeValue;//fee;

    const txObj = await _signTx({ tx: txList[2], xaccount: xaccount });

    const xresp = await _sendTx({ command: 'submit', "tx_blob": txObj.signedTransaction });

    return xresp;

}

const blackholeSetRegKey = async (_o) => {
    //Blackhole issuer wallet - set regular key

    const txInfo = await _getAccountInfoAndFee(_o.X_ISSUER_WALLET_ADDRESS);
    const xaccount = await _getXAccount(_o.X_ISSUER_SEED);

    txList[3].Sequence = txInfo.accountInfo.account_data.Sequence;

    const txObj = await _signTx({ tx: txList[3], xaccount: xaccount });

    const xresp = await _sendTx({ command: 'submit', "tx_blob": txObj.signedTransaction });

    return xresp;

}

const blackholeDisableMasterKey = async (_o) => {
    //Blackhole issuer wallet - disable master key

    const txInfo = await _getAccountInfoAndFee(_o.X_ISSUER_WALLET_ADDRESS);
    const xaccount = await _getXAccount(_o.X_ISSUER_SEED);

    txList[4].Sequence = txInfo.accountInfo.account_data.Sequence;

    const txObj = await _signTx({ tx: txList[4], xaccount: xaccount });

    const xresp = await _sendTx({ command: 'submit', "tx_blob": txObj.signedTransaction });

    return xresp;

}

const createTrustUserAndIssuer = async (_o) => {
    //Create trust-line user wallet <-> issuer wallet.

    const txInfo = await _getAccountInfoAndFee(_o.X_USER_WALLET_ADDRESS);
    const xaccount = await _getXAccount(_o.X_USER_SEED);

    txList[5].Sequence = txInfo.accountInfo.account_data.Sequence;
    txList[5].Account = _o.X_USER_WALLET_ADDRESS;
    txList[5].Fee = txInfo.feeValue;

    const txObj = await _signTx({ tx: txList[5], xaccount: xaccount });

    const xresp = await _sendTx({ command: 'submit', "tx_blob": txObj.signedTransaction });

    return xresp;

}


const sendNFTokenToUser = async (_o) => {
    //Sends NFToken to user wallet.

    const txInfo = await _getAccountInfoAndFee(_o.X_BRAND_WALLET_ADDRESS);
    const xaccount = await _getXAccount(_o.X_BRAND_SEED);

    txList[6].Sequence = txInfo.accountInfo.account_data.Sequence;
    txList[6].Account = _o.X_BRAND_WALLET_ADDRESS;
    txList[6].Destination = _o.X_USER_WALLET_ADDRESS;
    txList[6].Fee = txInfo.feeValue;

    const txObj = await _signTx({ tx: txList[6], xaccount: xaccount });

    const xresp = await _sendTx({ command: 'submit', "tx_blob": txObj.signedTransaction });

    return xresp;

}

const accountset = async (_o) => {
    //Account setup

    const txInfo = await _getAccountInfoAndFee(_o.X_ISSUER_WALLET_ADDRESS);
    const xaccount = await _getXAccount(_o.X_ISSUER_SEED);

    txList[0].Sequence = txInfo.accountInfo.account_data.Sequence;
    txList[0].Fee = txInfo.feeValue;

    const txObj = await _signTx({ tx: txList[0], xaccount: xaccount });

    const xresp = await _sendTx({ command: 'submit', "tx_blob": txObj.signedTransaction });

    return xresp;

}

module.exports = {

    create: async function (req, res) {

        const ans = await accountset({ X_ISSUER_WALLET_ADDRESS, X_ISSUER_SEED });

        return res.ok(ans);


    },

    approve: async function (req, res) {

        const xresp = await createTrustReceiverAndIssuer({ X_BRAND_SEED, X_BRAND_WALLET_ADDRESS });

        return _requestRes(xresp, res)

    },

    issue: async function (req, res) {

        function _sleep(milliseconds) {
            const date = Date.now();
            let currentDate = null;
            do {
                currentDate = Date.now();
            } while (currentDate - date < milliseconds);
        }

        await issueNFToken({ X_ISSUER_WALLET_ADDRESS, X_ISSUER_SEED });
        await blackholeSetRegKey({ X_ISSUER_WALLET_ADDRESS, X_ISSUER_SEED });
        _sleep(1000);
        await blackholeDisableMasterKey({ X_ISSUER_WALLET_ADDRESS, X_ISSUER_SEED });


        return res.ok({ message: 'done' })

    },

    claim: async function (req, res) {

        const ans = await createTrustUserAndIssuer({ X_USER_WALLET_ADDRESS, X_USER_SEED, });

        return res.ok(ans)

    },

    deliver: async function (req, res) {

        const ans = await sendNFTokenToUser({ X_BRAND_WALLET_ADDRESS, X_BRAND_SEED, X_USER_WALLET_ADDRESS });

        return res.ok(ans)

    }



};


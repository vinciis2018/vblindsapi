import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    txId: {type: String},
    txType: {},
    body: {},
  },
  {timestamps: true,}

)

const pendingTransactionSchema = new mongoose.Schema(
  {
    txId: {type: String},
    txType: {},
    body: {},
  },
  {timestamps: true,}

)


const recievedTransactionSchema = new mongoose.Schema(
  {
    txId: {type: String},
    txType: {},
    body: {},
  },
  {timestamps: true,}

)

const walletSchema = new mongoose.Schema(
  {
    walletAddAr: { type: String},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },
    username: { type: String, default: '' },
    isActive: { type: Boolean, default: false },
    balanceAR: { type: Number, default: 0 },  //Arweave Ar token
    balanceKOII: { type: Number,  default: 0 }, //Koii attention token
    balanceRAT: { type: Number, default: 0}, // Real Attention Token
    defaultWallet: { type: Boolean, default: false },
    walletName: { type: String, default: 'My Wallet' },
    transactions: [transactionSchema],
    pendingTransactions: [pendingTransactionSchema],
    recievedTransactions: [recievedTransactionSchema],

    }, {
    timestamps: true
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;
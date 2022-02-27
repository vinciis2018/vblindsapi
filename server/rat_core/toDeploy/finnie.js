import {poll} from '../../services/utils';

export const initExtension = async () => {
  try {
    let extensionObj = await poll(() => window.koiiWallet, 1000, 200);

    let res = await extensionObj.getPermissions();
    if(res.status === 200 && res.data.length) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error("Extension does not exist");
  }
};


export const connectToExtension = async () => {
  try {
    const extension = window.koiiWallet;
    let res = await extension.connect();

    if (res.status === 200) return true;
    throw new Error(res?.data);
  } catch (error) {
    throw new Error(error);
  }
};

export const disconnectExtension = async () => {
  try {
    await window?.koiiWallet?.disconnect();
    return true;
  } catch (error) {}
};

export const sendKoiiTip = async (artistAddress, amount) => {
  const extension = window.koiiWallet;
  return await extension.sendKoii(artistAddress, amount);
};
import { createStandaloneToast } from '@chakra-ui/toast';
import port from '../port/port';

export const sleep = (t) => new Promise(resolve => setTimeout(resolve, t))();


export const getNftsStats = (nfts) => {
  nfts.reduce(
    (acc, current) => {
      acc[0] += current.attention;
      acc[1] += current.reward;

      return acc;
    },
    [0,0]
  )
};


export const formatDigitNumber = (val) => {
  if(typeof val !== "number") return 0;
  if(val) return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
  else return 0;
};

export const getMediaType = (contentType) => {
  let mediaType = contentType;
  if(contentType) {
    if(contentType.includes("image/")) {
      mediaType = "image";
    } else if (contentType.includes("video/")) {
      mediaType = "video";
    } else if (contentType.includes("text/html")) {
      mediaType = "iframe"
    }
  }
  return mediaType;
};

export const getFileData = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const dataBuffer = await blob.arrayBuffer();

  return [dataBuffer, blob];
};

export const poll = (fn, timeout, interval) => {
  var endTime = Number(new Date()) + (timeout || 2000);
  interval = interval || 100;

  var checkCondition = function (resolve, reject) {
    var result = fn();
    if (result) {
      resolve(result);
    }
    else if (Number(new Date()) < endTime) {
      setTimeout(checkCondition, interval, resolve, reject);
    }
    else {
      reject(new Error("timed out for " + fn + ": " + arguments));
    }
  };
  return new Promise(checkCondition);
};

const toastId = "koi-toast";
const headlessToast = createStandaloneToast({
  defaultOptions: {
    title: "Loading...",
    isClosable: true,
    duration: 3000,
    status: "info",
    position: "top-right",
    description: null,
    id: toastId
  },
})

export const toast = ({
  title = "Loading...", 
  isClosable = true, 
  duration = 3000, 
  status = "info",
  variant = "left-accent",
  position = "top-right",
  description = null,
}) => {
  let newToast;
  if(!headlessToast.isActive(toastId)) {
    newToast = headlessToast({
      title,
      isClosable,
      status,
      duration,
      position,
      description,
      variant,
      id: toastId
    });
  } else {
    newToast = headlessToast.update(toastId, { title, description, variant, status, duration, position, isClosable });
  }
  return newToast;
}

export const convertToAr = (balance) => {
  if(!balance) return "...";
  let value = Number(balance);
  return (value / 1000000000000)?.toFixed?.(8);
};

export const triggerPort = (nftId) => {
  port.propagatePoRT(nftId);
};

export const formatUnixTimestamp = (
  timestamp,
  options = {
    day: "numeric",
    month: "short",
    year: "numeric"
  },
) => {
  if (!timestamp) return null;
  return new Date(parseInt(timestamp) * 1000).toLocaleString(undefined, options);
};

export const refreshPage = () => {
  window?.location.reload();
}
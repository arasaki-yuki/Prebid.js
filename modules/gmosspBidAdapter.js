import { registerBidder } from '../src/adapters/bidderFactory.js';
// import * as utils from '../src/utils.js';

const BIDDER_CODE = 'gmossp';
const ENDPOINT = 'http://localhost:3000';

export const spec = {
  code: BIDDER_CODE,
  isBidRequestValid: function (bid) {
    return true;
  },
  buildRequests: function (validBidRequests, bidderRequest) {
    const bidRequests = [];
    // utils.logMesage("hoge2");
    const queryString = 'hoge';
    bidRequests.push({
      method: 'GET',
      url: ENDPOINT,
      data: queryString
    });

    return bidRequests;
  },
  interpretResponse: function (bidderResponse, requets) {},
  getUserSyncs: function (syncOptions, serverResponse) {},
};

registerBidder(spec);

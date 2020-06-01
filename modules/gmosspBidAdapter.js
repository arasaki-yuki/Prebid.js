import { registerBidder } from '../src/adapters/bidderFactory.js';
import * as utils from '../src/utils.js';
import { config } from '../src/config.js';
import { BANNER, NATIVE } from '../src/mediaTypes.js';

const BIDDER_CODE = 'gmossp';
const ENDPOINT = 'https://arasaki-ad.devel.sp.gmossp-sp.jp/hb/prebid/query.ad';

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER, NATIVE],

  isBidRequestValid: function (bid) {
    return !!(bid.params.sid);
  },

  buildRequests: function (validBidRequests, bidderRequest) {
    const bidRequests = [];

    const url = bidderRequest.refererInfo.referer;
    const cur = getCurrencyType();
    const dnt = utils.getDNT() ? '1' : '0';

    for (let i = 0; i < validBidRequests.length; i++) {
      let queryString = '';

      const request = validBidRequests[i];
      const tid = request.transactionId;
      const bid = request.bidId;
      const ver = '$prebid.version$';
      const sid = utils.getBidIdParameter('sid', request.params);

      queryString = utils.tryAppendQueryString(queryString, 'tid', tid);
      queryString = utils.tryAppendQueryString(queryString, 'bid', bid);
      queryString = utils.tryAppendQueryString(queryString, 'ver', ver);
      queryString = utils.tryAppendQueryString(queryString, 'sid', sid);
      queryString = utils.tryAppendQueryString(queryString, 'url', url);
      queryString = utils.tryAppendQueryString(queryString, 'cur', cur);
      queryString = utils.tryAppendQueryString(queryString, 'dnt', dnt);

      bidRequests.push({
        method: 'GET',
        url: ENDPOINT,
        data: queryString
      });
    }
    return bidRequests;
  },

  interpretResponse: function (bidderResponse, requests) {
    const bid = [];
    const res = bidderResponse.body;

    if (utils.isEmpty(res)) {
      return bid;
    }

    try {
      res.imps.forEach(impTracker => {
        const tracker = utils.createTrackPixelHtml(impTracker);
        res.ad += tracker;
      });
    } catch (error) {
      utils.logError('Error appending tracking pixel', error);
    }

    const data = {
      requestId: res.bid,
      cpm: res.price,
      currency: res.cur,
      width: res.w,
      height: res.h,
      ad: res.ad,
      creativeId: res.creativeId,
      netRevenue: true,
      ttl: res.ttl || 300
    };

    bid.push(data);

    return bid;
  },

  getUserSyncs: function(syncOptions, serverResponses) {
    const syncs = [];
    if (!serverResponses.length) {
      return syncs;
    }

    serverResponses.forEach(res => {
      if (syncOptions.pixelEnabled && res.body && res.body.syncs.length) {
        res.body.syncs.forEach(sync => {
          syncs.push({
            type: 'image',
            url: sync
          })
        })
      }
    })

    return syncs;
  },

};

/**
 * @return {?string} USD or JPY
 */
function getCurrencyType() {
  if (config.getConfig('currency.adServerCurrency')) {
    return config.getConfig('currency.adServerCurrency');
  }
  return 'JPY';
}

registerBidder(spec);

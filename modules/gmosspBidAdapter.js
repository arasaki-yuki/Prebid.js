import { registerBidder } from '../src/adapters/bidderFactory.js';
import * as utils from '../src/utils.js';
import { config } from '../src/config.js';
import { BANNER, NATIVE } from '../src/mediaTypes.js';

const BIDDER_CODE = 'gmossp';
// const ENDPOINT = 'http://localhost:3000';
const ENDPOINT = 'https://arasaki-ad.devel.sp.gmossp-sp.jp/hb/prebid/query.ad';

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER, NATIVE],

  isBidRequestValid: function (bid) {
    /**
     * TODO:
     * 何を必須とするかまとめる
     * [x] sid //space_id
     * [] currencyについてこの時点でわかるか否か
     *  [] currencyが設定されていない場合の挙動確認
     */
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

    /**
 * TODO:
 * adagioBidAdapterのようにbidderResponseの中のbidId(bid)とrequestsの中にあるbidの突合処理を行う
 * - usersync、その他のオプションの実装
 * - testファイル作成
 * - 該当しないIDがある場合の挙動
 * - handles no bid response
 */
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

    /*
    if (syncOptions.iframeEnabled && bidderResponseBody.sync_htmls) {
      bidderResponseBody.sync_htmls.forEach(sync => {
        syncs.push({
          type: 'iframe',
          url: sync
        });
      });
    }
    */

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

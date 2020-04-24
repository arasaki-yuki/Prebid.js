import { registerBidder } from '../src/adapters/bidderFactory.js';
import * as utils from '../src/utils.js';
import { config } from '../src/config.js';
import { BANNER, NATIVE } from '../src/mediaTypes.js';

const BIDDER_CODE = 'gmossp';
const ENDPOINT = 'http://localhost:3000';

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

    /**
     * TODO:
     * [] サンプルページに複数枠設定
     *      GAMでサンプル枠作る
     */
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
    const res = bidderResponse.body;
    const requestId = res.bid;
    const cpm = res.price;
    const currency = res.cur;
    const width = res.w;
    const height = res.h;
    const ad = res.ad;
    const ttl = res.ttl || 300;
    const creativeId = res.cid;
    const netRevenue = true;

    /**
 * TODO:
 * adagioBidAdapterのようにbidderResponseの中のbidId(bid)とrequestsの中にあるbidの突合処理を行う
 */

    const bid = {
      requestId,
      cpm,
      currency,
      width,
      height,
      ad,
      creativeId,
      netRevenue,
      ttl
    };

    return [bid];
  },

  getUserSyncs: function (syncOptions, serverResponse) {},
};

/**
 * @return {?string} USD or JPY
 */
function getCurrencyType() {
  if (config.getConfig('currency.adServerCurrency') && config.getConfig('currency.adServerCurrency').toUpperCase() === 'USD') return 'USD';
  return 'JPY';
}

registerBidder(spec);

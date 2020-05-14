# Overview

```
Module Name: GMOSSP Bid Adapter
Module Type: Bidder Adapter
Maintainer: 
```

# Description
Connects to GMOSSP exchange for bids.
GMOSSP bid adapter supports Banner.

# Test Parameters
```
var adUnits = [
    // Banner adUnit
    {
        code: 'test-div',
        mediaTypes: {
            banner: {
                sizes: [
                    [300, 250],
                    [320, 50],
                    [320, 100]
                ]
            }
        },
        bids: [{
            bidder: 'gmossp',
            params: {
                sid: ''
            }
        }]
    }
];
```
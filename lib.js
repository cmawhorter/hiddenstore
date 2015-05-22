var HiddenID = function(ns, readyCallback) {
  var target = 'http://cdnjs.cloudflare.com/ajax/libs/emojione/1.4.0/assets/png/0023-20E3.png';
  var expiresOffset = 30672000;
  var rootKey = ns + ':';

  var THRESHOLD = 10;
  var MAX_LENGTH = 10;

  var store = {
    get: function(callback) {
      var digits = [];
      var lastDigit;
      var index = 0;
      async.until(function() {
        return lastDigit === null || lastDigit === 'n' || index >= MAX_LENGTH;
      }, function(taskCallback) {
        findDigitAtIndex(index, function(err, digit) {
          if (err) return taskCallback(err);
          lastDigit = digit;
          digits.push(digit);
          index++;
          taskCallback();
        });
      }, function(err) {
        if (err) return callback(err);
        console.log('digits', digits);
        callback(null, digits.join(''));
      });
    },

    set: function(uid, callback) {
      var encodedUrls = encode(uid);
      console.log('encodedUrls', encodedUrls);
      async.parallel(encodedUrls.map(function(url) {
        return async.apply(exists, url);
      }), callback);
    }
  };

  function exists(url, callback) {
    var img = new Image();
    var startTime = new Date().getTime();
    img.onload = function() {
      var elapsed = new Date().getTime() - startTime;
      return callback(null, elapsed < THRESHOLD);
    };
    img.onerror = function() {
      callback(null, null);
    };
    img.src = url;
  }

  function findDigitAtIndex(index, callback) {
    var tasks = {};
    var url = target + '?' + rootKey + ':' + index + ':';
    tasks.n = async.apply(exists, url + 'n'); // nul term
    for (var i=0; i < 10; i++) {
      tasks[i] = async.apply(exists, url + i);
    }
    async.parallel(tasks, function(err, results) {
      if (err) return callback(err);
      for (var indexValue in results) {
        if (true === results[indexValue]) {
          callback(null, 'n' === indexValue ? null : parseInt(indexValue, 10));
          return;
        }
      }
      callback(null, null);
    });
  }

  function getRootKey(index) {
    return rootKey + (index || '0');
  }

  function randomId() {
    return Math.floor(Math.random() * 100000000);
  }

  function encode(str) {
    str = '' + (str || '');
    var encoded = [];
    var i=0;
    for (; i < str.length; i++) {
      encoded.push(target + '?' + rootKey + ':' + i + ':' + str[i]);
    }
    encoded.push(target + '?' + rootKey + ':' + i + ':n'); // nul term
    return encoded;
  }

  exists(target + '?' + rootKey, function(err, yes) {
    if (err) return readyCallback(err);
    if (yes) {
      return store.get(readyCallback);
    }
    else {
      var generatedId = randomId();
      return store.set(generatedId, function(err) {
        if (err) return readyCallback(err);
        readyCallback(null, generatedId);
      });
    }
  });
};

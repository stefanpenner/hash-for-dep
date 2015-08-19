'use strict';

module.exports = {
  start: function() {
    return process.hrtime();
  },
  end: function(start) {
    var elapsed = process.hrtime(start)[1] / 1000000;
    return process.hrtime(start)[0] + 's ' + elapsed.toFixed(3) + 'ms';
  }
};

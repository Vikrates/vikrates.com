//https://github.com/emerleite/node-gravatar
var gravatar = require('gravatar');
var url = gravatar.url('emerleite@gmail.com', {s: '200', r: 'pg', d: '404'});
//returns //www.gravatar.com/avatar/93e9084aa289b7f1f5e4ab6716a56c3b?s=200&r=pg&d=404
var unsecureUrl = gravatar.url('emerleite@gmail.com', {s: '100', r: 'x', d: 'retro'}, false);
//returns http://www.gravatar.com/avatar/93e9084aa289b7f1f5e4ab6716a56c3b?s=100&r=x&d=retro
var secureUrl = gravatar.url('emerleite@gmail.com', {s: '100', r: 'x', d: 'retro'}, true);
//returns https://secure.gravatar.com/avatar/93e9084aa289b7f1f5e4ab6716a56c3b?s=100&r=x&d=retro
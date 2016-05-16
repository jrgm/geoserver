var restify = require('restify')
var geoip = require('geoip-lite')
var ip = require('ip')
var Logger = require('bunyan')

var logger = new Logger({
  name: 'geoip',
  streams: [
    {
      stream: process.stdout,
      level: 'trace'
    },
    {
      path: '/var/tmp/geoip.log',
      level: 'trace'
    }
  ],
  serializers: {
    req: Logger.stdSerializers.req,
    res: restify.bunyan.serializers.res
  },
});

function validIp(addr) {
  if (ip.isV4Format(addr) || ip.isV6Format(addr)) {
    return true
  }
  return false
}

function lookup(addr) {
  var geo = geoip.lookup(addr);
  if (!geo) {
    return {}
  }
  geo.range = geo.range.map(function(range) {
    if (!range) { 
      return range
    }
    return geoip.pretty(range)
  })
  return geo
}

function handler(req, res, next) {
  var addr = req.params.addr

  res.setHeader('content-type', 'application/json')

  if (!validIp(addr)) {
    res.setHeader('connection', 'close')
    res.send(400)
    return next()
  }

  var geo = lookup(addr)
  res.send(geo)
  next()
}

var server = restify.createServer({
  name: 'geoip',
  log: logger
})

server.get('/geoip/:addr', handler)

server.listen(48765, function() {
  console.log('%s listening at %s', server.name, server.url)
})

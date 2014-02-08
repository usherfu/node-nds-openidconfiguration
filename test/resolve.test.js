/* global describe, it, expect */

var path = require('path')
  , fs = require('fs')
  , resolve = require('../lib/resolve')
  , MODULE_PATH = path.resolve(__dirname, '../lib/resolve');


describe('resolve', function() {
  
  it('should export a setup function', function() {
    expect(resolve).to.be.a('function');
  });
  
  describe('resolving metadata', function() {
    // ** MOCKS **
    var request = function(options, cb) {
      expect(options.url).to.equal('https://server.example.com/.well-known/openid-configuration');
      expect(options.headers['Accept']).to.equal('application/json');
        
      process.nextTick(function() {
        // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse
        var keys = fs.readFileSync(path.resolve(__dirname, 'data/configuration-draft21.json'), 'utf8');
        return cb(null, { statusCode: 200 }, keys);
      });
    };
    
    
    var setup = $require(MODULE_PATH, { request: request });
    var resolve = setup();
    var provider;
    
    before(function(done) {
      resolve('https://server.example.com', function(err, p) {
        if (err) { return done(err); }
        provider = p;
        done();
      });
    });
    
    it('should resolve metadata', function() {
      expect(provider).to.be.an('object');
      expect(provider.id).to.equal('https://server.example.com');
      expect(provider.issuer).to.equal('https://server.example.com');
      expect(provider.jwksUrl).to.equal('https://server.example.com/jwks.json');
    });
  });
  
  describe('handling not found status', function() {
    // ** MOCKS **
    var request = function(options, cb) {
      expect(options.url).to.equal('https://server.example.com/.well-known/openid-configuration');
        
      process.nextTick(function() {
        return cb(null, { statusCode: 404 }, 'Cannot GET /.well-known/openid-configuration');
      });
    };
    
    
    var setup = $require(MODULE_PATH, { request: request });
    var resolve = setup();
    var provider;
    
    before(function(done) {
      resolve('https://server.example.com', function(err, p) {
        if (err) { return done(err); }
        provider = p;
        done();
      });
    });
    
    it('should not resolve metadata', function() {
      expect(provider).to.be.undefined;
    });
  });
  
  describe('handling unexpected status', function() {
    // ** MOCKS **
    var request = function(options, cb) {
      expect(options.url).to.equal('https://server.example.com/.well-known/openid-configuration');
        
      process.nextTick(function() {
        return cb(null, { statusCode: 500 }, 'Internal server error');
      });
    };
    
    
    var setup = $require(MODULE_PATH, { request: request });
    var resolve = setup();
    var error, provider;
    
    before(function(done) {
      resolve('https://server.example.com', function(err, p) {
        error = err;
        provider = p;
        done();
      });
    });
    
    it('should error', function() {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Unexpected status 500 from https://server.example.com/.well-known/openid-configuration');
      expect(error.status).to.be.undefined;
    });
    
    it('should not resolve metadata', function() {
      expect(provider).to.be.undefined;
    });
  });
  
  describe('handling unparsable body', function() {
    // ** MOCKS **
    var request = function(options, cb) {
      expect(options.url).to.equal('https://server.example.com/.well-known/openid-configuration');
        
      process.nextTick(function() {
        return cb(null, { statusCode: 200 }, '<xml></xml>');
      });
    };
    
    
    var setup = $require(MODULE_PATH, { request: request });
    var resolve = setup();
    var error, provider;
    
    before(function(done) {
      resolve('https://server.example.com', function(err, p) {
        error = err;
        provider = p;
        done();
      });
    });
    
    it('should error', function() {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Failed to parse OpenID provider configuration from https://server.example.com/.well-known/openid-configuration');
      expect(error.status).to.be.undefined;
    });
    
    it('should not resolve metadata', function() {
      expect(provider).to.be.undefined;
    });
  });
  
});

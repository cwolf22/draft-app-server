var axios = require('axios');
let config = {
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'cache-control,content-type,conversation-id,correlation-id,expires,pragma',
      'Origin': 'https://cdn.registerdisney.go.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
      Referer: 'https://cdn.registerdisney.go.com/v2/ESPN-ONESITE.WEB-PROD/en-US?include=config,l10n,js,html&scheme=http&postMessageOrigin=http%3A%2F%2Fwww.espn.com%2Ffantasy%2F&cookieDomain=www.espn.com&config=PROD&logLevel=INFO&topHost=www.espn.com&cssOverride=https%3A%2F%2Fsecure.espncdn.com%2Fcombiner%2Fc%3Fcss%3Ddisneyid%2Fcore.css%2Cdisneyid%2Ffantasy.css&responderPage=https%3A%2F%2Fwww.espn.com%2Flogin%2Fresponder%2Findex.html&buildId=16925ea174f'
    }
  }
  function f() { return g() + g() + "-" + g() + "-" + g("4") + "-" + g((Math.floor(10 * Math.random()) % 4 + 8).toString(16)) + "-" + g() + g() + g() }

  function g(e) { for (var t = Math.floor(65535 * Math.random()).toString(16), n = 4 - t.length; n > 0; n--) t = "0" + t; return e = ("" + e).substring(0, 4), !isNaN(parseInt(e, 16)) && e.length ? e + t.substr(e.length) : t }
  
  function uuid(){return f();}
  
const URL = 'https://registerdisney.go.com/jgc/v6/client/ESPN-ONESITE.WEB-PROD/api-key?langPref=en-US';

const loginURL = 'https://registerdisney.go.com/jgc/v6/client/ESPN-ONESITE.WEB-PROD/guest/login?langPref=en-US'

let correlationId = null;
let conversationId = null;
let apiKey = null;
axios.options(URL, null, config).then(data => {
    correlationId = uuid(data.headers['correlation-id'])
    console.log(`correlation Id: ${correlationId}`);
    conversationId = uuid(correlationId)
    console.log(`conversation Id: ${conversationId}`);
    let config2 = {
        Referer: 'https://cdn.registerdisney.go.com/v2/ESPN-ONESITE.WEB-PROD/en-US?include=config,l10n,js,html&scheme=http&postMessageOrigin=http%3A%2F%2Fwww.espn.com%2Ffantasy%2F&cookieDomain=www.espn.com&config=PROD&logLevel=INFO&topHost=www.espn.com&cssOverride=https%3A%2F%2Fsecure.espncdn.com%2Fcombiner%2Fc%3Fcss%3Ddisneyid%2Fcore.css%2Cdisneyid%2Ffantasy.css&responderPage=https%3A%2F%2Fwww.espn.com%2Flogin%2Fresponder%2Findex.html&buildId=16925ea174f',
        'Content-Type': 'application/json',
        'conversation-id': conversationId,
        'correlation-id': correlationId,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
        'cache-control': 'no-cache',
        expires: -1,
        pragma: 'no-cache'
    }
    return axios.post(URL, null, config2)
}).then(data => {
    apiKey = data.headers['api-key'];
    let config3 = {
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,cache-control,content-type,conversation-id,correlation-id,expires,oneid-reporting,pragma',
          'Origin': 'https://cdn.registerdisney.go.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
          Referer: 'https://cdn.registerdisney.go.com/v2/ESPN-ONESITE.WEB-PROD/en-US?include=config,l10n,js,html&scheme=http&postMessageOrigin=http%3A%2F%2Fwww.espn.com%2Ffantasy%2F&cookieDomain=www.espn.com&config=PROD&logLevel=INFO&topHost=www.espn.com&cssOverride=https%3A%2F%2Fsecure.espncdn.com%2Fcombiner%2Fc%3Fcss%3Ddisneyid%2Fcore.css%2Cdisneyid%2Ffantasy.css&responderPage=https%3A%2F%2Fwww.espn.com%2Flogin%2Fresponder%2Findex.html&buildId=16925ea174f'
        }
      }
    console.log(`APIKEY: ${apiKey}`)
    return axios.options(loginURL, null, config3)
}).then(data => {
    console.log('-------');
    let config4 = {
        Referer: 'https://cdn.registerdisney.go.com/v2/ESPN-ONESITE.WEB-PROD/en-US?include=config,l10n,js,html&scheme=http&postMessageOrigin=http%3A%2F%2Fwww.espn.com%2Ffantasy%2F&cookieDomain=www.espn.com&config=PROD&logLevel=INFO&topHost=www.espn.com&cssOverride=https%3A%2F%2Fsecure.espncdn.com%2Fcombiner%2Fc%3Fcss%3Ddisneyid%2Fcore.css%2Cdisneyid%2Ffantasy.css&responderPage=https%3A%2F%2Fwww.espn.com%2Flogin%2Fresponder%2Findex.html&buildId=16925ea174f',
        'Content-Type': 'application/json',
        'conversation-id': conversationId,
        'correlation-id': correlationId,
        'authorization': `APIKEY ${apiKey}`,
        'Origin': 'https://cdn.registerdisney.go.com',
        'oneid-reporting': 'eyJzb3VyY2UiOiJmYW50YXN5IiwiY29udGV4dCI6ImRpcmVjdCJ9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
        pragma: 'no-cache',
        expires: -1,
        'cache-control' : 'no-cache'
    }
    const body = {
        loginValue: 'cliffhanger178',
        passowrd: 'hilliard1'
    }
    //console.log(config4);
    console.log('-------');
    return axios.post(loginURL, body, config4)
}).then(data => {
    console.log('hur')
}).catch(err => {
    console.log(uuid('730c6c14-4a79-46f6-9ebf-c9ab5eca8c1b'));
    console.log(uuid('9091063c-5d32-4768-9986-67a208ac6948'))
  //  console.log(err.response)
    console.log(err.response.data)
})
/*
var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "OPTIONS", 'https://registerdisney.go.com/jgc/v6/client/ESPN-ONESITE.WEB-PROD/api-key?langPref=en-US', false );
    xmlhttp.setRequestHeader("Access-Control-Request-Method", "POST");
    xmlhttp.setRequestHeader("Access-Control-Request-Headers", "cache-control,content-type,conversation-id,correlation-id,expires,pragma");
    xmlhttp.setRequestHeader("Origin", "https://cdn.registerdisney.go.com");
    xmlHttp.send( null );
console.log(xmlHttp)
*/
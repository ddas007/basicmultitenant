// const express = require("express");
// const passport = require("passport");
// const xsenv = require("@sap/xsenv");
// const JWTStrategy = require("@sap/xssec").JWTStrategy;
// const vcapLocal = require("./default-services.json"); 
// const services = xsenv.getServices(vcapLocal);  // XSUAA service
// //const services = xsenv.loadEnv(vcapLocal);
// const app = express();
// passport.use(new JWTStrategy(services.uaa));
// app.use(passport.initialize());
// app.use(passport.authenticate("JWT", { session: false }));


const express = require("express");
var cfenv = require("cfenv");
const appEnv = cfenv.getAppEnv();
const JWTStrategy = require("@sap/xssec").JWTStrategy;
const app = express();
const passport = require("passport");
const xsenv = require("@sap/xsenv");
const bodyParser = require('body-parser');
var vcapLocal;
try {
  vcapLocal = require("./vcap-local.json");  
} catch (e) {
}
const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {};

var xsuaa_services = cfenv.getAppEnv(appEnvOpts).getService("basicmultitenant-xsuaa").credentials;
var registry_services = cfenv.getAppEnv(appEnvOpts).getService("basicmultitenant-registry").credentials;

passport.use(new JWTStrategy(xsuaa_services));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.authenticate("JWT", { session: false }));

app.get("/", function (req, res, next) {
  res.send("Welcome User from local: " + req.user.name.givenName);
});

app.put("/callback/v1.0/tenants/*", function (req, res) {
  //let tenantURL = "https://consumer1-es391rmq-dev-basicmultitenant-service.cfapps.us10-001.hana.ondemand.com";
  let tenantHost = req.body.subscribedSubdomain + '-' + appEnv.app.space_name.toLowerCase().replace(/_/g, '-') + '-' + registry_services.appName.toLowerCase().replace(/_/g, '-');
  //console.log('Suscribe: ', req.body.subscribedSubdomain, req.body.subscribedTenantId, tenantHost, tenantURL);
  res.send(200).send(tenantURL);
});

app.delete("/callback/v1.0/tenants/*", function (req, res) {
  //let tenantHost = "https://consumer1-es391rmq-dev-basicmultitenant-service.cfapps.us10-001.hana.ondemand.com";
  let tenantHost = req.body.subscribedSubdomain + '-' + appEnv.app.space_name.toLowerCase().replace(/_/g, '-') + '-' + registry_services.appName.toLowerCase().replace(/_/g, '-');
  console.log('Unsuscribe: ', req.body.subscribedSubdomain, req.body.subscribedTenantId, tenantHost);
  res.send(200).send(tenantHost);
});

app.get('/srv/info', function (req, res) {
  if (req.authInfo.checkScope('$XSAPPNAME.User')) {
    let info = {
      'userName': req.user.name.givenName,
      'userInfo': req.authInfo.userInfo,  // This will not work
      'subdomain': req.authInfo.subdomain, // This will not work
      'tenantId': req.authInfo.identityZone // This will not work
    };
    res.status(200).json(info);
  } else {
    res.status(403).send('Forbidden');
  }

});

const port = process.env.PORT || 4000;
app.listen(port, function () {
  console.log("Basic NodeJs listening on port " + port);
});
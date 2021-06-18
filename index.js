'use strict';

var express = require('express');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var methodOverride = require('method-override');
var passport = require('passport');
var bunyan = require('bunyan');
var morgan = require('morgan');
const path = require("path");
const fs = require("fs");

var config = require('./config');
const BASE_URI = process.env.baseUri || "https://leenet3.azurewebsites.net";
const REDIRECT_URI = `${BASE_URI}/redirect`;
const distFolder = path.join(process.cwd(), 'client');


var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const { response } = require('express');
var log = bunyan.createLogger({
    name: 'Microsoft OIDC Example Web Application'
});
/******************************************************************************
 * Set up passport in the app 
 ******************************************************************************/

//-----------------------------------------------------------------------------
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.  Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
//-----------------------------------------------------------------------------
passport.serializeUser(function(user, done) {
    done(null, user.oid);
});

passport.deserializeUser(function(oid, done) {
    findByOid(oid, function (err, user) {
        done(err, user);
    });
});

// array to hold logged in users
var users = [];

var findByOid = function(oid, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        log.info('we are using user: ', user);
        if (user.oid === oid) {
            return fn(null, user);
        }
    }
    return fn(null, null);
};

//-----------------------------------------------------------------------------
// Use the OIDCStrategy within Passport.
// 
// Strategies in passport require a `verify` function, which accepts credentials
// (in this case, the `oid` claim in id_token), and invoke a callback to find
// the corresponding user object.
// 
// The following are the accepted prototypes for the `verify` function
// (1) function(iss, sub, done)
// (2) function(iss, sub, profile, done)
// (3) function(iss, sub, profile, access_token, refresh_token, done)
// (4) function(iss, sub, profile, access_token, refresh_token, params, done)
// (5) function(iss, sub, profile, jwtClaims, access_token, refresh_token, params, done)
// (6) prototype (1)-(5) with an additional `req` parameter as the first parameter
//
// To do prototype (6), passReqToCallback must be set to true in the config.
//-----------------------------------------------------------------------------
passport.use(new OIDCStrategy({
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    redirectUrl: config.creds.redirectUrl,
    allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
    clientSecret: config.creds.clientSecret,
    validateIssuer: config.creds.validateIssuer,
    isB2C: config.creds.isB2C,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    scope: config.creds.scope,
    loggingLevel: config.creds.loggingLevel,
    nonceLifetime: config.creds.nonceLifetime,
    nonceMaxAmount: config.creds.nonceMaxAmount,
    useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
    cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
    clockSkew: config.creds.clockSkew,
},
function(iss, sub, profile, accessToken, refreshToken, done) {
    if (!profile.oid) {
    return done(new Error("No oid found"), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(function () {
    findByOid(profile.oid, function(err, user) {
        if (err) {
        return done(err);
        }
        if (!user) {
        // "Auto-registration"
        users.push(profile);
        return done(null, profile);
        }
        return done(null, user);
    });
    });
}
));
 
 
//-----------------------------------------------------------------------------
// Config the app, include middlewares
//-----------------------------------------------------------------------------
var app = express();
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', distFolder);
app.use(morgan('dev'));
app.use(methodOverride());
app.use(cookieParser());
 
 // set up session middleware
 app.use(expressSession({ secret: 'oBZ83#co7JqfmC163Bjp%#22%Pc', resave: true, saveUninitialized: false }));
 
 app.use(express.urlencoded({ extended : true }));
 
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());


//-----------------------------------------------------------------------------
// Set up the route controller
//
// 1. For 'login' route and 'returnURL' route, use `passport.authenticate`. 
// This way the passport middleware can redirect the user to login page, receive
// id_token etc from returnURL.
//
// 2. For the routes you want to check if user is already logged in, use 
// `ensureAuthenticated`. It checks if there is an user stored in session, if not
// it will call `passport.authenticate` to ask for user to log in.
//-----------------------------------------------------------------------------
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
        res.redirect('/login');
};
app.get('/', ensureAuthenticated, function(req, res) {
    const indexHtml = fs.existsSync(path.join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';
    res.render(indexHtml, {req, res, user: req.user})
});

// '/account' is only available to logged in user
app.get('/account', ensureAuthenticated, function(req, res) {
    res.render('account', { user: req.user });
});

app.get('/error1', function(req, res) {
    res.end()
});
app.get('/error2', function(req, res) {
    res.end()
});
app.get('/error3', function(req, res) {
    res.end()
});
app.get('/error4', function(req, res) {
    res.end()
});
app.get('/error5', function(req, res) {
    res.end()
});

app.get('/login',
    function(req, res, next) {
        passport.authenticate('azuread-openidconnect', 
        { 
            response: res,                      // required
            resourceURL: config.resourceURL,    // optional. Provide a value if you want to specify the resource.
            customState: 'my_state',            // optional. Provide a value if you want to provide custom state value.
            failureRedirect: '/error1' 
        }
        )(req, res, next);
    },
    function(req, res) {
        log.info('Login was called in the Sample');
        res.redirect('/error2');
});

// 'GET returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// query (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.get('/auth/openid/return',
    function(req, res, next) {
        passport.authenticate('azuread-openidconnect', 
        { 
            response: res,                      // required
            failureRedirect: '/error3'  
        }
        )(req, res, next);
    },
    function(req, res) {
        log.info('We received a return from AzureAD.');
        res.redirect('/error4');
});

// 'POST returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// body (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.post('/auth/openid/return',
    function(req, res, next) {
        passport.authenticate('azuread-openidconnect', 
        { 
            response: res,                      // required
            failureRedirect: '/error5'  
        }
        )(req, res, next);
    },
    function(req, res) {
        log.info('We received a return from AzureAD.');
        res.redirect('/');
});

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get('/logout', function(req, res){
    req.session.destroy(function(err) {
        req.logOut();
        res.redirect(config.destroySessionUrl);
    });
});
app.use('*.*', ensureAuthenticated, (req, res, next) => {
    next();
});
app.get('*.*', express.static(distFolder, {
    maxAge: '1y'
}));

app.listen(8080);

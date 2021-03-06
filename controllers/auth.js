// Authentication middelwares
var db = require('../models/db');
var Participant = db.Participant;
var config = require('../config').adminConfig;

// admin username & password
const USERNAME = config.username;
const PASSWORD = config.password;

const AS_INSTRUCTOR = 'instructor';
const AS_PARTICIPANT = 'participant';

// set admin username/password here
const verifyInstructor = (username, password) => {
    return (username == USERNAME &&  password == PASSWORD);
}

const verifyParticipant = (username) => {
    if (username != username.toLowerCase()) {
        return false;
    }
    return Participant.findOne({
        where: {
            id: username
        }
    }).then((result) => {
        return result !== null;
    });
}

const isInstructor = (cookies) => {
    return cookies[AS_INSTRUCTOR] && cookies[AS_INSTRUCTOR] == USERNAME;
}
exports.isInstructor = isInstructor;

const isParticipant = (cookies) => {
    return cookies[AS_PARTICIPANT];
}
exports.isParticipant = isParticipant;
exports.getParticipantID = isParticipant;

exports.authenticate = async (req, res, next) => {
    var loginAs = req.body.loginAs
      , username = req.body.username
      , password = req.body.password;
    if (loginAs == AS_INSTRUCTOR) {
        if (verifyInstructor(username, password)) {
            res.cookie(AS_INSTRUCTOR, username);
            res.redirect('/admin');
        } else {
            req.flag = 2;
            next();
        }
    } else if (loginAs == AS_PARTICIPANT && await verifyParticipant(username, password)) {
        res.cookie(AS_PARTICIPANT, username);
        res.redirect('/play');
    } else {
        req.flag = 1;
        next();
    }
}

// check if the instructor has logged in
exports.checkAuthInstructor = (req, res, next) => {
    if (!isInstructor(req.cookies)) {
        res.redirect('/login');
    } else {
        next();
    }
}

// check if the participant has logged in
exports.checkAuthParticipant = (req, res, next) => {
    if (!isParticipant(req.cookies)) {
        res.redirect('/login')
    } else {
        next();
    }
}

exports.clearCookie = (req, res, next) => {
    res.clearCookie(AS_INSTRUCTOR);
    res.clearCookie(AS_PARTICIPANT);
    next();
}

// set log-in failure flag
exports.authFail = (req, res) => {
    res.render('login', {flag: req.flag});
}

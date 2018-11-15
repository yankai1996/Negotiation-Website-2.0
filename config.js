// custom your MySQL config here
var dbConfig = {
    database: 'ra_website_v2',
    username: 'root',
    password: 'admin@0225',
    host: 'localhost',
    port: 3306,
    init: false
};

// custom your admin username and password here
var adminConfig = {
    username: 'admin',
    password: 'admin'
};

// custom your port number here
var serverConfig = {
    port: 8888
}

// the experiment parameters
const defaultParams = {
    alpha: 0.2,
    beta: 0.6,
    t: 10
}

// the base payment
const money = {
    basePayment: 40,
    periodCost: 0.1,
    resellingPrice: 12
};

exports.dbConfig = dbConfig;
exports.adminConfig = adminConfig;
exports.serverConfig = serverConfig;
exports.defaultParams = defaultParams;
exports.money = money;

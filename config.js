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

// highest price table
const table = {
    10: [1.00, 5.00, 8.00, 10.26, 12.12, 13.74,
        15.22, 16.59, 17.90, 19.16, 20.37],
    5: [5.00, 8.00, 10.26, 12.12, 13.74, 15.22],
    15: [0.00, 1.00, 5.00, 8.00, 10.26, 12.12,
        13.74, 15.22, 16.59, 17.90, 19.16,
        20.37, 21.56, 22.72, 23.87, 24.99]
}

exports.dbConfig = dbConfig;
exports.adminConfig = adminConfig;
exports.serverConfig = serverConfig;
exports.defaultParams = defaultParams;
exports.money = money;
exports.table = table;
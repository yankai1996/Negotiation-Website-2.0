# Negotiation-Website-2.0

Version 2.0 of [Negotiation-Website](https://github.com/yankai1996/Negotiation-Website). A web app for business experiment on negotiation in supply chains.


## Requirements

The website is based on 

* Node.js
* MySQL

## Installation

- [Download](https://github.com/yankai1996/RA-Website/archive/master.zip) and unzip the source code.
- Run `npm install`.
- Create a new MySQL database.
- Open `config.js`, customize the variables you need.
- Run `node server.js` to launch the website.



### Modules Dependency

* `express` - The website framework
* `mysql2`
* `sequelize` - A promise-based ORM for operating MySQL. View [Sequelize](http://docs.sequelizejs.com/).
* `cookie-parser`
* `morgan` 
* `socket.io` - For real-time bi-directional communication between the client s and server. View [Socket.IO](https://socket.io/).
* `socket.io-cookie`
* `browser-detect`
* `highcharts.js` - View [Highcharts](https://www.highcharts.com/).



## Experiment Description 2.0

In this experiment, you will perform as a buyer or seller in the negotiations between supply chain partners.

### The Buyer's Problem

You are buying a unique product that you can resell for **\$12** in the market. The seller cannot access the market. The market will be available for **T = 10** periods from now. In each period, either you or the seller will propose a price for this product and the other party will decide whether to accept or to reject the price. If the price is accepted, the negotiation ends; otherwise, the negotiation enters the next period. In each period when you negotiate, you will incur a fixed negotiation cost of **\$0.1**. If an agreement is not reached after T = 10 periods, you will have nothing to sell.

There are two uncertainties in this process. First, the party that proposes the price in any period is random. The probability that you will get to propose a price is **&beta; = 60%** (i.e., 40% chance the seller will get to propose the price). Second, there might be other external buyers who show interest in buying the product. According to experience, the highest price (guaranteed) at which the seller can sell to the external buyers is increasing in the total number of external buyers who show up in the T periods. The relationship is summarized in [Table 1](#table-1) In each period there is a chance of **&alpha; = 20%** that an external buyer shows up. If the product is not sold to you, the seller will sell it to external buyers at the highest guaranteed price.

##### Table 1

| Total Number of External<br/>buyers in 10 periods | Highest Price from<br/>External buyers |
| :-----------------------------------------------: | :------------------------------------: |
|                         0                         |                  1.00                  |
|                         1                         |                  5.00                  |
|                         2                         |                  8.00                  |
|                         3                         |                 10.26                  |
|                         4                         |                 12.12                  |
|                         5                         |                 13.74                  |
|                         6                         |                 15.22                  |
|                         7                         |                 16.59                  |
|                         8                         |                 17.90                  |
|                         9                         |                 19.16                  |
|                        10                         |                 20.37                  |

Your goal is to maximize your profit by deciding what price to offer if you are asked to propose the price, and deciding whether you want to accept the price proposed by the seller.

### The Seller's Problem

You are selling a unique product to a buyer. If the buyer buys the product, he can resell it for **\$12** in a market, which you cannot access. The market will be available to the buyer only for **T = 10** periods from now. In each period, either you or the buyer will propose a price for this product and the other party will decide whether to accept or to reject the price. If the price is accepted, the negotiation ends; otherwise, the negotiation enters the next period. In each period when you negotiate, you will incur a fixed negotiation cost of **\$0.1**. If an agreement is not reached after T = 10 periods, this buyer will leave.

There are two uncertainties in this process. First, the party that proposes the price in any period is random. The probability that the buyer will get to propose a price is **&beta; =60%** (i.e., 40% chance you will get to propose the price). Second, there might be other external buyers who show interest in buying the product. According to experience, the expected price at which you can sell to the external buyers is increasing in the total number of external buyers who show up in the T periods. The expected price levels are given in [Table 1](#table-1). In each period there is a probability of **&alpha; = 20%** that an external buyer shows up. If the product is not sold to the first buyer, you will sell it to external buyers at the highest guaranteed price.

Your goal is to maximize your profit by deciding what price to offer if you are asked to propose the price, and deciding whether you want to accept the price proposed by the buyer.

### Parameters

| Variable      |                                                              |
| ------------- | ------------------------------------------------------------ |
| &alpha; = 0.2 | the probability that an external buyer shows in each period  |
| &beta; = 0.6  | the probability that the buyer proposes the price in each period |
| T = 10        | the maximum number of negotiation periods                    |

| Constant         |             |
| ---------------- | ----------- |
| Reselling price  | $12         |
| Negotiation cost | $0.1/period |

If there are in total 5 periods, then the highest price from external buyers are given in [Table 2](#table-2):

##### Table 2

| Total Number of External<br />buyers in 5 periods | Highest Price from<br />External buyers |
| :-----------------------------------------------: | :-------------------------------------: |
|                         0                         |                  5.00                   |
|                         1                         |                  8.00                   |
|                         2                         |                  10.26                  |
|                         3                         |                  12.12                  |
|                         4                         |                  13.74                  |
|                         5                         |                  15.22                  |

If there are in total 15 periods, then the highest price from external buyers are given in [Table 3](#table-3): 

##### Table 3

| Total Number of External<br />buyers in 15 periods | Highest Price from<br />External buyers |
| :------------------------------------------------: | :-------------------------------------: |
|                         0                          |                  0.00                   |
|                         1                          |                  1.00                   |
|                         2                          |                  5.00                   |
|                         3                          |                  8.00                   |
|                         4                          |                  10.26                  |
|                         5                          |                  12.12                  |
|                         6                          |                  13.74                  |
|                         7                          |                  15.22                  |
|                         8                          |                  16.59                  |
|                         9                          |                  17.90                  |
|                         10                         |                  19.16                  |
|                         11                         |                  20.37                  |
|                         12                         |                  21.56                  |
|                         13                         |                  22.72                  |
|                         14                         |                  23.87                  |
|                         15                         |                  24.99                  |



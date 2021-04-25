# ethbalance
Graph the historical ETH Balance across multiple Ethereum addresses, then export the csv. The csv will contain 3 additional columns: prevbalance, balance, Total

When you submit your wallet transactions to the IRS from a per wallet perspective, and every time the balance drops (expense) or rises (income), the IRS agent can try to tax you. From the perspective of your left pocket, the balance has dropped when moving money from pocket to pocket, and your right pocket gains. This graph/csv shows you from the perspective of your pants (not an individual pocket). From your pants perspective your balance hasn't changed.

For example, if you moved coin to your phone, then sent it to your new phone later, and didn't properly backup your old phone then the IRS will pretend your old phone is a 3rd party. As if the coin left your possession. So that is a capital gain/loss when you sent it to the 3rd party, and then income when you received it from the 3rd party again. So if you have physical possession of your coins, the most important thing is your 12 or 24 word seed phrase. Even if there is no money in it. If you have every backup of every wallet you ever had coin in then there is any 'easy' way to trace your coin to its origin of when you got it. Easy relative to tracking it manually on the blockchain. 

# btcbalance
To track your coin from your pants perspective, do the following: Create an Electrum wallet called all_btc_wallet. From every other **empty** wallet you own, export out the private keys, and load them into all_btc_wallet. Then use the **electrum_export_tool.py** to export your transactions which will keep a running total of your coin from your 'pants' persepective.

# ethbalance (continued)
![alt text](https://github.com/maddadder/ethbalance/blob/master/screenshot.png?raw=true)

# Demo
[link to demo](https://maddadder.github.io/ethbalance/client/index.html)

# Build Instructions
1. navigate to the root of this project

2. npm install

3. npm run start

4. Navigate to http://localhost:8080/

# Docker
1. Navigate to Utils/Docker
2. docker-compose build
3. docker-compose up

# Terraform
* optional begin
- sudo ap-get install pass
- pass init YOUR_GPG_KEY_ID
- pass insert access_key
- pass insert secret_key
- export TF_VAR_access_key=$(pass access_key)
- export TF_VAR_secret_key=$(pass secret_key)
* optional end
- Navigate to ./Utils/Terraform
- terraform init
- terraform plan
- terraform apply

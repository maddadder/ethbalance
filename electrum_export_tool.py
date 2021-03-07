# In electrum console, you must copy/paste one line at a time (except the comments)
# The startBlock to endBlock is from year 2009 to 2021. Adjust accordingly
startBlock = 1000
# latest block found here: https://blockchain.info/q/getblockcount
endBlock = 673198

# Step 1, Import every private key you own with an EMPTY balance into this wallet

# Step 2, Print out every address you own from startBlock to endBlock. Keep for your records
lst = []
for addr in wallet.get_addresses():
    if wallet.is_used(addr):
        hist = getaddresshistory(addr)
        for i in range(len(hist)):
            if(hist[i]['height'] > startBlock and hist[i]['height'] < endBlock):
                if addr not in lst:
                    lst.append(addr)
for i in range(len(lst)):
    print(lst[i])

# Step 3, 
# In the label of every transaction:
# # list the input(s) address for income (optional)
# # list the output(s) address for expense (optional)
# Use the code below to export your transactions from startBlock to endBlock
# This export will list the running balance as coin moves in the bc_balance column

#wallet,timestamp,transaction_hash,label,value,direction,bc_balance
hist = onchain_history()['transactions']
for i in range(len(hist)):
    if(hist[i]['height'] > startBlock and hist[i]['height'] < endBlock):
        fee = hist[i]["fee"]
        if not fee:
            fee = 0
        print(hist[i]["date"] + "," + hist[i]["txid"]+ "," + hist[i]["label"] + "," + str(hist[i]["bc_value"]) + "," + str(fee) + "," + str(hist[i]["incoming"]) + "," + str(hist[i]["bc_balance"]))

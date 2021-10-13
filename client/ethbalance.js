
class EthBalance
{
	constructor()
	{
		this.global = {
			all_eth_external: [],
			balances: [],
			etherscan_apikey:''
		}
		this.promisify = (inner) =>
			new Promise((resolve, reject) =>
				inner((err, res) => {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				})
			);
		this.sleep = m => new Promise(r => setTimeout(r, m));
	}
	
	/**
	* Get the first transaction block for an address
	* @param {string} address 
	* @returns json
	*/
	async getTxList(address) {
		let response = await fetch("https://api.etherscan.io/api?apikey=" + this.global.etherscan_apikey + "&module=account&action=txlist&address=" + address + "&sort=asc");
		let data = await response.json();
		if ((data.result).length > 0) {
			return data.result;
		} else {
			throw(data.result);
		}
	}
	/**
	* Given an address and a range of blocks, 
	* query the Ethereum blockchain for the 
	* ETH balance across the range
	* @param {string} address 
	* @param {number} startBlock 
	* @param {number} endBlock 
	* @param {number} step 
	* @returns Array
	*/
	async getBalanceInRange(address, startBlock, endBlock, step) {

		//Update UX with Start and End Block
		document.getElementById('startBlock').value = startBlock;
		document.getElementById('endBlock').value = endBlock;

		// Tell the user the data is loading...
		document.getElementById("output").innerHTML = "Loading";

		var promises = []

		// Loop over the blocks, using the step value
		for (let i = startBlock; i <= endBlock; i = i + step) {
			// Create a promise to query the ETH balance for that block
			let balancePromise = this.promisify(cb => web3.eth.getBalance(address, i, cb));
			// Create a promise to get the timestamp for that block
			let timePromise = this.promisify(cb => web3.eth.getBlock(i, cb));
			// Push data to a linear array of promises to run in parellel.
			promises.push(i, balancePromise, timePromise);
		}

		// Call all promises in parallel for speed, result is array of {block: <block>, balance: <ETH balance>}
		var results = await Promise.all(promises);

		// Restructure the data into an array of objects
		var balances = []
		for (let i = 0; i < results.length; i = i + 3) {
			balances.push({
				address:address,
				block: results[i],
				balance: parseFloat(web3.utils.fromWei(results[i + 1], 'ether')),
				time: new Date(results[i + 2].timestamp * 1000),
				transactions:results[i + 2].transactions
			})
		}

		//Remove loading message
		document.getElementById("output").innerHTML = "";

		return balances;
	}

	/**
	* Unpack a multi-dimensional object
	* @param {Array} rows 
	* @param {string} index 
	* @returns 
	*/
	unpack(rows, index) {
		return rows.map(function (row) {
			return row[index];
		});
	}

	// Create the plotly.js graph
	createGraph(balances) {
		// Create the trace we are going to plot
		var trace = {
			type: "scatter",
			mode: "lines",
			x: this.unpack(balances, 'block'),
			y: this.unpack(balances, 'Total'),
			hoverinfo: "y+text",
			//text: unpack(balances, 'DateTime')
			text: this.unpack(balances, 'highestBalanceAddress')
		}


		// Settings for the graph
		var layout = {
			title: 'ETH Balance over Ethereum Blocks',
			xaxis: {
				autorange: true,
				rangeslider: {},
				type: 'linear',
				title: 'Block'
			},
			yaxis: {
				autorange: true,
				type: 'linear',
				title: 'ETH Balance'
			}
		};

		Plotly.newPlot('graph', [trace], layout);

	}

	// Sort function for sort by block value
	sortBlock(a, b) {
		if(a.block < b.block) { return -1; }
		if(a.block > b.block) { return 1; }
		return 0;
	}
	sortblockNumber(a, b) {
		if(parseInt(a.blockNumber) < parseInt(b.blockNumber)) { return -1; }
		if(parseInt(a.blockNumber) > parseInt(b.blockNumber)) { return 1; }
		return 0;
	}

	sortAddress(a, b) {
		if(a.address < b.address) { return -1; }
		if(a.address > b.address) { return 1; }
		return 0;
	}

	//Reset the page
	reset() {
		document.getElementById('output').innerHTML = "";
		Plotly.purge('graph');
		this.global.balances = [];
	}
	onlyUnique(value, index, self) {
		return self.indexOf(value) === index;
	}
	
	async getTxLists(self) 
	{
		let addressesText = document.getElementById("addresses").value;
		self.global.etherscan_apikey = document.getElementById("etherscan_apikey").value
		let addresses = [];
		if(addressesText && addressesText.indexOf('\n')){
			addresses = addressesText.split("\n");
		}
		let uniqueAddresses = addresses.filter(self.onlyUnique);
		self.global.all_eth_external = [];

		for(let i=0;i<uniqueAddresses.length;i++)
		{
			await self.sleep(1000);
			let address = uniqueAddresses[i];
			let result = await self.getTxList(address);
			for(let j=0;j<result.length;j++)
			{
				if(!result[j].blockNumber)
					continue;
				result[j].address = address;
				result[j].DateTime = new Date(result[j].timeStamp * 1000);
				self.global.all_eth_external.push(result[j]);
			}
		}
		await self.graphBalance(self.global.all_eth_external);
	}

	async graphBalance(txList) {
		this.reset();
		this.global.balances = [];
		let addresses = [];
		txList.sort(this.sortAddress);
		for(var i = 0;i<txList.length;i++)
		{
			var tx = txList[i];
			if(!tx.address){
				console.warn("something went wrong");
				continue;
			}
			let foundAddress = addresses.find(x => x == web3.utils.toChecksumAddress(tx.address));
			if(!foundAddress){
				
				addresses.push(web3.utils.toChecksumAddress(tx.address));
			}
		}
		console.log('unique list of addresses:')
		console.log(addresses);
		for(var i = 0;i<txList.length;i++)
		{
			var tx = txList[i];
			// Find the intial range, from first block to current block
			var startBlock = parseInt(tx.blockNumber) - 1;
			var endBlock = parseInt(tx.blockNumber);
			var skip = (endBlock - startBlock) + 1;
	
			let address = web3.utils.toChecksumAddress(tx.address);
			var step = 1;
			var localbalances = [];
			for(let j=0;j<addresses.length;j++)
			{
				let localbalance = await this.getBalanceInRange(addresses[j], startBlock, endBlock, step);
				if(!localbalance.length)
				{
					throw(tx.Txhash);
				}
				localbalances.push(localbalance);
			}
			let localbalance = localbalances.find(x => x.some(y => y.address == address));
			if(localbalance.length != skip){
				throw("something went wrong");
			}
			let otherTotal = 0;
			tx.highestBalanceAddress = "";
			let highestBalance = 0;
			for (let k = 0; k < localbalances.length; k++) 
			{
				let otherBalance = localbalances[k];
				for (let l = 1; l < otherBalance.length; l = l + skip) 
				{
					let previousTotal = otherBalance[l-1].balance;
					otherTotal += otherBalance[l].balance;
					if(highestBalance < otherBalance[l].balance)
					{
						highestBalance = otherBalance[l].balance;
						tx.highestBalanceAddress = otherBalance[l].address;
					}
				}
			}
			for (let k = 1; k < localbalance.length; k = k + skip) 
			{
				if(localbalance[k].balance >= 0){
					tx.prevbalance = localbalance[k-1].balance;
					tx.balance = localbalance[k].balance;
					tx.Total = otherTotal;
				}
				else
				{
					throw("something went wrong");
				}
			}
		}
		txList.sort(this.sortblockNumber);
		for(var i = 0;i<txList.length - 1;i++)
		{
			let previous = txList[i];
			let next = txList[i + 1];
			if(previous.blockNumber == next.blockNumber){
				if(web3.utils.toChecksumAddress(previous.to) == web3.utils.toChecksumAddress(previous.address)){
					//swap order
					var tmp = txList[i + 1];
					txList[i + 1] = txList[i];
					txList[i] = tmp;
				}
			}
		}
		for(var i = 0;i<txList.length;i++)
		{
			let tx = txList[i];
			tx.defaultSortOrder = i;
			this.global.balances.push({
				address:tx.address,
				block: parseInt(tx.blockNumber),
				Total: tx.Total,
				DateTime: tx.DateTime,
				highestBalanceAddress:tx.highestBalanceAddress
			});
		}
		// Create the graph
		if(this.global.balances.length)
		{
			this.global.balances.sort(this.sortBlock);
			this.createGraph(this.global.balances);
		}
		var json = txList;
		var fields = Object.keys(json[0])
		var replacer = function(key, value) { return value === null ? '' : value } 
		var csv = json.map(function(row){
			return fields.map(function(fieldName){
				return JSON.stringify(row[fieldName], replacer)
			}).join(',')
		});
		csv.unshift(fields.join(',')) // add header column
		csv = csv.join('\r\n');
		console.log(csv);
	}
	
	readSingleFile(self, evt) {

		var f = evt.target.files[0]; 
		if (f) {
			var r = new FileReader();
			r.onload = async function(e) { 
				var contents = e.target.result;
				var allTextLines = contents.split(/\r\n|\n/);
				var headers = allTextLines[0].split(',');
				for(let i=0;i<headers.length;i++){
					if(headers[i] == 'Blockno'){
						headers[i] = 'blockNumber';
					}
					else if(headers[i] == 'To'){
						headers[i] = 'to';
					}
				}
				self.global.all_eth_external = [];

				for (var i=1; i<allTextLines.length; i++) {
					var data = allTextLines[i].split(',');
					if (data.length > 1) {
						var tarr = "{";
						for (var j=0; j<headers.length; j++) {
							tarr += "\"" + [headers[j]] + "\":\"" + data[j] + "\"";
							if(j < headers.length - 1){
								tarr += ",";
							}
						}
						tarr += "}";
						self.global.all_eth_external.push(JSON.parse(tarr));
					}
				}
				await self.graphBalance(self.global.all_eth_external);
			}
			r.readAsText(f);
		} else { 
			alert("Failed to load file");
		}
	}
}

export default EthBalance;
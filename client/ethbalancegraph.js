import EthBalance from "./ethbalance.js";

// Check for MetaMask, otherwise use an HTTP Provider
window.addEventListener('load', function () {
    if (typeof web3 !== 'undefined') {
        console.log('Web3 Detected! ' + web3.currentProvider.constructor.name)
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.log('No Web3 Detected... using HTTP Provider');
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
})

document.getElementById('fileinput').addEventListener('change', (evt) => {
    const obj = new EthBalance();
    obj.readSingleFile(evt);
}, false);
document.getElementById('graphBalanceButton').addEventListener("click", () => {
    const obj = new EthBalance();
    obj.getTxLists();
}, false);
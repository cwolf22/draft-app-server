var url = "http://localhost:3000/bs/v1/drafter/valid-transactions/1wqsArgehrI2Mq8kGJ2gi4hd-LuCWA-RaMmaVtgQkbwc/3";
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();
xhr.open('GET', url, false);
xhr.send(null);

console.log("\n-----------------");
console.log("- R E S P O N S E")
console.log("-----------------\n");
console.log(xhr.responseText + '\n')

if (xhr.status == 409) {
    process.exit(1)
}

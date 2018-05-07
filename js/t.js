'use strict';

const dappAddress = "n1yx2oKWmQAa7Jxyvu8Y4HHW9gVCnPYycVH";
let NebPay = require("nebpay"); 
let nebPay = new NebPay();

document.querySelector(".message-send").addEventListener("click", saveMessage);
document.querySelector("#recentlyMessages").addEventListener("click", loadRecentlyMessages);
document.querySelector("#dailyTop").addEventListener("click", loadDailyTop);
document.querySelector("#weeklyTop").addEventListener("click", loadWeeklyTop);
document.querySelector("#monthlyTop").addEventListener("click", loadMonthlyTop);
loadRecentlyMessages();    


function loadRecentlyMessages() {
    selectMenuItem(0);
    showLoader();
    let to = dappAddress;
    let value = "0";
    let callFunction = "get";
    let limit = 50;
    let offset = 0;
    let callArgs = `[${limit}, ${offset}]`;
    nebPay.simulateCall(to, value, callFunction, callArgs, {  
        callback: function(resp){
            console.log(resp);
            let result = JSON.parse(resp.result);
            let messages = result.sort(compareMessagesByDate);
            addMessagesToContainer(messages);
        }   
    });
}

function showLoader() {
    clearMessageContainer();
    let div = document.createElement('div');
    div.innerHTML = `<div class="windows8">
	<div class="wBall" id="wBall_1">
		<div class="wInnerBall"></div>
	</div>
	<div class="wBall" id="wBall_2">
		<div class="wInnerBall"></div>
	</div>
	<div class="wBall" id="wBall_3">
		<div class="wInnerBall"></div>
	</div>
	<div class="wBall" id="wBall_4">
		<div class="wInnerBall"></div>
	</div>
	<div class="wBall" id="wBall_5">
		<div class="wInnerBall"></div>
	</div>
</div>`;

    let container = document.querySelector(".messages-container");
    container.append(div.firstChild);
}

function addMessagesToContainer(messages) {
    clearMessageContainer();
    if(!messages || messages.length == 0) {
        let container = document.querySelector(".messages-container");
        container.innerHTML = '<div class="no-stories">There is no stories yet. Be first!</div>';
    }

    for(let msg of messages) {
        if(msg){
            addMessageToPage(msg);
        }
    }
}

function loadDailyTop() {
    selectMenuItem(1);
    showLoader();
    let to = dappAddress;
    let value = "0";
    let callFunction = "getByDate";
    let date = dateToEpoch(new Date());
    let callArgs = `[${date}]`;
    nebPay.simulateCall(to, value, callFunction, callArgs, {  
        callback: function(resp){
            console.log(resp);
            try {
                let result = JSON.parse(resp.result);
                let messages = result.sort(compareMessagesByPrice).slice(0, 50);
                addMessagesToContainer(messages);
            }
            catch{}               
        }   
    });
}

function loadWeeklyTop() {
    selectMenuItem(2);
    showLoader();
    let to = dappAddress;
    let value = "0";
    let callFunction = "getByDate";

    const dayMs = 86400000;
    let counter = 0;
    let date = dateToEpoch(new Date());
    let messages = [];
    let loadedDate = [];
    while(counter < 7){
        let fromDate = date;
        let callArgs = `[${fromDate}]`;               
        nebPay.simulateCall(to, value, callFunction, callArgs, {  
            callback: function(resp){
                console.log(resp);
                try {
                    loadedDate.push(fromDate);
                    let result = JSON.parse(resp.result);
                    messages = messages.concat(result);  
                }
                catch {}                                
            }   
        });
        date -= dayMs;
        counter++;
    }

    let interval = setInterval(function() {
        if(loadedDate.length >= 7) {
            console.log(messages); 
            messages = messages.sort(compareMessagesByPrice).slice(0,  50); 
            addMessagesToContainer(messages); 
            clearInterval(interval);
        }        
    }, 500);       
}


function loadMonthlyTop() {
    selectMenuItem(3);
    showLoader();
    let to = dappAddress;
    let value = "0";
    let callFunction = "getByDate";

    const dayMs = 86400000;
    let counter = 0;
    let date = dateToEpoch(new Date());
    let messages = [];
    let loadedDate = [];
    while(counter < 30){
        let fromDate = date;
        let callArgs = `[${fromDate}]`;
        nebPay.simulateCall(to, value, callFunction, callArgs, {  
            callback: function(resp){
                console.log(resp);
                try {
                    loadedDate.push(fromDate);
                    let result = JSON.parse(resp.result);
                    messages = messages.concat(result); 
                }
                catch {}                                   
            }   
        });
        date -= dayMs;
        counter++;
    }

    let interval = setInterval(function() {
        if(loadedDate.length >= 30) {
            messages = messages.sort(compareMessagesByPrice).slice(0,  50);    
            addMessagesToContainer(messages); 
            clearInterval(interval);
        }        
    }, 500);       
}

function selectMenuItem(index) {
    let menuItems = document.querySelectorAll(".sidebar a");
    for(let i = 0; i < menuItems.length; i++) {
        if(i != index) {
            menuItems[i].classList.remove("selected");
        }
        else {
            menuItems[i].classList.add("selected");
        }
    }
}

function clearMessageContainer() {
    let container = document.querySelector(".messages-container");
    container.innerHTML = "";
}

function compareMessagesByPrice(msg1, msg2) {
    console.log(msg1.price, " ", msg2.price);
    return +msg1.price >= +msg2.price ? -1 : 1;
}

function compareMessagesByDate(msg1, msg2) {
    if(!msg1 || !msg2)
        return 0;

    let date1 = new Date(+msg1.date);
    let date2 = new Date(+msg2.date);
    return date1 >= date2 ? -1 : 1;
}

function saveMessage() {
    let text = document.querySelector(".message-input").value;
    let to = dappAddress;
    let value = "0";
    let callFunction = "save"
    let callArgs = `["${text}", ${+new Date()}, ${dateToEpoch(new Date())}]`;

    nebPay.call(to, value, callFunction, callArgs, { 
        callback: cbSaveMessage
    });
}

function cbSaveMessage(resp) {
    console.log("response of save message: ");
    console.log(resp);
}

function addMessageToPage(msg) {
    let container = document.querySelector(".messages-container");
    let template = `<div class="user-message">
                        <div class="message-header">                        
                            <span class="message-importance ${getImportanceLevel(msg.price)}-importance">
                                <div class="importance-info">
                                    Author paid for this message:
                                    <div>${convertWeiToNas(msg.price)} NAS</div>
                                </div>
                            </span>
                            <span class="message-date">${convertDateToStr(msg.date)}
                                <div class="full-date">
                                    ${convertUnixToScreenDate(msg.date)}
                                </div>
                            </span>
                            <span class="message-author">${msg.author}</span>
                        </div>    
                    <div class="user-message-content">
                    ${html2text(msg.content)}
                    </div>
                </div>`;
    let div = document.createElement('div');
    div.innerHTML = template;
    container.append(div.firstChild)
}

function html2text(html) {
    var tag = document.createElement('div');
    tag.innerHTML = html;
    
    return tag.innerText;
}

function convertWeiToNas(value) {
    if(value) {
        return value / 1000000000000000000;
    }
}

function convertUnixToScreenDate(unixStamp) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];

    let date = new Date(+unixStamp);
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()} ${addZeroIfOne(date.getHours())}:${addZeroIfOne(date.getMinutes())}:${addZeroIfOne(date.getSeconds())}`;
}

function addZeroIfOne(s) {
    if(s.toString().length == 1) {
        return 0 + s.toString();
    }
    return s;
}

function getImportanceLevel(value) {
    if(!value)
        return "default";

    let price = value / 1000000000000000000;    
    if(price > 10)
        return "extra";
    if(price > 5)
        return "high";
    if(price > 2)
        return "middle";
    if(price > 0)
        return "low";
    
    return "default";
}

function convertDateToStr(unixStamp) {
    if(!unixStamp)
        return "a long time ago";

    let today = new Date(+unixStamp);
    let Christmas = new Date();
    let diffMs = (Christmas - today); // milliseconds between now & Christmas
    let diffDays = Math.floor(diffMs / 86400000); // days
    let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
    let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
    
    if(diffDays > 0){
        if(diffDays === 1) {
            return diffDays + " day ago"; 
        }
        return diffDays + " days ago";    
    }

    if(diffHrs > 0){
        if(diffHrs === 1) {
            return diffHrs + " hour ago"; 
        }
        return diffHrs + " hours ago";    
    }

    if(diffMins === 1) {
        return diffMins + " minute ago"; 
    }  
    return diffMins + " minutes ago";
}

function dateToEpoch(thedate) {
    let time = thedate.getTime();
    return time - (time % 86400000);
}

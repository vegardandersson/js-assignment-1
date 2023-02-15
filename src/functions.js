
let userValues = {
    "workBalance": 0,
    "bankBalance": 0,
    "loanBalance": 0
}

let loanPaymentRatio = 0.1;
let workSalaryPerClick = 100;

let workCurrency = "Kr.";
let bankCurrency = "Kr";
let storeCurrency = "NOK";

let computers;
let selectedComputer;

const baseURL = "https://hickory-quilled-actress.glitch.me/";



function updateMoney(){
    document.getElementById("bank-balance").innerHTML = 
                        userValues.bankBalance + " " + bankCurrency;
    document.getElementById("work-balance").innerHTML = 
                        userValues.workBalance + " " + workCurrency;
    document.getElementById("loan-balance").innerHTML = 
                        "- " + userValues.loanBalance + " " + bankCurrency;
    if(userValues.loanBalance > 0){
        document.getElementById("repay-loan-button").classList.remove("invisible")
        document.getElementById("loan-balance").classList.remove("invisible")
    }else{
        document.getElementById("repay-loan-button").classList.add("invisible")
        document.getElementById("loan-balance").classList.add("invisible")
    }
}

function handleLoan() {
    if(userValues.loanBalance > 0){return;}
    loanAmount = prompt("How much would you like to loan? (" + bankCurrency + ")");
    if(!loanAmount){return;}
    if(isNaN(loanAmount)){return;}
    if(loanAmount <= 0 || loanAmount > userValues.bankBalance*2){return;}
    userValues.loanBalance += Number(loanAmount);
    userValues.workBalance += Number(loanAmount);
    updateMoney();
}

function handleWork() {
    userValues.workBalance += workSalaryPerClick;
    updateMoney();
}

function handleDeposit() {
    let remainder = 0;
    if(userValues.workBalance <= 0){return;}
    if(userValues.loanBalance > 0){
        remainder = reduceLoan(userValues.workBalance*loanPaymentRatio)
        userValues.bankBalance += userValues.workBalance*(1-loanPaymentRatio);
    }else {
        userValues.bankBalance += userValues.workBalance;
    }
    userValues.bankBalance += remainder;
    userValues.workBalance = 0;
    updateMoney();
}

function handleRepayLoan() {
    if(userValues.workBalance <= 0){return;}
    if(userValues.loanBalance <= 0){return;}
    let remainder = reduceLoan(userValues.workBalance);
    userValues.bankBalance += remainder;
    userValues.workBalance = 0;
    updateMoney();
}

function reduceLoan(amount) {
    if(userValues.loanBalance - amount <= 0){
        let remainder = amount - userValues.loanBalance;
        userValues.loanBalance = 0;
        return remainder;
    } else {
        userValues.loanBalance -= amount;
        return 0;
    }
}

function handleBuyComputer() {
    if(selectedComputer.price > userValues.bankBalance){
        alert("You do not have sufficient funds to purchase this computer.");
        return;
    }
    userValues.bankBalance -= selectedComputer.price;
    updateMoney();
    alert("You are now the proud owner of " + selectedComputer.title);
}


async function getComputers() {
    try {
        const response = await fetch(baseURL + "computers");
        computers = await response.json();
        populateDropdown();
    } catch(error) {
        console.error(error);
    }
}

function populateDropdown() {
    let dropdown = document.getElementById("computer-dropdown");
    computers.map((computer, index) => {
        let newOption = document.createElement("option");
        newOption.text = computer.title;
        newOption.value = index;
        dropdown.add(newOption);
    })
    setSelectedComputer();
}

function setSelectedComputer(){
    let dropdown = document.getElementById("computer-dropdown");
    let computerIndex = dropdown.options[dropdown.selectedIndex].value;
    selectedComputer = computers[computerIndex];
    console.log(selectedComputer);
    updateComputerInformation();
}

function updateComputerInformation(){
    document.getElementById("computer-description-text").innerHTML = selectedComputer.description;
    document.getElementById("computer-price").innerHTML = selectedComputer.price + " " + storeCurrency;
    let specsList = document.getElementById("specs-list");
    specsList.innerHTML = "";
    selectedComputer.specs.map((spec, index) => {
        let newListItem = document.createElement("li");
        newListItem.innerHTML = spec;
        newListItem.key = index;
        specsList.appendChild(newListItem);
    })
    let imageContainer = document.getElementById("computer-image");
    let computerImage = document.createElement("img");
    computerImage.src = baseURL + selectedComputer.image;
    computerImage.alt = selectedComputer.title;
    imageContainer.innerHTML = "";
    imageContainer.appendChild(computerImage);
}
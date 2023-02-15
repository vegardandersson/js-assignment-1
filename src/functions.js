
// Since nothing is stored or communicated server-side
// other than retrieving the computers, the rest of the
// data is stored and manipulated locally and 
// erased each session reload


// All money parameters related to a user of the page
let userValues = {
    "workBalance": 0,
    "bankBalance": 0,
    "loanBalance": 0
}

// LoanPaymentRatio specifies how large a portion
// of the work money earned should be used to make
// downpayments on the loan when depositing to the bank
let loanPaymentRatio = 0.1;

// Set rate of money received from each unit of work
let workSalaryPerClick = 100;

// The list of computers and the computer that is
// currently selected and displayed based on the dropdown menu
let computers;
let selectedComputer;

// The base API url
const baseURL = "https://hickory-quilled-actress.glitch.me/";



function displayNOK(number){
    return Intl.NumberFormat('no-NO', {style: 'currency', currency: 'NOK'}).format(number);
}



/**
 * General update function for re-rendering all relevant values
 * in the money(work and bank) component. 
 * 
 * This function is used extensively
 * whenever another function modifies any of the user-specific values.
 * It might not always be a good idea to re-render like this considering
 * that document manipulation (which is an expensive operation) will occur
 * on elements that have not had their relevant value changed, but since this is
 * such a small application with such few re-renders overall I chose to do it this 
 * way to value code-readability/reusability over slight performance optimization
 */
function updateMoney(){
    document.getElementById("bank-balance").innerHTML = displayNOK(userValues.bankBalance);
    document.getElementById("work-balance").innerHTML = displayNOK(userValues.workBalance);
    document.getElementById("loan-balance").innerHTML = displayNOK(userValues.loanBalance);

    // We make the loan-balance component and the repay loan button either appear
    // or disappear based on whether the user has an active loan or not
    if(userValues.loanBalance > 0){
        document.getElementById("repay-loan-button").classList.remove("invisible")
        document.getElementById("loan-balance").classList.remove("invisible")
    }else{
        document.getElementById("repay-loan-button").classList.add("invisible")
        document.getElementById("loan-balance").classList.add("invisible")
    }
}


/**
 * Responsible for what happens when the "get loan" button is pressed.
 * First it checks several conditions of eligibility to loan as well as
 * correctness of input. If passed, the function adjusts work and loan balance
 * based on the inputted amount and then re-renders
 * @returns Nothing
 */
function handleLoan() {
    // If user already has an outstanding loan, another loan cannot be made
    if(userValues.loanBalance > 0){
        alert("You already have an outstanding loan!");
        return;
    }

    loanAmount = prompt("How much would you like to loan? (" + bankCurrency + ")");

    // Checks that something was inputted and submitted
    // and that it is in fact a number
    if(!loanAmount){return;}
    if(isNaN(loanAmount)){
        alert("Erronous input type!");
        return;
    }

    // The loan amount cannot be negative and a user is only
    // allowed to take out a loan that is no more than twice the bank balance
    if(loanAmount <= 0 || loanAmount > userValues.bankBalance*2){
        alert("Illegal loan amount!");
        return;
    }

    userValues.loanBalance += Number(loanAmount);
    userValues.bankBalance += Number(loanAmount);
    updateMoney();
}

/**
 * Increases the work balance each time the work button is clicked
 */
function handleWork() {
    userValues.workBalance += workSalaryPerClick;
    updateMoney();
}

/**
 * Deposits accumuated work balance into the bank balance
 * If an outstanding loan exists, a fraction of the work balance 
 * is used to make a downpayment on the loan
 * @returns Nothing
 */
function handleDeposit() {
    // The user must have something to deposit
    if(userValues.workBalance <= 0){
        alert("Nothing to deposit!");
        return;
    }

    // We either make a downpayment on the loan or simply
    // deposit everything if no loan exists
    if(userValues.loanBalance > 0){
        let remainder = reduceLoan(userValues.workBalance*loanPaymentRatio)
        userValues.bankBalance += userValues.workBalance*(1-loanPaymentRatio) + remainder;
    }else {
        userValues.bankBalance += userValues.workBalance;
    }
    userValues.workBalance = 0;
    updateMoney();
}

/**
 * Uses all of the accumulated workbalance to make a downpayment
 * on the loan. The excess is deposited into the bank balance
 * @returns Nothing
 */
function handleRepayLoan() {
    if(userValues.workBalance <= 0){
        alert("Nothing to deposit!");
        return;
    }
    // This check should never pass as the button should always be hidden
    // but just incase the function gets wrongfully called
    if(userValues.loanBalance <= 0){return;}

    let remainder = reduceLoan(userValues.workBalance);
    userValues.bankBalance += remainder;
    userValues.workBalance = 0;
    updateMoney();
}

/**
 * Reduces the loan-balance by an amount
 * @param {number} amount The amount that the loan is to be reduced with 
 * @returns Returns the amount of money left over after a downpayment
 *          If the loan is not completely paid off by the downpayment
 *          the remainder will always be zero(0)
 */
function reduceLoan(amount) {
    // If the downpayment will reduce the current loan to nothing
    // we return what is left over
    if(userValues.loanBalance - amount <= 0){
        let remainder = amount - userValues.loanBalance;
        userValues.loanBalance = 0;
        return remainder;
    } else {
        userValues.loanBalance -= amount;
        return 0;
    }
}

/**
 * Symbolically buys a computer by simply reducing a users bank balance
 * and displaying a message of ownership if sufficient funds are present
 * @returns Nothing
 */
function handleBuyComputer() {
    if(selectedComputer.price > userValues.bankBalance){
        alert("You do not have sufficient funds to purchase this computer.");
        return;
    }
    userValues.bankBalance -= selectedComputer.price;
    updateMoney();
    alert("You are now the proud owner of " + selectedComputer.title);
}


/**
 * Fetches the list of computer JSON objects from the API
 */
async function getComputers() {
    try {
        const response = await fetch(baseURL + "computers");
        computers = await response.json();
        populateDropdown();
    } catch(error) {
        console.error(error);
    }
}


/**
 * Populates the Select DOM Element with options elements
 * relating to the list of computers fetched from the API
 */
function populateDropdown() {
    let dropdown = document.getElementById("computer-dropdown");
    computers.map((computer, index) => {
        let newOption = document.createElement("option");
        newOption.text = computer.title;
        // We use the index to attach a value to each option in the
        // dropdown for easy access by numerical reference later
        newOption.value = index;
        dropdown.add(newOption);
    })
    setSelectedComputer();
}

/**
 * Finds the currently selected item in the select item and
 * then uses its value to find the corresponding Computer object
 */
function setSelectedComputer(){
    let dropdown = document.getElementById("computer-dropdown");
    let computerIndex = dropdown.options[dropdown.selectedIndex].value;
    selectedComputer = computers[computerIndex];
    updateComputerInformation();
}

/**
 * Rendering function for updating the computer information component
 * with the values of the currently selected computer in the dropdown
 */
function updateComputerInformation(){
    document.getElementById("computer-description-text").innerHTML = selectedComputer.description;
    document.getElementById("computer-price").innerHTML = displayNOK(selectedComputer.price);

    let specsList = document.getElementById("specs-list");
    // innerHTML = "" functions the same way as removing every child node
    specsList.innerHTML = "";
    selectedComputer.specs.map((spec, index) => {
        let newListItem = document.createElement("li");
        newListItem.innerHTML = spec;
        // All list items should have a key
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
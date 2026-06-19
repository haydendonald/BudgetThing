const term = require("terminal-kit").terminal;
const { selectFiles } = require("select-files-cli");

term.blue("-".repeat(35));
term.blue("\nBudget Thing by Hayden Donald\nhttps://github.com/haydendonald\n");
term.blue("-".repeat(35) + "\n\n");

const file = process.argv[2];
if (file) {
    processFile(file);
    return;
}
readBudgetJSON();

//Save a budget file
async function writeBudgetJSON(fileName, json) {
    var nconf = require("nconf");
    nconf.use("file", { file: `./${fileName}.json` });
    nconf.load();
    for (var i in json) { nconf.set(i, json[i]); }
    nconf.save();
}

//Build a new budget file ready for the user to modify
async function buildBudgetJSON() {
    await writeBudgetJSON("exampleBudget", {
        "outputPeriod": "monthly",
        "income": {
            "incomeStream1": {
                "employer1": {
                    "period": "fortnightly",
                    "amount": 1000.0
                }
            }
        },
        "expenses": {
            "car": {
                "insurance": {
                    "period": "yearly",
                    "amount": 1000.0
                },
                "service": {
                    "period": "yearly",
                    "amount": 1000.0
                },
                "rego": {
                    "period": "yearly",
                    "amount": 400.0
                },
                "fuel": {
                    "period": "weekly",
                    "amount": 100.0
                }
            },
            "groceries": {
                "meals": {
                    "period": "weekly",
                    "amount": 100.0
                },
                "snacks": {
                    "period": "weekly",
                    "amount": 50.0
                }
            }
        },
        "remaining": {
            "uni": 10,
            "purchases": 20,
            "going out": 20,
            "savings": 50
        },
        "accounts": {
            "savings": ["savings"],
            "fun": ["purchases", "going out"]
        }
    });
}

//Calculate a value to weekly
function calculateToPeriod(value, originalPeriod, aimedPeriod) {
    switch (aimedPeriod) {
        case "weekly": {
            switch (originalPeriod) {
                case "weekly": { return value; }
                case "fortnightly": { return value * 0.4615; }
                case "monthly": { return value * 0.2308; }
                case "yearly": { return value * 0.0192; }
            }
        }
        case "fortnightly": {
            switch (originalPeriod) {
                case "weekly": { return value * 2.1667; }
                case "fortnightly": { return value; }
                case "monthly": { return value * 0.5; }
                case "yearly": { return value * 0.0417; }
            }
        }
        case "monthly": {
            switch (originalPeriod) {
                case "weekly": { return value * 4.3333; }
                case "fortnightly": { return value * 2.0; }
                case "monthly": { return value; }
                case "yearly": { return value * 0.0833; }
            }
        }
        case "yearly": {
            switch (originalPeriod) {
                case "weekly": { return value * 52.1429; }
                case "fortnightly": { return value * 24.0; }
                case "monthly": { return value * 12.0; }
                case "yearly": { return value; }
            }
        }
    }
}

// Check if an expense object is a leaf (has period + amount directly)
// rather than a category containing sub-expenses
function isLeaf(obj) {
    return obj && obj.hasOwnProperty("period") && obj.hasOwnProperty("amount");
}

//Process a file
async function processFile(fileLocation) {
    term.bgGreen();
    var nconf = require("nconf");
    nconf.use("file", { file: fileLocation });
    nconf.load();
    
    //First grab our stuff
    var income = nconf.get("income");
    var expenses = nconf.get("expenses");
    var aimedPeriod = nconf.get("outputPeriod");
    var remaining = nconf.get("remaining");
    var accounts = nconf.get("accounts");

    //Validate input TODO


    //Calculate our incomes
    var currentAmount = 0;
    for (var i in income) {
        var amount = 0;
        for (var j in income[i]) {
            income[i][j].amount = calculateToPeriod(income[i][j].amount, income[i][j].period, aimedPeriod);
            amount += income[i][j].amount;
        }
        income[i].amount = amount;
        currentAmount += amount;
    }

    term.bgGreen(`You have a total income of $${currentAmount} ${aimedPeriod}`);
    for (var i in income) {
        term.green(`\n- ${i} totaled to $${income[i].amount} ${aimedPeriod}\n`);
        for (var j in income[i]) {
            if (j != "amount") {
                term.green(`\t- ${j} = $${income[i][j].amount}\n`);
            }
        }
    }

    term.black("\n\n");

    //Calculate our expenses
    // Supports both flat leaf expenses ({ period, amount }) and
    // nested category expenses ({ subItem: { period, amount }, ... })
    var totalExpenses = 0;
    for (var i in expenses) {
        var amount = 0;
        if (isLeaf(expenses[i])) {
            // Flat expense e.g. rent: { period: "monthly", amount: 1217 }
            expenses[i].amount = calculateToPeriod(expenses[i].amount, expenses[i].period, aimedPeriod);
            amount = expenses[i].amount;
        } else {
            // Nested category e.g. car: { insurance: { period, amount }, ... }
            for (var j in expenses[i]) {
                if (isLeaf(expenses[i][j])) {
                    expenses[i][j].amount = calculateToPeriod(expenses[i][j].amount, expenses[i][j].period, aimedPeriod);
                    amount += expenses[i][j].amount;
                }
            }
            expenses[i].amount = amount;
        }
        totalExpenses += amount;
    }

    term.bgRed(`You have a total expenses of $${totalExpenses}, leaving $${currentAmount - totalExpenses} ${aimedPeriod}`);
    for (var i in expenses) {
        term.red(`\n- ${i} totaled to $${expenses[i].amount}, leaving ${currentAmount -= expenses[i].amount} ${aimedPeriod}\n`);
        // Only print sub-items for nested categories, not flat leaf expenses
        if (!isLeaf(expenses[i])) {
            for (var j in expenses[i]) {
                if (j != "amount") {
                    term.red(`\t- ${j} = $${expenses[i][j].amount}\n`);
                }
            }
        }
    }

    term.black("\n\n");


    //Calculate the left over allocations
    var percentage = 0;
    for (var i in remaining) {
        remaining[i] = {
            "amount": currentAmount * (remaining[i] / 100.0),
            "percentage": remaining[i]
        }
        percentage += remaining[i].percentage;
    }

    //Check if all the remaining funds were allocated
    if (percentage < 100.0) {
        remaining["unallocated"] = {
            "amount": currentAmount * ((100.0 - percentage) / 100.0),
            "percentage": 100.0 - percentage
        };
    }
    else if (percentage > 100.0) {
        term.bgBrightRed("There was an over allocation of remaining funds, please check your remaining percentages!");
        return;
    }


    term.bgYellow(`There is $${currentAmount} to allocate to the remaining funds ${aimedPeriod}`);
    for (var i in remaining) {
        term.yellow(`\n- ${i} (${remaining[i].percentage}%) = $${remaining[i].amount}`);
    }

    term.black("\n\n");

    //Ok calculate what amount(s) should be put into each account
    term.bgBlue(`Here is the amount you should put into each account ${aimedPeriod}`);
    var includedInAccount = {};
    var accountCalculations = {};
    for (var i in accounts) {
        var amount = 0;
        for (var j in accounts[i]) {
            for (var k in expenses) {
                if (k == accounts[i][j]) { amount += expenses[k].amount; includedInAccount[k] = true; break; }
            }
            for (var k in remaining) {
                if (k == accounts[i][j]) { amount += remaining[k].amount; includedInAccount[k] = true; break; }
            }
            for (var k in accountCalculations) {
                if (k == accounts[i][j]) { amount += accountCalculations[k]; break; }
            }
        }
        accountCalculations[i] = amount;
        term.blue(`\n- ${i} should have $${amount} deposited ${aimedPeriod}\n`);
    }

    //The amounts that are not included will be allocated to the regular account
    var leftOverAccount = 0;
    for(var i in expenses) {
        if(!includedInAccount[i]) {
            leftOverAccount += expenses[i].amount
        }
    }
    for(var i in remaining) {
        if(!includedInAccount[i]) {
            leftOverAccount += remaining[i].amount
        }
    }
    term.blue(`\n- regular should have $${leftOverAccount} left over after depositing ${aimedPeriod}\n`);

    term.black("\n\n");
    term.bgGreen("Ok i'm done!");
    term.black("\n\n");
}

/**
 * Read the budget JSON file and return as an object
 */
async function readBudgetJSON() {
    term.green("Please select the budget file(s) you wish to process or cancel to create a new one\n");
    await selectFiles({
        clearConsole: false,
        fileFilter: (fileName) => {
            return fileName.includes(".json");
        }
    }).then(async function ({ selectedFiles, status }) {
        switch (status) {
            case "SELECTION_COMPLETED": {
                term.green("Ok got %d file(s), I'll goto work!\n", selectedFiles.length);
                for (var i in selectedFiles) {
                    term.gray("%d/%d - Processing file at %s\n", i + 1, selectedFiles.length, selectedFiles[i]);
                    await processFile(selectedFiles[i]);
                }
                break;
            }
            case "SELECTION_CANCELLED": {
                term.yellow("Selection was cancelled, i will generate a new budget file for you now!\n");
                await buildBudgetJSON();
                break
            }
        }
    });
}
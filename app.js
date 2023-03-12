const term = require("terminal-kit").terminal;
const { selectFiles } = require("select-files-cli");

term.blue("-".repeat(35));
term.blue("\nBudget Thing by Hayden Donald\nhttps://github.com/haydendonald\n");
term.blue("-".repeat(35) + "\n\n");
readBudgetJSON();

//Save a budget file
async function writeBudgetJSON(fileName, json) {
    var nconf = require("nconf");
    nconf.use("file", { file: `./${fileName}.json` });
    nconf.load();
    for (var i in json) { nconf.set(i, json[i]); }
    nconf.save(function (error) {
        console.log(error);
    });
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
        }
    });
}

//Calculate a value to weekly
function calculateToPeriod(value, originalPeriod, aimedPeriod) {
    switch (aimedPeriod) {
        case "weekly": {
            switch (originalPeriod) {
                case "weekly": { return value; }
                case "fortnightly": { return value / 2.0; }
                case "monthly": { return value / 4.0; }
                case "yearly": { return value / 52.1429; }
            }
        }
        case "fortnightly": {
            switch (originalPeriod) {
                case "weekly": { return value * 2.0; }
                case "fortnightly": { return; }
                case "monthly": { return value / 2.0; }
                case "yearly": { return value * 26.07145; }
            }
        }
        case "monthly": {
            switch (originalPeriod) {
                case "weekly": { return value * 4.0; }
                case "fortnightly": { return value * 2.0; }
                case "monthly": { return value; }
                case "yearly": { return value / 13.035725; }
            }
        }
        case "yearly": {
            switch (originalPeriod) {
                case "weekly": { return value * 52.1429; }
                case "fortnightly": { return value * 26.07145; }
                case "monthly": { return value * 13.035725; }
                case "yearly": { return value; }
            }
        }
    }
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
    var totalExpenses = 0;
    for (var i in expenses) {
        var amount = 0;
        for (var j in expenses[i]) {
            expenses[i][j].amount = calculateToPeriod(expenses[i][j].amount, expenses[i][j].period, aimedPeriod);
            amount += expenses[i][j].amount;
        }
        expenses[i].amount = amount;
        totalExpenses += amount;
    }

    term.bgRed(`You have a total expenses of $${totalExpenses}, leaving $${currentAmount - totalExpenses} ${aimedPeriod}`);
    for (var i in expenses) {
        term.red(`\n- ${i} totaled to $${expenses[i].amount}, leaving ${currentAmount -= expenses[i].amount} ${aimedPeriod}\n`);
        for (var j in expenses[i]) {
            if (j != "amount") {
                term.red(`\t- ${j} = $${expenses[i][j].amount}\n`);
            }
        }
    }

    term.black("\n\n");


    //Calculate the left over allocations
    var percentage = 0;
    for(var i in remaining) {
        remaining[i] = {
            "amount": currentAmount * (remaining[i] / 100.0),
            "percentage": remaining[i]
        }
        percentage += remaining[i].percentage;
    }

    //Check if all the remaining funds were allocated
    if(percentage < 100.0) {
        remaining["unallocated"] = {
            "amount": currentAmount * ((100.0 - percentage) / 100.0),
            "percentage": 100.0 - percentage
        };
    }
    else if(percentage > 100.0) {
        term.bgBrightRed("There was an over allocation of remaining funds, please check your remaining percentages!");
        return;
    }


    term.bgYellow(`There is $${currentAmount} to allocate to the remaining funds ${aimedPeriod}`);
    for(var i in remaining) {
        term.yellow(`\n- ${i} (${remaining[i].percentage}%) = $${remaining[i].amount}`);
    }




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

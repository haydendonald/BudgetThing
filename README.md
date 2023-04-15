# Budget Thing
This is a simple script to help me calculate my budgets with a run down format.

Use it if you wish :)

![Lookin good!](https://raw.githubusercontent.com/haydendonald/BudgetThing/main/img/yes.png)

(and yes you need super precise prices, who doesn't work with 12 decimal points)

# Usage
1. Download the executable from [here]() otherwise build it following the instructions below.
2. Run the application and select `Cancel File Selection` to create the example budget file which looks something like this:
```JSON
{
  "income": {
    "incomeStream1": {
      "employer1": {
        "period": "fortnightly",
        "amount": 1000
      }
    }
  },
  "expenses": {
    "car": {
      "insurance": {
        "period": "yearly",
        "amount": 1000
      },
      "service": {
        "period": "yearly",
        "amount": 1000
      },
      "rego": {
        "period": "yearly",
        "amount": 400
      },
      "fuel": {
        "period": "weekly",
        "amount": 100
      }
    },
    "groceries": {
      "meals": {
        "period": "weekly",
        "amount": 100
      },
      "snacks": {
        "period": "weekly",
        "amount": 50
      }
    }
  },
  "outputPeriod": "monthly",
  "remaining": {
    "uni": 10,
    "purchases": 20,
    "going out": 20,
    "savings": 50
  },
  "accounts": {
    "savings": [
      "savings"
    ],
    "fun": [
      "purchases",
      "going out"
    ]
  }
}
```
3. Edit the file as you require, the income/expenses are pretty obvious as to what they do. The remaining is a percentage of how much money you would like to allocate to different categories. The accounts is useful if you want to know how much you need to transfer to different accounts per period, for example "fun" will add the purchases and going out percentages (this can also use expenses).
4. Details..
* `income` is your income streams
* `expenses` are the expenses you have to pay each cycle
* `outputPeriod` is the period you wish to work in, you can use `weekly`, `fortnightly`, `monthly`, or `yearly`.
* `remaining` is what you would like to do with the left over income after the expenses in percentage, for example for uni i allocate 10% of the left overs to pay of my fees
* `accounts` is useful for listing how much you need to transfer to each account (if you do it that way). You can add expense or remaining to these. 


# Building
* This project uses nexe to compile, install it using `npm i pkg -g`
* Run the project using `node app.js` while in the project directory
* Build the project using `npm i && pkg .` to build the project

# Warranty?
This script is pretty basic and may have some calculation issues in it (i wrote this quick) so don't use it to calculate the budget of launching a rocket to space thanks :)
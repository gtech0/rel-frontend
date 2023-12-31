const url_test = "http://localhost:8080/interpreter/execute";
const url_validation = "http://localhost:8080/interpreter/validate";
let relations = {};

window.onload = function() {
    var executeButton = document.getElementById("execute-button");
    executeButton.addEventListener("click", execute);

    var validateButton = document.getElementById("validate-button");
    validateButton.addEventListener("click", validate);
}

async function execute() {
    clearHTML();
    console.log(relations);
    return fetch(url_test, {
        body: JSON.stringify(new TestBody(getText(), relations)),
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        return response.text().then((error) => {
            throw new Error(error);
        })
    })
    .then(data => {
        console.log(data);
        jsonToTableResult(data["result"]);
        jsonToTableGet(data["getResults"]);
    })
    .catch(function (error) {
        writeToDebugConsole(error.message);
    })
}

async function validate() {
    clearHTML();
    var str = window.location.href;
    var n = str.lastIndexOf('/');
    var result = str.substring(n + 1);

    return fetch(url_validation, {
        body: JSON.stringify(new ValidBody(getText(), `sol${result}`)),
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        }
        return response.text().then((error) => {
            throw new Error(error);
        })
    })
    .then(data => {
        writeValidationResult(data);
    })
    .catch(function (error) {
        writeToDebugConsole(error.message);
    })
}

class ValidBody {
    constructor(query, problemName) {
        this.query = query;
        this.problemName = problemName;
    }
}

class TestBody {
    constructor(query, relations) {
        this.query = query;
        this.relations = relations;
    }
}

function getText() {
    var area = document.getElementById("txtArea");             
    var lines = area.value.replace(/\r\n/g,"\n").split("\n");
    return lines;
}

function writeToDebugConsole(data) {
    document.getElementById("debug-area").value += (data + "\n");
}

function clearHTML() {
    $("#main-table").empty();
    document.getElementById("main-table").value = "";
    $("#debug-area").empty();
    document.getElementById("debug-area").value = "";
}

function addRow(table) {
    var row = table.insertRow(-1);
    var rows = table.rows[0].cells.length;
    for(let i = 0; i < rows; i++) {
        var cell = row.insertCell(i);
        cell.contentEditable = "true";
    }
}

function deleteRow(table) {
    if (table.rows.length > 2) {
        table.deleteRow(-1);
    }
}

function problemScript(tableId) {
    document.querySelector("#execute-button").addEventListener("click", async () => {
        addToDict(tableId);
    })
    return document.getElementById(tableId);
}

function writeValidationResult(data) {
    const table = document.querySelector("#main-table");
    table.innerHTML = data;
}

// json stuff

function finalResult(data, key) {
    let result = "";
    if (data.length == 0) {
        writeToDebugConsole("Empty relation " + key);
    } else {
        result = jsonToTableCommon(data, key);
    }
    return result;
}

function addToDict(tableId) {
    var tableName = document.querySelector("#" + tableId + " caption").innerHTML;
    var myRows = [];
    var $headers = $("#" + tableId + " th");
    $("#" + tableId + " tbody tr").each(function(index) {
        if (index != 0) {
            var realIndex = index - 1;
            $cells = $(this).find("td");
            myRows[realIndex] = {};
            $cells.each(function(cellIndex) {
                var value = $(this).html();
                if (value.length > 0) myRows[realIndex][$($headers[cellIndex]).html()] = [value];
                else myRows[realIndex][$($headers[cellIndex]).html()] = [];
            });
        }
    });

    relations[tableName] = myRows;
}

function jsonToTableCommon(data, key) {
    return `
    <thead><caption>${key}</caption>
    <tr>${mapTableHead(data)}</tr>
    <tbody>${mapTableBody(data)}</tbody>`;
}

function jsonToTableResult(data) {
    const table = document.querySelector("#main-table");
    table.innerHTML = `
    <table style=\"margin-right: 10px;\">
    ${finalResult(data, "Result")}
    </table>`;
}

function jsonToTableGet(data) {
    const div = document.querySelector("#get-container");
    div.innerHTML = "";
    for (const [key, table] of Object.entries(data)) {
        div.innerHTML += `
        <table style=\"margin-right: 10px;\">
        ${finalResult(table, key)}
        </table>`;
    }
}

const insertInArray = (arr, index, newItem) => [
    ...arr.slice(0, index),
    newItem,
    ...arr.slice(index)
]

function mapTableHead(data) {
    let tags = "";
    var columns = Object.keys(data[0]);
    for (const key of columns) {
        var max = 0;
        for (const row of data) {
            if (row[key].length > max) {
                max = row[key].length;
            }
        }
        
        if (max > 0) {
            var index = columns.indexOf(key);
            for (const dupeKey of Array(max - 1).fill(key)) {
                columns = insertInArray(columns, index, dupeKey);
            }
        }
    }
    
    for (i = 0; i < columns.length; i++) {
        tags += `<th>${columns[i]}</th>`;
    }
    return tags;
}

function mapTableBody(data) {
    let tags = "";

    var maxDict = {};
    data.forEach(element => {
        for (const [key, values] of Object.entries(element)) {
            maxDict[key] = values.length;
        }
    });

    data.forEach(element => {
        tags += "<tr>";
        for (const [key, values] of Object.entries(element)) {
            let insertionCount = 0;
            for (const value of values) {
                tags += `<td>${value}</td>`;
                insertionCount++;
            }

            if (insertionCount < maxDict[key]) {
                tags += `<td></td>`;
            }
        }
        tags += "</tr>";
    });
    return tags;
}
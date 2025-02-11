// Elements
var start_button1 = document.querySelector("#start_button");
var downloadButton = document.querySelector("#download-button");
var textarea1 = document.querySelector("#textarea1");
var textarea2 = document.querySelector("#textarea2");
var textareaError = document.querySelector("#textarea-error");
var file1 = document.querySelector("#file_input");

// Events
window.addEventListener('keydown', on_keydown, false);
start_button1.addEventListener('click', ausfuehren, false);
file1.addEventListener('change', on_change_F, false);
textarea1.addEventListener("input", on_change_T, false);

function on_change_T(e) {
    if (e.target.value == "") {
        downloadButton.classList.add("hidden");
        textarea2.value = "";
    }
}

// Drag and Drop vom PC in das Browser-Textfeld
// Standard Verhalten Unterbinden weil sonst -> (öffnet eine neue Seite mit dem Text)!
window.addEventListener('dragover', function (e) { e.preventDefault(); }, false);
// Für Chrome nötig wenn daneben gezogen, sonst -> (öffnet eine neue Seite mit dem Text)!
document.addEventListener('drop', function (e) { e.preventDefault(); }, false);
textarea1.addEventListener('drop', on_drop, false);

function on_drop(e) {
    var fReader = new FileReader();
    fReader.readAsText(e.dataTransfer.files[0]);

    fReader.onload = function () {
        textarea1.value = fReader.result;
        ausfuehren();
    }
}

// IE null Problem beheben(wird in Textarea angezeigt)
if (textarea1.value === 'null') {
    textarea1.value = '';
}

// File Auswählen (läuft fast gleich wie beim Drag and Drop)
// 'e.target...' statt 'e.dataTransfer...'
function on_change_F(e) {
    var fReader = new FileReader();
    fReader.readAsText(e.target.files[0]);

    fReader.onload = function () {
        textarea1.value = fReader.result;
        ausfuehren();
    }
}

// Ausführen, wenn Enter gedrückt
function on_keydown(e) {
    if (e.key === 'Enter') {
        ausfuehren();
    }
}

function splitVCF(vcf) {
    var returnData = [];
    var contacts = vcf.split(/END:VCARD(\r\n|\n|\r)/);
    contacts = contacts.map(el => el.split(/(\r\n|\n|\r)(?=.*:)/).map(line => line.split(/:(?!\/\/)/).map(elements => elements.split(";"))));
    for (const contact of contacts) {
        var contactObj = {"First Name": "","Middle Name": "","Last Name": "","Title": "","Suffix": "","Web Page": "","Birthday": "","Anniversary": "","Notes": "","E-mail Address": "","E-mail 2 Address": "","E-mail 3 Address": "","Primary Phone": "","Home Phone": "","Home Phone 2": "","Mobile Phone": "","Pager": "","Home Fax": "","Home Address": "","Home Street": "","Home Street 2": "","Home Street 3": "","Home Address PO Box": "","Home City": "","Home State": "","Home Postal Code": "","Home Country": "","Spouse": "","Children": "","Manager's Name": "","Assistant's Name": "","Referred By": "","Company Main Phone": "","Business Phone": "","Business Phone 2": "","Business Fax": "","Assistant's Phone": "","Company": "","Job Title": "","Department": "","Business Address": "","Business Street": "","Business Street 2": "","Business Street 3": "","Business Address PO Box": "","Business City": "","Business State": "","Business Postal Code": "","Business Country": "","Other Phone": "","Other Fax": "","Other Address": "","Other Street": "","Other Street 2": "","Other Street 3": "","Other Address PO Box": "","Other City": "","Other State": "","Other Postal Code": "","Other Country": "","Callback": "","Car Phone": "","ISDN": "","Radio Phone": "","TTY/TDD Phone": "","Telex": "","Categories": ""};
        var fn = "";
        for (const line of contact) {
            if (line.length == 1) {
                continue;
            }
            if (line[0][0].match(/\./)) {
                var identifier = line[0][0].split(/\./)[0];
                line[0][0] = line[0][0].split(/\./)[1];
            }
            line[1] = line[1].map(el => el.replace(/(\r\n|\n|\r)/, ""));
            switch (line[0][0]) {
                case "FN":
                    fn = line[1][0]
                    if (contactObj["First Name"] == "") {
                        contactObj["First Name"] = line[1][0];
                    }
                    break;
                case "N":
                    contactObj["First Name"] = line[1][1];
                    contactObj["Middle Name"] = line[1][2];
                    contactObj["Last Name"] = line[1][0];
                    contactObj["Title"] = line[1][3];
                    contactObj["Suffix"] = line[1][4];
                    break;
                case "EMAIL":
                    if (contactObj["E-mail Address"] == "") {
                        contactObj["E-mail Address"] = line[1][0];
                    } else if (contactObj["E-mail 2 Address"] == "") {
                        contactObj["E-mail 2 Address"] = line[1][0];
                    } else if (contactObj["E-mail 3 Address"] == "") {
                        contactObj["E-mail 3 Address"] = line[1][0];
                    } else {
                        textareaError.value += "Es sind mehr als 3 E-Mail-Addressen nicht durch das CSV-Format unterstützt: " + line[1][0] + (fn != "" ? (" (" + fn + ")") : "") + "\r\n";
                    }
                    break;
                case "TEL":
                    if (line[0].length > 1 && line[0][1].match(/TYPE/)) {
                        switch (line[0][1].split("=")[1].toLowerCase()) {
                            case "home":
                                var key = "Home Phone";
                                break;
                            case "home2":
                                var key = "Home Phone 2";
                                break;
                            case "main":
                                var key = "Primary Phone";
                                break;
                            case "mobile":
                            case "cell":
                                var key = "Mobile Phone";
                                break;
                            case "pager":
                                var key = "Pager";
                                break;
                            case "home fax":
                                var key = "Home Fax";
                                break;
                            case "work":
                                var key = "Business Phone";
                                break;
                            case "work2":
                                var key = "Business Phone 2";
                                break;
                            case "workfax":
                                var key = "Business Fax";
                                break;
                            case "assistant":
                                var key = "Assistant's Phone";
                                break;
                            case "car":
                                var key = "Car Phone";
                                break;
                            case "car":
                                var key = "Other Phone";
                                break;
                            default:
                                var key = "Other Phone";
                                break;
                        }
                    } else {
                        var key = "Other Phone";
                    }
                    if (contactObj[key] !== "") {
                        textareaError.value += "Es sind mehrere Telefonnummern mit dem gleichen Label (" + key + ") nicht durch das Outlook-CSV-Format unterstützt: " + line[1][0] + (fn != "" ? (" (" + fn + ")") : "") + "\r\n";
                    } else {
                        contactObj[key] = line[1][0];
                    }
                    break;
                case "ADR":
                    if (line[0].length > 1 && line[0][1].match(/TYPE/)) {
                        switch (line[0][1].split("=")[1].toLowerCase()) {
                            case "home":
                                var prefix = "Home ";
                                break;
                            case "work":
                                var prefix = "Business ";
                                break;
                            case "other":
                                var prefix = "Other ";
                                break;
                            default:
                                var prefix = "Home ";
                                break;
                        }
                    } else {
                        var prefix = "Other ";
                    }
                    contactObj[prefix + "Street"] = line[1][2];
                    contactObj[prefix + "Street 2"] = line[1][1];
                    contactObj[prefix + "Address PO Box"] = line[1][0];
                    contactObj[prefix + "City"] = line[1][3];
                    contactObj[prefix + "State"] = line[1][4];
                    contactObj[prefix + "Postal Code"] = line[1][5];
                    contactObj[prefix + "Country"] = line[1][6];
                    break;
                case "BDAY":
                    contactObj["Birthday"] = line[1][0];
                    break;
                case "X-ANNIVERSARY":
                case "ANNIVERSARY":
                    contactObj["Anniversary"] = line[1][0];
                    break;
                case "URL":
                    contactObj["Web Page"] = line[1][0];
                    break;
                case "NOTE":
                    contactObj["Notes"] = line[1][0];
                    break;
                case "X-SPOUSE":
                    contactObj["Spouse"] = line[1][0];
                    break;
                case "X-MANAGER":
                    contactObj["Manager's Name"] = line[1][0];
                    break;
                case "AGENT":
                    contactObj["Assistant's Name"] = line[1][0];
                    break;
                case "TITLE":
                    contactObj["Job Title"] = line[1][0];
                    break;
                case "ORG":
                    contactObj["Company"] = line[1][0];
                    break;
                case "X-DEPARTMENT":
                    contactObj["Department"] = line[1][0];
                    break;
                case "CATEGORIES":
                    contactObj["Categories"] = line[1][0];
                    break;
                case "BEGIN":
                case "VERSION":
                    break;
            }
        }
        if (new Set(Object.values(contactObj)).size > 1) {
            returnData.push(contactObj);
            console.log(contactObj);
            console.log("----")
        }
    }
    return returnData;
}

function createCSV(contactsData) {
    var result = "";
    var keys = ["First Name","Middle Name","Last Name","Title","Suffix","Web Page","Birthday","Anniversary","Notes","E-mail Address","E-mail 2 Address","E-mail 3 Address","Primary Phone","Home Phone","Home Phone 2","Mobile Phone","Pager","Home Fax","Home Address","Home Street","Home Street 2","Home Street 3","Home Address PO Box","Home City","Home State","Home Postal Code","Home Country","Spouse","Children","Manager's Name","Assistant's Name","Referred By","Company Main Phone","Business Phone","Business Phone 2","Business Fax","Assistant's Phone","Company","Job Title","Department","Business Address","Business Street","Business Street 2","Business Street 3","Business Address PO Box","Business City","Business State","Business Postal Code","Business Country","Other Phone","Other Fax","Other Address","Other Street","Other Street 2","Other Street 3","Other Address PO Box","Other City","Other State","Other Postal Code","Other Country","Callback","Car Phone","ISDN","Radio Phone","TTY/TDD Phone","Telex","Categories"];
    result += keys.join(",") + "\r\n";
    for (const contact of contactsData) {
        for (const key of keys) {
            result += contact[key].replaceAll(",", ";") + ",";
        }
        result += "\r\n";
    }
    return result;
}

// Parser
function ausfuehren() {
    if (textarea1.value == "") {
        downloadButton.classList.add("hidden");
        document.querySelector("#error-div").classList.add("hidden");
    } else {
        textareaError.value = "";
        var contactsData = splitVCF(textarea1.value);
        textarea2.value = createCSV(contactsData);
    
        // Replace all Line-Breaks to comply with Windows CRLF
        createDownload(createCSV(contactsData).replaceAll(/\r?\n/g, "\r\n"));
        downloadButton.classList.remove("hidden")

        if (textareaError.value != "") {
            document.querySelector("#error-div").classList.remove("hidden");
        }
    }
}

function createDownload(text) {
    var date = new Date();
    var options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    };
    downloadButton.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    downloadButton.setAttribute('download', "adressbuch_"+(date.toLocaleDateString("de-DE", options).replaceAll(".", "-"))+".csv");
}
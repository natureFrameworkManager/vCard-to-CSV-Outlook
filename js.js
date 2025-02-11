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
        var contactObj = {'Anrede':'','Vorname':'','Weitere Vornamen':'','Nachname':'','Suffix':'','Firma':'','Abteilung':'','Position':'','Straße geschäftlich':'','Straße geschäftlich 2':'','Straße geschäftlich 3':'','Ort geschäftlich':'','Region geschäftlich':'','Postleitzahl geschäftlich':'','Land/Region geschäftlich':'','Straße privat':'','Straße privat 2':'','Straße privat 3':'','Ort privat':'','Bundesland/Kanton privat':'','Postleitzahl privat':'','Land/Region privat':'','Weitere Straße':'','Weitere Straße 2':'','Weitere Straße 3':'','Weiterer Ort':'','Weiteres/r Bundesland/Kanton':'','Weitere Postleitzahl':'','Weiteres/e Land/Region':'','Telefon Assistent':'','Fax geschäftlich':'','Telefon geschäftlich':'','Telefon geschäftlich 2':'','Rückmeldung':'','Autotelefon':'','Telefon Firma':'','Fax privat':'','Telefon (privat)':'','Telefon (privat 2)':'','ISDN':'','Mobiltelefon':'','Weiteres Fax':'','Weiteres Telefon':'','Pager':'','Haupttelefon':'','Mobiltelefon 2':'','Telefon für Hörbehinderte':'','Telex':'','Abrechnungsinformation':'','Assistent(in)':'','Benutzer 1':'','Benutzer 2':'','Benutzer 3':'','Benutzer 4':'','Beruf':'','Büro':'','E-Mail-Adresse':'','E-Mail-Typ':'','E-Mail: Angezeigter Name':'','E-Mail 2: Adresse':'','E-Mail 2: Typ':'','E-Mail 2: Angezeigter Name':'','E-Mail 3: Adresse':'','E-Mail 3: Typ':'','E-Mail 3: Angezeigter Name':'','Empfohlen von':'','Geburtstag':'','Geschlecht':'','Hobby':'','Initialen':'','Internet Frei/Gebucht':'','Jahrestag':'','Kategorien':'','Kinder':'','Konto':'','Name des/r Vorgesetzten':'','Notizen':'','Organisationsnr.':'','Ort':'','Partner/in':'','Postfach geschäftlich':'','Postfach privat':'','Priorität':'','Privat':'','Reisekilometer':'','Sozialversicherungsnr.':'','Sprache':'','Stichwörter':'','Vertraulichkeit':'','Verzeichnisserver':'','Webseite':'','Weiteres Postfach':''};
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
                    fn = line[1][0];
                    if (contactObj["Vorname"] == "") {
                        contactObj["Vorname"] = line[1][0];
                    }
                    break;
                case "N":
                    contactObj["Vorname"] = line[1][1];
                    contactObj["Weitere Vornamen"] = line[1][2];
                    contactObj["Nachname"] = line[1][0];
                    contactObj["Anrede"] = line[1][3];
                    contactObj["Suffix"] = line[1][4];
                    break;
                case "EMAIL":
                    if (contactObj["E-Mail-Adresse"] == "") {
                        contactObj["E-Mail-Adresse"] = line[1][0];
                    } else if (contactObj["E-Mail 2: Adresse"] == "") {
                        contactObj["E-Mail 2: Adresse"] = line[1][0];
                    } else if (contactObj["E-Mail 3: Adresse"] == "") {
                        contactObj["E-Mail 3: Adresse"] = line[1][0];
                    } else {
                        textareaError.value += "Es sind mehr als 3 E-Mail-Addressen nicht durch das CSV-Format unterstützt: " + line[1][0] + (fn != "" ? (" (" + fn + ")") : "") + "\r\n";
                    }
                    break;
                case "TEL":
                    if (line[0].length > 1 && line[0][1].match(/TYPE/)) {
                        switch (line[0][1].split("=")[1].toLowerCase()) {
                            case "home":
                                var key = "Telefon (privat)";
                                break;
                            case "home2":
                                var key = "Telefon (privat 2)";
                                break;
                            case "main":
                                var key = "Haupttelefon";
                                break;
                            case "mobile":
                            case "cell":
                                var key = "Mobiltelefon";
                                break;
                            case "pager":
                                var key = "Pager";
                                break;
                            case "home fax":
                                var key = "Fax privat";
                                break;
                            case "work":
                                var key = "Telefon geschäftlich";
                                break;
                            case "work2":
                                var key = "Telefon geschäftlich 2";
                                break;
                            case "workfax":
                                var key = "Fax geschäftlich";
                                break;
                            case "assistant":
                                var key = "Telefon Assistent";
                                break;
                            case "car":
                                var key = "Autotelefon";
                                break;
                            case "car":
                                var key = "Weiteres Telefon";
                                break;
                            default:
                                var key = "Weiteres Telefon";
                                break;
                        }
                    } else {
                        var key = "Weiteres Telefon";
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
                                var prefix = "privat";
                                break;
                            case "work":
                                var prefix = "geschäftlich";
                                break;
                            case "other":
                                var prefix = "Weitere";
                                break;
                            default:
                                var prefix = "privat";
                                break;
                        }
                    } else {
                        var prefix = "Other ";
                    }
                    if (prefix != "Weitere") {
                        contactObj["Straße " + prefix] = line[1][2];
                        contactObj["Straße " + prefix + " 2"] = line[1][1];
                        contactObj["Ort " + prefix] = line[1][3];
                        contactObj["Bundesland/Kanton " + prefix] = line[1][4];
                        contactObj["Postleitzahl " + prefix] = line[1][5];
                        contactObj["Land/Region " + prefix] = line[1][6];
                    } else {
                        contactObj[prefix + " Straße"] = line[1][2];
                        contactObj[prefix + " Straße 2"] = line[1][1];
                        contactObj[prefix + "r Ort"] = line[1][3];
                        contactObj[prefix + "s/r Bundesland/Kanton"] = line[1][4];
                        contactObj[prefix + " Postleitzahl"] = line[1][5];
                        contactObj[prefix + "s/e Land/Region"] = line[1][6];
                    }
                    break;
                case "BDAY":
                    contactObj["Geburtstag"] = line[1][0];
                    break;
                case "X-ANNIVERSARY":
                case "ANNIVERSARY":
                    contactObj["Jahrestag"] = line[1][0];
                    break;
                case "URL":
                    contactObj["Webseite"] = line[1][0];
                    break;
                case "NOTE":
                    contactObj["Notizen"] = line[1][0];
                    break;
                case "X-SPOUSE":
                    contactObj["Partner/in"] = line[1][0];
                    break;
                case "X-MANAGER":
                    contactObj["Name des/r Vorgesetzten"] = line[1][0];
                    break;
                case "AGENT":
                    contactObj["Assistent(in)"] = line[1][0];
                    break;
                case "TITLE":
                    contactObj["Position"] = line[1][0];
                    break;
                case "ORG":
                    contactObj["Firma"] = line[1][0];
                    break;
                case "X-DEPARTMENT":
                    contactObj["Abteilung"] = line[1][0];
                    break;
                case "CATEGORIES":
                    contactObj["Kategorien"] = line[1][0];
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
    var keys = ['Anrede','Vorname','Weitere Vornamen','Nachname','Suffix','Firma','Abteilung','Position','Straße geschäftlich','Straße geschäftlich 2','Straße geschäftlich 3','Ort geschäftlich','Region geschäftlich','Postleitzahl geschäftlich','Land/Region geschäftlich','Straße privat','Straße privat 2','Straße privat 3','Ort privat','Bundesland/Kanton privat','Postleitzahl privat','Land/Region privat','Weitere Straße','Weitere Straße 2','Weitere Straße 3','Weiterer Ort','Weiteres/r Bundesland/Kanton','Weitere Postleitzahl','Weiteres/e Land/Region','Telefon Assistent','Fax geschäftlich','Telefon geschäftlich','Telefon geschäftlich 2','Rückmeldung','Autotelefon','Telefon Firma','Fax privat','Telefon (privat)','Telefon (privat 2)','ISDN','Mobiltelefon','Weiteres Fax','Weiteres Telefon','Pager','Haupttelefon','Mobiltelefon 2','Telefon für Hörbehinderte','Telex','Abrechnungsinformation','Assistent(in)','Benutzer 1','Benutzer 2','Benutzer 3','Benutzer 4','Beruf','Büro','E-Mail-Adresse','E-Mail-Typ','E-Mail: Angezeigter Name','E-Mail 2: Adresse','E-Mail 2: Typ','E-Mail 2: Angezeigter Name','E-Mail 3: Adresse','E-Mail 3: Typ','E-Mail 3: Angezeigter Name','Empfohlen von','Geburtstag','Geschlecht','Hobby','Initialen','Internet Frei/Gebucht','Jahrestag','Kategorien','Kinder','Konto','Name des/r Vorgesetzten','Notizen','Organisationsnr.','Ort','Partner/in','Postfach geschäftlich','Postfach privat','Priorität','Privat','Reisekilometer','Sozialversicherungsnr.','Sprache','Stichwörter','Vertraulichkeit','Verzeichnisserver','Webseite','Weiteres Postfach'];
    // Keys which are actually populated
    // var keys = ['Anrede','Vorname','Weitere Vornamen','Nachname','Suffix','Firma','Abteilung','Position','Straße geschäftlich','Straße geschäftlich 2','Straße geschäftlich 3','Ort geschäftlich','Region geschäftlich','Postleitzahl geschäftlich','Land/Region geschäftlich','Straße privat','Straße privat 2','Straße privat 3','Ort privat','Bundesland/Kanton privat','Postleitzahl privat','Land/Region privat','Weitere Straße','Weitere Straße 2','Weitere Straße 3','Weiterer Ort','Weiteres/r Bundesland/Kanton','Weitere Postleitzahl','Weiteres/e Land/Region','Telefon Assistent','Fax geschäftlich','Telefon geschäftlich','Telefon geschäftlich 2','Autotelefon','Fax privat','Telefon (privat)','Telefon (privat 2)','Mobiltelefon','Weiteres Fax','Weiteres Telefon','Pager','Haupttelefon','Mobiltelefon 2','Assistent(in)','E-Mail-Adresse','E-Mail 2: Adresse','E-Mail 3: Adresse','Geburtstag','Jahrestag','Kategorien','Name des/r Vorgesetzten','Notizen','Partner/in','Webseite'];
    result += '"' + keys.join('","') + '"\r\n';
    for (const contact of contactsData) {
        for (const key of keys) {
            result += '"' + contact[key].replaceAll(",", ";") + '",';
        }
        // Remove redundant comma at end of line
        result = result.slice(0, -1);
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
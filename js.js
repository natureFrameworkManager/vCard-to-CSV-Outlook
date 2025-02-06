// Elements
var start_button1 = document.querySelector("#start_button");
var downloadButton = document.querySelector("#download-button");
var textarea1 = document.querySelector("#textarea1");
var textarea2 = document.querySelector("#textarea2");
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


// Parser
function ausfuehren() {
    var temp;
    temp = textarea1.value;

    // Alles unnötige Rausputzen! :)))
    temp = temp.replace(/;/gim, '');
    temp = temp.replace(/CHARSET=.*:/gim, ':');
    // Hier nur erste Zeile von Photo weg :(
    temp = temp.replace(/^PHOTO.*/gim, '');
    // Macht die restlichen Photo-Daten weg! :)))
    temp = temp.replace(/^ .*\n/gim, '');

    // Decode CHARSET=
    // Wenn match nichts findet gibt null zurück!
    var arr = temp.match(/(=..=.*=..$|%..%.*%..$)/gim);

    if (arr !== null) {
        // Hier werden einfach '=' durch '%' ersetzt! ;)
        for (var x = 0; x < arr.length; x++) {
            arr[x] = arr[x].replace(/={1}/g, '%');
        }
        // Hier wird decodiert
        for (var x = 0; x < arr.length; x++) {
            arr[x] = decodeURI(arr[x]);
        }

        // Alle decodierten Werte Ersetzen im ganzen Text
        for (var x = 0; x < arr.length; x++) {
            temp = temp.replace(/(=..=.*=..$|%..%.*%..$)/m, arr[x]);
        }

    }

    // Alles in ein Array-Array Packen
    temp = temp.split('\n');

    var index = 0;
    var x = 0;
    var arr_str = [];
    var arr_str_i = [];
    try {
        while (true) {

            arr_str_i[x] = temp.shift();

            if (arr_str_i[x].match(/^END:VCARD/i)) {
                arr_str[index] = arr_str_i;
                index++;
                x = 0;
                arr_str_i = [];
                continue;
            }
            x++;
        }
    } catch { };

    //Ausgabe-Array-CSV
    var ausgabeArr = [];
    var spaltenNamen = [];
    var temp = '';
    var index = 0;
    for (var x = 0; x < arr_str.length; x++) {
        temp = arr_str[x]
        for (var i = 0; i < temp.length; i++) {
            spaltenNamen[i] = temp[i].split(':');
        }
        ausgabeArr[index] = spaltenNamen;
        spaltenNamen = [];
        index++;
    }

    // Ausgabe:
    var strSpalten = '';
    for (var x = 0; x < ausgabeArr.length; x++) {
        // Spalten
        for (var i = 0; i < ausgabeArr[x].length; i++) {

            // Filter
            if (filter(strSpalten, ausgabeArr, x, i))
                continue;

            strSpalten += ausgabeArr[x][i][0] + ';';
        }
    }
    function filter(strSpalten, ausgabeArr, x, i) {
        var str = '';

        // Grober Filter
        // Folgendes Rauswerfen
        str = ausgabeArr[x][i][0];

        if (str.match(/VERSION/i))
            return true;
        if (str.match(/BEGIN/i))
            return true;
        if (str.match(/END/i))
            return true;

        // Muss sein sonst wird N in FN gefunden und nicht aufgenommen! :()
        if (strSpalten) {
            var spaltenWerte = strSpalten.split(';');
            for (var x = 0; x < spaltenWerte.length; x++) {
                if (spaltenWerte[x] === str)
                    return true;
            }
        }
        return false;
    }


    // Finale!

    // Enthält die Kopf Zeilen
    // strSpalten;

    // Wird nur die Werte enthalten 
    var arrEntgueltig = [];

    // Ausgabe Objekt
    var obj = {};

    var tempStr = '';
    for (var x = 0; x < ausgabeArr.length; x++) {
        for (var i = 0; i < ausgabeArr[x].length; i++) {
            // key value
            obj[ausgabeArr[x][i][0]] = ausgabeArr[x][i][1];
        }

        var spaltenWerte = strSpalten.split(';');
        for (var y = 0; y < spaltenWerte.length; y++) {
            tempStr += obj[spaltenWerte[y]] + ';';
        }

        // Hier wird abgefüllt!!
        tempStr = tempStr.replace(/undefined/g, '');
        arrEntgueltig[x] = tempStr;

        // Ausgabe aufs Textfeld
        // Stellt Autokorrektur zurück(Rote Wellenlinien)
        textarea2.value = '';

        // Kopfzeile
        textarea2.value = strSpalten + '\n';

        // Werte(Zeilen)
        for (var y = 0; y < arrEntgueltig.length; y++) {
            textarea2.value += arrEntgueltig[y] + '\n';
        }
        tempStr = '';
        obj = {};

        createDownload(textarea2.value);
        downloadButton.classList.remove("hidden")
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
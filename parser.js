const file = require("fs");
const DELAY = 30000;//yes, yandex really slow enough to do such delay
const element = ".serp-layout_kb__content-container";
let link = file.readFileSync("file.txt");
let search = require("webpage").create();

search.open(link, () => {
    slimer.wait(DELAY);
    let size = search.evaluate((element) => {
        return {
            height: document.querySelector(element).offsetHeight,
            width: document.querySelector(element).offsetWidth,
            left: document.querySelector(element).offsetLeft,
            top: document.querySelector(element).offsetTop
        };
    }, element);

    search.clipRect = size;
    search.render('screen.png');
    search.close();
    phantom.exit();

});
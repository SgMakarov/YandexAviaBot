const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN
const {exec} = require('child_process');
const bot = new TelegramBot(token, {
    polling: true
});
const initlalMessageRegExp = new RegExp('/tickets ([\\w|а-я|А-Я]+)\\s+([\\w|а-я|А-я]+)', 'i');
const cityRegExp = new RegExp('[\\w|а-я|А-я]+', 'i');
const dateRegExp = new RegExp("Отмена\\s*|Сегодня\\s*|Завтра\\s*|\\d\\d[\\s*|:|\\-|.]\\d\\d[\\s*|:|\\-|.]\\d\\d|\\d\\d[\\s*|:|\\-|.]\\d\\d[\\s*|:|\\-|.]\\d\\d\\d\\d", 'i')
const returnDateRegExp = new RegExp('Отмена\\s*|В \\s*один\\s* конец\\s*|Сегодня\\s*|Завтра\\s*|\\d\\d[\\s*|:|\\-|.]\\d\\d[\\s*|:|\\-|.]\\d\\d|\\d\\d[\\s*|:|\\-|.]\\d\\d[\\s*|:|\\-|.]\\d\\d\\d\\d', 'i')
const luggageRegExp = new RegExp('Отмена\\s*|Да\\s*|Нет\\s*', 'i');
const numberRegExp = new RegExp('\\d+');
const file = require('fs');
const NEW_USER = 0;
const INITIAL = 1;
const DESTINATION = 2;
const ARRIVAL = 3;
const RETURN = 4;
const ADULT = 5;
const CHILDREN = 6;
const LUGGAGE = 7;

const users = new Map([]);
const userPattern = {
    from: "",
    to: "",
    when: 'today',
    retDate: 'today',
    adultN: 1,
    childN: 0,
    luggageN: 0,
    stage: NEW_USER
};


const dateKB = {
    "reply_markup": {
        "keyboard": [[
            {
                "text": "Сегодня"
            }], [
            {
                "text": "Завтра"
            }], [
            {
                "text": "Отмена"
            }]
        ]
    }
}
const returnDateKB = {
    "reply_markup": {
        "keyboard": [[
            {
                "text": "Сегодня"
            }], [
            {
                "text": "Завтра"
            }], [
            {
                "text": "Отмена"
            }], [
            {
                "text": "В один конец"
            }]
        ]
    }
}
const adultTicketsKB = {
    "reply_markup": {
        "keyboard": [[
            {
                "text": "1"
            }], [
            {
                "text": "2"
            }], [
            {
                "text": "3"
            }], [
            {
                "text": "4"
            }]
        ]
    }
}
const childrenTicketsKB = {
    "reply_markup": {
        "keyboard": [[
            {
                "text": "0"
            }], [
            {
                "text": "1"
            }], [
            {
                "text": "2"
            }], [
            {
                "text": "3"
            }]
        ]
    }
}
const luggageKB = {
    "reply_markup": {
        "keyboard": [[

            {
                "text": 'Да'
            }], [
            {
                "text": "Нет"
            }]
        ]
    }
}


const removeKB = {
    "reply_markup": {
        "remove_keyboard": true
    }
}


bot.onText(new RegExp(".+"), msg => {
    if (!users.has(msg.chat.id)) {
        let copy = Object.assign({}, userPattern);
        users.set(msg.chat.id, copy);
    }

    if (users.get(msg.chat.id).stage === NEW_USER && initlalMessageRegExp.exec(msg.text)) {
        users.get(msg.chat.id).from = msg.text.replace(initlalMessageRegExp, "$1");
        users.get(msg.chat.id).to = msg.text.replace(initlalMessageRegExp, "$2");
        bot.sendMessage(msg.chat.id, "Когда вы хотели бы полететь?", dateKB);
        users.get(msg.chat.id).stage = ARRIVAL;
    } else if (msg.text === "\/cancel" || msg.text === 'Отмена') {
        bot.sendMessage(msg.chat.id, "Хорошо, введите новый маршрут", removeKB);
        clear(msg);
    } else if (users.get(msg.chat.id).stage === NEW_USER && msg.text === '\/tickets') {
        bot.sendMessage(msg.chat.id, "Откуда вы планируете вылетать?");
        users.get(msg.chat.id).stage = INITIAL;

    } else if (users.get(msg.chat.id).stage === INITIAL && cityRegExp.exec(msg.text)) {
        users.get(msg.chat.id).from = msg.text;
        bot.sendMessage(msg.chat.id, "Куда вы планируете вылетать?",);
        users.get(msg.chat.id).stage = DESTINATION;
    } else if (users.get(msg.chat.id).stage === DESTINATION && cityRegExp.exec(msg.text)) {
        users.get(msg.chat.id).to = msg.text;
        bot.sendMessage(msg.chat.id, "Когда бы вы хотели вылететь?", dateKB);
        users.get(msg.chat.id).stage = ARRIVAL;
    } else if (users.get(msg.chat.id).stage === ARRIVAL) {
        if (dateRegExp.exec(msg.text)) {
            if (msg.text === "Сегодня") {
                users.get(msg.chat.id).when = "today";
            } else if (msg.text === "Завтра") {
                users.get(msg.chat.id).when = "tomorrow";
            } else {
                console.log()
                users.get(msg.chat.id).when = msg.text.replace(new RegExp('(\\d\\d)[.|\\-|\\s|:](\\d\\d)[.|\\-|\\s|:](\\d+)'), "$3-$2-$1");
            }
            bot.sendMessage(msg.chat.id, "Когда планируете возвращаться?", returnDateKB);
            users.get(msg.chat.id).stage = RETURN;
        } else {
            bot.sendMessage(msg.chat.id, "Неправильная дата, введите снова", dateKB);
        }

    } else if (users.get(msg.chat.id).stage === RETURN) {
        if (returnDateRegExp.exec(msg.text)) {
            if (msg.text === "Сегодня")
                users.get(msg.chat.id).retDate = "today";
            else if (msg.text === "Завтра") {
                users.get(msg.chat.id).retDate = "tomorrow";
            } else if (msg.text === "В один конец") {
                users.get(msg.chat.id).retDate = "";
            } else {
                users.get(msg.chat.id).retDate = msg.text.replace(new RegExp('(\\d\\d)[.|\\-|\\s|:](\\d\\d)[.|\\-|\\s|:](\\d+)'), "$3-$2-$1");
            }
            bot.sendMessage(msg.chat.id, "Сколько нужно взрослых билетов?", adultTicketsKB)
            users.get(msg.chat.id).stage = ADULT;
        } else {
            bot.sendMessage(msg.chat.id, "Неправильная дата, введите снова", returnDateKB);
        }

    } else if (users.get(msg.chat.id).stage === ADULT) {
        if (numberRegExp.exec(msg.text)) {
            users.get(msg.chat.id).adultN = msg.text;
            bot.sendMessage(msg.chat.id, "Сколько нужно детских билетов?", childrenTicketsKB)
            users.get(msg.chat.id).stage = CHILDREN;
        } else {
            bot.sendMessage(msg.chat.id, "Не число, введите снова", adultTicketsKB);
        }

    } else if (users.get(msg.chat.id).stage === CHILDREN) {
        if (numberRegExp.exec(msg.text)) {
            users.get(msg.chat.id).childN = msg.text;
            bot.sendMessage(msg.chat.id, "Нужен ли багаж?", luggageKB)
            users.get(msg.chat.id).stage = LUGGAGE;
        } else {
            bot.sendMessage(msg.chat.id, "Не число, введите снова", childrenTicketsKB);
        }

    } else if (users.get(msg.chat.id).stage === LUGGAGE) {
        if (luggageRegExp.exec(msg.text)) {
            users.get(msg.chat.id).luggageN = msg.text === "Да" ? 1 : 0;
            //everything is ok and we can go to yandex
            let link = 'https://avia.yandex.ru/search/result/?fromName=' + users.get(msg.chat.id).from + '&toName=' + users.get(msg.chat.id).to + '&when=' + users.get(msg.chat.id).when + '&return_date=' + users.get(msg.chat.id).retDate + '&adult_seats=' + users.get(msg.chat.id).adultN + '&children_seats=' + users.get(msg.chat.id).childN + '&fromBlock=FormSearch#bg=' + users.get(msg.chat.id).luggageN;
            file.writeFileSync("file.txt", link, err => {
                console.log("no file")
            });
            let id = '';
            bot.sendMessage(msg.chat.id, "Подождите, пока Яндекс обработает запрос", removeKB).then(msg => {
                id = msg.message_id
            });
            exec('slimerjs --headless parser.js', {env: process.env}, () => {
                bot.sendPhoto(msg.chat.id, file.readFileSync('./screen.png'), {
                    //bot.sendMessage(msg.chat.id, "lsdfj", {
                    "reply_markup": {
                        "inline_keyboard": [[
                            {"text": 'результаты поиска', url: link}
                        ]]
                    }
                }).then(() => {
                    clear(msg);
                    bot.deleteMessage(msg.chat.id, id);
                });

            });


        } else {
            bot.sendMessage(msg.chat.id, "Неверный ввод, введите снова", luggageKB);
        }

    } else {
        bot.sendMessage(msg.chat.id, "Неправильный ввод", removeKB);
        clear(msg);
    }


});


function clear(msg) {

    file.writeFileSync("file.txt", '');
    users.delete(msg.chat.id)

}


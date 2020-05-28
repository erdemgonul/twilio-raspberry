const gpio = require('pigpio').Gpio;
const twilio = require('twilio');
var moment = require('moment');

moment.locale('tr');

const accountSid = 'ACbf13e351061aea0a81fc33f2d1dcf78f';
const authToken = '8a8cd6503d7e274d801a6f054edac042';


const homeOwnerPhone = "+90 532 432 28 62";
const fromPhone = "+90 538 724 5515 ";
var client = new twilio(accountSid, authToken);


// microseconds to travel 1 cm at 20 Celcius
const microSecondsPerCM = 1e6 / 34321;

let actionStartTime;
//defining trigger and echo pins
const trigger = new gpio(23, { mode: gpio.OUTPUT });
const echo = new gpio(24, { mode: gpio.INPUT, alert: true });

trigger.digitalWrite(0);

function checkSensor() {
    let startTick;
    let isActiveCall = false;
    //check if level of input changed
    echo.on('alert', (level, tick) => {
        if (level) // if level is 1
            startTick = tick; // assign current tick to startTick
        else {
            let endTick = tick;
            let diff = (endTick >> 0) - (startTick >> 0);
            if (diff / (2 * microSecondsPerCM) < 200) {
                if (diff / 2 / microSecondsPerCM < 100 && diff/2/microSecondsPerCM > 20  && !isActiveCall) {
                    console.log("Calling");
		   console.log(diff/(2*microSecondsPerCM));

                    isActiveCall = true;
                    actionStartTime = tick;
                    console.log(moment().format('LLLL'), " tarihinde kapınıza bir kişi gelmiştir.");

                    client.calls
                        .create({
                            url: 'http://demo.twilio.com/docs/voice.xml',
                            to: homeOwnerPhone,
                            from: fromPhone
                        })
                        .then(call => {
                            console.log(call.sid);
                        }
                        );
                    client.messages
                        .create({
                            body: moment().format('LLLL') + " tarihinde kapınıza bir kişi gelmiştir.",
                            to: homeOwnerPhone,
                            from: '+1 201 890 7056'
                        })
                        .then(message => console.log(message.sid));
 }

            }
          if (isActiveCall && ((endTick >> 0) - (actionStartTime >> 0)) > 60000000)
            isActiveCall = false;
        }
    });
}
checkSensor();
setInterval(() => {
    trigger.trigger(10, 1);
}, 100);



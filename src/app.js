import path from 'path';
import url from 'url';

import ffi from 'ffi-napi';
import notifier from 'node-notifier';

import {
    error,
    warning,
    info,
    verbose } from './print.js';
import settings from './settings.json' with {type: 'json'};

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const dayInMilleseconds = 24 * 60 * 60 * 1000;

const VolumeControlApi = ffi.Library(path.join(__dirname, '../VolumeControl.dll'), {
    'setVolume': [ 'bool', [ 'int' ] ],
    'setMute': [ 'bool', [ 'bool' ] ]
});

main();

function main() {
    verbose('Starting...');

    if (settings.schedule.length === 0) {
        warning(`No schedule provided, exiting...`);
        process.exit();
    }

    schedule();

    process.on('SIGINT', () => {
        warning('SIGINT received, exiting...');
        process.exit();
    });

    // Use a no-op timer to keep the process running.
    setInterval(() => {}, 60 * 60 * 1000);
}

function schedule() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + dayInMilleseconds).toISOString().split('T')[0];

    let lowestTimeToWait = dayInMilleseconds;
    let scheduledTime = now;
    let scheduledVolume = 0;
    for (const schedule of settings.schedule) {
        let time = new Date(`${today} ${schedule.time}`);
        if (time <= now) {
            time = new Date(`${tomorrow} ${schedule.time}`);
        }

        const timeToWait = time.getTime() - now.getTime();
        if (timeToWait < lowestTimeToWait) {
            lowestTimeToWait = timeToWait;
            scheduledTime = time;
            scheduledVolume = schedule.volume;
        }
    }

    verbose(`Next scheduled time is ${scheduledTime.toLocaleString()}`);

    setTimeout(() => {
        if (VolumeControlApi.setVolume(scheduledVolume)) {
            info(`Successfully changed volume to ${scheduledVolume}`);
            sendDesktopNotification('Audio Volume Changed', `Successfully changed audio volume to ${scheduledVolume}`, 'update-success.png');
        } else {
            error(`Failed to change volume to ${scheduledVolume}`);
            sendDesktopNotification('Failed to Change Audio Volume', `Failed to change audio volume to ${scheduledVolume}`, 'update-failure.png');
        }
        schedule();
    }, lowestTimeToWait);
}

function sendDesktopNotification(title, message, icon) {
    if (settings.showNotification) {
        notifier.notify({
            title: title,
            message: message,
            appID: 'Audio Volume Scheduler',
            icon: getImagePath(icon),
        });
    }
}

function getImagePath(imageFile) {
    return path.join(__dirname, 'images', imageFile);
}

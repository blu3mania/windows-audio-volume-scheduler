import path from 'path';
import url from 'url';

import ffi from 'ffi-napi';
import notifier from 'node-notifier';

import {
    error,
    warning,
    info,
    verbose } from './print.js';
import settings from './settings.json' assert {type: 'json'};

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const dayInMilleseconds = 24 * 60 * 60 * 1000;

const VolumeControlApi = ffi.Library(path.join(__dirname, '../VolumeControl.dll'), {
    'setVolume': [ 'bool', [ 'int' ] ],
    'setMute': [ 'bool', [ 'bool' ] ]
});

/*
const monitor = new NetworkInterfaceMonitor(settings.networkInterface, settings.addressFamily, (address, eventType) => {
    switch (eventType) {
        case NetworkInterfaceMonitor.EventType.Initial:
            // Initial callback
            if (address !== null) {
                info(`Current ${settings.addressFamily} address: ${address[settings.addressFamily]}`);
            } else {
                warning(`Network interface '${settings.networkInterface}' is inactive!`);
            }
            break;

        case NetworkInterfaceMonitor.EventType.IPChanged:
            info(`${settings.addressFamily} address changed: ${address[settings.addressFamily]}`);
            if (settings.showNotification && settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.IpChanged)) {
                sendDesktopNotification('IP Changed', `Network interface '${settings.networkInterface}' ${settings.addressFamily} address changed: ${address[settings.addressFamily]}`, 'ip-changed.png');
            }
            break;

        case NetworkInterfaceMonitor.EventType.IPAssigned:
            info(`Network interface '${settings.networkInterface}' is now active.`);
            info(`${settings.addressFamily} address assigned: ${address[settings.addressFamily]}`);
            if (settings.showNotification && settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.IpAssigned)) {
                sendDesktopNotification('IP Assigned', `Network interface '${settings.networkInterface}' ${settings.addressFamily} address assigned: ${address[settings.addressFamily]}`, 'ip-changed.png');
            }
            break;

        case NetworkInterfaceMonitor.EventType.IPRemoved:
            warning(`Network interface '${settings.networkInterface}' is now inactive!`);
            if (settings.showNotification && settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.IpRemoved)) {
                sendDesktopNotification('IP Removed', `Network interface '${settings.networkInterface}' is now inactive!`, 'ip-changed.png');
            }
            break;
    }

    if (dnsProvider !== null
        && address !== null && address[settings.addressFamily]
        && (
            (ipToRegister === null && currentRegisteredIP !== address[settings.addressFamily])
            || (ipToRegister !== null && ipToRegister !== address[settings.addressFamily])
        )) {
        ipToRegister = address[settings.addressFamily];
        info(`Registering domain ${settings.domainName} with IP ${ipToRegister}...`);
        dnsProvider.register(ipToRegister, settings.addressFamily, (data, eventType) => {
            switch (eventType) {
                case DnsProvider.EventType.Registered:
                    ipToRegister = null;
                    currentRegisteredIP = data;
                    info(`Registered ${settings.addressFamily} address ${currentRegisteredIP}`);
                    if (settings.showNotification && settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.DnsRegistration)) {
                        sendDesktopNotification('DNS Registration Updated', `Updated domain ${settings.domainName} with IP ${currentRegisteredIP}`, 'dns-updated.png');
                    }
                    break;

                case DnsProvider.EventType.RegistrationScheduled:
                    const waitTime = Math.round(data / 1000);
                    warning(`Last IP registration just happened so next one is deferred. Waiting for ${waitTime < 1 ? 'less than 1' : waitTime} second${waitTime > 1 ? 's' : ''} before calling provider...`);
                    if (settings.showNotification && settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.ScheduledDnsRegistration)) {
                        sendDesktopNotification('DNS Registration Scheduled', `Will update domain ${settings.domainName} with IP ${ipToRegister} in ${waitTime} seconds.`, 'dns-update-scheduled.png');
                    }
                    break;

                case DnsProvider.EventType.Failed:
                    ipToRegister = null;
                    error(`Registration failed due to error: ${data}`);
                    if (settings.showNotification && settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.DnsRegistration)) {
                        sendDesktopNotification('DNS Registration Failure', `Failed to update domain ${settings.domainName}!`, 'dns-update-failure.png');
                    }
                    break;
            }
        });
    }
});
*/

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
            if (settings.showNotification) {
                sendDesktopNotification('Audio Volume Changed', `Successfully changed audio volume to ${scheduledVolume}`, 'update-success.png');
            }
        } else {
            error(`Failed to change volume to ${scheduledVolume}`);
            if (settings.showNotification) {
                sendDesktopNotification('Failed to Change Audio Volume', `Failed to change audio volume to ${scheduledVolume}`, 'update-failure.png');
            }
        }
        schedule();
    }, lowestTimeToWait);
}

function sendDesktopNotification(title, message, icon) {
    notifier.notify({
        title: title,
        message: message,
        appID: 'Audio Volume Scheduler',
        icon: getImagePath(icon),
    });
}

function getImagePath(imageFile) {
    return path.join(__dirname, 'images', imageFile);
}

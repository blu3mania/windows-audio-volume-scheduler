# windows-audio-volume-scheduler
[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-yellow)](https://raw.githubusercontent.com/blu3mania/windows-audio-volume-scheduler/main/LICENSE)
[![node.js 16+](https://img.shields.io/badge/node.js-16.0.0-blue?logo=node.js)](https://nodejs.org/en/)
[![Latest Release](https://img.shields.io/github/v/release/blu3mania/windows-audio-volume-scheduler)](https://github.com/blu3mania/windows-audio-volume-scheduler/releases/latest)

Automatically adjust Windows system audio level based on a configurable schedule.

## Run these steps first (end user):

1. One of the packages, "ffi-napi", uses native modules and relies on "node-gyp" to build the project if needed,
   depending on whether a prebuilt binary exists or not. As a result, there may be some prerequisites that are
   needed to be installed/configured. The recommendation is to try to install this package first, and if it ends
   up building the native binary on the fly and node-gyp complains about something, then refer to
   [node-gyp's instructions](https://github.com/nodejs/node-gyp#installation) to have those prerequisites installed.

2. Edit src/settings.json.
   * service defines service parameters when installed as Windows service:
     * name is the service name to be used.
     * account info is optional. If provided, the service will be running as the specified account. These properties
       can be provided:
       * name is account's name
       * password is account's password
       * domain is optional, and should be provided if the account is a domain account
   ```
    "service": {
        "name": "Audio Volume Scheduler",
        "account": {
            "name": "{account name}",
            "password": "{account password}",
            "domain": "{account domain}"
        }
    },
   ```
   * schedule lists trigger time and desired audio value level (between 0 and 100). Currently schedule runs daily.
   * showNotification allows showing Windows notification when it succeeds or fails to adjust audio volume.

     **Note**, this only works when running in standalone mode instead of as a Windows service.

4. Run "npm install". Accept UAC prompts if any (there could be up to 4). "npm link" can be used as well,
   which will create a command "showip" that can be used as a shortcut to "src/show-interfaces.js".

   **Note**, this step installs the script as a Windows service. If it's not desired, run "npm run uninstall"
   afterwards.

## For developers:

The native DLL and optionally the test executable can be built by one of the following methods:

- To build the project in *Visual Studio 2022*, just open the solution file in VS2022 and build.
- For those who use *Visual Studio Code*, a *.vscode* folder is provided at top level, with tasks defined and
  the default build task uses MSBuild to generate the *Release|x64* output. **Note**, you need to download and
  install *Build Tools for Visual Studio 2022* from [this page](https://visualstudio.microsoft.com/downloads/).
  Make sure to include *Desktop development with C++* workload during installation.

  Launch VSCode from *Developer Command Prompt for VS 2022* by running *"code ."* from src directory, so that
  environment needed by *MSBuild* is set up properly.
- The third option is cmake. A *CMakeLists.txt* file is provided in src directory. It is recommended to use a
  separate build directory at top level. For example, "cmake -B build" creates a build directory at top level
  and prepares the build environment, then, "cmake --build build --config Release" builds the project in release
  mode.

## To run the script manually:

Run "npm start" or "node src/app.js".

## To install and run the script as a Windows service:

Run "npm run install" or "node src/install-service.js". Accept UAC prompts if any (there could be up to 4).

**Note**, if settings.json is updated when service is running, restart it in Windows Services control panel.

## To uninstall the Windows service:

Run "npm run uninstall" or "node src/uninstall-service.js". Accept UAC prompts if any (there could be up to 4).

## FALK PA-01 Advanced Control Board

### Build
- Install Visual Studio Code and open
- From the Extensions window, install PlatformIO (this will take a while)

```
cd ~
git clone https://github.com/gilphilbert/falk-pa01-advanced.git
code .
```

To build the firmware click on the PlatformIO tab on the left (little alien) and then select `Build` under `esp32dev`. When that completes, select `Build Filesystem Image` under `Platform`.

Note: PlatformIO (https://github.com/gilphilbert/falk-pa01-advanced/issues/3)[can have issues on MacOS], for now using a virtual machine with Debian installed is the recommended workaround.

### Installation
Assuming those both complete, you're ready to flash the firmware
- Connect the Ground, TX and RX connectors on the advanced board to a serial adapter
- Connect the serial adapter to your development machine
- Power up the Advanced Control Board
- While holding down the BOOT button, press the RESET button
- In PlatformIO, click the `Upload` option under `esp32dev` or press `CTRL` + `SHIFT` + `U`
  - This will rebuild and upload the code to the Advanced Control Board
  - If you see an error saying you need to install udev rules, follow the link to install the rules then try again
- Once the firmware upload is complete, put the board back into programming mode by holding the BOOT button and pressing the RESET button again
- Now upload the filesystem image by going to the PlatformIO tab and clicking on `Upload Filesystem Image` (not the OTA one!)
- When the upload is complete, press the RESET button on the Advanced Control Board
- Programming is complete!

### Updating the firmware
Once you have the PA-01 connected to your wifi, you can update your PA-01 easily. When you've made changes to the code, simply build the code. If you haven't made changes to the UI, then you can upload the firmware directly using the Web UI:
    `/user/home/project-path/.pio/build/esp32dev/firmware.bin`
If you changed the Web UI, next you will need to build the File System Image. The File System Image will include the new firmware as a bundle. Navigate to the build folder and use the Web UI to upload the bundle:
  `/user/home/project-path/.pio/build/esp32dev/spiffs.bin`
Node: to upload firmware in the web UI of the PA-01, go to "Firmware" and select "Update". Provide the new bin file and it will upload the new firmware and restart the unit.

### Connecting the PA-01 to WiFi
Press and hold the INPUT button for 5 seconds. The PA-01 will start an Access Point (named on the front of the unit) that you can connect to. Browse to [http://192.168.4.1](http://192.168.4.1). Click on "Wireless" and select your WiFi network and enter your key.
Note: The board is based on the ESP32 microcontroller which only supports 2.4GHz WiFi networks.
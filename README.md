# MakerBot WebUI

[![bitHound Overall Score](https://www.bithound.io/github/tjhorner/MakerbotWebUI/badges/score.svg)](https://www.bithound.io/github/tjhorner/MakerbotWebUI)
[![bitHound Dependencies](https://www.bithound.io/github/tjhorner/MakerbotWebUI/badges/dependencies.svg)](https://www.bithound.io/github/tjhorner/MakerbotWebUI/master/dependencies/npm)
[![bitHound Code](https://www.bithound.io/github/tjhorner/MakerbotWebUI/badges/code.svg)](https://www.bithound.io/github/tjhorner/MakerbotWebUI)

**This software is in _beta_! Please report issues [here](https://github.com/tjhorner/MakerbotWebUI/issues), but make sure you're not creating dupes. Thank you!**

![](https://raw.githubusercontent.com/tjhorner/MakerbotWebUI/master/screenshot.png)

This project's goal is to make 3D printing across multiple devices and with many files as easy as possible. Example use cases could be:

- Allowing students at a university to queue up their own prints without admin assistance
- Letting people print at makerspaces without all the "who got here first" arguments
- Personal printing: if you have multiple MakerBots for some reason

The queue works like this:

- User adds a print. If there's an available printer, start printing. If not, queue.
- Thing prints.
- After thing is done printing, wait until printer is marked as "ready".
- Mark print as "complete" in the database, and let the next queued print go to that printer.

## Contribute

If you like this project and you want to contribute in some way,
there are many ways to do so! You can:

- [Go bug hunting](https://github.com/tjhorner/MakerbotWebUI/issues)
- [Submit a pull request](https://github.com/tjhorner/MakerbotWebUI/pulls)
- [Buy me a cup of tea](https://cash.me/$tjhorner/5)

## Setup

Setup is a bit complex. First, you need to identify the LAN that your printers are on. It's critical that the server is run on the same LAN as the printers.

After you've determined the LAN that the printers are running on, and set up the server on that same LAN, you can install the required modules and go to the _actual_ setup.

Okay, now we need a MongoDB server. You can install one locally, use mLab or something, it doesn't really matter. I recommend you read [this guide](https://docs.mongodb.com/manual/installation/) if you aren't familiar with setting up a MongoDB server. I host mine locally since it's more reliable. Once you have a Mongo server, make a config.json file, and fill it with this:

```json
{
  "mongoUri": "YOUR_MONGO_URI",
  "printerAuth": {
    "authMethod": "thingiverse",
    "thingiverseToken": "YOUR_THINGIVERSE_TOKEN",
    "username": "YOUR_THINGIVERSE_USERNAME"
  },
  "cookieSecret": "SOME_RANDOM_CHARACTERS_OR_SOMETHING",
  "debug": false
}
```

You can find more info about getting a Thingiverse token [here](https://github.com/tjhorner/node-makerbot-rpc/wiki/Thingiverse-Tokens).

Ok now, to run the server, run these commands with Node.js >v7 installed:

```bash
npm install
node index # Server will be running at the PORT env variable, or 3000
```

If you don't get any errors, great! If you do, head over to the issues and see if there's already one there. If not, go ahead and create one!

### Setting up the admin user account

When you first start up the server and go to the index page, it should prompt you to set up an admin user. Do this.

### Setting up your printers

To add a printer, press the "Add Printer" link at the top. The only field needed is the printer's IP, since the printer will provide all the other info for us. You can find your printer's IP by going to your printer's network settings.

Repeat the steps above for each printer on your network. _Note: later on, auto network scanning may be possible, but I don't have the time to do that right now. Sorry!_

Once you're done adding printers, restart the server. The server will then attempt a connection to each of the printers you added. You can check that a connection has been successfully established by going to the "Manage Printers" page again.

### Testing a print

With MakerBot Print or MakerBot Desktop, generate a `.makerbot` file for printing. It can be anything you'd like. Now, go to the "Prints" page, and press "Queue Print". Drag your print file into the file upload box, review the print information, and press "Add it to the queue". If successful, the print should now show up in both "Your Prints" and the global print queue.

After a few seconds, the status should change to either "Sending Print File" or a progress number. The printer assigned to the print should also appear. Go check the assigned printer to see if it's actually printing it.

Once the print is done, you should see the progress change to "Complete". Clear your build plate and press the knob on the printer to mark the printer as ready to print. Shortly after, the status on the print queue should also change, and the print should disappear (it will still show up in your prints). If you have more prints, the next one should automatically queue up.

# License

```
MakerBot WebUI
Copyright (C) 2017 TJ Horner

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```
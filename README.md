# NitradisBot

This Project started as a completely different approach. When we started playing ARK: Survival Evolved in our gaming group, we quickly needed a way fo all players to start or stop the server. But not all of us have an Account at Nitrado, so we needed some kind of tool.
Since I like to code in my free time I started developing a small tool for us. The first version was a Webpage written in React which did the job quiet well. After a while it was quit painful to maintain so I searched for a new approach and this project was created.

## What is this?
This Discord Bot is used to control game servers hosted by Nitrado. It is completely written in Node.js and uses discord.js and a few other packages like sequelize for the database or undici for an easy API access. \

## How to install
This project is available as Docker Container on Docker Hub. So the easiest way to install is to simply start it as a Docker Container. \
Since the Bot connects to Discord as a user, the Container has no incoming ports. For persistent storage you need a Volume for a single folder where the SQLite Database will be stored. And the configuration is done via an .env file (see the .env.template).
But you can also just clone the GitHub Repo and start from there, but I will not describe how to do that.

### Preparation
To use the Bot on your own, you need to create a Discord Application in the Discord Developer Portal.
* Log in at: https://discord.com/developers/applications
* Create a new Application
* Go the the "Bot" Tab and click "Add Bot"

Be sure to save the token of the Bot now! This token goes into the .env file, if you forget it, you have to reset the Token an need to reconfigure the .env file. 

You can find a more detailed explanation on how to create a bot [here](https://discordpy.readthedocs.io/en/stable/discord.html).

So far the bot does not need any special permissions. To join the bot to your Discord Server you need to use the URL Generator under the OAuth2 Tab. With this URL you set the permissions for the Bot on your Server, to change these you have to rejoin the Bot to your Server with a new URL. \
The permissions needed are shown [here](./docs/img/NitradisBot_Permissions_noURL.png), if you feel uncomfortable with some of the permissions like "Manage Server" you can find a more restricted permission set [here](./docs/img/NitradisBot_Permissions_noURL_restricted.png). The Bot should work without control over you Discord Server, feel free to test more restrictive permissions.

Now since you hav your discord bot, you are ready to fill your .env file. Just create a copy the the .env.template. The `DISCORD_TOKEN` mentioned before can only be seen when resetting it on the Bot Tab in the Discord Dev Portal. The `clientId` can be found on the "General Information" Tab in the Discord Dev Portal. And finally you can copy the `guildId` with a right click on your Server in the Discord App. You have to enable the Developer mode, more information can be found [here](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-)

Finally you need to register the Bot Commands to the Discord system. The script [deploy-commands.js](deploy-commands.js) does the job for you, but you have to trigger it manually. Unfortunately I don't have a simple solution yet. You can either override the start command for the Docker Container or just run the script locally. \
If you want to delete the Commands just use the script [delete-commands.js](delete-commands.js) the same way.

### Starting the container
Now that you have created the .env file and joined your Bot to your Server you can start the Bot Application. Be sure to change the path shown below if needed.

```
docker run -d --name=NitradisBot -v $(pwd)/.env:/usr/src/nitradisbot/.env:ro -v nitradisbotDB:/var/lib/nitradisbot:rw viseron/nitradisbot:latest
```

## How to use the Bot
The final step of the Preparation phase should have registered the available commands on your Discord Server. You can check that in you Server Setting -> Integrations -> "Bot Name"

The available commands are: 
|Command|Subcommand|Options|Description|
|-------|----------|-------|-----------|
|/bot|ping|-|Can be used for connectivity test. Returns the roundtrip time for the bot.|
|/bot|restart|-|Actually kill the bot process. The PM2 process manager in the docker container will restart a new process|
|/help|-|-|Show a auto generated list of all Main commands|
|/ping|-|-|Pong|
|/server|import| serverid, server-name, nitrado-token|Add a Server into the Database. The Bot can only control servers saved in its database. The serverid can be obtained from the Nitrado Webportal. You can create a nitrado-token in your Nitrado Account Settings -> Developer Portal -> Long-Life tokens. The server-name is free for your own choice, but the Bot will use it for easy server identification.|
|/server|info|server-name, pin-message|Displays an Discord Embed with the current Server Status. With the pin-message option you can automatically pin the message to the current Discord Channel. Pinned Messages will update the shown information every 1 minute.|
|/server|list|-|Shows all Server in the Bot's Database|
|/server|start|server-name|Starts the specified server.|
|/server|restart|server-name|Restarts the specified server.|
|/server|stop|server-name|Stops the specified server.|
|/server|switch|server-name,game|Changes the active game on the specified server. The game list has autocompletion for the games installed on the server. The list is cached in the local database which is updated on every `/server info` command (also on auto updating pinned messages)|
|/server|unpin|server-name|Removes the pinned message for the specified server and stops the auto update cronjob.|
|/waifu|-|nsfw|Well this is a command I used for learning how to create a Discord Bot and some testing. I just left it in for the memes. The command returns a random picture of an Anime Girl. The nsfw options does the obvious thing... The command uses the [WAIFU.IM](https://www.waifu.im) API|
|/whereami|-|-|Returns a message with the Name of the current Discord server an the number of server members. |
|/whoami|-|-|Who doesn't forget its own name regularly? This command will tell you how you are an when you joined the current Discord server|

## FAQ

#### 1. Why is there a Database for the Bot?
There are two main reasons I decided to add a database to the bot. To store the Server ID and Nitrado-Token together in the Database enables an easy solution to have multiple servers with different Tokens controlled by the same bot. The second reason is for caching purposes. Discord has an tight timeframe for some options, e.g. autocompletion. So the best practice is to have a local cache of these things.

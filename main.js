const electron = require('electron');
const url = require('url');
const path = require('path');

const {
    app,
    BrowserWindow,
    Menu,
    ipcMain
} = electron;
let mainWindow;

//Listen for app to ready
app.on('ready', function () {
    //Create window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    //Load html in
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'keyboard.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Quit app when closed
    mainWindow.on('closed', function () {
        app.quit();
    });

    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenu);
});


//Create menu
const mainMenuTemplate = [{
    label: 'File',
    submenu: [{
            label: 'Stroke Color'
        },
        {
            label: 'Highlight Color'
        },
        {
            label: 'Exit',
            accelerator: 'CmdOrCtrl+Q',
            click() {
                app.quit();
            }
        }
    ]
}];

//Add empty object to menu if mac
if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

//Add developer tool if test env
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [{
                label: 'Toggle Dev',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}
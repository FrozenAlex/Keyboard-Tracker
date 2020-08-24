const electron = require('electron');
const url = require('url');
const path = require('path');
const localServer = require('./server');
const windowStateKeeper = require('electron-window-state');
// const mousePos = require('mouse-position');
const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    screen
} = electron;
let mainWindow;
let settingsWindow;
let keySelectWindow;
let mainWindowState;
let maximized;
//Disable hardware acceleration to allow for capture in obs
app.disableHardwareAcceleration();

//Listen for app to ready
app.on('ready', function () {
    //Window Manager
    mainWindowState = windowStateKeeper({
        maximize: true
    });
    //Create window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            backgroundThrottling: false
        },
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 500,
        minHeight: 300,
        frame: false,
        backgroundColor: '#212121',
        // minimizable: false,
        icon: './buildResources/icon.ico',
    });
    //Load html in
    mainWindow.loadFile(`${__dirname}/main.html`);
    //Quit app when closed
    mainWindow.on('closed', function () {
        app.quit();
    });

    // mainWindow.webContents.setBackgroundThrottling();

    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenu);
    //Window state listener
    mainWindowState.manage(mainWindow);
    //Maximize Window
    mainWindow.on('maximize', () => {
        maximized = true;
    });
    mainWindow.on('unmaximize', () => {
        maximized = false;
    });


    //Start Setting window
    settingsWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        frame: false,
        width: 600,
        height: 590,
        resizable: false,
        show: false,
        backgroundColor: '#808080',
        offscreen: true,
        parent: mainWindow,
        modal: true
    });
    settingsWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'settings.html'),
        protocol: 'file:',
        slashes: true
    }));
    settingsWindow.on('closed', function () {
        settingsWindow = null;
    });

    app.server = localServer.createServer(app);
});

app.respondToClient = (req) => {
    return '?'
}

ipcMain.on('open-key-window', () => {
    keySelectWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        frame: false,
        width: 1400,
        height: 900,
        resizable: false,
        show: false,
        backgroundColor: '#808080',
        parent: mainWindow,
        modal: true
    });
    keySelectWindow.loadFile(`${__dirname}/keySelect.html`);
    keySelectWindow.on('ready-to-show', () => {
        keySelectWindow.show();
    })
    keySelectWindow.on('closed', () => {
        keySelectWindow = null;
    })
})



//!
//Create menu
const mainMenuTemplate = [{
    label: 'File',
    submenu: [{
        label: 'Exit',
        click() {
            app.quit();
        }
    }]
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
                accelerator: 'CmdOrCtrl+I',
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
//!




//Mouse Tracking
let mouseCounter = true;
let mouseTracking;
ipcMain.on('track-mouse', () => {
    if (mouseCounter) {
        mouseTracking = setInterval(mouseTracker, 30);
    }
    mouseCounter = false;
})

function mouseTracker() {
    mainWindow.webContents.send('mouse-pos', {
        pos: screen.getCursorScreenPoint()
    });
}




//Window handeling
//*Setting Window
//Open setting window
ipcMain.on('open-settings', () => {
    settingsWindow.show();
})
///Hide setting window
ipcMain.on('close-setting-window', () => {
    settingsWindow.hide();
    settingsWindow.webContents.send('settings-reset');
});
//Apply settings
ipcMain.on('apply-settings', () => {
    mainWindow.webContents.send('load-settings');
});
//*Main Window
//Reload tracker when some settings are changed
ipcMain.on('reload-main', () => {
    mainWindow.reload();
})

//Maximize Main Window
ipcMain.on('maximize-main-window', function () {
    if (maximized) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
    mainWindow.webContents.send('size-mouse');
});
ipcMain.on('minimize-main-window', () => {
    mainWindow.minimize();
})

//Close Main Window
ipcMain.on('close-main-window', function () {
    clearInterval(mouseTracking);
    mainWindow.close();
});

//*Key select window
ipcMain.on('close-key-select-window', () => {
    keySelectWindow.close();
});
// main.js

// Modules to control application life and create native browser window
const { app, ipcMain, BrowserWindow, globalShortcut } = require("electron");
const { dialog } = require("electron/main");
const path = require("node:path");
const fs = require("node:fs");

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

function sortFunction(stringA, stringB) {
  /* this is a sort function to sort videos by number in it's description
   *
   *
   * @param {string} stringA
   * @param {string} stringB
   *
   * return -1 , 1 or 0 based on the calculated order of stringA and stringB
   * */

  function getNumbers(inputString) {
    let result = [];

    let lastNumCharacters = [];

    const number = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

    for (let char of inputString) {
      if (number.includes(char)) {
        lastNumCharacters.push(char);
      } else if (lastNumCharacters.length > 0) {
        result.push(parseInt(lastNumCharacters.join("")));
        lastNumCharacters = [];
      }
    }

    return result;
  }
  const numbersA = getNumbers(stringA);
  const numbersB = getNumbers(stringB);

  for (let i = 0; i < Math.min(numbersA.length, numbersB.length); i++) {
    if (numbersA[i] > numbersB[i]) {
      return 1;
    } else if (numbersA[i] < numbersB[i]) {
      return -1;
    }
  }

  return numbersA.length - numbersB.length;
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  /*request-response*/
  ipcMain.handle("get-image-queue", (event) => {
    // Store a shuffled image queue per directory
    const imageQueueMap = new Map();
    // Utility: Shuffle an array
    function shuffle(array) {
      // for (let i = array.length - 1; i > 0; i--) {
      //   const j = Math.floor(Math.random() * (i + 1));
      //   [array[i], array[j]] = [array[j], array[i]];
      // }
      // CURRENTLY NO SUFFLE
      //
      array.sort(sortFunction);
      return array;
    }

    const selectedPaths = dialog.showOpenDialogSync(app.mainWindow, {
      properties: ["openDirectory"],
      title: "Select Image Directory",
    });

    console.log(selectedPaths);

    if (!selectedPaths || selectedPaths.length === 0) return [];

    const dirPath = selectedPaths[0];

    if (!fs.existsSync(dirPath)) return [];

    if (!imageQueueMap.has(dirPath)) {
      const allImages = fs
        .readdirSync(dirPath)
        .filter((file) => /\.(png|jpe?g|gif|webp|jfif)$/i.test(file));

      const shuffledImages = shuffle(allImages).map((img) =>
        path.join(dirPath, img),
      );

      imageQueueMap.set(dirPath, shuffledImages);
    }

    return imageQueueMap.get(dirPath);
  });

  /*fire-and-forget*/
  ipcMain.on("restart-app", () => {
    app.relaunch();
    app.exit(0);
  });

  /*keybinds*/
  globalShortcut.resgister("CommandOrControl+R", () => {
    ipcMain.emit("restart-app");
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

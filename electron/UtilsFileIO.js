const { promises: fs } = require('fs');
const { resolve: resolvePath } = require('path');
const path = require('path');

const { dialog } = require('electron');

// parsing xml files
const xml2js = require('xml2js');

const { log, LogLevel } = require('./OutputManager');

const ErrorExplanations = {
  errors: [
    {
      errorCode: 'EACCES',
      explanation: 'Access to the file was denied.'
    },
    {
      errorCode: 'EEXIST',
      explanation:
        'The file already exists and function was not set to overwrite.'
    },
    {
      errorCode: 'EISDIR',
      explanation:
        'Expected a file but was given a directory. How in the world...'
    },
    {
      errorCode: 'ENOENT',
      explanation:
        'File or directory was not found. Verify the path exists and create it if not.'
    },
    {
      errorCode: 'ENOTDIR',
      explanation:
        'Expected directory but was given a file path. How in the world...'
    },
    {
      errorCode: 'EPERM',
      explanation:
        'Did not have permissions to do command. Verify that the file/folder is not set to read-only or located in a place that requires admin privileges.'
    }
  ]
};

class UtilsFileIO {
  static log = (value, level = LogLevel.LOG) => log('Utils', value, level);

  /**
   * Converts then writes an object as a JSON file. Will overwrite if the file already exists.
   * @param {object} obj Object to write as JSON.
   * @param {string} outputFile Output file path to write obj to.
   * @returns {promise} A promise that resolves if obj is written to outputFile as a JSON successfully, else returns the error.
   */
  static async writeObjectJSON(obj, outputFile) {
    return new Promise((resolve, reject) => {
      try {
        const objData = JSON.stringify(obj, null, 2);
        return fs
          .writeFile(outputFile, objData, { encoding: 'utf8', flag: 'w' })
          .then(() => resolve())
          .catch((err) => {
            UtilsFileIO.simplifiedIOError(err);
            return reject(err);
          });
      } catch (exception) {
        UtilsFileIO.log(exception, LogLevel.ERROR);
        UtilsFileIO.log('Failed to stringify obj!', LogLevel.ERROR);
        return reject(exception);
      }
    });
  }

  /**
   * Parses and returns the file in the given file path as a JSON object.
   * @param {string} filePath Path of file to parse.
   * @param {boolean} ignoreMissing Flag indicating whether to silence missing file error messages. Promise will still be rejected with said error.
   * @returns The file at filePath parsed as a JSON object.
   */
  static async parseObjectJSON(filePath, ignoreMissing = false) {
    return new Promise((resolve, reject) =>
      fs
        .readFile(filePath, 'utf8')
        .then((fileData) => {
          try {
            const fileObject = JSON.parse(fileData);
            return resolve(fileObject);
          } catch (ex) {
            UtilsFileIO.log(ex, LogLevel.ERROR);
            return reject(ex);
          }
        })
        .catch((err) => {
          if (!(ignoreMissing && err.code === 'ENOENT')) {
            UtilsFileIO.simplifiedIOError(err);
          }
          return reject(err);
        })
    );
  }

  static async parseXmlObject(xmlPath) {
    // read xml config file
    const xmlData = await fs.readFile(xmlPath, 'utf8').catch((err) => {
      UtilsFileIO.log(err);
    });
    if (xmlData != null) {
      const xmlObject = await xml2js
        .parseStringPromise(xmlData)
        .catch((err) => {
          UtilsFileIO.log(err);
        });
      if (xmlObject != null) {
        return xmlObject;
      }
      UtilsFileIO.log(`Could not parse xml file: ${xmlPath}`, LogLevel.ERROR);
    } else {
      UtilsFileIO.log(`Could not read xml file: ${xmlPath}`, LogLevel.ERROR);
    }

    return null;
  }

  // https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
  // Author: qwtel
  /**
   * Returns a list containing every file in the given directory.
   * @param {string} dir Directory to list every file of.
   * @returns List containing the paths of every file in dir.
   */
  static async getFiles(dir) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map((dirent) => {
        const res = resolvePath(dir, dirent.name);
        return dirent.isDirectory() ? this.getFiles(res) : res;
      })
    );
    return Array.prototype.concat(...files);
  }

  /**
   *  Creates the directory given and any parent directories.
   * @param {string} dir Directory path to create.
   * @param {bool} ignoreExisting Flag to hide error messages if dir already exists.
   */
  static async createDirectory(dir, ignoreExisting = false) {
    return fs.mkdir(dir, { recursive: true }).catch((err) => {
      if (!ignoreExisting) {
        UtilsFileIO.simplifiedIOError(err);
        return;
      }
      if (ignoreExisting && err.errorCode !== 'EEXIST') {
        UtilsFileIO.simplifiedIOError(err);
      }
    });
  }

  /**
   * Reads and filters all the files in the given folder path of the given file types.
   * @param {path} folderPath
   * @param {string[]} fileTypes
   * @returns Object containing a list of every file per file type.
   */
  static async filterFolderFiles(folderPath, fileTypes) {
    const fileList = await UtilsFileIO.getFiles(folderPath);

    const filesContainer = {};

    fileTypes.forEach((filetype) => {
      // create a collection for name for this current file type
      // const fileCollection = {
      //   [filetype]: []
      // };
      filesContainer[filetype] = [];

      // new array filtered to only include files of this file type
      const filteredFileList = fileList.filter(
        (file) => path.extname(file) === filetype
      );

      /* Not entirely sure what this was supposed to do???
      const filteredFilePaths = filteredFileList.map((file) =>
        path.join(folderPath, file)
      );
      */

      filesContainer[filetype] = filteredFileList;
    });

    return filesContainer;
  }

  /**
   * Deletes every file in a list of files.
   * @param {array} files List of files to delete.
   */
  static async batchRemoveFiles(files) {
    // delete every file list
    if (files != null) {
      const outputPromises = files.map((file) => {
        if (file != null) return fs.unlink(file);
        return null;
      });

      await Promise.all(outputPromises).catch((err) =>
        UtilsFileIO.simplifiedIOError(err)
      );
    }
  }

  /**
   * Deletes every file in the given directory.
   * @param {string} dir Directory to remove every file of.
   */
  static async emptyFolder(dir) {
    // get list of all files in output folder
    const outputFiles = await UtilsFileIO.getFiles(dir).catch((err) => {
      UtilsFileIO.simplifiedIOError(err);
      return null;
    });

    // delete every file in output folder
    if (outputFiles != null) {
      const outputPromises = outputFiles.map((file) => fs.unlink(file));

      await Promise.all(outputPromises).catch((err) =>
        UtilsFileIO.simplifiedIOError(err)
      );
    }
  }

  /**
   * Opens a folder select window and returns the selected folder.
   * @param {object} window Window to attach dialog window to.
   * @param {string} windowTitle Sets the window's title.
   * @returns The selected folder path.
   */
  static async selectFolderDialog(window, windowTitle = 'Select Folder...') {
    // prompt to select file
    const selectedFolder = await dialog.showOpenDialog(window, {
      title: `${windowTitle}`,
      properties: ['openDirectory']
    });

    // exit if selection cancelled
    if (selectedFolder.canceled) {
      UtilsFileIO.log('Folder selection cancelled', LogLevel.DEBUG);
      return null;
    }

    UtilsFileIO.log(
      `Folder selected: ${selectedFolder.filePaths[0]}`,
      LogLevel.DEBUG
    );
    return selectedFolder.filePaths[0];
  }

  /**
   * Opens a save file dialog and returns the chosen file path.
   * @param {object} window Window to attach to.
   * @param {string} windowTitle Sets the window's title.
   * @param {object[]} filterName File filters.
   * @returns The selected file path to save to.
   */
  static async saveFileDialog(
    window,
    windowTitle = 'Save File...',
    windowFilters = [{ name: 'File', extensions: ['*'] }]
  ) {
    const selectedFile = await dialog.showSaveDialog(window, {
      title: windowTitle,
      filters: windowFilters
    });

    // end function if saving was cancelled
    if (selectedFile.canceled) {
      UtilsFileIO.log('Cancelled saving preset', LogLevel.DEBUG);
      return null;
    }

    UtilsFileIO.log(`Save file: ${selectedFile.filePath}`, LogLevel.DEBUG);

    return selectedFile.filePath;
  }

  /**
   * Opens a file select window and returns the selected file.
   * @param {object} window Window to attach to.
   * @param {string} windowTitle Sets the title of the window.
   * @param {object[]} filterName File filters.
   * @returns The selected file path to open.
   */
  static async selectFileDialog(
    window,
    windowTitle = 'Select File...',
    windowFilters = [{ name: 'File', extensions: ['*'] }]
  ) {
    // prompt to select file
    const selectedFile = await dialog.showOpenDialog(window, {
      title: `${windowTitle}`,
      properties: ['openFile'],
      filters: windowFilters
    });

    // exit if selection cancelled
    if (selectedFile.canceled) {
      UtilsFileIO.log('File selection cancelled', LogLevel.DEBUG);
      return null;
    }

    UtilsFileIO.log(
      `File selected: ${selectedFile.filePaths[0]}`,
      LogLevel.DEBUG
    );
    return selectedFile.filePaths[0];
  }

  /**
   * Checks the given error object is some form of IO error and outputs
   * a simplified error explanation if known.
   * @param {object} error The error object to check.
   */
  static simplifiedIOError(error) {
    const knownErrorIndex = ErrorExplanations.errors.findIndex(
      (err) => err.errorCode === error.code
    );
    if (knownErrorIndex >= 0) {
      UtilsFileIO.log(error, LogLevel.ERROR);
      UtilsFileIO.log(
        ErrorExplanations.errors[knownErrorIndex].explanation,
        LogLevel.ERROR
      );
    } else {
      UtilsFileIO.log(error, LogLevel.ERROR);
    }
  }

  /**
   * Check if error was caused by file/dir not existing.
   * @param {object} error The error object.
   * @returns Boolean indicating whether the error was caused by the file/dir not existing.
   */
  static pathDidntExist(error) {
    return error.code === 'ENOENT';
  }
}

module.exports = {
  UtilsFileIO,
  parseXmlObject: UtilsFileIO.parseXmlObject,
  writeObjectJSON: UtilsFileIO.writeObjectJSON,
  emptyFolder: UtilsFileIO.emptyFolder,
  parseObjectJSON: UtilsFileIO.parseObjectJSON,
  filterFolderFiles: UtilsFileIO.filterFolderFiles,
  selectFolderDialog: UtilsFileIO.selectFolderDialog,
  saveFileDialog: UtilsFileIO.saveFileDialog,
  selectFileDialog: UtilsFileIO.selectFileDialog,
  createDirectory: UtilsFileIO.createDirectory,
  pathDidntExist: UtilsFileIO.pathDidntExist
};

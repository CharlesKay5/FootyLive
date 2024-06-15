const fs = require('fs');
const path = require('path');

// Specify the path to the images folder
const imagesFolderPath = '.';

// Read the directory
fs.readdir(imagesFolderPath, (err, files) => {
    if (err) {
        console.error('Error reading the directory:', err);
        return;
    }

    files.forEach(file => {
        // Check if the file name contains the ' character
        if (file.includes("'")) {
            // Construct the old and new file paths
            const oldFilePath = path.join(imagesFolderPath, file);
            const newFileName = file.replace(/'/g, ''); // Remove all ' characters
            const newFilePath = path.join(imagesFolderPath, newFileName);

            // Rename the file
            fs.rename(oldFilePath, newFilePath, err => {
                if (err) {
                    console.error(`Error renaming file ${file}:`, err);
                } else {
                    console.log(`${file} was renamed to ${newFileName}`);
                }
            });
        }
    });
});
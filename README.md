# Transfer Now

> Share your files with people using just the terminal

- [Transfer Now](#transfer-now)
- [Installation](#installation)
    - [Install with npm](#install-with-npm)
    - [Install with Yarn](#install-with-yarn)
    - [Run with npm without installing](#run-with-npm-without-installing)
  - [Upload a file](#upload-a-file)
  - [Download a file](#download-a-file)

```
Share your files with people using just the terminal

Note: Uploaded files will be available for 1 day only

  Usage
    $ transfer-now put <input>
    $ transfer-now get <file_short_name>

  Options
    --targetDir, -t         The directory where you want to save the file (only available when using 'transfer-now get')
    --targetFilename, -n    The filename by which you want to save the file. Original file extension is preserved (only available when using 'transfer-now get')
    --silent, -s            Don't produce any output

  Examples
    $ transfer-now put ./README.md
    $ transfer-now put ./README.md --silent
    $ transfer-now get daily_tomato_orangutan -t ./tmp
    $ transfer-now get daily_tomato_orangutan -n tomato
```

# Installation

### Install with npm

```sh
$ npm install -g transfer-now
```

### Install with Yarn

```sh
$ yarn global add transfer-now
```

### Run with npm without installing

```sh
$ npx transfer-now
```

eg.

```sh
$ npx transfer-now put README.md
```

## Upload a file

**Note:** Uploaded files will be available for 1 day only

```sh
$ transfer-now put {FILE_PATH}
```

eg.

```sh
$ transfer-now put grocery.txt
$ transfer-now put ./README.md
$ transfer-now put /User/myname/Desktop/smile.jpg
```

## Download a file

```sh
$ transfer-now get {UNIQUE_NAME}
```

eg.

```sh
$ transfer-now get skilled_scarlet_cockroach
$ transfer-now get skilled_scarlet_cockroach -t ./tmp
$ transfer-now get skilled_scarlet_cockroach -t /User/myname/Desktop/
$ transfer-now get skilled_scarlet_cockroach -n example
```

Use the flag `--targetDir, -t` if you want to save the file to a different location.


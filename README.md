# JShelf

JShelf is a react project auto format tool, you can use it to format your react project structure easily.
features:
- configurable
- format directory and file names
- auto modify the module import and export

## Installation
you can install jshelf by the npm recommend:
```
$ npm install jshelf --save-dev
```
## Usage

create a config file ```jshelf.json``` for your project, for example:

```
{
  "root": "./src",
  "ignore": ["./src/app/", "./src/lib/", "./src/util/"],
  "rules": {
    "directory": {
      "case": "kebab"
    },
    "files": [
      {
        "test": "\\.js$|\\.jsx$",
        "case": "camel",
        "ignore": [
          "index",
          "logic",
          "store",
          "actions",
          "util"
        ]
      },
      {
        "test": "\\.less$",
        "case": "mix",
        "ignore": []
      }
    ],
    "default": {
      "case": "mix",
      "ignore": []
    }
  },
  "words": [
    "these",
    "are",
    "words",
    "used",
    "in",
    "your",
    "file",
    "names",
  ]
}
```
## Config options
|field name|type|required|comment|
|---|---|---|---|
|root|string|true|the root directory to be formated|
|ignore|array|false|the directorys you don't want to be formated but whitch included in root|
|rules|object|true|the rules according to whitch to format|
|rules.directory|object<br>\<rule item\>|false|directory rules|
|rules.files|array<br>\<rule item\>|false|files rules|
|rules.default|object<br>\<rule item\>|true|default rules|
|words|array|true|the words appeard in your file or directory name|

### Rule item configs:
|field name|type|required|comment|
|---|---|---|---|
|case|string|true|format case selectable: camel, kebab, mix, snack|
|test|string|true|only file rules has this option, regular expression string to match the file|
|ignore|array|false|the file's name you don't want to format|

### Cases
now you can format your file or directory name use one of the following cases:
|case|example|words|formated|
|---|---|---|---|
|kebab|'kebabcase'|['kebab', 'case']|kebab-case|
|snake|'snakecase'|['snake', 'case']|snake_case|
|camel|'camelcase'|['camel', 'case']|CamelCase|
|mix|'mixcase'|['mix', 'case']|mixCase|

### Words
the words maintain a dictionary to format your project file and directory names, jshelf will spit your file or directory name according these words. before use jshelf, you must scan your project and find all the words you used in your directory and files, exclude ignored files.

for example, now you have a file named ```jshelfformatfile.js```, if you want to formated it to ```jshelfFormatFile.js```, your words config should be ```['jshelf', 'format', 'file']``` and the case is ```mix```.

# JSDOC generation

This is how you go about generating the documentation for the bici project

## Instructions

### 1. Install dependencies

JSDOC is part of package.json

```bash
npm install
```

### 2. Add documentation

Ensure adding proper documentation to whatever changes you are making

### 3. Generate documentation

Since dependencies are not installed globally, we need to point to the binary

```bash
./node_modules/.bin/jsdoc \<path_to_file\>/\<file_name\>.js
```

To generate documentation recursively for the entire project

```bash
./node_modules/.bin/jsdoc . -r
```

By default outputs are generated in the out folder. If you want a different folder, use the -d option

```bash
./node_modules/.bin/jsdoc . -r -d docs
```

This generates the html output in a folder named docs

### 4. Should I commit?

Unless we are making the final release and want to expose the documentation to the public,
it is better to not commit the generated output (or any generated output for that matter).

Make sure to add the output folder to .gitignore
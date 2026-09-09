const fs = require('fs');
const path = require('path');
const { Validator } = require('xsd-schema-validator');

async function main() {
  const schemaPath = process.argv[2];
  if (!schemaPath) {
    console.error('Missing schema path');
    process.exit(2);
  }

  const xml = fs.readFileSync(0, 'utf8');
  const validator = new Validator({
    cwd: path.dirname(schemaPath),
    debug: /xsd-schema-validator/.test(process.env.LOG_DEBUG || '')
  });

  try {
    await validator.validateXML(xml, schemaPath);
    process.exit(0);
  } catch (err) {
    console.error(err && err.message ? err.message : String(err));
    process.exit(1);
  }
}

main();

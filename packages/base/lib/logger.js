function defaultLogger(level, message) {
  const outputMessage = `[${level}] ${message}`;

  if (level === "error") return console.warn(outputMessage);
  if (level === "warn") return console.warn(outputMessage);

  console.log(`[${level}] ${message}`);
}

function deprecated(message) {
  defaultLogger("deprecated", message);
}

exports = module.exports = { defaultLogger, deprecated };

export class Logger {
  public static info(message?: any, ...optionalParams: any[]) {
    console.log(`[Squeaky] ${message}`, ...optionalParams);
  }

  public static warn(message?: any, ...optionalParams: any[]) {
    console.warn(`[Squeaky] ${message}`, ...optionalParams);
  }

  public static error(message?: any, ...optionalParams: any[]) {
    console.error(`[Squeaky] ${message}`, ...optionalParams);
  }

  public static debug(message?: any, ...optionalParams: any[]) {
    if (window.squeaky?.debugLoggingEnabled) {
      console.debug(`[Squeaky] ${message}`, ...optionalParams);
    }
  }
}

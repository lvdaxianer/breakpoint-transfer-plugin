export class Logger {
  private static prev() {
    return "[Big-File-Upload]: ";
  }

  /**
   * 警告消息
   *
   * @author lihh
   * @param message 发送的消息
   */
  static warning(message: string) {
    console.warn(this.prev() + message);
  }

  /**
   * 错误消息打印
   *
   * @author lihh
   * @param message 错误的消息
   * @param throwError 是否抛出异常，true 则抛出 Error，false 则仅打印到 console
   */
  static error(message: string, throwError = true) {
    const errorMsg = this.prev() + message;
    if (!throwError) console.error(errorMsg);
    else throw new Error(errorMsg);
  }
}

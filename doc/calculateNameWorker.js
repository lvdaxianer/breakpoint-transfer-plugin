self["calculateNameWorker"] = true;
// 表示 切割的文件大小
const SPLIT_CHUNK_SIZE = 192 * 1024 * 1024,
  MAX_RANDOM_SAMPLING_SORT = [0, 2, 4, 6, 8, 1, 5, 3, 7];

self.addEventListener("message", async (event) => {
  //获取主进程发过来的文件
  const { file, flag } = event.data || {};
  if (flag !== "file") return;

  //单独开一个进程来进行hash计算并得到新的文件名
  const fileName = await getFileName(file);
  //把文件名再发回主进程
  self.postMessage(fileName);

  /**
   * 根据文件对象获取根据文件内容得到的hash文件名
   * @param {*} file 文件对象
   */
  async function getFileName(file) {
    //计算此文件的hash值
    const fileHash = await calculateFileHash(file);
    //获取文件扩展名
    const fileExtension = file.name.split(".").pop();
    return `${fileHash}.${fileExtension}`;
  }

  /**
   * 切割文件 事件
   *
   * @author lihh
   * @param file 文件本身
   * @return {Promise<Array<Blob>>} promise值 状态
   */
  async function cuttingFilesHandler(file) {
    const chunks = Math.ceil(file.size / SPLIT_CHUNK_SIZE);
    let chunk = 0,
      offset = 0;

    const _chunksArray = [];

    for (; chunk < chunks; chunk += 1) {
      offset = chunk * SPLIT_CHUNK_SIZE;
      _chunksArray.push(file.slice(offset, offset + SPLIT_CHUNK_SIZE));
    }

    return _chunksArray;
  }

  /**
   * 实现 拼接不同的 buffer
   *
   * @author lihh
   * @param args 这里是不同的buffer
   */
  function mergeArrayBufferHandler(...args) {
    let newArgs = args;
    // 判断是否需要随机抽样
    if (args.length > MAX_RANDOM_SAMPLING_SORT.length) {
      newArgs = [];
      newArgs = MAX_RANDOM_SAMPLING_SORT.reduce((memo, currIndex, index) => {
        newArgs[index] = args[currIndex];
        return newArgs;
      }, []);
    }

    const total = newArgs.reduce((memo, buff) => memo + buff.byteLength, 0);

    const combinedBuffer = new Uint8Array(total);
    let preBuffLength = 0;

    newArgs.forEach((currBuffer) => {
      combinedBuffer.set(new Uint8Array(currBuffer), preBuffLength);
      preBuffLength = currBuffer.byteLength;
    });

    return combinedBuffer;
  }

  /**
   * 计算文件的hash字符串
   * @param {*} file
   * @returns
   */
  async function calculateFileHash(file) {
    /* 这里做 兼容性处理, 需要在 http 下运行, 但是这种情况下 秒传的功能就无法实现了 */
    if (typeof crypto.subtle === "undefined") {
      return `${(Math.random() * 100000) | 0}${+new Date()}${(Math.random() * 100000) | 0}`;
    }

    // 切割文件
    const cuttingFiles = await cuttingFilesHandler(file);
    // 每个切割文件 返回 arrayBuffer
    let arrayBufferArr = [];
    for (const blob of cuttingFiles)
      arrayBufferArr.push(await blob.arrayBuffer());
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      mergeArrayBufferHandler(...arrayBufferArr),
    );
    return bufferToHex(hashBuffer);
  }

  /**
   * 把ArrayBuffer转成16进制的字符串
   * @param {*} buffer
   * @returns
   */
  function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
});

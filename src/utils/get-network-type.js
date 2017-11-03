/**
 * @file 内置默认规则
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

export default  function getNetworkType() {
  // 检测NetworkInformation接口是否存在，若存在
  if (!navigator.connection) {
    return 'unknow'
  }

  return navigator.connection.effectiveType
}
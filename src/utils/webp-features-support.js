/**
 * @file 内置默认规则
 * @author lisfan <goolisfan@gmail.com>
 * @version 2.0.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

const logger = new Logger('webp-features')

const storageName = 'WEBP_FEATURES'
// session期间只检测一次，刷新页面中session中取值
const WEBP_FEATURES = JSON.parse(global.sessionStorage.getItem(storageName)) || {
  lossy: undefined,
  lossless: undefined,
  animation: undefined
}

const IMAGES_SOURCE = {
  // 有损
  lossy: "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
  // 无损
  lossless: "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
  // alpha通道
  // alpha:
  // "data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==",
  // 动态webp
  animation: "data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"
}

/**
 * 检测是否支持webp特性
 * @param {string} feature - 特性值
 * @returns {Promise}
 */
function checkWebpFeatures(feature) {
  return new Promise((resolve, reject) => {
    let $image = new Image()

    $image.onload = function () {
      ($image.width > 0) && ($image.height > 0) ? resolve(true) : reject(false)
    }

    $image.onerror = function () {
      reject(false)
    }

    $image.src = IMAGES_SOURCE[feature]
  })
}

// 提前发起检测
Object.entries(WEBP_FEATURES).forEach(([feature, isSupport]) => {
  // 如果已经从缓存中先进知了支持结果，则不再处理
  if (validation.isBoolean(isSupport)) {
    logger.log('sessionStorage already existed test result:', feature, isSupport)

    return
  }

  logger.log(`checking webp ${feature} feature`)

  checkWebpFeatures(feature).then(() => {
    WEBP_FEATURES[feature] = true
    logger.log(`lucky! support ${feature} feature`)
  }).catch(() => {
    WEBP_FEATURES[feature] = false
    logger.log(`bad! unsupport ${feature} feature`)
  }).finally(() => {
    global.sessionStorage.setItem(storageName, JSON.stringify(WEBP_FEATURES))
  })
})

/**
 * 是否支持对应的webp特性
 *
 * @since 2.0.0
 * @param {string} feature - 特性值
 * @returns {boolean}
 */
export default function isWebpSupport(feature) {
  return WEBP_FEATURES[feature]
}



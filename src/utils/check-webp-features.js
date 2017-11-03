/**
 * @file 内置默认规则
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

const IMAGES_SOURCE = {
  // 有损
  lossy: "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
  // 无损
  lossless: "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
  // alpha通道
  alpha: "data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==",
  // 动态webp
  animation: "data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"
}

export default function checkWebpFeatures(feature) {
  return new Promise((resolve, reject) => {
    let $image = new Image()

    $image.onload = function () {
      const result = ($image.width > 0) && ($image.height > 0)
      $image = null
      resolve(result)
    }

    $image.onerror = function () {
      $image = null
      reject(false)
    }

    $image.src = IMAGES_SOURCE[feature]
  })
}
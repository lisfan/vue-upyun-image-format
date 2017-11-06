/**
 * @file 根据条件确定默认图片格式
 */

import isWebpSupport from './webp-features-support'

/**
 * 根据条件确定默认输出图片格式
 *
 * - 根据浏览器对webp的支持力度及其他一些情况，用户上传的图片如果是非webp格式或jpg格式，如源图是png的，则会按照以下不同的场景转换成webp或jpg
 * - (静态，支持有损webp，图片宽小于设备物理分辨率*dpr的2分之1时或小于200px*dpr时)，使用webp格式（又拍云api: `/format/webp`）
 *  - (静态，支持有损webp，图片宽大于设备物理分辨率*dpr的2分之1时且大于200px*dpr时)，使用jpg格式（又拍云api: `/format/jpg`）
 *  - (静态，不支持webp)，使用jpg格式（又拍云api: `/format/jpg`）
 *  - (动态，支持动态webp时)，使用webp格式（又拍云api: `/format/webp`）
 *  - (动态，不支持动态webp时)，使用gif格式，不作变动
 *
 * @param {string} originFormat - 原格式
 * @param {number} width - 用户自定义的宽度
 * @param {number} minWidth - 最小宽度
 * @returns {string}
 */
export default function computeDefaultFormat(originFormat, width, minWidth) {
  // 如果源文件是动态图片且支持动态webp时，则转换为webp
  if (originFormat === 'gif') {
    return isWebpSupport['animation'] ? 'webp' : 'gif'
  } else {
    // 如果支持静态webp
    return isWebpSupport['lossy'] && minWidth >= width ? 'webp' : 'jpg'
  }
}
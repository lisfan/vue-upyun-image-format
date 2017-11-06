/**
 * @file 计算默认图片格式
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

import isWebpSupport from './webp-features-support'

/**
 * 计算默认输出图片格式
 *
 * - 根据浏览器对webp的支持力度及其他一些情况，用户上传的图片如果是非webp格式或jpg格式，如源图是png的，则会按照以下不同的场景转换成webp或jpg
 * - (静态，支持有损webp，图片宽小于设备物理分辨率*dpr的2分之1时或小于200px*dpr时)，使用webp格式（又拍云api: `/format/webp`）
 *  - (静态，支持有损webp，图片宽大于设备物理分辨率*dpr的2分之1时且大于200px*dpr时)，使用jpg格式（又拍云api: `/format/jpg`）
 *  - (静态，不支持webp)，使用jpg格式（又拍云api: `/format/jpg`）
 *  - (动态，支持动态webp时)，使用webp格式（又拍云api: `/format/webp`）
 *  - (动态，不支持动态webp时)，使用gif格式，不作变动
 *
 * - 当业务场景中需要使用原图尺寸时，内部也会调用压缩，除非明确指定不压缩
 *
 *
 * @param {} originFormat
 * @param width
 * @param minWidth
 * @param DPR
 * @param draftRatio
 */
export default function computeDefaultFormat(originFormat, width, minWidth) {
  // 如果源文件是动态图片且指定格式为webp时，转换为webp
  // 如果是动态图片后缀结尾的
  if (originFormat === 'gif') {
    return isWebpSupport['animation'] ? 'webp' : 'gif'
  } else {
    // 其他图片则无视
    // 图片宽小于设备物理分辨率*dpr的2分之1时或小于200px*dpr时)
    return isWebpSupport['lossy'] && minWidth >= width ? 'webp' : 'jpg'
  }
}
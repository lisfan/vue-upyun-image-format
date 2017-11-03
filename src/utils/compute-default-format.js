/**
 * @file 计算默认图片格式
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

  // - 根据浏览器对webp的支持力度及其他一些情况，用户上传的图片如果是非webp格式或jpg格式，如源图是png的，则会按照以下不同的场景转换成webp或jpg
  // - (静态，支持webp，图片宽小于设备物理分辨率*dpr的2分之1时或小于200px*dpr时)，使用webp格式（又拍云api: `/format/webp`）
  // 	- (静态，支持webp，图片宽大于设备物理分辨率*dpr的2分之1时且大于200px*dpr时)，使用jpg格式（又拍云api: `/format/jpg`）
  // 	- (静态，不支持webp)，使用jpg格式（又拍云api: `/format/jpg`）
  // 	- (动态，支持动态webp时)，使用webp格式（又拍云api: `/format/webp`）
  // 	- (动态，不支持动态webp时)，使用gif格式，不作变动
  //
  // - 当业务场景中需要使用原图尺寸时，内部也会调用压缩，除非明确指定不压缩

const docHtml = global.document.documentElement
const clientWidth = docHtml.clientWidth
const clientHeight = docHtml.clientHeight

// 尺寸最小值
const MINIMUM = 200

// 假设默认情况下不支持webp格式上传

const staticImageRegExp = /jpg|png/
const dynamicImageRegExp = /gif/

export default function computDefaultFormat(originSrc, width, DPR, draftRatio) {
  if (originSrc.match(staticImageRegExp)) {

  }
  // 如果是
}
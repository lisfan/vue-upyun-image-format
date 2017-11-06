/**
 * @file 内置默认规则
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

export default {
  format: 'jpg', // 图片格式，默认以format优先
  scale: 'both', // 缩放规格，默认居中裁剪
  size: null, // 图片尺寸，保留原尺寸
  progressive: true, // 是否启用模
  compress: true, // 启用压缩优化
  quality: 90, // jpg图片压缩质量
  // force: false, // 图片原尺寸不足时，自动放大
}
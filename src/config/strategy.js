/**
 * @file 内置策略条件
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

export default {
  format: 'jpg', // 图片格式
  scale: 'both', // 缩放规格
  size: '', // 图片尺寸
  force: false, // 图片原尺寸不足时，是否自动放大
  compress: true, // 压缩优化
  progressive: 'isNaN', // jpg图片压缩质量
}
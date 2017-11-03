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
  quantity: 90, // jpg图片压缩质量
  force: false, // 图片原尺寸不足时，自动放大
}

// 使用的规则列表
let x = {
  jpg: '/format/jpg', // 转换为jpg
  png: '/format/png',// 转换为png
  webp: '/format/webp',// 转换为webp
  compress: '/compress/true',// 压缩优化
  quantity90: '/quantity/90'// 压缩质量90%
}

// 启用一个功能项的条件
const finalRules2 = {
  format: 'jpg', // 图片格式
  scale: 'both', // 缩放规格
  size: '', // 图片尺寸
  force: false, // 图片原尺寸不足时，是否自动放大
  compress: true, // 压缩优化
  progressive: 'isNaN', // jpg图片压缩质量
}
/**
 *
 * 指定的优化规则必须与图片格式匹配，否则无法应用该格式
 *
 * @since 2.0.0
 *
 * @enum {regexp}
 */
export default {
  compress: /jpg|jpeg|png/,
  format: /jpg|jpeg|png|webp/,
  progressive: /jpg|jpeg/,
  quality: /jpg|jpeg/,
  lossless: /webp/,
}
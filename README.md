# vue-upyun-image-format

## vue过滤器插件-又拍云图片处理工具：默认以指定的策略规则进行了处理优化

[API documentation](https://lisfan.github.io/vue-upyun-image-format/)

## Feature 特性

- 利用又拍云的图片处理服务，提供最适当的图片默认优化策略

## Detail 详情

- 图片优化依赖了又拍云的处理服务，相应的图片处理规则请参考[又拍云文档](http://docs.upyun.com/cloud/image/#webp)
- 根据当前设计稿和设备物理分辨率缩放比，及设备的DPR值，计算出实际的图片尺寸
- 由于 [NetworkInformation API](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation)支持力度差，所以需要外部额外传入一个获取网络制式的方式（比如平台入口是微信或支付宝的）
- 使用格式：`<img :src="图片地址 | image-format([sizeOrConfig],[scale = 'both'],[format],[quality],[otherRules])" />`

## Install 安装

```bash
npm install -S @~lisfan/vue-upyun-image-format
```

## Usage 起步

```js
import Vue from 'vue'
import VueUpyunImageFormat from '@~lisfan/vue-upyun-image-format'

// 注册指令
// 以下是默认值
Vue.use(VueUpyunImageFormat, {
  debug: true, // 开启调试模式
  maxDPR: 3, // (>=4)g网络或者'unknow'未知网络下，DPR取值的最大数
  draftRatio: 2, // UI设计稿尺寸与设备物理尺寸的比例
  scale: 'both', // 又拍云图片尺寸缩放方式，默认宽度进行自适应，超出尺寸进行裁剪，若自定义尺寸大于原尺寸时，自动缩放至指定尺寸再裁剪
  quality: 90, // 又拍云jpg格式图片压缩质量
  otherRules: '', // 又拍云图片处理的其他规则
  minWidth: global.document.documentElement.clientWidth * global.devicePixelRatio / 2, //  默认值是(当前设备的物理分辨率 * 当前实际设备像素比的) 二分之一
  networkHandler() {
    // 获取网络制式的处理函数，可配合微信和支付宝的sdk使用
    // 如果实在不知道怎么获取，建议返回4g
    return '4g'
  }
})
```

```html
<!-- 无任何参数，接着内部优化策略自动执行：使用原尺寸，转换为jpg，并压缩质量到90%和启用渐进载入 -->
<img :src="imageSrc | image-format">

<!-- 裁剪为200宽300高，接着内部优化策略自动执行：转换为jpg，并压缩质量到90%和启用渐进载入 -->
<img :src="imageSrc | image-format('200x300')">

<!-- 裁剪为500宽500高的尺寸，裁剪方式为宽自适应，接着内部优化策略自动执行：转换为jpg，并压缩质量到90%和启用渐进载入 -->
<img :src="imageSrc | image-format('500', 'fw')">

<!-- 裁剪为200宽300高，并转换为png，接着内部优化策略自动执行：启用png压缩优化算法 -->
<img :src="imageSrc | image-format('200x300', null, 'png')">

<!-- 裁剪为500宽100高，使用宽高自适应缩放方式，且不压缩质量，接着内部优化策略自动执行：转换为jpg，启用渐进载入>
<img :src="imageSrc | image-format('500x100', 'fwfh', null, 100)">

<!-- 以字典方式进行配置，设置宽度为400px，缩放方式会自适应，压缩质量为50%，不进行渐进载入，接着内部优化策略自动执行：转换为jpg -->
<img :src="imageSrc | image-format({
  size:'400',
  scale:'both',
  progressive:false,
  quality:50,
})">

<!-- 使用默认优化策略，但配置了一些其他规则：增加水印，你好 -->
<img :src="imageSrc | image-format(null, null, null, null, '/watermark/text/5L2g5aW977yB')">
```

## 附：又拍云图片处理的研究报告

**注1：该测试是建立在使用又拍云的图片处理服务的，所以其他场景下结果会有不同，不要沿用**

**注2：本测试只考虑了图片的容量对加载速度的影响，并不考虑因图片格式的不同，而造成的浏览器渲染图片速度的问题**

**注3：但可能存在的一个规则是：图片数量级越多，图片容量越小，最终的渲染总时间消耗越少**

### 静态图源（`png/jpg/webp`）的对比（ 同一图源，相同尺寸下 ）

1. 未使用任何优化的情况下
  - png > 无损webp > jpg > 有损webp
2. 使用压缩优化(`compress/true`)的情况下：压缩后的png比未压缩优化约65%，压缩jpg比未压缩优化约5%
  - png > 无损webp > 压缩png > jpg > 压缩jpg > 有损webp
3. png设置了压缩优化后(`compress/true`)
  - png -> png压缩算法，容量优化约65%
4. png转jpg，png转webp
  - png -> jpg，容量优化约70%
  - png -> webp，容量优化约95%
5. jpg转webp
  - jpg -> webp，容量优化约80%
6. jpg设置了压缩质量(`quality/<number>`)后
  - jpg 90%的质量下，容量优化35%
  - jpg 80%的质量下，容量优化约60%
7. png、webp、jpg图片质量相较时（纯肉眼判断）
  - jpg格式的色彩饱和度最好，饱满靓丽
  - png和webp饱和度质量相差无几，整体偏灰，饱和底下降会比较明显
  - webp如果细看会有模糊感，细节会丢失
  - jpg在压缩质量90%情况下细节还原度还挺高，压缩质量80%的情况下细节丢失度还是挺严重的，但总体细节还原还是比webp好
  - 所以针对于大尺寸图片，在质量和容量双重保证的情况下使用jpg格式，而对于小尺寸图片，则优先使用webp格式

### 动态图源（gif/动态webp）的对比（ 同一图源，相同尺寸下 ）

1. 未使用任何优化的情况下
  - 无损动态webp > gif > 有损动态webp
2. gif转无损webp，gif转有损webp，
  - gif -> 无损webp，容量增长约10%
  - gif -> 有损webp，容量优化约80%
3. gif转换为有损webp，并没有明显的不适感

## 实行约定（也是该插件的内部默认优化策略）

### 图片格式

默认情况下，根据浏览器对webp特性的支持情况，图片格式会按照以下不同的场景转换成webp或jpg

- (静态，支持webp，图片宽小于设备物理分辨率*dpr的2分之1时)，格式化为webp格式（又拍云api: `/format/webp`）
- (静态，支持webp，图片宽大于设备物理分辨率*dpr的2分之1时)，格式化为jpg格式（又拍云api: `/format/jpg`）
- (静态，不支持webp)，格式化为jpg格式（又拍云api: `/format/jpg`）
- (动态，支持动态webp时)，格式化为webp格式（又拍云api: `/format/webp`）
- (动态，不支持动态webp时)，格式化为gif格式，不作变动

### 图片质量

- 图片格式为 jpg 格式时，使用90%压缩质量（又拍云api: `/quality/90`）
- 图片格式为 png 格式时，使用压缩优化（又拍云api: `/compress/true`）
- 图片格式为 webp 格式时，使用有损webp
- 图片格式为 gif 格式时，不作变动

### 图片尺寸

默认宽度进行自适应，超出尺寸进行**裁剪**，若自定义尺寸大于原尺寸时，自动缩放至指定尺寸再裁剪（又拍云api: `/both/宽x高`）

### 其他优化

图片格式为 jpg 格式时，启用模糊到清晰的**渐进加载**效果（又拍云api: `/progressive/true`）

### 注意点

图片格式为 jpg 格式时，同时使用**渐进加载**和**压缩优化**会有冲突，具体表现：渐进加载是一个从灰阶图片到彩色图片的渲染

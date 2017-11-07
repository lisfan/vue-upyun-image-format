# vue-upyun-image-format

## vue过滤器插件-又拍云图片处理工具器：默认以指定的策略规则进行了处理优化

[API documentation](https://lisfan.github.io/vue-upyun-image-format/)

## Feature 特性

- 利用又拍云的图片处理服务，提供最适当的图片默认优化策略

## Detail 详情

- 图片优化依赖了又拍云的处理服务，相应的图片处理规则请参考[又拍云文档](http://docs.upyun.com/cloud/image/#webp)
- 根据当前设计稿和设备物理分辨率缩放比，及设备的DPR值，计算出实际的图片尺寸
- 由于 [NetworkInformation API](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation)支持力度差，所以需要外部额外传入一个获取网络制式的方式（比如是平台入口是微信或支付宝的）
- 使用格式：<img :src="图片地址 | image-format([sizeOrConfig],[scale = 'both'],[format],[quality],[otherRules])" />

## Install 安装

```bash
npm install -S @~lisfan/vue-upyun-image-format
```

## Usage 起步

``` js
import Vue from 'vue'
import VueUpyunImageFormat from '@~lisfan/vue-upyun-image-format'

// 注册指令
// 以下是默认值
Vue.use(VueUpyunImageFormat, {
  debug: true,
  networkHandler() {
    // 获取网络制式的处理函数，如果实在不知道怎么获取，建议返回4g
    return '4g'
  }
})
```

```html
<!-- 无作何参数：使用原尺寸，内部使用默认优化策略，转换为jpg，压缩90%，并启用渐进载入 -->
<img :src="imageSrc | image-format">

<!-- 使用原尺寸，转换为png，并启用png压缩优化算法 -->
<img :src="imageSrc | image-format('200x300',null,'png')">

<!-- 裁剪为500宽500高的尺寸，转换为jpg，压缩80% -->
<img :src="imageSrc | image-format('500',null,null,80)">

<!-- 使用宽高适应缩放方式，以最小边为准，转换为jpg，不压缩质量 -->
<img :src="imageSrc | image-format('500x100','fwfh',null,100)">

<!-- 以字典方式进行配置 设置宽度为400px，不进行渐进载入，转换为jpg，压缩质量为50% -->
<img :src="imageSrc | image-format({
  size:'400',
  scale:'both',
  progressive:false,
  quality:50,
})">

<!-- 使用默认配置，但配置了一些其他规则：增加水印，你好 -->
<img :src="imageSrc | image-format(null,null,null,null,'/watermark/text/5L2g5aW977yB')">

```

## 附：又拍云图片处理的研究报告

**注：该测试是建立在使用又拍云的图片处理服务的，所以其他场景下结果会有不同，不要延用**
**注2：本测试只考虑了图片的容量对加载速度的影响，并不考虑因图片格式的不同，而造成的浏览器渲染图片速度的问题**
**注3：但可能存在的一个规则是：图片数量级越多，图片容量越小，最终的渲染速度越快**

### 静态图源（`png/jpg/webp`）的对比（ 同一图源，相同尺寸下 ）

1. 未使用任何优化的情况下
- 容量比较：png > 无损webp > jpg > 有损webp

2. 使用压缩优化(`compress/true`)的情况下：压缩后的png比未压缩小64%，压缩jpg比未压缩小5%
- png > 无损webp > 压缩png > jpg > 压缩jpg > 有损webp

3. png设置了压缩优化后(`compress/true`)
- png -> png压缩算法，容量优化 64%

4. png转jpg，png转webp
- png -> jpg，容量优化 70%
- png -> webp，容量优化 95%

5. jpg转webp
- jpg -> webp，容量优化 80%

6. jpg设置了压缩质量(`quality/<number>`)后
- jpg 90%的质量下，比源图容量优化35%
- jpg 80%的质量下，比源图容量优化62%

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
- gif -> 无损webp，比源图容量增加18%
- gif -> 有损webp，比源图容量增加62%

3. gif转换为有损webp，并没有明显的不适感

## 实行约定（也是该插件的内部优化方案）

### 图片格式

- 根据浏览器对webp的支持力度及其他一些情况，用户上传的图片如果是非webp格式或jpg格式，如源图是png的，则会按照以下不同的场景转换成webp或jpg
	- (静态，支持webp，图片宽小于设备物理分辨率*dpr的2分之1时或小于200px*dpr时)，使用webp格式（又拍云api: `/format/webp`）
	- (静态，支持webp，图片宽大于设备物理分辨率*dpr的2分之1时且大于200px*dpr时)，使用jpg格式（又拍云api: `/format/jpg`）
	- (静态，不支持webp)，使用jpg格式（又拍云api: `/format/jpg`）
	- (动态，支持动态webp时)，使用webp格式（又拍云api: `/format/webp`）
	- (动态，不支持动态webp时)，使用gif格式，不作变动

- 当业务场景中需要使用原图尺寸时，内部也会调用压缩，除非明确指定不压缩

### 图片质量

- 指定为 jpg 格式时，默认不使用压缩算法，但会压缩质量到90%（又拍云api: `/quality/90`）
- 指定为 png 格式时，默认使用压缩算法 （又拍云api: `/compress/true`）
- 指定为 web 格式时，不作变动
- 指定为 gif 格式时，不作变动
- 当然你也可以自定义图片的质量

### 图片尺寸

若使用了原尺寸输出，则会使用压缩算法（compress/true）
默认宽度进行自适应，超出尺寸进行裁剪，若自定义尺寸大于原尺寸时，自动缩放至指定尺寸再裁剪（又拍云api: `/both/宽x高`）

当然你也可以自定义图片的尺寸

### 其他优化

由于使用压缩优化会导致模糊到清晰的渐进加载效果失效，所以默认对jpg图片不进行压缩优化
